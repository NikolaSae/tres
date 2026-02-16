// scripts/vas-import/utils/ParkingImportUtils.ts
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { ParkingRecord, ProgressCallback } from '../processors/ExcelProcessor';

const prisma = new PrismaClient();

const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors');

interface DatabaseOperationResult {
  inserted: number;
  updated: number;
  errors: number;
  duplicates: number;
}

interface ServiceMappingResult {
  id: string;
  created: boolean;
}

// 1. Directory Management
export async function ensureDirectories(): Promise<void> {
  const dirs = [FOLDER_PATH, PROCESSED_FOLDER, ERROR_FOLDER];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      log(`Error creating directory ${dir}: ${error}`, 'error');
    }
  }
}

// 2. Logging Utilities
export function log(message: string, type: 'info' | 'error' | 'success' = 'info', file?: string): void {
  console.log(`${type.toUpperCase()}: ${message}`);
}

// 3. Service Mapping
export function normalizeProviderName(name: string): string {
  return name
    .replace(/SDP\s*m?Parking\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractServiceCode(serviceName: string): string | null {
  if (!serviceName) return null;
  const pattern = /(?<!\d)(\d{4})(?!\d)/;
  const match = serviceName.toString().match(pattern);
  return match?.[1] || null;
}

export async function getOrCreateService(serviceCode: string): Promise<ServiceMappingResult> {
  let service = await prisma.service.findFirst({
    where: { name: serviceCode }
  });

  if (service) {
    return { id: service.id, created: false };
  }

  service = await prisma.service.create({
    data: {
      name: serviceCode,
      type: 'PARKING',
      billingType: 'PREPAID',
      description: `Auto-created parking service: ${serviceCode}`,
      isActive: true,
    }
  });

  return { id: service.id, created: true };
}

// 4. Database Operations
export async function importRecordsToDatabase(
  records: ParkingRecord[],
  filename?: string
): Promise<DatabaseOperationResult> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const existing = await prisma.parkingTransaction.findFirst({
        where: {
          parkingServiceId: record.parkingServiceId,
          date: record.date,
          serviceName: record.serviceName,
          group: record.group
        }
      });

      if (existing) {
        // ✅ ISPRAVLJENA GREŠKA: Koristimo UncheckedUpdateInput (direktan serviceId)
        await prisma.parkingTransaction.update({
          where: { id: existing.id },
          data: {
            price: record.price,
            quantity: record.quantity,
            amount: record.amount,
            serviceId: record.serviceId // ✅ Direktan ID umesto connect
          }
        });
        updated++;
      } else {
        // ✅ ISPRAVLJENA GREŠKA: Koristimo UncheckedCreateInput (direktan serviceId)
        await prisma.parkingTransaction.create({
          data: {
            parkingServiceId: record.parkingServiceId,
            serviceId: record.serviceId, // ✅ Direktan ID umesto connect
            date: record.date,
            group: record.group,
            serviceName: record.serviceName,
            price: record.price,
            quantity: record.quantity,
            amount: record.amount
          }
        });
        inserted++;
      }
    } catch (error) {
      errors++;
      log(`Error processing record: ${JSON.stringify(record)} - ${error}`, 'error', filename);
    }
  }

  return { inserted, updated, errors, duplicates: 0 };
}

// 5. File Management
export async function createParkingServiceDirectory(providerName: string, year: string): Promise<string> {
  const safeProviderName = providerName.replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-');
  const basePath = path.join(PROJECT_ROOT, 'public', 'parking-servis', safeProviderName, 'reports', year);
  await fs.mkdir(basePath, { recursive: true });
  return basePath;
}