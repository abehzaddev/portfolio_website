// Receives the contact form and writes it to Sanity server-side.
// The write token lives only in Netlify's environment (SANITY_WRITE_TOKEN), never in the browser.

const PROJECT_ID = 'oyf22kt8'
const DATASET = 'production'
const API = `https://${PROJECT_ID}.api.sanity.io/v2022-02-01/data/mutate/${DATASET}`

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) return json(500, { error: 'Contact form is not configured' })

  let data
  try {
    data = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  // Honeypot: real visitors never fill this hidden field.
  if (data.company) return json(200, { ok: true })

  const name = String(data.name || '').trim()
  const email = String(data.email || '').trim()
  const message = String(data.message || '').trim()
  if (!name || name.length > 100) return json(400, { error: 'Please enter your name' })
  if (!EMAIL_RE.test(email) || email.length > 200) return json(400, { error: 'Please enter a valid email' })
  if (!message || message.length > 5000) return json(400, { error: 'Please enter a message (under 5000 characters)' })

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations: [{ create: { _type: 'contact', name, email, message } }] }),
  })
  if (!res.ok) {
    console.error('Sanity write failed', res.status, await res.text())
    return json(502, { error: 'Could not save your message' })
  }
  return json(200, { ok: true })
}
