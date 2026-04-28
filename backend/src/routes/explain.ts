import type { FastifyPluginAsync } from "fastify";
import { getExplanation, type ExplanationRequest } from "../lib/ai-explanation-service.js";

export const explainRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: ExplanationRequest }>("/explain", async (request, reply) => {
    try {
      const { name, version, impactScore, dependentsCount, depth } = request.body;

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

      const explanation = await getExplanation({
        name,
        version,
        impactScore,
        dependentsCount,
        depth,
      });

      return reply.send(explanation);
    } catch (error) {
      console.error("Explain endpoint error:", error);
      return reply.code(500).send({ message: "Internal server error." });
    }
  });
};
