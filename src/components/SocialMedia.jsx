import React from 'react'
import {BsYoutube, BsInstagram} from 'react-icons/bs'
import {FaLinkedinIn} from 'react-icons/fa'
const SocialMedia = () => {
  return (
    <div className='app__social'>
         <a href="https://www.linkedin.com/in/arshia-behzad/" target="_blank" rel="noopener noreferrer">
          <div>
                <FaLinkedinIn />
          </div>
        </a>
        <a href="https://www.youtube.com/@arshiabehzad" target="_blank" rel="noopener noreferrer">
          <div>
              <BsYoutube />  
          </div>
        </a>
        <a href="https://instagram.com/arshbehzad" target="_blank" rel="noopener noreferrer">
          <div>
                <BsInstagram />
          </div>
        </a>
    </div>
  )
}

export default SocialMedia