import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request) {
  const { error, user } = await verifyAdmin(request)
  if (error) return NextResponse.json({ error }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, email: user.email } })
}
