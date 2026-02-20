import { configureStore } from "@reduxjs/toolkit";
import userSlice from './userSlice'
import cartSlice from './cartSlice'
import locationSlice from"./locationSlice"
export const store=configureStore({
    reducer:{
       user:userSlice,
       cart:cartSlice,
       location:locationSlice,
    }
})

export type RootState=ReturnType<typeof store.getState>

export type AppDispatch=typeof store.dispatch