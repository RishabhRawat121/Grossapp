
import React from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import connectDb from '../lib/Db'
import groceryModel from '../models/grocery.model'
import GroceryItemCard from './GroceryItemCard'
const UserDashBoard = async() => {
  await connectDb()
  const groceries=await groceryModel.find({}).lean()
  const plainGrocery=JSON.parse(JSON.stringify(groceries))
  return (
    <>
    <HeroSection/>
    <CategorySlider/>
    <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center mt-10">
            Popular Grocery Items
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[15px] px-4">
  {plainGrocery.map((item: any) => (
    <GroceryItemCard key={item._id} item={item} />
  ))}
</div>


    </>
  )
}

export default UserDashBoard
