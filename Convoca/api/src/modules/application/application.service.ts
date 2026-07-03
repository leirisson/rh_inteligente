import { ApplicationStatus, type Channel } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { evaluateAnswer } from "../../lib/answer-evaluator.js";
import { combinedContactChannel } from "../../lib/contact-channel.js";
import { transitionApplication } from "../../lib/application-transition.js";

function applicationNotFoundError() {
  return Object.assign(new Error("Application not found"), {
    statusCode: 404,
    code: "APPLICATION_NOT_FOUND",
  });
}

async function assertApplicationInTenant(tenantId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { tenantId } },
  });
  if (!application) throw applicationNotFoundError();
  return application;
}

export async function processCandidateMessage(
  tenantId: string,
  applicationId: string,
  content: string,
  channel: Channel = "EMAIL",
) {
  const application = await assertApplicationInTenant(tenantId, applicationId);

  await prisma.conversation.create({
    data: {
      applicationId,
      sender: "CANDIDATE",
      channel,
      content,
      sentAt: new Date(),
    },
  });

  const questions = await prisma.screeningQuestion.findMany({
    where: { jobId: application.jobId },
    orderBy: { order: "asc" },
  });

  const answeredQuestionIds = new Set(
    (
      await prisma.screeningAnswer.findMany({
        where: { applicationId },
        select: { questionId: true },
      })
    ).map((a) => a.questionId),
  );

  const currentQuestion = questions.find((q) => !answeredQuestionIds.has(q.id));
  if (!currentQuestion) {
    return application;
  }

  const evaluation = await evaluateAnswer(
    currentQuestion.question,
    currentQuestion.expectedAnswer,
    content,
  );

  await prisma.screeningAnswer.create({
    data: {
      applicationId,
      questionId: currentQuestion.id,
      answer: content,
      score: evaluation.score,
      verdict: evaluation.verdict,
    },
  });

  const remainingQuestions = questions.filter(
    (q) => q.id !== currentQuestion.id && !answeredQuestionIds.has(q.id),
  );

  if (remainingQuestions.length > 0) {
    const nextQuestion = remainingQuestions[0];
    await combinedContactChannel.send(applicationId, "WHATSAPP", nextQuestion.question);
    return application;
  }

  const answers = await prisma.screeningAnswer.findMany({ where: { applicationId } });
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  let weightedScoreSum = 0;
  let totalWeight = 0;
  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question || answer.score === null) continue;
    weightedScoreSum += answer.score * question.weight;
    totalWeight += question.weight;
  }
  const finalScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;
  const approved = finalScore >= 0.6;
  const finalStatus = approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;

  return transitionApplication(
    applicationId,
    finalStatus,
    `Screening completed with weighted score ${finalScore.toFixed(2)}`,
  );
}
