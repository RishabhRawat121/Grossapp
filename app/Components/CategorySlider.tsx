"use client";
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import {
  Apple,
  Milk,
  Leaf,
  Cookie,
  Flame,
  Coffee,
  Heart,
  Home,
  Package,
  Baby,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Category {
  name: string;
  icon: JSX.Element;
  bgColor: string;
}

const CategorySlider: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const categories: Category[] = [
    { name: "Fruits & Vegetables", icon: <Apple size={32} />, bgColor: "#FFCDD2" },
    { name: "Dairy & Eggs", icon: <Milk size={32} />, bgColor: "#FFF9C4" },
    { name: "Rice, Atta & Grain", icon: <Leaf size={32} />, bgColor: "#C8E6C9" },
    { name: "Snacks & Biscuits", icon: <Cookie size={32} />, bgColor: "#FFE0B2" },
    { name: "Spices & Masalas", icon: <Flame size={32} />, bgColor: "#FFCCBC" },
    { name: "Beverages & Drinks", icon: <Coffee size={32} />, bgColor: "#D1C4E9" },
    { name: "Personal Care", icon: <Heart size={32} />, bgColor: "#B3E5FC" },
    { name: "Household Essentials", icon: <Home size={32} />, bgColor: "#CFD8DC" },
    { name: "Instant & Packaged food", icon: <Package size={32} />, bgColor: "#F8BBD0" },
    { name: "Baby & Pet Care", icon: <Baby size={32} />, bgColor: "#DCEDC8" },
  ];

  // Auto-scroll effect every 2 seconds
  useEffect(() => {
    const slider = scrollContainerRef.current;
    if (!slider) return;

    const interval = setInterval(() => {
      // Only auto-scroll if not hovering
      if (!isHovering) {
        const cardWidth = 144 + 20; // card width (w-36 = 144px) + gap (gap-5 = 20px)
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        
        if (slider.scrollLeft >= maxScroll) {
          // Loop back to start
          slider.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Scroll by one card width
          slider.scrollBy({ left: cardWidth, behavior: "smooth" });
        }
      }
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, [isHovering]);

  // Manual scroll buttons
  const scroll = (direction: "left" | "right"): void => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.div
      className="w-[90%] md:w-[80%] mx-auto mt-16 relative bg-transparent"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center">
        Shop by Category
      </h2>

      <div 
        className="relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Left Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} className="text-green-700" />
        </button>

        {/* Right Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} className="text-green-700" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto py-4 px-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {categories.map((category, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-32 md:w-36 h-36 rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-lg snap-center"
              style={{ backgroundColor: category.bgColor }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="mb-3">{category.icon}</div>
              <div className="text-center font-semibold text-sm md:text-base px-2">
                {category.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CategorySlider;