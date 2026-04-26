import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { analyzeRoute } from "./routes/analyze.js";

const MAX_LOCKFILE_SIZE_BYTES = 5 * 1024 * 1024;
const PORT = Number(process.env.PORT ?? 3001);

const LOCALHOST_ORIGINS = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] as const;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const CORS_ORIGINS = ALLOWED_ORIGINS && ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : [...LOCALHOST_ORIGINS];

const server = Fastify({ logger: true });

await server.register(cors, {
  origin: CORS_ORIGINS,
});

await server.register(multipart, {
  limits: {
    files: 1,
    fields: 10,
    fileSize: MAX_LOCKFILE_SIZE_BYTES,
  },
});
await server.register(analyzeRoute);

try {
  await server.listen({ port: PORT, host: "0.0.0.0" });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
