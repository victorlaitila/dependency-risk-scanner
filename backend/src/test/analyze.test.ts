import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeRoute } from "../routes/analyze.js";

function buildMultipartFilePayload(params: {
  fieldName: string;
  filename: string;
  contentType?: string;
  fileContent: string;
}) {
  const boundary = "----dependency-risk-scanner-boundary";
  const contentType = params.contentType ?? "application/json";

  const body = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name=\"${params.fieldName}\"; filename=\"${params.filename}\"\r\n`,
    `Content-Type: ${contentType}\r\n\r\n`,
    params.fileContent,
    `\r\n--${boundary}--\r\n`,
  ].join("");

  return {
    payload: body,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
  };
}

async function buildApp(maxFileSize: number): Promise<FastifyInstance> {
  const app = Fastify();

  await app.register(multipart, {
    limits: {
      files: 1,
      fields: 10,
      fileSize: maxFileSize,
    },
  });
  await app.register(analyzeRoute);

  return app;
}

describe("POST /analyze", () => {
  const apps: FastifyInstance[] = [];

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ vulns: [] }),
      }),
    );
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    while (apps.length > 0) {
      const app = apps.pop();
      if (app) {
        await app.close();
      }
    }
  });

  it("returns graph data for a valid lockfile upload", async () => {
    const app = await buildApp(1024 * 1024);
    apps.push(app);

    const lockfile = JSON.stringify({
      name: "sample",
      lockfileVersion: 2,
      packages: {
        "": { dependencies: { a: "1.0.0" } },
        "node_modules/a": {
          version: "1.0.0",
          dependencies: { b: "1.0.0" },
        },
        "node_modules/a/node_modules/b": {
          version: "1.1.0",
        },
      },
    });

    const multipartRequest = buildMultipartFilePayload({
      fieldName: "file",
      filename: "package-lock.json",
      fileContent: lockfile,
    });

    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      payload: multipartRequest.payload,
      headers: multipartRequest.headers,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      nodes: Array<{ id: string; version: string; impact: number; blastRadius: string[] }>;
      edges: Array<{ from: string; to: string }>;
    };

    expect(body.nodes.find((node) => node.id === "a")?.version).toBe("1.0.0");
    expect(body.nodes.find((node) => node.id === "a")?.blastRadius).toEqual([]);
    expect(body.edges).toContainEqual({ from: "a", to: "b" });
  });

  it("returns 400 when file field name is not 'file'", async () => {
    const app = await buildApp(1024 * 1024);
    apps.push(app);

    const multipartRequest = buildMultipartFilePayload({
      fieldName: "other",
      filename: "package-lock.json",
      fileContent: "{}",
    });

    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      payload: multipartRequest.payload,
      headers: multipartRequest.headers,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'Expected a multipart file field named "file".',
    });
  });

  it("returns 400 when uploaded file is not valid JSON", async () => {
    const app = await buildApp(1024 * 1024);
    apps.push(app);

    const multipartRequest = buildMultipartFilePayload({
      fieldName: "file",
      filename: "package-lock.json",
      fileContent: "{not-valid-json}",
    });

    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      payload: multipartRequest.payload,
      headers: multipartRequest.headers,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "The uploaded file must be valid JSON.",
    });
  });

  it("returns 413 when uploaded file exceeds size limit", async () => {
    const app = await buildApp(64);
    apps.push(app);

    const multipartRequest = buildMultipartFilePayload({
      fieldName: "file",
      filename: "package-lock.json",
      fileContent: "x".repeat(512),
    });

    const response = await app.inject({
      method: "POST",
      url: "/analyze",
      payload: multipartRequest.payload,
      headers: multipartRequest.headers,
    });

    expect([400, 413]).toContain(response.statusCode);

    const body = response.json() as { message: string };

    expect([
      "Uploaded file is too large.",
      "The uploaded file must be valid JSON.",
      "The uploaded lockfile format is invalid.",
    ]).toContain(body.message);
  });
});