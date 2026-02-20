"use client"
import { useEffect } from "react"
import { getSocket } from "../lib/socket"


function GeoUpdater({userId}:{userId:string}){
   let socket=getSocket()
   socket.emit("identity",userId);
   useEffect(()=>{
      if(!userId){
        return
      }
      if(!navigator.geolocation) return
       const watcher= navigator.geolocation.watchPosition((pos)=>{
             const lat=pos.coords.latitude;
             const lon=pos.coords.longitude;
             console.log("the long value",lon);
             console.log("the lat value",lat);
             socket.emit("update-location",{
                userId,
                latitude:lat,
                longitude:lon
             })
        },(err)=>{
            console.log(err)
        },{enableHighAccuracy:true})
        return ()=>navigator.geolocation.clearWatch(watcher)
      
   },[])

   return null;
}

export default GeoUpdater