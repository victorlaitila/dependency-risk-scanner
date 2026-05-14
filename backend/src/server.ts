import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { analyzeRoute } from "./routes/analyze.js";
import { explainRoute } from "./routes/explain.js";
import {
  DEFAULT_MAX_LOCKFILE_SIZE_BYTES,
  DEFAULT_PORT,
  LOCALHOST_ORIGINS
} from "./lib/constants.js";

const server = Fastify({ logger: true });

await server.register(cors, {
  origin: LOCALHOST_ORIGINS,
});

await server.register(multipart, {
  limits: {
    files: 1,
    fields: 10,
    fileSize: DEFAULT_MAX_LOCKFILE_SIZE_BYTES,
  },
});
await server.register(analyzeRoute);
// TODO: Add rate limiting to /explain if this endpoint is exposed publicly or gets heavy usage.
await server.register(explainRoute);

try {
  await server.listen({ port: DEFAULT_PORT, host: "0.0.0.0" });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
