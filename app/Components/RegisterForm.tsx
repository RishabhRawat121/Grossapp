"use client"
import { ArrowLeft, EyeIcon, EyeOff, Key, Leaf, Loader, Loader2, Lock, LogIn, Mail, User } from 'lucide-react'
import { motion } from "framer-motion"
import React, { useState } from 'react'
import googleImage from '@/app/assests/google.png'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
type propType={
    previousStep:(s:number)=>void
}
const RegisterForm = ({previousStep}:propType) => {
    const[name,setName]=useState("");
    const[email,setEmail]=useState("");
    const[password,setPassword]=useState("");
    const[showPassword,setShowPassword]=useState(false);
    const[loading,Setloading]=useState(false)
    const router=useRouter();
    const handleRegister=async(e:React.FormEvent)=>{
      try {
         e.preventDefault()
         Setloading(true)
         const result=await axios.post("/api/auth/register",{name,email,password})
         router.push("/Login");
         Setloading(false);
         console.log(result);
      } catch (error) {
         console.log(error);
         Setloading(false)
      }
    }
    return (
    <div className='flex flex-col item-center justify-center min-h-screen px-6 py-10 bg-white relative'>
    <div onClick={()=>previousStep(1)} className='absolute top-6 left-6 flex items-center gap-2 text-green-700 hover:text-green-800 transition-colors cursor-pointer'>
        <ArrowLeft className='w-5 h-5'/>
        <span className='font-medium'>Back</span>
    </div>
     <motion.h1 initial={{
        y:-10,
        opacity:0
     }} animate={{y:0, opacity:1}} transition={{
        duration:0.6
     }} className='text-4xl font-extrabold text-green-700 mb-2 text-center'>Create Account</motion.h1>
    <p className='text-gray-600 mb-8 flex items-center text-center mx-auto '>join snap cart Today<Leaf className='w-5 h-5 text-green-600'/></p>
    <motion.form onSubmit={handleRegister} initial={{
        opacity:0
     }} animate={{ opacity:1}} transition={{
        duration:0.6
     }} className='flex flex-col gap-5 w-full max-w-sm mx-auto'>
     <div className="relative ">
        <User className='absolute left-3 top-3.5 w-5 h-5 text-gray-400'/>
        <input value={name} onChange={(e)=>setName(e.target.value)} className=' w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none' type="text" placeholder='Enter Your Name' />
     </div>
      <div className="relative ">
        <Mail className='absolute left-3 top-3.5 w-5 h-5 text-gray-400'/>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className=' w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none' type="text" placeholder='Enter Your Email' />
     </div>
      <div className="relative ">
        <Lock className='absolute left-3 top-3.5 w-5 h-5 text-gray-400'/>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} className=' w-full border border-gray-300 rounded-xl py-3 pl-10 pr-4 text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none' type={showPassword?"text":"password"} placeholder='Enter Your Password' />
         {
            showPassword?<EyeOff onClick={()=>setShowPassword(false)} className='absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer'/>:<EyeIcon onClick={()=>setShowPassword(true)} className='absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer'/>
         }
     </div>
      {
       (() => {
  const formValidation = name !== "" && email !== "" && password !== "";

  return (
    <button
      className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 shadow-md inline-flex items-center justify-center gap-2 ${
        formValidation
          ? "bg-green-600 hover:bg-green-700 hover:text-white text-gray-800"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
    >
      {loading ?<Loader2 className='w-5 h-5 animate-spin'/>:"Register"}
     
    </button>
  );
})()
}
<div className="flex items-center gap-2 text-gray-400 text-sm mt-2">

   <span className='flex-1 h-px bg-gray-200'>

   </span>
   OR
   <span className='flex-1 h-px bg-gray-200'>

   </span>
</div>
 <div onClick={()=>signIn("google",{callbackUrl:"/"})} className="
  w-full flex items-center justify-center gap-3
  border border-gray-300 hover:bg-gray-50
  py-3 rounded-xl text-gray-700 font-medium
  transition-all duration-200
">
  <Image src={googleImage} width={20} height={20} alt="google" />
  Continue with Google
</div>


    </motion.form>
    <p className='flex justify-center mt-10 gap-1' onClick={()=>router.push("/Login")}>Already have an account ?<LogIn className='w-4 h-4 mt-1'/><span className='text-green-600'>SignIn</span></p>
    </div>
  )
}

export default RegisterForm