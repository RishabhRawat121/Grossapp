"use client"
import React, { useState } from 'react'
import Welcome from '../Components/Welcome'
import RegisterForm from '../Components/RegisterForm'

function Register() {
  const [step,setStep]=useState(1)
  return (
    <div>
      {step==1 ? <Welcome nextStep={setStep}/>:<RegisterForm previousStep={setStep}/>}
      
      </div>
  )
}

export default Register