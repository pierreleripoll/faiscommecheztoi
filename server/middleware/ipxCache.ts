import { defineEventHandler, sendStream } from "h3";
import { PassThrough, Writable } from "stream";
import { promises as fs, existsSync, createReadStream } from "fs";
import { mkdirSync } from "fs";
import path from "path";
import { ServerResponse } from "http";

export default defineEventHandler(async (event) => {
  const cacheDir = path.resolve("./.ipx-cache");
  const reqUrl = event.req.url || "";

  if (!reqUrl.startsWith("/_ipx/")) {
    // If the request is not for an IPX image, skip this middleware
    return;
  }

  // Strip the /_ipx/ prefix from the URL to get the cache path
  const strippedUrl = reqUrl.replace("/_ipx/", "");
  const cacheFilePath = path.resolve(cacheDir, strippedUrl);

  // Ensure cache directory exists
  if (!existsSync(path.dirname(cacheFilePath))) {
    mkdirSync(path.dirname(cacheFilePath), { recursive: true });
  }

  // Check if the file exists in the cache
  if (existsSync(cacheFilePath)) {
    // If the file exists in cache, send it directly
    if (import.meta.dev) console.log(`Serving from cache: ${cacheFilePath}`);
    return sendStream(event, createReadStream(cacheFilePath));
  }

  // Otherwise, capture the response stream to cache it
  const originalRes = event.res;
  const passThrough = new PassThrough();
  const captureStream = new CaptureStream();
  let responseEnded = false;

  passThrough.pipe(captureStream);

  // Modify the response object to capture the data
  const originalWrite = originalRes.write.bind(originalRes) as (
    chunk: any,
    encoding?: BufferEncoding | ((error: Error | null | undefined) => void),
    callback?: (error: Error | null | undefined) => void
  ) => boolean;

  const originalEnd = originalRes.end.bind(originalRes) as (
    chunk?: any,
    encoding?: BufferEncoding | ((error: Error | null | undefined) => void),
    callback?: () => void
  ) => ServerResponse;

  originalRes.write = (
    chunk: any,
    encodingOrCallback?:
      | BufferEncoding
      | ((error: Error | null | undefined) => void),
    callback?: (error: Error | null | undefined) => void
  ): boolean => {
    passThrough.write(chunk, encodingOrCallback as BufferEncoding, callback);
    return originalWrite(chunk, encodingOrCallback as BufferEncoding, callback);
  };

  originalRes.end = (
    chunk?: any,
    encodingOrCallback?:
      | BufferEncoding
      | ((error: Error | null | undefined) => void),
    callback?: () => void
  ): ServerResponse => {
    if (chunk)
      passThrough.write(chunk, encodingOrCallback as BufferEncoding, callback);

    originalEnd(chunk, encodingOrCallback, callback);

    // Write to cache after response has ended
    mkdirSync(path.dirname(cacheFilePath), { recursive: true });
    fs.writeFile(cacheFilePath, captureStream.getBuffer())
      .then(() => {
        if (import.meta.dev) console.log(`Cached image: ${cacheFilePath}`);
      })
      .catch((err) => {
        console.error(`Error caching image: ${err}`);
      });
    return originalRes;
  };

  return;
});

class CaptureStream extends Writable {
  private chunks: Buffer[];

  constructor(options?: any) {
    super(options);
    this.chunks = [];
  }

  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.chunks.push(
      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)
    );
    callback();
  }

  getBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
