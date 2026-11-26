import "server-only";
import { deleteDoc, deleteFile, listDocs } from "./db";

export interface Attachment {
  id: string;
  certId: string;
  name: string;
  type: string;
  size: number;
  key: string;
  uploadedBy: string;
  createdAt: string;
}

export const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel request limit is 4.5 MB
export const MAX_FILES_PER_CERT = 20;

export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

export const collectionFor = (certId: string) => `att-${certId}`;

export function listAttachments(certId: string) {
  return listDocs<Attachment>(collectionFor(certId)).then((l) => l.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
}

export async function deleteAllAttachments(certId: string) {
  const items = await listAttachments(certId);
  await Promise.all(items.map(async (a) => {
    await deleteFile(a.key);
    await deleteDoc(collectionFor(certId), a.id);
  }));
}

export function cleanFileName(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1f]+/g, "_").slice(0, 120) || "document";
}
