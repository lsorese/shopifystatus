import { getSupabaseAdmin } from './supabase-server'

export async function verifyAdmin(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', user: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid token', user: null }
  }

  return { error: null, user }
}
