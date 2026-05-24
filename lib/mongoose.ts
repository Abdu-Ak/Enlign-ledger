/**
 * Mongoose singleton connection helper for Next.js.
 * Caches the connection across hot-reloads in development to prevent
 * exhausting MongoDB connection limits.
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

// Use a module-level cache to reuse the connection across requests
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((instance) => {
        console.log("✅ MongoDB Atlas connected");
        return instance;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
