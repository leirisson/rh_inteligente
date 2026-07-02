import { describe, it, expect, vi, afterEach } from "vitest";
import { generateEmbedding } from "./embeddings.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateEmbedding", () => {
  it("returns the embedding vector from a successful response", async () => {
    const embedding = [0.1, 0.2, 0.3];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ embedding }] }),
      }),
    );

    const result = await generateEmbedding("some resume text");

    expect(result).toEqual(embedding);
  });

  it("throws a 502 EMBEDDING_PROVIDER_ERROR when the API responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(generateEmbedding("text")).rejects.toMatchObject({
      statusCode: 502,
      code: "EMBEDDING_PROVIDER_ERROR",
    });
  });

  it("throws a 502 EMBEDDING_PROVIDER_ERROR when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(generateEmbedding("text")).rejects.toMatchObject({
      statusCode: 502,
      code: "EMBEDDING_PROVIDER_ERROR",
    });
  });

  it("throws a 502 EMBEDDING_PROVIDER_ERROR when the response has no embedding data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      }),
    );

    await expect(generateEmbedding("text")).rejects.toMatchObject({
      statusCode: 502,
      code: "EMBEDDING_PROVIDER_ERROR",
    });
  });
});
