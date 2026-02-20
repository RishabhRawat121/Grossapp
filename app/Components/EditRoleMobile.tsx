"use client";

import axios from "axios";
import { truncate } from "fs";
import { ArrowRight, Bike, User, UserCog } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

 

const EditRoleMobile = () => {
  const[count,setCount]=useState(0);
  useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/user/edit-role-mobile");
      console.log(res.data);
      const isAdmin=res.data.filter((user:any)=>user.role==='admin').length;
      setCount(isAdmin);
    } catch (error) {
      console.error(error);
    }
  };

  fetchData();
}, []);

useEffect(()=>{
  console.log("the admin count",count);
},[count])
  const router=useRouter();
  const [roles] = useState([
    { id: "admin", label: "Admin", icon: UserCog },
    { id: "user", label: "User", icon: User },
    { id: "deliveryBoy", label: "Delivery Boy", icon: Bike },
  ]);
  const [selectedRole, setSelectedRole] = useState("");
  const [mobile, setMobile] = useState("");
  const {update}=useSession()
  const isNextEnabled = selectedRole && mobile.length === 10;
  const handleEdit=async()=>{
    try {
        const result=await axios.post("/api/user/edit-role-mobile",{
            role:selectedRole,
            mobile
        })
        await update({ role: selectedRole });
        router.push("/home");
    } catch (error) {
        console.log(error);
    }
  }
  return (
    <div className="flex flex-col min-h-screen p-6 w-full bg-green-50">
      <motion.h1
        className="text-3xl md:text-4xl font-extrabold text-green-700 text-center mt-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Select Your Role
      </motion.h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-10">
        {roles.filter((data=>!(data.id==='admin' && count>0))).map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            
            <motion.div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              role="button"
              aria-selected={isSelected}
              className={`flex flex-col items-center justify-center w-48 h-44 rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-green-600 bg-green-100 shadow-lg"
                  : "border-gray-300 bg-white hover:border-green-400"
              }`}
            >
              <Icon size={36} className="mb-2 text-green-700" />
              <span className="font-medium">{role.label}</span>
            </motion.div>
          );
        })}
      </div>

      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col items-center mt-10 w-full md:w-auto"
        >
          <label htmlFor="mobile" className="text-gray-700 font-medium mb-2">
            Enter Your Mobile Number
          </label>
          <input
            type="tel"
            id="mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="e.g. 1234567890"
            maxLength={10}
            className="w-full md:w-80 px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </motion.div>
      )}

      {selectedRole && (
        <motion.button
          onClick={handleEdit}
          className={`inline-flex items-center w-[200px] mx-auto justify-center gap-2 font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 mt-8 ${
            isNextEnabled
              ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          disabled={!isNextEnabled}
        >
          Go to Home
          <ArrowRight/>
        </motion.button>
      )}
    </div>
  );
};

export default EditRoleMobile;
