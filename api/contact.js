// Vercel serverless entry for the contact form. Reuses the Netlify handler so the
// validation and Sanity write live in one place. Needs SANITY_WRITE_TOKEN in Vercel's env.
const { handler } = require('../netlify/functions/contact')

module.exports = async (req, res) => {
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
  const result = await handler({ httpMethod: req.method, body })
  res.status(result.statusCode)
  Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v))
  res.send(result.body)
}
