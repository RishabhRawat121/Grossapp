"use client"
import { motion } from "framer-motion"
import React from 'react'
import { ArrowRight, Bike, ShoppingBasket } from 'lucide-react'
type propType={
  nextStep:(s:number)=>void
}
const Welcome = ({nextStep}:propType) => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen text-center p-6'>
        <motion.div className="text-4xl flex items-center gap-3" initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:1}}>
            <ShoppingBasket className='h-10 w-10 text-green-600'/>
            <h1 className='text-4xl md:text-5xl font-extrabold text-green-700'>Snapcart</h1>
            
        </motion.div>
        <motion.p className='mt-4 text-gray-700 text-lg md:text-xl max-w-lg' initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.3}}>
           You one-stop designation for fresh groceries, organic produce, and daily essentials delivered right to your doorstep. 
        </motion.p>
        <motion.div className='flex  items-center justify-center gap-10 mt-10' initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.3}}>
           <ShoppingBasket className='w-24 h-24 md:h-32 text-green-600 drop-shadow-md'/>
           <Bike className='w-24 h-24 md:h-32 text-orange-500 drop-shadow-md'/>
        </motion.div >

        <motion.button onClick={()=>nextStep(2)} className='inline-flex item-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 mt-5'  initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.6}}>
            Next
            <ArrowRight/>
        </motion.button>
    </div>
  )
}

export default Welcome