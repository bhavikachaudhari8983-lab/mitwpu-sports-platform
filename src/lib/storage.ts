// Private file storage. Files live OUTSIDE /public and are only served by
// /api/documents/[id] after an authorisation check. Swap this module for S3/GCS later.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export function uploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  return configured ? resolve(configured) : resolve(process.cwd(), "uploads");
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function saveFile(data: Uint8Array, mimeType: string): Promise<string> {
  const ext = EXT[mimeType];
  if (!ext) throw new Error(`Unsupported type ${mimeType}`);
  const key = `${randomUUID()}.${ext}`;
  await mkdir(uploadRoot(), { recursive: true });
  await writeFile(join(uploadRoot(), key), data, { mode: 0o600 });
  return key;
}

function safePath(key: string): string {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(key)) throw new Error("Invalid storage key");
  return join(uploadRoot(), key);
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(safePath(key));
}

export async function deleteStoredFile(key: string): Promise<void> {
  try {
    await unlink(safePath(key));
  } catch {
    // already gone
  }
}

/** Checks magic bytes so a renamed file can't pass as an image/PDF. */
export function sniffMime(data: Uint8Array): string | null {
  const b = data;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}
