// app/api/cron/check-expiring/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkExpiringContracts } from '@/actions/contracts/check-expiring';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await checkExpiringContracts();
  return NextResponse.json(result);
}