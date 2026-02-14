// actions/bulk-services/index.ts
"use server";

import { createBulkService as createBulkServiceAction } from './create';
import { updateBulkService as updateBulkServiceAction } from './update';
import { getBulkServiceById } from './getBulkServiceById';
import { getBulkServices } from './getBulkServices';
import { getBulkServicesByProviderId } from './getBulkServicesByProviderId';
import { deleteBulkService } from './delete';
import { importBulkServicesFromCsv } from './import';
import { exportBulkServices } from './export';
import { getAllBulkServices } from './getAllBulkServices';

// Export sa originalnim imenima
export {
  createBulkServiceAction as createBulkService,
  updateBulkServiceAction as updateBulkService,
  getBulkServiceById,
  getBulkServices,
  getBulkServicesByProviderId,
  deleteBulkService,
  importBulkServicesFromCsv,
  exportBulkServices,
  getAllBulkServices,
};

// Export sa alternativnim imenima za kompatibilnost
export {
  createBulkServiceAction as create,
  updateBulkServiceAction as update,
  importBulkServicesFromCsv as importBulkServices,
};