//lib/storage.ts
export async function uploadFile(file: File): Promise<{ url: string }> {
  // Placeholder implementation
  return { url: "/uploads/" + file.name };
}

export async function deleteFile(url: string): Promise<void> {
  // Placeholder implementation
  console.log("Deleting file:", url);
}

export function getFileUrl(filename: string): string {
  return "/uploads/" + filename;
}