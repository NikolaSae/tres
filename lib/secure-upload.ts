// lib/secure-upload.ts
// Bezbedno upravljanje fajlovima — van public/ foldera

import { writeFile, mkdir } from "fs/promises";
import { join, extname, basename } from "path";
import { randomUUID } from "crypto";
import { auth } from "@/auth";

// ============================================================
// KONFIGURACIJA
// ============================================================

// KRITIČNO: fajlovi se čuvaju VAN public/ foldera!
// Pristup je moguć samo kroz zaštićeni API endpoint
const UPLOAD_BASE_DIR = join(process.cwd(), "private-uploads");

const ALLOWED_TYPES: Record<string, string[]> = {
  contracts: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  reports: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
};

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  contracts: [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  reports: [".pdf", ".xlsx", ".csv"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================
// VALIDACIJA FAJLA
// ============================================================
interface FileValidationResult {
  valid: boolean;
  error?: string;
}

function validateFile(
  file: File,
  category: keyof typeof ALLOWED_TYPES
): FileValidationResult {
  // 1. Proveri veličinu
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fajl je prevelik. Maksimalna veličina je ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // 2. Proveri MIME tip (ne veruj samo ekstenziji!)
  const allowedMimes = ALLOWED_TYPES[category] || [];
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Tip fajla nije dozvoljen. Dozvoljeni tipovi: ${allowedMimes.join(", ")}`,
    };
  }

  // 3. Proveri ekstenziju
  const ext = extname(file.name).toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[category] || [];
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Ekstenzija nije dozvoljena. Dozvoljene: ${allowedExts.join(", ")}`,
    };
  }

  // 4. Sanitizuj naziv fajla (sprečava path traversal)
  const fileName = basename(file.name);
  if (fileName !== file.name || file.name.includes("..")) {
    return {
      valid: false,
      error: "Naziv fajla sadrži nedozvoljene karaktere",
    };
  }

  return { valid: true };
}

// ============================================================
// UPLOAD FAJLA
// ============================================================
interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}

export async function uploadSecureFile(
  file: File,
  category: "contracts" | "reports",
  entityId?: string
): Promise<UploadResult> {
  // 1. Proveri autentifikaciju
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Niste autentifikovani" };
  }

  // 2. Validiraj fajl
  const validation = validateFile(file, category);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 3. Generiši bezbedan naziv fajla
  const ext = extname(file.name).toLowerCase();
  const fileId = randomUUID();
  const safeFileName = `${fileId}${ext}`;

  // 4. Kreiraj folder strukturu
  const uploadDir = join(
    UPLOAD_BASE_DIR,
    category,
    entityId || session.user.id
  );
  await mkdir(uploadDir, { recursive: true });

  // 5. Sačuvaj fajl
  const filePath = join(uploadDir, safeFileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  // 6. Sačuvaj metadata u bazu (primer)
  /*
  await db.fileAttachment.create({
    data: {
      id: fileId,
      originalName: file.name,
      storedName: safeFileName,
      mimeType: file.type,
      size: file.size,
      category,
      entityId,
      uploadedById: session.user.id,
      storagePath: filePath,
    },
  });
  */

  return {
    success: true,
    fileId,
    fileName: file.name,
  };
}