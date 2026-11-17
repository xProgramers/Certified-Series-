import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type ImagesBinding = {
  input(stream: ReadableStream): {
    output(opts: { format: string; quality?: number }): Promise<{ response(): Response }>;
  };
};

type Bindings = {
  ASSETS?: { fetch(req: Request | string): Promise<Response> };
  IMAGES?: ImagesBinding;
};

/** The Worker's bindings, or an empty object under plain `next dev` / `next start`. */
function bindings(): Bindings {
  try {
    return getCloudflareContext().env as Bindings;
  } catch {
    return {};
  }
}

/**
 * A file from /public. On Cloudflare there's no file system, so it comes from
 * the static assets; elsewhere it's read from disk.
 */
export async function publicFile(path: string): Promise<ArrayBuffer> {
  const { ASSETS } = bindings();
  if (ASSETS) {
    const res = await ASSETS.fetch(`https://assets.local/${path.replace(/^\//, "")}`);
    if (!res.ok) throw new Error(`asset ${path}: ${res.status}`);
    return res.arrayBuffer();
  }
  const buf = await readFile(join(process.cwd(), "public", path));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/**
 * PNG → JPEG through Cloudflare Images (the IMAGES binding). Returns null when
 * the binding isn't there or the conversion fails, so the caller keeps the PNG.
 */
export async function toJpeg(png: Response, quality = 86): Promise<Response | null> {
  const { IMAGES } = bindings();
  const body = png.clone().body; // the original stays readable for the fallback
  if (!IMAGES || !body) return null;
  try {
    return (await IMAGES.input(body).output({ format: "image/jpeg", quality })).response();
  } catch (e) {
    console.error("jpeg conversion failed", e);
    return null;
  }
}
