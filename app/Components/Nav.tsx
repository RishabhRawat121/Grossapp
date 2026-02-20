"use client"
import { Package, Search, ShoppingCartIcon, LogOut, X, PlusCircle, Boxes, ClipboardCheckIcon } from 'lucide-react'
import { AnimatePresence, motion } from "framer-motion"
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
interface IUser {
  _id?: string
  name: string
  email: string
  password?: string
  mobile?: string
  role: 'user' | 'deliveryBoy' | 'admin'
  image?: string
}

const Nav = ({ user }: { user?: IUser }) => {
  const [open, setOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const {Cartdata}=useSelector((state:RootState)=>state.cart)
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleLogout = () => {
    setOpen(false)
    signOut({ callbackUrl: "/" })
  }

  const profileDropDown = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
        setOpen(false)
        setShowMobileSearch(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="w-[95%] mx-auto bg-gradient-to-r from-green-500 to-green-700 rounded-2xl shadow-lg shadow-black/30 flex justify-between items-center h-20 px-4 md:px-8 my-4">
      <Link href="/" className="text-white font-extrabold text-2xl sm:text-3xl tracking-wide hover:scale-105 transition-transform pl-5">
        Snap Cart
      </Link>
      {user?.role === 'user' && (
        <form className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/2 max-w-lg shadow-md">
          <Search className="text-gray-500 w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full outline-none text-gray-700 placeholder-gray-400"
          />
        </form>
      )}
      <div className="flex items-center gap-3 md:gap-6 relative">
        {user?.role==='user' && (
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="flex items-center justify-center bg-white rounded-full h-10 w-10"
            >
              {showMobileSearch ? <X className="w-5 h-5 text-green-700" /> : <Search className="w-5 h-5 text-green-700" />}
            </button>
          </div>
        )}
        {user?.role === 'user' && (
          <Link href="/user/cart">
            <div className="relative flex items-center justify-center bg-white rounded-full h-10 w-10">
              <ShoppingCartIcon className="w-6 h-6 text-green-700" />
              <span className="absolute -top-2 -right-2 bg-white text-green-700 text-xs font-bold rounded-full px-2">{Cartdata.length}</span>
            </div>
          </Link>
        )}
        {user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <div className="flex md:hidden gap-2">
              <Link  href="/admin/add-grocery" className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-green-50 text-green-600">
                <PlusCircle />
              </Link>
              <Link href="/view-grocery" className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-green-50 text-green-600">
                <Boxes />
              </Link>
              <Link href="/admin/manage-orders" className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow hover:bg-green-50 text-green-600">
                <ClipboardCheckIcon />
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/admin/add-grocery" className="bg-white flex gap-2 text-green-700 font-semibold px-4 py-2 rounded-xl shadow hover:shadow-lg hover:bg-green-50 transition-all">
                <PlusCircle/> Add Grocery
              </Link>
              <Link href="/view-grocery" className="bg-white flex gap-2 text-green-700 font-semibold px-4 py-2 rounded-xl shadow hover:shadow-lg hover:bg-green-50 transition-all">
                <Boxes/> View Grocery
              </Link>
              <Link href="/admin/manage-orders" className="bg-white flex gap-2 text-green-700 font-semibold px-4 py-2 rounded-xl shadow hover:shadow-lg hover:bg-green-50 transition-all">
                <ClipboardCheckIcon/> Manage Orders
              </Link>
            </div>
          </div>
        )}
        <div className="relative" ref={profileDropDown}>
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center bg-white rounded-full h-10 w-10 overflow-hidden cursor-pointer"
          >
            {user?.image ? (
              <Image src={user.image} alt={user.name} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                {getInitials(user?.name)}
              </div>
            )}
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg py-2 z-50"
              >
                <div className="flex items-center px-4 py-3 gap-3 border-b border-gray-200">
                  {user?.image ? (
                    <Image src={user.image} alt={user.name} width={50} height={50} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <span className="font-semibold text-gray-700">{user?.name}</span>
                    <span className="text-gray-500 text-sm">{user?.role}</span>
                  </div>
                </div>

                {user?.role === 'user' && (
                  <Link
                    href="/user/my-order"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                  >
                    <Package className="w-5 h-5" /> My Orders
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600 cursor-pointer w-full text-left"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showMobileSearch && user?.role==='user' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-0 w-full px-4 md:hidden"
          >
            <div className="bg-white rounded-full shadow-md flex items-center px-4 py-2">
              <Search className="text-gray-500 w-5 h-5 mr-2" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Nav
