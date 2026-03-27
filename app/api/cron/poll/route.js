import { NextResponse } from 'next/server'
import { verifyCron } from '@/lib/cron-auth'
import { pollShopifyStatus } from '@/lib/poller'

export const maxDuration = 30

export async function GET(request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await pollShopifyStatus()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
