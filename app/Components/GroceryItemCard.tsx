"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Minus, Plus, ShoppingBasket } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { setCartdata } from "../redux/cartSlice"
import type { RootState, AppDispatch } from "../redux/store"
import axios from "axios"
import CategorySlider from "./CategorySlider"


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
const GroceryItemCard = ({ item }: { item: IGrocery }) => {
  const dispatch = useDispatch<AppDispatch>()
  const cartdata = useSelector((state: RootState) => state.cart.Cartdata || [])
  const [cartItemData, setCartItemData] = useState<IGrocery | undefined>(undefined)

  useEffect(() => {
    console.log("the cart data Redux",cartdata)
    const cartItem = cartdata.find(ci => ci._id === item._id)
    setCartItemData(cartItem)
  }, [cartdata, item._id])

  const handleAddToCart = async () => {
  try {
    if (cartItemData) return
    const updatedCart = [...cartdata, { ...item, quantity: 1 }]

    dispatch(setCartdata({ ...item, quantity:1}))

    const payload = updatedCart.map(item => ({
      category: item.category,
      image: item.image,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
    }))

    console.log("sending payload", payload)
  } catch (error) {
    console.error(error)
  }
}


  const handleIncrement=async()=>{
    if(!cartItemData)return;
    const newQuantity=(cartItemData.quantity??0)+1;
    dispatch(
      setCartdata({
         ...cartItemData,
         quantity:newQuantity
      })
      
    )
  }

  const handleDecrement = async() => {
    if (!cartItemData) return
    const newQuantity = (cartItemData.quantity || 1) - 1
    dispatch(setCartdata({ ...cartItemData, quantity: newQuantity }))
  }

  const isInCart = !!cartItemData && (cartItemData.quantity || 0) > 0

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl overflow-hidden w-70 cursor-pointer hover:scale-105 transition-transform duration-300"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.6 }}
    >
      <div className="h-50 w-full bg-gray-100">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full mt-5 object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-1">{item.name}</h2>
        <p className="text-gray-500 text-sm mb-2">{item.category}</p>
        <div className="flex justify-between items-center">
          <span className="text-green-600 font-bold">₹{item.price}</span>
          <span className="text-gray-400 text-sm">{item.unit}</span>
        </div>
      </div>

      <div className="flex justify-center mt-4 mb-3">
        {isInCart ? (
          <div className="flex items-center justify-between w-[230px] bg-green-600 rounded-full px-4 py-2 text-white font-semibold">
            <button onClick={handleDecrement} className="p-1 hover:bg-green-700 rounded-full transition">
              <Minus size={18} />
            </button>
            <span className="mx-4 text-lg">{cartItemData?.quantity}</span>
            <button onClick={handleIncrement} className="p-1 hover:bg-green-700 rounded-full transition">
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 w-[230px] rounded-full flex items-center justify-center gap-3 transition-colors duration-300"
            onClick={handleAddToCart}
          >
            <ShoppingBasket />
            Add to Cart
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default GroceryItemCard
