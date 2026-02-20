import { io, Socket } from "socket.io-client";

let socket:Socket|null=null

export const getSocket=()=>{
    if(!socket){
        
        socket=io("https://grossapp.onrender.com")
    }
    return socket
}
