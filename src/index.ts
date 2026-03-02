import "dotenv/config";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

const app = Fastify({
  logger: true,
});

// Required for Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

/* ---------------- Swagger ---------------- */

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
      {
        url: "https://trainningapp.com",
        description: "Production server",
      },
    ],
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

/* ---------------- Routes ---------------- */

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
    return {
      message: "Hello World",
    };
  },
});

/* ---------------- Server Start ---------------- */

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "8080", 10);

    await app.listen({
      port,
      host: "0.0.0.0",
    });

    app.log.info(`🚀 Server running at http://localhost:${port}`);
    app.log.info(`📘 Swagger docs at http://localhost:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
