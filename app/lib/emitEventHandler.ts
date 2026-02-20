import axios from 'axios'
import React from 'react'

async function emitEventHandler(event:string,data:any,socketId?:string) {
   try {
   const res= await axios.post("http://localhost:5000/notify",{event,data,socketId})
   console.log("patch val data emitevent",res.data); 
   if (!res.data) {
      console.warn("emitEventHandler: Server did not return any data");
      return { success: false };
    }
   return res.data;  
} catch (error) {
    console.log(error)
   }
}

export default emitEventHandler