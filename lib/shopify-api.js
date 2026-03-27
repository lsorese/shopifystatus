const BASE_URL = 'https://www.shopifystatus.com/api/v2'

export async function fetchSummary() {
  const res = await fetch(`${BASE_URL}/summary.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`)
  return res.json()
}

export async function fetchComponents() {
  const res = await fetch(`${BASE_URL}/components.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`)
  return res.json()
}
