// /actions/reports/humanitarian/constants.ts
import path from 'path';

export const TEMPLATES_PATH = path.join(process.cwd(), 'templates');
export const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');
export const ORIGINAL_REPORTS_PATH = path.join(process.cwd(), 'public', 'reports');

export const MONTHS_SR = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
] as const;

export const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  'а': 'a', 'А': 'A', 'б': 'b', 'Б': 'B', 'в': 'v', 'В': 'V',
  'г': 'g', 'Г': 'G', 'д': 'd', 'Д': 'D', 'ђ': 'dj', 'Ђ': 'Dj',
  'е': 'e', 'Е': 'E', 'ж': 'z', 'Ж': 'Z', 'з': 'z', 'З': 'Z',
  'и': 'i', 'И': 'I', 'ј': 'j', 'Ј': 'J', 'к': 'k', 'К': 'K',
  'л': 'l', 'Л': 'L', 'љ': 'lj', 'Љ': 'Lj', 'м': 'm', 'М': 'M',
  'н': 'n', 'Н': 'N', 'њ': 'nj', 'Њ': 'Nj', 'о': 'o', 'О': 'O',
  'п': 'p', 'П': 'P', 'р': 'r', 'Р': 'R', 'с': 's', 'С': 'S',
  'т': 't', 'Т': 'T', 'ћ': 'c', 'Ћ': 'C', 'у': 'u', 'У': 'U',
  'ф': 'f', 'Ф': 'F', 'х': 'h', 'Х': 'H', 'ц': 'c', 'Ц': 'C',
  'ч': 'c', 'Ч': 'C', 'џ': 'dz', 'Џ': 'Dz', 'ш': 's', 'Ш': 'S'
};