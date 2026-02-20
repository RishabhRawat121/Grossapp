"use client"

import React, { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { RootState, AppDispatch } from "../../redux/store"
import { setCartdata } from "../../redux/cartSlice"
import { Minus, Plus, Trash } from "lucide-react"
import { useRouter } from 'next/navigation'

interface IGrocery {
  _id: string
  name: string
  category: string
  price: number
  unit: string
  image?: string
  quantity?: number
}

const CartPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const cartdata: IGrocery[] = useSelector((state: RootState) => state.cart.Cartdata)

  useEffect(() => {
    console.log("the cart data", cartdata)
  }, [cartdata])

  const handleIncrement = (item: IGrocery) => {
    const newQuantity = (item.quantity || 0) + 1
    dispatch(setCartdata({ ...item, quantity: newQuantity }))
  }

  const handleDecrement = (item: IGrocery) => {
    const newQuantity = (item.quantity || 1) - 1
    dispatch(setCartdata({ ...item, quantity: newQuantity }))
  }

  const handleRemove = (item: IGrocery) => {
    dispatch(setCartdata({ ...item, quantity: 0 }))
  }

  const totalItems = cartdata.reduce((acc, item) => acc + (item.quantity || 0), 0)
  const totalPrice = cartdata.reduce((acc, item) => acc + (item.price * (item.quantity || 0)), 0)

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-600">Your Cart</h1>

      {cartdata.length === 0 ? (
        <div className="text-center text-gray-500">Your cart is empty.</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {cartdata.map((item) => (
              <div key={item._id} className="flex items-center justify-between bg-white shadow rounded p-4">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded text-gray-500">
                      No Image
                    </div>
                  )}
                  <div className="flex flex-col justify-between">
                    <h2 className="font-semibold text-lg text-gray-800">{item.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{item.category}</p>
                    <div className="flex items-center justify-between mt-2 gap-3">
                      <span className="text-green-600 font-bold text-lg">₹{item.price}</span>
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                        <button onClick={() => handleDecrement(item)} className="p-1 hover:bg-gray-300 rounded transition">
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-medium">{item.quantity || 0}</span>
                        <button onClick={() => handleIncrement(item)} className="p-1 hover:bg-gray-300 rounded transition">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRemove(item)} className="p-1 bg-red-500 hover:bg-red-600 rounded text-white transition">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-1/3 bg-white shadow rounded p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="flex justify-between text-gray-700">
              <span>Total Items:</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>₹{totalPrice}</span>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900 text-lg">
              <span>Total:</span>
              <span>₹{totalPrice}</span>
            </div>
            <button onClick={()=>router.push("/checkout/")} className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded w-full transition">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
