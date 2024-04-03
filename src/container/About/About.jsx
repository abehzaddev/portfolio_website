import React, {useState, useEffect} from 'react'
import './About.scss'
import {motion} from 'framer-motion'
import {images} from '../../constants'
import {urlFor, client} from '../../client' 
import { AppWrap, MotionWrap } from '../../wrapper'

const About = () => {

  const [abouts, setAbouts] = useState([])

  useEffect(() => {
    const query = '*[_type == "abouts"] | order(order asc)'

    client.fetch(query)
      .then((data) => setAbouts(data))
  }, [])

  const specialAbouts = [
    {
      title: "Masters in Computer Science",
      school: "University of Southern California",
      description: "Class of 2024, Viterbi School of Engineering",
      aditionalInfo:"",
      imgUrl:images.usc, // Adjust as needed
    },
    {
      title: "Bachelors in Computer Science",
      school: "Chapman University",
      description: "Class of 2022, Fowler School of Engineering",
      aditionalInfo: "Minors: Entrepreneurship & Neuroscience",
      imgUrl: images.chapman, // Adjust as needed
    },
  ];
  

  return (
   <>
    <h2 className="head-text">Who <span>I am</span>
    </h2>

    <div className='app__profiles'>
      {abouts.map((about,index) => (
        <motion.div
          whileInView={{ opacity: 1}}
          whileHover={{scale:1.1}}
          transition={{ duration:0.5, type:"tween"}}
          className="app__profile-item"
          key={about.title + index}
        >
            <img src={urlFor(about.imgUrl)} alt={about.title} />
            <h2 className='bold-text' style={{marginTop:20}}>{about.title}</h2>
            <p className='p-text' style={{marginTop:10}}>{about.description}</p>
        </motion.div>
      ))}
    </div>
    <div className="app__special-profiles">
  {specialAbouts.map((about, index) => (
    <motion.div
      whileInView={{ opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.5, type: "tween" }}
      className="app__special-profile-item"
      key={about.title + index}
    >
      <img src={about.imgUrl} alt={about.title} />
      <div className="content">
        <h2 className="head-color">{about.school}</h2>
        <h2 className="bold-text">{about.title}</h2>
        <p className="p-text">{about.description}</p>
        <p className="p-text">{about.aditionalInfo}</p>
      </div>
    </motion.div>
  ))}
</div>
   </>
  )
}

export default AppWrap(
  MotionWrap(About, 'app__about'),
  'about',
  'app__whitebg',
);