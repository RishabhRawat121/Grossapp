import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../redux/store'
import axios from 'axios';

function useGetCart() {
  const dispatch=useDispatch<AppDispatch>();

  useEffect(()=>{
      const getcart=async()=>{
               try {
            const getcartd=await axios.get("/api/cart");
            console.log("cart data",getcartd.data);

        } catch (error) {
            
        }
      }
      getcart();
      
  },[])
}

export default useGetCart