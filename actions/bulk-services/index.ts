// actions/bulk-services/index.ts

"use server";

import { createBulkService } from './create';
import { updateBulkService } from './update';
import { getBulkServiceById } from './getBulkServiceById';
import { getBulkServices } from './getBulkServices';
import { getBulkServicesByProviderId } from './getBulkServicesByProviderId';
import { deleteBulkService } from './delete';
import { importBulkServicesFromCsv } from './import';
import { exportBulkServices } from './export';
import { getAllBulkServices } from './getAllBulkServices';

export {
  createBulkService,
  updateBulkService,
  createBulkService as create,
  updateBulkService as update,
  getBulkServiceById,
  getBulkServices,
  getBulkServicesByProviderId,
  deleteBulkService,
  importBulkServicesFromCsv,
  importBulkServicesFromCsv as importBulkServices,
  exportBulkServices,
  getAllBulkServices,
};