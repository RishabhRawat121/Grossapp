"use client"

import { useState } from "react"
import Welcome from "../app/Components/Welcome"
import RegisterForm from "../app/Components/RegisterForm"

export default function Register() {
  const [step, setStep] = useState(1)

  return (
    <div>
      {step === 1 ? (
        <Welcome nextStep={setStep} />
      ) : (
        <RegisterForm previousStep={setStep} />
      )}
    </div>
  )
}
