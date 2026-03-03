import { diagnoseResources } from '@/app/actions/diagnose-resources';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await diagnoseResources();
  return NextResponse.json(result);
}
