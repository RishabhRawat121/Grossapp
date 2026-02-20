import React from 'react'

function unauthorized() {
  return (
    <div className='flex flex-col item-center justify-center h-screen bg-gray-100 w-full'>
        <h1 className='text-3xl font-bold text-red-600 text-center'>Access Denied  🚫</h1> 
        <p className='mt-2 text-gray-700 text-center'>You can not access this page</p>
    </div>
    
  )
}

export default unauthorized;