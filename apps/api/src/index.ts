import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./env.js";
import { connectDb } from "./lib/db.js";
import { configureCloudinary } from "./lib/cloudinary.js";

const env = loadEnv();

async function main() {
  await connectDb(env.MONGODB_URI);
  
  // Configure Cloudinary if credentials are provided
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    configureCloudinary(env);
    // eslint-disable-next-line no-console
    console.log("Cloudinary configured successfully");
  } else {
    // eslint-disable-next-line no-console
    console.warn("Cloudinary credentials not found. Image upload features will be unavailable.");
  }
  
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

