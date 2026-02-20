"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CreditCard,
  MapPin,
} from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { getSocket } from "@/app/lib/socket";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface IOrderItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  unit: string;
  quantity: number;
  image?: string;
}

interface IOrder {
  id: string;
  date: string;
  status: "Delivered" | "Pending" | "Cancelled";
  items: IOrderItem[];
  totalAmount: number;
  paymentMethod: string;
  address?: {
    city: string;
    state: string;
    fulladdress: string;
  };
  deliveryBoyContact?: string;
}

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id;
  const router = useRouter();
  const [num, Setnum] = useState<any>();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapOrder = (order: any): IOrder => ({
    id: order._id,
    date: new Date(order.updatedAt).toLocaleDateString(),
    status:
      (order.status || "pending").charAt(0).toUpperCase() +
      order.status?.slice(1),
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    address: order.address,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          id: item._id,
          name: item.grocery?.name || "Unknown",
          price: item.price || 0,
          quantity: item.quantity || 1,
          unit: item.grocery?.unit || "pcs",
          image: item.image || "/placeholder.png",
        }))
      : [],
  });

  useEffect(() => {
    console.log("my live locations", location);
  });

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    axios
      .get(`/api/user/order?userId=${userId}`)
      .then((res) => setOrders(res.data.orders.map(mapOrder)))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [status, userId]);

  useEffect(() => {
    if (orders.length === 0) return;

    const fetchDeliveryAssignments = async () => {
      try {
        const updatedOrders = await Promise.all(
          orders.map(async (order) => {
            try {
              const res = await axios.get(
                `/api/deliveryBoy/patch-assign/${userId}`
              );
              Setnum(res.data.data.deliveryBoyContact);
              return {
                ...order,
                deliveryBoyContact: res.data?.data?.deliveryBoyContact,
              };
            } catch {
              return order;
            }
          })
        );

        setOrders(updatedOrders);
      } catch (err) {
        console.error("Delivery assignment fetch failed", err);
      }
    };

    fetchDeliveryAssignments();
  }, [orders.length]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    const socket = getSocket();

    socket.on("connect", () => socket.emit("identity", userId));

    socket.on("new-order", (order: any) => {
      setOrders((prev) => [mapOrder(order), ...prev]);
    });

    socket.on("status", (updatedOrder: any) => {
      const mapped = mapOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o.id === mapped.id ? mapped : o))
      );
    });

    socket.on("order-data", (data: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.orderId
            ? { ...o, deliveryBoyContact: data.number }
            : o
        )
      );
    });

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });

          socket.emit("deli-loc", {
            userId,
            lat: latitude,
            lng: longitude,
          });
        },
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        socket.disconnect();
      };
    }

    return () => {
      socket.disconnect();
    };
  }, [status, userId]);

  function callNumber(phone?: string) {
    if (!phone) return alert("Delivery number not available yet");
    const clean = phone.replace(/\D/g, "");
    if (clean) window.location.href = `tel:${clean}`;
  }

  if (status === "loading") {
    return (
      <div className="text-center mt-20 text-gray-500">Loading session...</div>
    );
  }

  if (!session) {
    return (
      <div className="text-center mt-20 text-gray-500">Please log in</div>
    );
  }

  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-500">Loading orders...</div>
    );
  }

  if (error) {
    return <div className="text-center mt-20 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-center mb-8">
        <ArrowLeft className="h-8 w-8 text-gray-600 mr-3" />
        <h1 className="text-4xl font-bold text-gray-800">My Orders</h1>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-lg rounded-xl border border-gray-200"
          >
            <div className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Order #{order.id}
                  </h2>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{
                    backgroundColor:
                      order.status === "Delivered"
                        ? "rgb(16 185 129)"
                        : order.status === "Pending"
                        ? "rgb(234 179 8)"
                        : "rgb(239 68 68)",
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 text-sm text-gray-700">
                {order.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="text-green-500" />
                    <span>{order.address.fulladdress}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className="text-blue-500" />
                  <span>
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Paid via Card"}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => callNumber(num)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Call Delivery Boy
                </button>

                <Link
                  href={`/Trackorder/${order.id}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition inline-block"
                >
                  Live Track
                </Link>
                
                <button
                  onClick={() =>
                    setOpenOrderId(openOrderId === order.id ? null : order.id)
                  }
                  className="ml-auto flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  {openOrderId === order.id ? (
                    <>
                      <ArrowUp className="w-4 h-4" />
                      Hide Items
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4" />
                      View Items
                    </>
                  )}
                </button>
              </div>

              {/* Item List */}
              <AnimatePresence>
                {openOrderId === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 border-t pt-4 space-y-3"
                  >
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} × {item.unit}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}