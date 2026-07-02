import { config } from "../config/index";

const EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

function embeddingProviderError(detail: string) {
  return Object.assign(new Error(`Embedding provider error: ${detail}`), {
    statusCode: 502,
    code: "EMBEDDING_PROVIDER_ERROR",
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  let response: Response;
  try {
    response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
  } catch (error) {
    throw embeddingProviderError(error instanceof Error ? error.message : "network error");
  }

  if (!response.ok) {
    throw embeddingProviderError(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as { data: { embedding: number[] }[] };
  const embedding = body.data[0]?.embedding;
  if (!embedding) {
    throw embeddingProviderError("empty response");
  }

  return embedding;
}
