"use client"

import { ArrowRight, CheckCircle } from 'lucide-react'
import { motion } from "framer-motion"
import Link from 'next/link'
import React from 'react'

const Order = () => {
  return (
    <div className='relative flex flex-col items-center justify-center min-h-[80vh] px-6 text-center bg-gradient-to-b from-green-50 to-white overflow-hidden'>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='text-green-700 text-6xl md:text-7xl'
      >
        <CheckCircle />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='text-3xl md:text-4xl font-bold text-green-700 mt-6'
      >
        Order Placed Successfully
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className='text-gray-600 mt-4 text-sm md:text-base max-w-md'
      >
        Thank you for shopping with us! Your order has been placed and is being
        processed. You can track its progress in your{' '}
        <span className='font-semibold text-green-700'>My Orders</span> section.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className='mt-12'
      >
        <Link href="/user/my-order" className='inline-block'>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-base font-semibold px-8 py-3 rounded-full shadow-lg transition-all'
          >
            Go to My Orders <ArrowRight />
          </motion.div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-green-400 rounded-full animate-bounce" />
        <div className="absolute top-32 left-[30%] w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <div className="absolute top-24 left-[50%] w-2 h-2 bg-green-400 rounded-full animate-bounce" />
        <div className="absolute top-16 left-[70%] w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </motion.div>

    </div>
  )
}

export default Order
