import "dotenv/config";

import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

const app = Fastify({
  logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get("/", async () => {
  return { hello: "world" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 8080);

    await app.listen({ port });
    app.log.info(`🚀 Server is running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
