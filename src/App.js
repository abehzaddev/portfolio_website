import React from 'react'
import Boot from './components/Boot'
import Cursor from './components/Cursor'
import Hud from './components/Hud'
import Hero from './sections/Hero'
import About from './sections/About'
import Work from './sections/Work'
import Toolbox from './sections/Toolbox'
import Log from './sections/Log'
import Contact from './sections/Contact'
import { useContent } from './lib/content'
import { useRevealAll } from './lib/hooks'

const App = () => {
  const { abouts, works, skills, experiences, resume, loaded } = useContent()
  useRevealAll([loaded])

  const roles = ['Software Engineer', ...abouts.map((a) => a.title)]

  return (
    <>
      <Boot />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Hud />
      <main>
        <Hero roles={roles} resume={resume} />
        <About abouts={abouts} />
        <Work works={works} />
        <Toolbox skills={skills} />
        <Log experiences={experiences} works={works} />
        <Contact />
      </main>
    </>
  )
}

export default App
