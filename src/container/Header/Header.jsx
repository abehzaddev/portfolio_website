import React, {useState, useEffect} from 'react'
import {motion} from 'framer-motion'
import {images} from '../../constants'
import './Header.scss'
import {client} from '../../client' 
import {AppWrap} from '../../wrapper'

const scaleVariants = {
  whileInView:{
      scale: [0,1],
      opacity: [0,1],
      transition: {
        duration: 1,
        ease: 'easeInOut'
      }

  }
}
const Header = () => {

  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    const query = `*[_type == "resumeUpload"][0]{
      title,
      "pdfUrl": resume.asset->url
    }`;
    client.fetch(query).then((data) => {
      if (data && data.pdfUrl) {
        setPdfUrl(data.pdfUrl); 
      }
    }).catch(error => console.error("Fetching PDF URL failed", error));
  }, []);
  return (
    <div className = "app__header app__flex">
    <motion.div
        whileInView={{ x: [-100,0], opacity: [0,1]}}
        transition = {{duration: 0.5}}
        className = "app__header-info"
      >
        <div className = "app__header-badge">
          <div className="badge-cmp app_flex">
            <span>👋</span>
            <div style={{marginLeft: 20}}>
              <p className="p-text">Hello, I am</p>
              <h1 className="head-text">Arshia</h1>
            </div>
          </div>
          <div className='tag-cmp app__flex'>
            <p className="p-text">Software Engineer</p>
            <p className="p-text">USC MS in CS</p>
            <p className="p-text">Chapman BS in CS</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="resume-download-button bold-text"
            onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
          >
            Download My Resume
          </motion.button>
        </div>
    </motion.div>
    <motion.div
        whileInView={{opacity: [0,1]}}
        transition = {{duration: 0.5, delayChildren: 0.5}}
        className = "app__header-img"
    >
        <img src={images.profile} alt="profile_bg"></img>
        <motion.img
         whileInView={{scale: [0,1]}}
         transition = {{duration: 1, ease: 'easeInOut'}}
         src ={images.circle}
         alt="profile_circle"
         className="overlay_circle"
        />
    </motion.div>

    <motion.div
      variant={scaleVariants}
      whileInView={scaleVariants.whileInView}
      className="app__header-circles"
    >
      {[images.cplusC, images.pythonC, images.reactC].map((circle,index) => (
        <div className= "circle-cmp app__flex" key={`circle-${index}`}>
          <img src={circle} alt="circle"/>
        </div>
      ))}
    </motion.div>
    </div>
  )
}

export default AppWrap(Header, "home")