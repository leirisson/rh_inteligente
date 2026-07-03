import { describe, it, expect } from "vitest";
import { ApplicationStatus } from "@prisma/client";
import { ALLOWED_TRANSITIONS, isValidTransition } from "./application-transition.js";

describe("isValidTransition", () => {
  it.each([
    [ApplicationStatus.PENDING_CONTACT, ApplicationStatus.IN_SCREENING, true],
    [ApplicationStatus.PENDING_CONTACT, ApplicationStatus.WITHDRAWN, true],
    [ApplicationStatus.PENDING_CONTACT, ApplicationStatus.HIRED, false],
    [ApplicationStatus.IN_SCREENING, ApplicationStatus.APPROVED, true],
    [ApplicationStatus.IN_SCREENING, ApplicationStatus.REJECTED, true],
    [ApplicationStatus.APPROVED, ApplicationStatus.INTERVIEW_SCHEDULED, true],
    [ApplicationStatus.APPROVED, ApplicationStatus.IN_SCREENING, false],
    [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.APPROVED, true],
    [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.HIRED, true],
    [ApplicationStatus.HIRED, ApplicationStatus.APPROVED, false],
    [ApplicationStatus.REJECTED, ApplicationStatus.IN_SCREENING, false],
    [ApplicationStatus.WITHDRAWN, ApplicationStatus.IN_SCREENING, false],
  ])("isValidTransition(%s, %s) === %s", (from, to, expected) => {
    expect(isValidTransition(from, to)).toBe(expected);
  });

  it("terminal states have no outbound transitions", () => {
    expect(ALLOWED_TRANSITIONS[ApplicationStatus.HIRED]).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS[ApplicationStatus.REJECTED]).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS[ApplicationStatus.WITHDRAWN]).toHaveLength(0);
  });
});
