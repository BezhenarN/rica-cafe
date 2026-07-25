import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Next.js 16+ exported function to set the runtime */
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[categories] error:', msg.slice(0, 500));
    return NextResponse.json([], { status: 500 });
  }
}
