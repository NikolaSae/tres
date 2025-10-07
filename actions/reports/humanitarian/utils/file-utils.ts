// /actions/reports/humanitarian/utils/file-utils.ts

import { promises as fs } from 'fs';
import path from 'path';
import { CYRILLIC_TO_LATIN_MAP, TEMPLATES_PATH } from '../constants';
import { TemplateType } from '../types';

export function sanitizeFileName(orgName: string, maxLength: number = 50): string {
  if (!orgName?.trim()) {
    return 'unknown_org';
  }

  let sanitized = orgName.trim().replace(/\s+/g, ' ');
  
  for (const [cyrillic, latin] of Object.entries(CYRILLIC_TO_LATIN_MAP)) {
    sanitized = sanitized.replace(new RegExp(cyrillic, 'g'), latin);
  }
  
  return sanitized
    .replace(/\s/g, '_')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[„"""'']/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '_')
    .replace(/[…]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, maxLength)
    .replace(/_+$/, '') || 'org';
}

export function getMasterTemplatePath(templateType: TemplateType): string {
  return path.join(TEMPLATES_PATH, `humanitarian-template-${templateType}.xlsx`);
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

export async function safeFileDelete(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, which is fine
  }
}