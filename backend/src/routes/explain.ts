import type { FastifyPluginAsync } from "fastify";
import { getExplanation, type ExplanationRequest } from "../lib/ai-explanation-service.js";

const VALID_HIGHEST_SEVERITIES = new Set<ExplanationRequest["highestSeverity"]>(["low", "medium", "high", "critical", "none"]);

export const explainRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: ExplanationRequest }>("/explain", async (request, reply) => {
    try {
      const {
        name,
        version,
        impactScore,
        dependentsCount,
        depth,
        vulnerabilityCount,
        hasCriticalVulnerabilities,
        highestSeverity,
      } = request.body;

      if (!name || typeof name !== "string") {
        return reply.code(400).send({ message: "Missing or invalid 'name' field." });
      }

      if (!version || typeof version !== "string") {
        return reply.code(400).send({ message: "Missing or invalid 'version' field." });
      }

      if (typeof impactScore !== "number") {
        return reply.code(400).send({ message: "Missing or invalid 'impactScore' field." });
      }

      if (typeof dependentsCount !== "number") {
        return reply.code(400).send({ message: "Missing or invalid 'dependentsCount' field." });
      }

      if (typeof depth !== "number") {
        return reply.code(400).send({ message: "Missing or invalid 'depth' field." });
      }

      if (typeof vulnerabilityCount !== "number") {
        return reply.code(400).send({ message: "Missing or invalid 'vulnerabilityCount' field." });
      }

      if (typeof hasCriticalVulnerabilities !== "boolean") {
        return reply.code(400).send({ message: "Missing or invalid 'hasCriticalVulnerabilities' field." });
      }

      if (typeof highestSeverity !== "string" || !VALID_HIGHEST_SEVERITIES.has(highestSeverity as ExplanationRequest["highestSeverity"])) {
        return reply.code(400).send({ message: "Missing or invalid 'highestSeverity' field." });
      }

      const explanation = await getExplanation({
        name,
        version,
        impactScore,
        dependentsCount,
        depth,
        vulnerabilityCount,
        hasCriticalVulnerabilities,
        highestSeverity: highestSeverity as ExplanationRequest["highestSeverity"],
      });

      return reply.send(explanation);
    } catch (error) {
      console.error("Explain endpoint error:", error);
      return reply.code(500).send({ message: "Internal server error." });
    }
  });
};
