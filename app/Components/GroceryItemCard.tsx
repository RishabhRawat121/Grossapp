"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Minus, Plus, ShoppingBasket } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { setCartdata } from "../redux/cartSlice"
import type { RootState, AppDispatch } from "../redux/store"

interface IGrocery {
  _id: string
  name: string
  category: string
  price: number
  unit: string
  image?: string
  quantity?: number
  createdAt?: Date
  updatedAt?: Date
}

const GroceryItemCard = ({ item }: { item: IGrocery }) => {
  const dispatch = useDispatch<AppDispatch>()
  const cartdata = useSelector((state: RootState) => state.cart.Cartdata || [])
  const [cartItemData, setCartItemData] = useState<IGrocery | undefined>(undefined)

  useEffect(() => {
    const cartItem = cartdata.find((ci) => ci._id === item._id)
    setCartItemData(cartItem)
  }, [cartdata, item._id])

  const handleAddToCart = async () => {
    try {
      if (cartItemData) return
      dispatch(setCartdata({ ...item, quantity: 1 }))
    } catch (error) {
      console.error(error)
    }
  }

  const handleIncrement = async () => {
    if (!cartItemData) return
    dispatch(setCartdata({ ...cartItemData, quantity: (cartItemData.quantity ?? 0) + 1 }))
  }

  const handleDecrement = async () => {
    if (!cartItemData) return
    const newQuantity = (cartItemData.quantity || 1) - 1
    dispatch(setCartdata({ ...cartItemData, quantity: newQuantity }))
  }

  const isInCart = !!cartItemData && (cartItemData.quantity || 0) > 0

  return (
    <motion.div
      // ✅ FIX: Use flex-col + fixed width + min/max height so all cards are same size
      className="bg-white shadow-md rounded-2xl overflow-hidden flex flex-col w-[220px] sm:w-[230px] h-[340px]"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
    >
      {/* ✅ FIX: Fixed image height so all cards align regardless of image ratio */}
      <div className="h-[160px] w-full bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* ✅ FIX: flex-1 so content fills remaining space, pushing button to bottom */}
      <div className="flex flex-col flex-1 p-4">
        {/* ✅ FIX: line-clamp to prevent long names from breaking layout */}
        <h2 className="text-base font-semibold text-gray-800 mb-1 line-clamp-1">
          {item.name}
        </h2>
        <p className="text-gray-400 text-xs mb-3 line-clamp-1">{item.category}</p>

        <div className="flex justify-between items-center mb-4">
          <span className="text-green-600 font-bold text-base">₹{item.price}</span>
          <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            {item.unit}
          </span>
        </div>

        {/* ✅ FIX: mt-auto pushes the button to the bottom of the card always */}
        <div className="mt-auto">
          {isInCart ? (
            <div className="flex items-center justify-between w-full bg-green-600 rounded-full px-4 py-2 text-white font-semibold">
              <button
                onClick={handleDecrement}
                className="p-1 hover:bg-green-700 rounded-full transition"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="text-base">{cartItemData?.quantity}</span>
              <button
                onClick={handleIncrement}
                className="p-1 hover:bg-green-700 rounded-full transition"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 w-full rounded-full flex items-center justify-center gap-2 text-sm transition-colors duration-300"
              onClick={handleAddToCart}
            >
              <ShoppingBasket size={16} />
              Add to Cart
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default GroceryItemCard
