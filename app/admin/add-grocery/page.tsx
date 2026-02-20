"use client"

import axios from "axios"
import { ArrowLeft, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import React, { useState } from "react"

function AddGrocery() {
  const categories = [
    "Fruits & Vegetables",
    "Dairy & Eggs",
    "Rice, Atta & Grain",
    "Snacks & Biscuits",
    "Spices & Masalas",
    "Beverages & Drinks",
    "Personal Care",
    "Household Essentials",
    "Instant & Packaged food",
    "Baby & Pet Care",
  ]

  const units = ["kg", "g", "liter", "ml", "piece", "pack"]

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [unit, setUnit] = useState("")
  const [description, setDescription] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [backendImage, setBackendImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackendImage(e.target.files[0])
      setPreview(URL.createObjectURL(e.target.files[0]))
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!backendImage) {
      alert("Please upload an image!")
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("name", name)
      formData.append("price", price)
      formData.append("category", category)
      formData.append("unit", unit)
      formData.append("description", description)
      formData.append("image", backendImage)

      const result = await axios.post("/api/admin/addGrossery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      console.log("Response:", result.data)
      alert("Grocery added successfully!")

      // Reset form
      setName("")
      setPrice("")
      setCategory("")
      setUnit("")
      setDescription("")
      setPreview(null)
      setBackendImage(null)
    } catch (error) {
      console.error(error)
      alert("Error adding grocery!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-10 px-4">
      <Link
        href="/home"
        className="absolute top-6 left-6 flex items-center gap-2 text-green-700 font-semibold bg-white px-4 py-2 rounded-full shadow-md hover:bg-green-100 hover:shadow-lg transition-all z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to home</span>
      </Link>

      {/* Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-md sm:max-w-2xl shadow-2xl rounded-3xl border border-green-100 p-6 sm:p-10 flex flex-col gap-6 overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center gap-3">
            <PlusCircle className="w-8 h-8 text-green-500" />
            <h1 className="text-xl sm:text-3xl font-bold text-green-700">
              Add Your Grocery
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-500 max-w-md">
            Fill out the details below to add a new grocery item
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {/* Grocery Name */}
          <input
            type="text"
            placeholder="Grocery Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-green-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm transition"
            required
          />

          {/* Price */}
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-green-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm transition"
            required
          />

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-green-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm transition"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-green-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm transition"
              required
            >
              <option value="">Select Unit</option>
              {units.map((unit, idx) => (
                <option key={idx} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-green-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none shadow-sm transition"
            rows={4}
          />

          {/* Image Upload */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-gray-700 font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm sm:text-base"
              required
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-xl border border-green-200 shadow-md"
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Grocery"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default AddGrocery
