import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { pollShopifyStatus } from '@/lib/poller'

export async function POST(request) {
  const { error } = await verifyAdmin(request)
  if (error) return NextResponse.json({ error }, { status: 401 })

  try {
    const stats = await pollShopifyStatus()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
