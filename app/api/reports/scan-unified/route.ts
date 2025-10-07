///app/api/reports/scan-unified/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Folder gde se nalaze unified fajlovi (preporučeno u public/reports)
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    const files = await fs.promises.readdir(reportsDir);

    const monthNames = [
      'Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust',
      'Septembar','Oktobar','Novembar','Decembar'
    ];

    const unifiedReports = files
      .filter(f => f.includes('Humanitarni_SMS_i_VOICE_brojevi') && f.endsWith('.xlsx'))
      .map(fileName => {
        const filePath = path.join(reportsDir, fileName);
        const stats = fs.statSync(filePath);

        // Pretpostavljamo da ime fajla sadrži Mesec_YYYY.xlsx
        const match = fileName.match(/-(\w+)_([0-9]{4})\.xlsx$/i);
        const month = match ? monthNames.indexOf(match[1]) + 1 : 0;
        const year = match ? parseInt(match[2]) : 0;

        return {
          fileName,
          filePath,
          publicUrl: `/reports/${fileName}`,
          paymentType: 'prepaid', // ili logika za pre/postpaid
          month,
          year,
          fileSize: stats.size,
          lastModified: stats.mtime
        };
      });

    return NextResponse.json({ success: true, reports: unifiedReports });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: 'Failed to scan unified reports' },
      { status: 500 }
    );
  }
}
