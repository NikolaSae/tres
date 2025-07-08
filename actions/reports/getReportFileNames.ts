//actions/reports/getReportFileNames.ts

import fs from 'fs/promises';
import path from 'path';
import { getParkingServiceById } from "../parking-services/getParkingServiceById";

export const getReportFileNames = async (parkingServiceId: string) => {
  try {
    const serviceResult = await getParkingServiceById(parkingServiceId);
    if (!serviceResult.success || !serviceResult.data) {
      return [];
    }
    
    const service = serviceResult.data;
    const formattedName = service.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    // Base path to reports
    const basePath = path.join(
      process.cwd(), 
      'public', 
      'parking-service',
      formattedName,
      'report'
    );
    
    // Check if base path exists
    try {
      await fs.access(basePath);
    } catch {
      return []; // Directory doesn't exist
    }
    
    const allFiles: string[] = [];
    const yearDirs = await fs.readdir(basePath);
    
    for (const year of yearDirs) {
      const yearPath = path.join(basePath, year);
      const stat = await fs.stat(yearPath);
      
      if (!stat.isDirectory()) continue;
      
      const monthDirs = await fs.readdir(yearPath);
      
      for (const month of monthDirs) {
        const originalPath = path.join(yearPath, month, 'original');
        
        try {
          await fs.access(originalPath);
          const files = await fs.readdir(originalPath);
          files.forEach(file => allFiles.push(file));
        } catch (error) {
          // Directory doesn't exist
          continue;
        }
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error('Error fetching report files:', error);
    return [];
  }
};