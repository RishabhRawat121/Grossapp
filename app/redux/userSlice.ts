import { createSlice } from "@reduxjs/toolkit";
import mongoose from "mongoose";

interface Iuser{
   _id?:mongoose.Types.ObjectId
   name:string,
   email:string,
   password?:string,
   mobile?:string,
   role:"user"|"deliveryBoy"|"admin"
   image?:string
}

interface IUserSlice{
   userData:Iuser|null
}

const initialState:IUserSlice={
    userData:null
}


const userSlice=createSlice({
    name:"user",
    initialState,
    reducers:{
        setUserData:(state,action)=>{
          state.userData=action.payload
        }
    }
})

export const {setUserData}=userSlice.actions

export default userSlice.reducer