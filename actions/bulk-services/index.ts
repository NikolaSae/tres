// actions/bulk-services/index.ts

"use server";

import { createBulkService as create } from './create';
import { updateBulkService as update } from './update';
import { getBulkServiceById } from './getBulkServiceById';
import { getBulkServices } from './getBulkServices';
import { getBulkServicesByProviderId } from './getBulkServicesByProviderId';
import { deleteBulkService } from './delete';
import { importBulkServicesFromCsv as importBulkServices } from './import';  // ← OVDE je ispravka!
import { exportBulkServices } from './export';
import { getAllBulkServices } from './getAllBulkServices';

export {
  create,
  update,
  getBulkServiceById,
  getBulkServices,
  getBulkServicesByProviderId,
  deleteBulkService,
  importBulkServices,          // ← sada koristi alias
  exportBulkServices,
  getAllBulkServices,
};