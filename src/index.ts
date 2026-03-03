import "dotenv/config";

import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

import { auth } from "./lib/auth.js";

const app = Fastify({
  logger: true,
});

/* ---------------- Zod Setup ---------------- */

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

/* ---------------- Swagger (OpenAPI generator only) ---------------- */

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "TrainningApp",
      description: "TrainningApp backend service",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local server",
      },
    ],
  },
  transform: jsonSchemaTransform,
});

/* ---------------- Expose swagger.json (REQUIRED for Scalar) ---------------- */

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger();
  },
});

/* ---------------- CORS ---------------- */

await app.register(fastifyCors, {
  origin: true,
  credentials: true,
});

/* ---------------- Example Route ---------------- */

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "Hello World endpoint",
    tags: ["hello"],
    response: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
  handler: async () => {
    return { message: "Hello World" };
  },
});

/* ---------------- Auth Proxy Route ---------------- */

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);

      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const response = await auth.handler(req);

      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));

      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      app.log.error(error);
      reply.status(500).send({
        error: "Internal authentication error",
      });
    }
  },
});

/* ---------------- Scalar API Reference (Docs UI) ---------------- */

await app.register(fastifyApiReference, {
  routePrefix: "/docs",
  configuration: {
    sources: [
      {
        title: "Trainning API",
        slug: "trainning-api", // must be URL-safe
        url: "/swagger.json",
      },
      {
        title: "Auth API",
        slug: "auth-api",
        url: "/api/auth/open-api/generate-schema",
      },
    ],
  },
});

/* ---------------- Server Start ---------------- */

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8080;

    await app.listen({
      port,
      host: "0.0.0.0",
    });

    app.log.info(`🚀 Server running at http://localhost:${port}`);
    app.log.info(`📘 API Reference at http://localhost:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
