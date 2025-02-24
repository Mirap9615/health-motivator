import React from 'react'

function Nav() {
  return (
    <div className='flex justify-between items-center w-full bg-red-400'>
      <div className='bg-red-400'>
        <p>Health Motivator</p>
      </div>
      <div className='flex justify-between items-center bg-red-400'>
        <p>Home</p>
        <p className='mx-4'>About Us</p>
        <p className='mx-4'>Features</p>
        <p className='mx-4'>Contact Us</p>
        <div>
            <p>Login</p>
            <p>Sign Up</p>
        </div>
      </div>
    </div>
  )
}

export default Nav
