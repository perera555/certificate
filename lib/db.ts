import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { put, list, del, get } from "@vercel/blob";

/**
 * Tiny JSON document store.
 * - With BLOB_READ_WRITE_TOKEN set (Vercel): private Vercel Blob storage.
 * - Otherwise: JSON files in ./.data (local development).
 */

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = path.join(process.cwd(), ".data");

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage is not configured. In Vercel, open your project > Storage > create a Blob store and connect it (this adds BLOB_READ_WRITE_TOKEN), then redeploy."
    );
  }
}

function assertWritable() {
  if (!useBlob && process.env.VERCEL) throw new StorageNotConfiguredError();
}

const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

async function readStream(stream: ReadableStream<Uint8Array>) {
  return await new Response(stream).text();
}

export async function listDocs<T>(collection: string): Promise<T[]> {
  if (useBlob) {
    const out: T[] = [];
    let cursor: string | undefined;
    const paths: string[] = [];
    do {
      const res = await list({ prefix: `data/${safe(collection)}/`, cursor, limit: 1000 });
      paths.push(...res.blobs.map((b) => b.pathname));
      cursor = res.hasMore ? res.cursor : undefined;
    } while (cursor);
    await Promise.all(
      paths.map(async (p) => {
        const r = await get(p, { access: "private", useCache: false });
        if (r && r.statusCode === 200) out.push(JSON.parse(await readStream(r.stream)));
      })
    );
    return out;
  }
  if (process.env.VERCEL) return [];
  const dir = path.join(DATA_DIR, safe(collection));
  try {
    const files = await fs.readdir(dir);
    return Promise.all(
      files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await fs.readFile(path.join(dir, f), "utf8")))
    );
  } catch {
    return [];
  }
}

export async function getDoc<T>(collection: string, id: string): Promise<T | null> {
  if (useBlob) {
    try {
      const r = await get(`data/${safe(collection)}/${safe(id)}.json`, { access: "private", useCache: false });
      if (!r || r.statusCode !== 200) return null;
      return JSON.parse(await readStream(r.stream));
    } catch {
      return null;
    }
  }
  if (process.env.VERCEL) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, safe(collection), `${safe(id)}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function putDoc<T extends { id: string }>(collection: string, doc: T): Promise<T> {
  assertWritable();
  const body = JSON.stringify(doc);
  if (useBlob) {
    await put(`data/${safe(collection)}/${safe(doc.id)}.json`, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return doc;
  }
  const dir = path.join(DATA_DIR, safe(collection));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${safe(doc.id)}.json`), body, "utf8");
  return doc;
}

export async function deleteDoc(collection: string, id: string): Promise<void> {
  assertWritable();
  if (useBlob) {
    await del(`data/${safe(collection)}/${safe(id)}.json`);
    return;
  }
  await fs.rm(path.join(DATA_DIR, safe(collection), `${safe(id)}.json`), { force: true });
}

/* ---------- binary files (private) ---------- */

export async function putFile(key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  assertWritable();
  if (useBlob) {
    await put(`files/${key}`, Buffer.from(data), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return;
  }
  const file = path.join(DATA_DIR, "files", key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(data));
}

export async function getFile(key: string): Promise<ReadableStream<Uint8Array> | null> {
  if (useBlob) {
    const r = await get(`files/${key}`, { access: "private", useCache: false }).catch(() => null);
    return r && r.statusCode === 200 ? r.stream : null;
  }
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, "files", key));
    return new Response(buf).body;
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  assertWritable();
  if (useBlob) {
    await del(`files/${key}`).catch(() => {});
    return;
  }
  await fs.rm(path.join(DATA_DIR, "files", key), { force: true });
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export function newSerial() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `OC-${new Date().getFullYear()}-${code.slice(0, 4)}-${code.slice(4)}`;
}
