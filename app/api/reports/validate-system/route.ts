// app/api/reports/validate-system/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MASTER_TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'humanitarian-template.xlsx');
const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');

export async function POST(request: NextRequest) {
  try {
    const validationResult = {
      templateExists: false,
      templateReadable: false,
      templateSize: 0,
      reportsDirectoryExists: false,
      reportsDirectoryWritable: false,
      excelJSAvailable: false,
      pythonAvailable: false,
      databaseConnection: false,
      organizationCount: 0,
      errors: [] as string[]
    };

    // 1. Check if master template exists and is readable
    try {
      const stats = await fs.stat(MASTER_TEMPLATE_PATH);
      validationResult.templateExists = true;
      validationResult.templateSize = stats.size;
      
      // Check if file is readable
      await fs.access(MASTER_TEMPLATE_PATH, fs.constants.R_OK);
      validationResult.templateReadable = true;
    } catch (error) {
      validationResult.errors.push(`Master template issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. Check if reports directory exists and is writable
    try {
      await fs.access(REPORTS_BASE_PATH, fs.constants.F_OK);
      validationResult.reportsDirectoryExists = true;
      
      // Check write permissions
      await fs.access(REPORTS_BASE_PATH, fs.constants.W_OK);
      validationResult.reportsDirectoryWritable = true;
    } catch (error) {
      validationResult.errors.push(`Reports directory issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Try to create reports directory
      try {
        await fs.mkdir(REPORTS_BASE_PATH, { recursive: true });
        validationResult.reportsDirectoryExists = true;
        validationResult.reportsDirectoryWritable = true;
      } catch (createError) {
        validationResult.errors.push(`Cannot create reports directory: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
      }
    }

    // 3. Check if ExcelJS is available
    try {
      await import('exceljs');
      validationResult.excelJSAvailable = true;
    } catch (error) {
      validationResult.errors.push('ExcelJS library not installed - install with: npm install exceljs');
    }

    // 4. Check if Python + openpyxl is available
    try {
      await execAsync('python3 -c "import openpyxl"');
      validationResult.pythonAvailable = true;
    } catch (error) {
      validationResult.errors.push('Python3 or openpyxl not available - install with: pip install openpyxl');
    }

    // 5. Check database connection and humanitarian organizations
    try {
      // Test database connection
      await db.$queryRaw`SELECT 1`;
      validationResult.databaseConnection = true;
      
      // Count active humanitarian organizations with active contracts
      const orgCount = await db.humanitarianOrg.count({
        where: {
          isActive: true,
          contracts: {
            some: {
              status: 'ACTIVE',
              startDate: { lte: new Date() },
              endDate: { gte: new Date() }
            }
          }
        }
      });
      
      validationResult.organizationCount = orgCount;
      
      if (orgCount === 0) {
        validationResult.errors.push('No active humanitarian organizations with active contracts found');
      }
    } catch (error) {
      validationResult.databaseConnection = false;
      validationResult.errors.push(`Database connection issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Validation system error:', error);
    return NextResponse.json({
      templateExists: false,
      templateReadable: false,
      templateSize: 0,
      reportsDirectoryExists: false,
      reportsDirectoryWritable: false,
      excelJSAvailable: false,
      pythonAvailable: false,
      databaseConnection: false,
      organizationCount: 0,
      errors: [
        `System validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    }, { status: 500 });
  }
}