"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, MapPin, CreditCard } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { getSocket } from "@/app/lib/socket";
import emitEventHandler from "@/app/lib/emitEventHandler";

interface IOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
}

interface IOrder {
  id: string;
  user: string;
  totalAmount: number;
  status: "pending" | "out of delivery";
  paymentMethod: string;
  date: string;
  address: any;
  items: IOrderItem[];
}

const mapOrder = (order: any): IOrder => ({
  id: order.id || order._id,
  user:
    typeof order.user === "string"
      ? order.user
      : order.user?.name || "Unknown User",
  date: order.date || new Date(order.updatedAt).toLocaleDateString(),
  status: order.status?.toLowerCase() || "pending",
  paymentMethod: order.paymentMethod,
  totalAmount: order.totalAmount,
  address: order.address,
  items: Array.isArray(order.items) ? order.items : [],
});

export default function ManageOrdersPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/user/order");
        setOrders(res.data.orders.map(mapOrder));
      } catch {
        setError("failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.on("new-order", (order: any) => {
      setOrders((prev) => [mapOrder(order), ...prev]);
    });

    return () => {
      socket.off("new-order");
    };
  }, [userId]);

  const updateStatus = async (id: string, status: IOrder["status"]) => {
    try {
      const res = await axios.patch(`/api/user/order?id=${id}`, { status });
      const updatedOrder = mapOrder(res.data.order);
      console.log("the update status",updatedOrder.id);
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updatedOrder : order))
      );
    } catch {
      alert("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 px-6 py-10">
        <p className="mt-20 text-center text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="flex items-center justify-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Manage Orders ({orders.length})
        </motion.h1>
      </div>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found</p>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow p-6"
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="font-semibold">Order #{order.id}</h2>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>

                <span className="px-4 py-1 rounded-full text-sm font-semibold capitalize bg-gray-100">
                  {order.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-green-600" />
                  <span className="font-medium">{order.user}</span>
                </div>

                {order.address?.fulladdress && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-green-600 mt-0.5" />
                    <span>{order.address.fulladdress}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600" />
                    <span className="capitalize">
                      {order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : order.paymentMethod}
                    </span>
                  </div>

                  <span className="font-semibold text-green-600 text-base">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus(
                      order.id,
                      e.target.value as IOrder["status"]
                    )
                  }
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="out of delivery">Out of delivery</option>
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
