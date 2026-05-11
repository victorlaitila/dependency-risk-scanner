import type { FastifyPluginAsync } from "fastify";
import { analyzePackageLockWithVulns } from "../lib/analyze-lockfile.js";

const JSON_MIME_TYPES = new Set([
  "application/json",
  "text/json",
  "text/plain",
  "application/octet-stream",
]);

export const analyzeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/analyze", async (request, reply) => {
    try {
      const file = await request.file();

      if (!file || file.fieldname !== "file") {
        return reply.code(400).send({ message: 'Expected a multipart file field named "file".' });
      }

      const hasJsonExtension = file.filename.toLowerCase().endsWith(".json");
      const hasJsonMimeType = JSON_MIME_TYPES.has(file.mimetype);

      if (!hasJsonExtension && !hasJsonMimeType) {
        return reply.code(400).send({ message: "Only JSON lockfiles are supported." });
      }

      try {
        const fileBuffer = await file.toBuffer();

        if (file.file.truncated) {
          return reply.code(413).send({ message: "Uploaded file is too large." });
        }

        // Use the vulnerability-enriched analyzer for API responses.
        return await analyzePackageLockWithVulns(fileBuffer.toString("utf8"));
      } catch (error) {
        if (error instanceof SyntaxError) {
          return reply.code(400).send({ message: "The uploaded file must be valid JSON." });
        }

        return reply.code(400).send({ message: "The uploaded lockfile format is invalid." });
      }
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;

      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? (error as { statusCode?: number }).statusCode
          : undefined;

      if (
        code === "FST_REQ_FILE_TOO_LARGE"
        || code === "FST_FILES_LIMIT"
        || code === "FST_PARTS_LIMIT"
        || statusCode === 413
      ) {
        return reply.code(413).send({ message: "Uploaded file is too large." });
      }

      return reply.code(400).send({ message: "Invalid multipart upload payload." });
    }
  });
};
