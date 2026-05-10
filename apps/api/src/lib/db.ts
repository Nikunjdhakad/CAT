import mongoose from "mongoose";

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDb(uri: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!connecting) {
    connecting = mongoose.connect(uri);
  }
  try {
    await connecting;
    return mongoose;
  } finally {
    connecting = null;
  }
}
