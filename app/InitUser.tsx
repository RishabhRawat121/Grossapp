"use client"
import React from 'react'
import useGetMe from './hooks/useGetMe'
import useGetCart from './hooks/useGetCart'

function InitUser() {
   useGetMe()
   useGetCart()
   return null;
}

export default InitUser