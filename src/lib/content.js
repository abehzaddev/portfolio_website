import { useEffect, useState } from 'react'
import { client } from '../client'

// Drafts are excluded so unpublished edits never show on the site.
const QUERY = `{
  "abouts": *[_type == "abouts" && !(_id in path("drafts.**"))] | order(order asc){ title, description, "img": imgUrl.asset->url },
  "works": *[_type == "works" && !(_id in path("drafts.**"))] | order(_createdAt desc){ title, description, projectLink, codeLink, tags, role, start, end, "img": imgUrl.asset->url },
  "skills": *[_type == "skills" && !(_id in path("drafts.**"))] | order(order asc){ name, "icon": icon.asset->url },
  "experiences": *[_type == "experiences" && !(_id in path("drafts.**"))] | order(year desc){ year, works[]{ name, company, desc, start, end, highlight } },
  "resume": *[_type == "resumeUpload" && !(_id in path("drafts.**"))][0].resume.asset->url
}`

// Education isn't in Sanity, so it lives here.
export const education = [
  {
    degree: 'M.S. Computer Science',
    school: 'University of Southern California',
    detail: 'Viterbi School of Engineering',
    year: 2024,
  },
  {
    degree: 'B.S. Computer Science',
    school: 'Chapman University',
    detail: 'Fowler School of Engineering · Minors in Entrepreneurship & Neuroscience',
    year: 2022,
  },
]

// Headline numbers for the Profile readout (from the résumé).
export const highlights = [
  { ctx: 'IBM + Cellanome · Professional', value: 2, unit: 'yrs', tail: 'professional AI',
    label: 'Professional experience building AI: multi-agent systems at IBM (A2A handoffs, MCP tool orchestration) and computer-vision models at Cellanome.' },
  { ctx: 'IBM · CI/CD pipeline', value: 24, to: 1, unit: 'h', tail: 'from 24h',
    label: 'Security-scan runtime after I parallelized IBM’s Aqua Security CI/CD scanning.' },
  { ctx: 'Cellanome · Computer vision', value: 70, unit: '%', tail: 'faster',
    label: 'Inference speed-up on microscopy cell segmentation after tuning YOLOv5 size, precision and resolution.' },
  { ctx: 'Munch · Full stack', value: 30, unit: '+', tail: 'API modules',
    label: 'Backend modules in Munch’s TypeScript/Convex server — designed and built solo.' },
]

export const now = [
  { k: 'Engineering', v: 'IBM — WatsonX enterprise agent framework',
    tags: ['A2A multi-agent handoffs', 'MCP tool orchestration', 'Integration Agent (lead)', 'Agentic Tool Studio', 'Multimodal inputs'] },
  { k: 'Building', v: 'Munch — AI restaurant & nutrition app' },
  { k: 'Studied', v: 'M.S. CS, USC · B.S. CS, Chapman' },
]

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/arshia-behzad/' },
  { label: 'GitHub', href: 'https://github.com/abehzaddev' },
  { label: 'YouTube', href: 'https://www.youtube.com/@arshiabehzad' },
  { label: 'Instagram', href: 'https://instagram.com/arshbehzad' },
]

export const EMAIL = 'abehzad.developer@gmail.com'

// Sanity CDN image with resizing params.
export const sized = (url, w) => (url ? `${url}?w=${w}&auto=format&fit=max` : '')

export const useContent = () => {
  const [content, setContent] = useState({
    abouts: [], works: [], skills: [], experiences: [], resume: '', loaded: false,
  })

  useEffect(() => {
    client.fetch(QUERY)
      .then((data) => setContent({ ...data, loaded: true }))
      .catch((err) => {
        console.error('Failed to load content', err)
        setContent((c) => ({ ...c, loaded: true }))
      })
  }, [])

  return content
}
