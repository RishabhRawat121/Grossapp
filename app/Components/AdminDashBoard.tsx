"use client";

import React, { useEffect, useState } from "react";
import { IndianRupee, TrendingUp } from "lucide-react";

const AdminDashBoard = () => {
  const [deliveredData, setDeliveredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveredData = async () => {
      try {
        const res = await fetch("/admin/get-assign");
        if (!res.ok) throw new Error("Failed to fetch delivered orders");

        const data = await res.json();
        setDeliveredData(data.deliveryData || []);
      } catch (error) {
        console.error("Error fetching delivered data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveredData();
  }, []);

  const totalRevenue = deliveredData.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex  justify-center w-[1000px]">
      <div className="w-full max-w-md text-center">


        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300  mt-10">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm opacity-90">Total Revenue</p>
              <h2 className="text-3xl font-bold mt-2 flex items-center gap-1">
                <IndianRupee size={26} />
                {totalRevenue.toLocaleString("en-IN")}
              </h2>
              <p className="text-xs mt-1 opacity-80">
                Delivered Orders Only
              </p>
            </div>

            <div className="bg-white/20 p-3 rounded-full">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
