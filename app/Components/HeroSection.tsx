"use client";

import React, { useEffect, useState } from "react";
import { Leaf, ShoppingBasket, PackageCheck, Truck } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

const HeroSection = () => {
  const slides = [
    {
      id: 1,
      icon: <Leaf className="w-20 h-20 text-green-500 drop-shadow-md" />,
      title: "Fresh Organic Groceries",
      subtitle:
        "Delivered from local farms to your doorstep, always fresh and pesticide-free.",
      btntext: "Shop Now",
      image:
        "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      icon: <ShoppingBasket className="w-20 h-20 text-green-500 drop-shadow-md" />,
      title: "Eco-Friendly Packaging",
      subtitle:
        "We use 100% biodegradable and recyclable packaging materials.",
      btntext: "Learn More",
      image:
        "https://images.unsplash.com/photo-1570913196376-dacb677ef459?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 3,
      icon: <PackageCheck className="w-20 h-20 text-green-500 drop-shadow-md" />,
      title: "Daily Discounts & Offers",
      subtitle:
        "Save big on vegetables, fruits, and home essentials every day.",
      btntext: "View Offers",
      image:
        "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      icon: <Truck className="w-20 h-20 text-green-500 drop-shadow-md" />,
      title: "Fast & Free Delivery",
      subtitle:
        "Get your groceries delivered within an hour with zero delivery charges.",
      btntext: "Start Shopping",
      image:
        "https://plus.unsplash.com/premium_photo-1682141929497-97402f35d45e?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, when: "beforeChildren" },
    },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 15 },
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.9,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-r from-green-50 to-white flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        <motion.img
          key={slides[current].id}
          src={slides[current].image}
          alt={slides[current].title}
          className="absolute inset-0 w-full h-[600px] object-cover brightness-75 rounded-2xl"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-black/40 h-[600px] rounded-2xl"></div>

      <div className="relative z-10 max-w-5xl w-full px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center space-y-6 ">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[current].id}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center gap-6"
          >
            <motion.div variants={itemVariants} className="bg-green-100 p-5 rounded-full drop-shadow-lg">
              {slides[current].icon}
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
              {slides[current].title}
            </motion.h1>

            <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg max-w-xl">
              {slides[current].subtitle}
            </motion.p>

            <motion.button
              variants={itemVariants}
              className="mt-6 bg-green-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-green-600 transition-all"
            >
              {slides[current].btntext}
            </motion.button>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-10">
          {slides.map((_, index) => (
            <motion.span
              key={index}
              className={`w-3 h-3 rounded-full cursor-pointer ${index === current ? "bg-green-500" : "bg-white/50"}`}
              onClick={() => setCurrent(index)}
              layout
              transition={{ type: "spring", stiffness: 300 }}
            ></motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
