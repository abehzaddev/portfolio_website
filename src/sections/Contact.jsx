import React, { useEffect, useRef, useState } from 'react'
import { SectionLabel } from './About'
import { EMAIL, socials } from '../lib/content'
import { jumpTo } from '../components/Hud'

const STEPS = [
  { key: 'name', q: 'what should I call you?', type: 'text', auto: 'name' },
  { key: 'email', q: 'where can I write back?', type: 'email', auto: 'email' },
  { key: 'message', q: "what's on your mind?", type: 'textarea' },
]

const validate = (key, v) => {
  if (!v.trim()) return 'this one is required'
  if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "that doesn't look like an email"
  return ''
}

const Terminal = () => {
  const [values, setValues] = useState({ name: '', email: '', message: '', company: '' })
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | failed
  const inputs = useRef([])

  useEffect(() => {
    if (step > 0 && inputs.current[step]) inputs.current[step].focus()
  }, [step])

  const advance = (i) => {
    const err = validate(STEPS[i].key, values[STEPS[i].key])
    if (err) { setError(err); return false }
    setError('')
    if (i === step && step < STEPS.length - 1) setStep(step + 1)
    return true
  }

  const send = () => {
    for (let i = 0; i < STEPS.length; i++) {
      const err = validate(STEPS[i].key, values[STEPS[i].key])
      if (err) { setError(err); setStep(Math.max(step, i)); inputs.current[i] && inputs.current[i].focus(); return }
    }
    setError('')
    setStatus('sending')
    // Saved server-side by netlify/functions/contact.js, which holds the Sanity write token.
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Contact failed: ${res.status}`)
        setStatus('sent')
      })
      .catch((err) => { console.error(err); setStatus('failed') })
  }

  const onKey = (i) => (e) => {
    if (STEPS[i].type === 'textarea') {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      advance(i)
    }
  }

  return (
    <div className="term" data-reveal>
      <div className="term__bar mono">
        <span className="term__lights"><i /><i /><i /></span>
        <span>~/arshia — message.sh</span>
        <span>{status === 'sent' ? 'exit 0' : 'zsh'}</span>
      </div>
      <div className="term__body mono" onClick={() => inputs.current[step] && status === 'idle' && inputs.current[step].focus()}>
        <p className="term__dim">$ ./message.sh --to arshia</p>
        {/* Honeypot for bots; hidden from people and screen readers */}
        <input
          className="term__trap" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={values.company} onChange={(e) => setValues({ ...values, company: e.target.value })}
        />
        {STEPS.slice(0, step + 1).map((s, i) => {
          const Field = s.type === 'textarea' ? 'textarea' : 'input'
          return (
            <div key={s.key} className="term__step">
              <label htmlFor={`f-${s.key}`}><span className="term__prompt">?</span> {s.q}</label>
              <div className="term__input">
                <span className="term__caret">›</span>
                <Field
                  id={`f-${s.key}`}
                  ref={(el) => { inputs.current[i] = el }}
                  type={s.type === 'textarea' ? undefined : s.type}
                  autoComplete={s.auto}
                  rows={s.type === 'textarea' ? 4 : undefined}
                  value={values[s.key]}
                  disabled={status === 'sending' || status === 'sent'}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  onKeyDown={onKey(i)}
                  spellCheck={s.type === 'textarea'}
                  placeholder={s.type === 'textarea' ? 'type away — ⌘↵ to send' : 'type, then press enter'}
                />
              </div>
            </div>
          )
        })}
        {error && <p className="term__err">! {error}</p>}

        {status === 'idle' && (
          <div className="term__actions">
            {step < STEPS.length - 1 ? (
              <button className="btn" onClick={() => advance(step)} data-cursor="NEXT">Next ↵</button>
            ) : (
              <button className="btn btn--solid" onClick={send} data-cursor="SEND">Send message ⌘↵</button>
            )}
          </div>
        )}
        {status === 'sending' && <p className="term__dim">transmitting<span className="term__dots" /></p>}
        {status === 'sent' && <p className="term__ok">✓ message delivered. talk soon, {values.name.trim().split(' ')[0]}.</p>}
        {status === 'failed' && (
          <p className="term__err">
            ! transmission failed. <button className="term__link" onClick={send}>retry</button> or email {EMAIL}
          </p>
        )}
      </div>
    </div>
  )
}

const Contact = () => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800) }
    if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(done, () => { window.location.href = `mailto:${EMAIL}` })
    else window.location.href = `mailto:${EMAIL}`
  }

  return (
    <section id="contact" className="contact section">
      <SectionLabel n={5}>Contact</SectionLabel>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[0, 1, 2, 3].map((k) => (
            <span key={k}>Let's build <em>something</em> <b>✺</b> </span>
          ))}
        </div>
      </div>

      <div className="contact__grid">
        <div className="contact__left" data-reveal>
          <p className="mono contact__k">Direct line</p>
          <button className="contact__email" onClick={copy} data-cursor={copied ? 'COPIED' : 'COPY'}>
            <span>{EMAIL}</span>
            <em className="mono">{copied ? '✓ copied to clipboard' : 'click to copy'}</em>
          </button>
          <a className="mono contact__mailto" href={`mailto:${EMAIL}`}>or open your mail app ↗</a>

          <ul className="contact__socials">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" data-cursor="VISIT">
                  <span>{s.label}</span><i aria-hidden="true">↗</i>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Terminal />
      </div>

      <footer className="footer mono">
        <span>© {new Date().getFullYear()} Arshia Behzad</span>
        <span>Built with React + Sanity · Rendered live in ASCII</span>
        <button onClick={() => jumpTo('home')} data-cursor="REWIND">Rewind ↑</button>
      </footer>
    </section>
  )
}

export default Contact
