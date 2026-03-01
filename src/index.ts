// Require the framework and instantiate it
import "dotenv/config";

// ESM
import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

// Declare a route
fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

try {
  await fastify.listen({ port: process.env.PORT ?? 8080 });
  fastify.log.info(`Server is running on port ${process.env.PORT ?? 8080}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
// Run the server!
