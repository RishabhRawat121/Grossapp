"use client"
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../redux/store'
import { setUserData } from '../redux/userSlice'

function useGetMe() {
   const dispatch=useDispatch<AppDispatch>()
 useEffect(()=>{
    const getme=async()=>{
         try {
            const result=await axios.get("/api/me")
            dispatch(setUserData(result.data))
            
         } catch (error) {
            console.log("me",error);
         }
    }
    getme()
 },[])
}

export default useGetMe