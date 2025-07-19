import React from 'react'
import Header from './header.module.css'

const FooterElement = () => {
  return (
    <div>
      <p>Made with electricity ⚡⚡ by <span className={`${Header.footerDept} mt-.5`}>Condition Monitoring Cell - {new Date().getFullYear()} 😎 </span></p>
    </div>
  )
}

export default FooterElement