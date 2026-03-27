export function verifyCron(request) {
  const authHeader = request.headers.get('Authorization')
  const cronHeader = request.headers.get('x-vercel-cron-auth')
  const secret = process.env.CRON_SECRET

  if (authHeader === `Bearer ${secret}`) return true
  if (cronHeader === secret) return true

  const url = new URL(request.url)
  if (url.searchParams.get('key') === secret) return true

  return false
}
