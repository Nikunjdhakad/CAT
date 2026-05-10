import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./env.js";
import { connectDb } from "./lib/db.js";

const env = loadEnv();

async function main() {
  await connectDb(env.MONGODB_URI);
  const app = createApp(env);
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`@cat/api listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start @cat/api:", err);
  process.exit(1);
});

