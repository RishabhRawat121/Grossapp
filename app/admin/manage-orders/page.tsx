"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, MapPin, CreditCard } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { getSocket } from "@/app/lib/socket";

interface IOrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  unit: string;
  image: string;
}

interface IOrder {
  id: string;
  user: string;
  totalAmount: number;
  status: "pending" | "out of delivery" | "delivered";
  paymentMethod: "cod" | "online";
  date: string;
  address: {
    fullName?: string;
    mobile?: string;
    city?: string;
    state?: string;
    pincode?: string;
    fulladdress?: string;
    latitute?: number;
    longitute?: number;
  };
  items: IOrderItem[];
  assignment?: string;
  assignmentDeliveryBoy?: string;
}

const mapOrder = (order: any): IOrder => ({
  id: order._id || order.id,
  user:
    typeof order.user === "string"
      ? order.user
      : order.user?.name || "Unknown User",
  date: order.date || new Date(order.updatedAt).toLocaleDateString(),
  status: order.status?.toLowerCase() || "pending",
  paymentMethod: order.paymentMethod,
  totalAmount: Number(order.totalAmount),
  address: order.address || {},
  items: Array.isArray(order.items)
    ? order.items.map((item: any) => ({
        id: item._id || item.id || item.groceries,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        image: item.image,
      }))
    : [],
  assignment: order.assignment?._id
    ? String(order.assignment._id)
    : order.assignment
    ? String(order.assignment)
    : undefined,
  assignmentDeliveryBoy: order.assignmentDeliveryBoy
    ? String(order.assignmentDeliveryBoy)
    : undefined,
});

export default function ManageOrdersPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/user/order");
        setOrders(res.data.orders.map(mapOrder));
      } catch {
        setError("Failed to load orders");
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
    setUpdatingId(id);
    try {
      const res = await axios.patch(`/api/user/order?id=${id}`, { status });
      const updatedOrder = mapOrder(res.data.order);
      setOrders((prev) =>
        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    } catch {
      alert("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 sm:px-6 py-10">
        <p className="mt-20 text-center text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-center mb-6 sm:mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Manage Orders ({orders.length})
        </motion.h1>
      </div>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found</p>
      ) : (
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm sm:text-base truncate">
                    Order #{order.id}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">{order.date}</p>
                </div>
                <span className="self-start sm:self-auto px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold capitalize bg-gray-100 whitespace-nowrap">
                  {order.status}
                </span>
              </div>

              <div className="mt-3 sm:mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-green-600 shrink-0" />
                  <span className="font-medium truncate">{order.user}</span>
                </div>

                {order.address?.fulladdress && (
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-green-600 mt-0.5 shrink-0" />
                    <span className="text-xs sm:text-sm leading-snug">{order.address.fulladdress}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mt-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-green-600 shrink-0" />
                    <span className="capitalize text-xs sm:text-sm">
                      {order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : order.paymentMethod}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600 text-sm sm:text-base">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end">
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) =>
                    updateStatus(order.id, e.target.value as IOrder["status"])
                  }
                  className="border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <option value="pending">Pending</option>
                  <option value="out of delivery">Out of delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}