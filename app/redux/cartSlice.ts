import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { act } from "react";

interface IGrocery {
  _id:string
  name: string;
  category: string;
  price: number;   
  unit: string;
  image?: string;
  quantity?:number,
  createdAt?:Date,
  updatedAt?:Date,
}

interface ICartSlice{
    Cartdata:IGrocery[]
}

const initialState:ICartSlice={
    Cartdata:[]
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartdata: (state, action: PayloadAction<IGrocery>) => {
      const index = state.Cartdata.findIndex(ci => ci._id === action.payload._id)
      if (index >= 0) {
        state.Cartdata[index] = action.payload
      } else {
        state.Cartdata.push(action.payload)
      }
    }
  }
})

export const {setCartdata}=cartSlice.actions

export default cartSlice.reducer