import React, { useEffect, useState } from 'react'
import AsciiPortrait from '../components/AsciiPortrait'
import Scramble from '../components/Scramble'
import { jumpTo } from '../components/Hud'
import { images } from '../constants'

// Face bounding box in profile.png, as fractions of the image.
const FACE = { x0: 0.285, y0: 0.19, x1: 0.555, y1: 0.555 }

const Hero = ({ roles, resume }) => {
  const [i, setI] = useState(0)
  const list = roles.length ? roles : ['Software Engineer']

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % list.length), 2600)
    return () => clearInterval(t)
  }, [list.length])

  return (
    <section id="home" className="hero">
      <div className="hero__portrait">
        <AsciiPortrait src={images.profile} face={FACE} label="ARSHIA" />
      </div>

      <div className="hero__meta mono">
        <p><span>Name</span><i /> Arshia Behzad</p>
        <p><span>Role</span><i /> Software Engineer</p>
        <p><span>M.S. CS</span><i /> USC · 2024</p>
        <p><span>B.S. CS</span><i /> Chapman · 2022</p>
      </div>

      <h1 className="hero__name" aria-label="Arshia Behzad">
        <span className="hero__first">Arshia</span>
        <span className="hero__last">Behzad</span>
      </h1>

      <div className="hero__foot">
        <p className="hero__role mono">
          <span className="hero__role-k">Currently detecting</span>
          <Scramble key={i} text={list[i % list.length]} className="hero__role-v" />
        </p>
        <div className="hero__actions">
          <a
            className="btn btn--solid"
            href={resume || undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!resume}
            data-cursor="DOWNLOAD"
          >
            Résumé.pdf <span aria-hidden="true">↓</span>
          </a>
          <button className="btn" onClick={() => jumpTo('contact')} data-cursor="HELLO">
            Say hello <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <button className="hero__scroll mono" onClick={() => jumpTo('about')} data-cursor="ROLL">
        <span>Scroll to roll film</span>
        <i />
      </button>
    </section>
  )
}

export default Hero
