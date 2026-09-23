import sanityClient from '@sanity/client'

// Read-only, public client. The dataset is public, so no token is needed (or allowed) here:
// anything bundled into the browser is visible to every visitor.
// Writes (the contact form) go through netlify/functions/contact.js instead.
export const client = sanityClient({
  projectId: 'oyf22kt8',
  dataset: 'production',
  apiVersion: '2022-02-01',
  useCdn: true,
})
