"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getSocket } from "@/app/lib/socket";
import { motion } from "framer-motion";
import { Package, MapPin, Wifi, WifiOff, Clock, IndianRupee } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { setLocation } from "../redux/locationSlice";
import type { RootState } from "../redux/store";

interface DeliveryRequest {
  _id: string;
  order: string;
  assignmentId: string;
  customerAddress: string;
  status: string;
  address: string;
  deliveryBoyContact?: string;
  fulladdress?: string;
  orderStatus?: string;
  totalAmount?: number;
  items?: any[];
}

export default function DeliveryBoyPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const dispatch = useDispatch();
  const location = useSelector((state: RootState) => state.location.locationData);

  const socketRef = useRef<any>(null);

  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveredOrderId, setDeliveredOrderId] = useState("");
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);
  const [total, setTotal] = useState<any>();
  const [status, setStatus] = useState("not-delivered");
  const [accept, setAccept] = useState<boolean>(false);
  const [deliveredOrders, setDeliveredOrders] = useState<Set<string>>(new Set());
  const [order,Setorder]=useState([]);
  useEffect(() => {
    const stored = localStorage.getItem("deliveredOrders");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDeliveredOrders(new Set(parsed));
      } catch (err) {
        console.error("Error parsing localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (deliveredOrders.size > 0) {
      localStorage.setItem("deliveredOrders", JSON.stringify(Array.from(deliveredOrders)));
    }
  }, [deliveredOrders]);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("identity", userId);

    socket.on("identity", () => {
      setIsConnected(true);
      console.log("✅ Socket connected with identity:", userId);
    });

    socket.on("new-delivery-request", (data: any) => {
      console.log("📦 New delivery request received:", data);
      if (!data.orderId || !data.assignmentId) return;

      const newRequest: DeliveryRequest = {
        _id: data._id || data.assignmentId,
        order: data.orderId,
        assignmentId: data.assignmentId,
        customerAddress: data.customerAddress || "Address not available",
        status: data.status || "broadcasted",
        address: data.customerAddress || data.address || "Address not available",
        deliveryBoyContact: data.deliveryBoyContact,
        totalAmount: data.totalAmount,
        items: data.items || [],
      };

      setRequests((prev) => {
        if (prev.some((r) => r.assignmentId === newRequest.assignmentId)) return prev;
        return [...prev, newRequest];
      });
    });

    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect", () => setIsConnected(true));

    return () => {
      socket.off("identity");
      socket.off("new-delivery-request");
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (!activeOrderId || !socketRef.current) return;

    socketRef.current.emit("join-order", activeOrderId);

    const handleJoinConfirm = () => setJoinedRoom(true);
    socketRef.current.on("joined-order", handleJoinConfirm);

    return () => {
      socketRef.current?.emit("leave-order", activeOrderId);
      socketRef.current?.off("joined-order", handleJoinConfirm);
      setJoinedRoom(false);
    };
  }, [activeOrderId]);

  useEffect(() => {
    if (!userId) return;

    const fetchAssignments = async () => {
      try {
        const res = await fetch(`/api/deliveryBoy/get-assignment?userId=${userId}`);
        const data = await res.json();
        Setorder(data.data);
        console.log("the order data", data);
        if (!Array.isArray(data.data)) return;

        if (data.data[0]?.total) setTotal(data.data[0].total);

        setRequests((prev) => {
          const existingIds = new Set(prev.map((r) => r.assignmentId));

          const mapped = data.data
            .filter((r: any) => !existingIds.has(r.assignmentId))
            .map((r: any) => ({
              _id: r._id || r.assignmentId,
              order: r.order,
              assignmentId: r.assignmentId,
              customerAddress: r.customerAddress || r.address || "Address not available",
              status: r.status,
              address: r.address || r.customerAddress || "Address not available",
              deliveryBoyContact: r.deliveryBoyContact,
              orderStatus: r.orderStatus,
              totalAmount: r.total || r.totalAmount,
              items: r.items || [],
            }));

          const acceptedDelivery = data.data.find((r: any) => r.status === "accept");
          if (acceptedDelivery) {
            setIsTracking(true);
            setActiveOrderId(acceptedDelivery.order);
          }

          data.data.forEach((r: any) => {
            if (r.orderStatus === "delivered") {
              setDeliveredOrders((prev) => {
                const newSet = new Set(prev);
                newSet.add(r.order);
                return newSet;
              });
            }
          });

          return [...prev, ...mapped];
        });
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };

    fetchAssignments();
  }, [userId]);
  useEffect(()=>{
    console.log("the order data of usestate",order)
  },[])
  useEffect(() => {
    if (!userId || !isTracking || !activeOrderId) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        try {
          const res = await fetch("/api/deliveryBoy/location-updater", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              lat: latitude.toString(),
              lon: longitude.toString(),
            }),
          });

          if (res.ok) {
            dispatch(setLocation({
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              name: "Delivery Boy Live Location",
            }));
            
              socketRef.current.emit("deli-loc", {
                userId,
                orderId: activeOrderId,
                lat: latitude,
                lon: longitude,
              });
            
          }
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (err) => console.error("Geolocation error:", err.code, err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userId, isTracking, activeOrderId, dispatch, joinedRoom]);

  const acceptDelivery = async (requestId: string) => {
    console.log("🟡 acceptDelivery called with _id:", requestId);

    const req = requests.find((r) => r._id === requestId);
    console.log("🟡 Found req:", req);

    if (!req) {
      console.error("❌ Request not found for _id:", requestId);
      return;
    }

    // ✅ assignmentId and _id are the same thing now
    const { _id: assignmentId, order: orderId } = req;

    if (!orderId) {
      console.error("❌ orderId is missing on req:", req);
      return;
    }
    if (!assignmentId) {
      console.error("❌ assignmentId is missing on req:", req);
      return;
    }
    if (!userId) {
      console.error("❌ userId is undefined");
      return;
    }

    try {
      const res = await fetch(`/api/deliveryBoy/patch-assign/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", userId }),
      });

      console.log("🟡 API response status:", res.status);
      const responseData = await res.json();
      console.log("🟡 API response body:", responseData);

      if (!res.ok) {
        console.error("❌ API failed:", responseData);
        setMessage("Failed to accept delivery");
        return;
      }

      console.log("✅ Accept successful!");
      setAccept(true);
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, status: "accept" } : r))
      );
      setActiveOrderId(orderId);
      setIsTracking(true);
      setMessage("Delivery accepted! Location tracking active.");
    } catch (err) {
      console.error("❌ Catch error:", err);
      setMessage("Something went wrong");
    }

    setTimeout(() => setMessage(""), 3000);
  };


  const rejectDelivery = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/deliveryBoy/patch-assign/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!res.ok) return;

      setRequests((prev) => prev.filter((r) => r.assignmentId !== assignmentId));

      const req = requests.find((r) => r.assignmentId === assignmentId);
      if (req?.order === activeOrderId) {
        setIsTracking(false);
        setActiveOrderId(null);
      }

      setMessage("Delivery rejected");
    } catch {
      setMessage("Something went wrong");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const openDeliverModal = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setShowDeliverModal(true);
  };

  const markDelivered = async () => {
    try {
      const res = await fetch(`/api/deliveryBoy/delivery-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: deliveredOrderId, total }),
      });
      const data = await res.json();

      if (data.data.status === "delivered") {
        setStatus(data.data.status);
        setDeliveredOrders((prev) => {
          const newSet = new Set(prev);
          newSet.add(deliveredOrderId);
          return newSet;
        });
        setRequests((prev) =>
          prev.map((r) =>
            r.order === deliveredOrderId ? { ...r, orderStatus: "delivered" } : r
          )
        );
      }

      if (!res.ok) return;

      setMessage("Order marked as delivered!");
      setShowDeliverModal(false);
      setDeliveredOrderId("");
    } catch {
      setMessage("Something went wrong");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const getStatusColor = (status: string) => {
    if (status === "accept") return "bg-green-100 text-green-700";
    if (status === "delivered") return "bg-blue-100 text-blue-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 py-6 sm:py-8   w-[354px] lg:w-[1000px]">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800">
            Delivery Requests ({requests.length})
          </h1>
          
        </div>
      </div>

      {message && (
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
            <p className="font-semibold">{message}</p>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="max-w-4xl mx-auto text-center py-20">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">
            {isConnected ? "No delivery requests yet. Waiting for orders..." : "Connecting to server..."}
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {requests.map((req, index) => (
            <motion.div
              key={req.assignmentId || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-xl shadow-md p-4 sm:p-6 w-full"
            >

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-gray-800 text-base sm:text-xl font-bold truncate">
                    Order #{req.order || "N/A"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Assignment: {req.assignmentId}
                  </p>
                </div>
                <span className={`self-start text-xs sm:text-sm px-3 py-1 rounded-full font-semibold capitalize shrink-0 ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>

              {/* Order Details */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-green-600 mt-0.5 shrink-0" />
                  <span className="text-xs sm:text-sm leading-snug">
                    {req.address || req.customerAddress || "Address not available"}
                  </span>
                </div>

                {req.totalAmount && (
                  <div className="flex items-center gap-2">
                    <IndianRupee size={15} className="text-green-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">
                      ₹{req.totalAmount}
                    </span>
                  </div>
                )}

                {req.items && req.items.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Package size={15} className="text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs sm:text-sm text-gray-600">
                      {req.items.map((item: any, i: number) => (
                        <span key={i}>
                          {item.name} × {item.quantity}
                          {i < req.items!.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {req.deliveryBoyContact && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Contact: {req.deliveryBoyContact}</span>
                  </div>
                )}
              </div>

              {req.status === "accept" ? (
                deliveredOrders.has(req.order) || req.orderStatus === "delivered" ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg font-semibold text-sm w-full sm:w-auto justify-center sm:justify-start">
                    <Package size={18} />
                    <span>Delivered ✓</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link
                      href={`/Deliveryboy/${req.order}`}
                      className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition text-center text-sm sm:text-base"
                    >
                      Live Track
                    </Link>
                    <button
                      onClick={() => openDeliverModal(req.assignmentId)}
                      className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center text-sm sm:text-base"
                    >
                      Mark Delivered
                    </button>
                  </div>
                )
              ) : req.status === "delivered" ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg font-semibold text-sm justify-center sm:justify-start">
                  <Package size={18} />
                  <span>Delivered ✓</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => acceptDelivery(req._id)}
                    className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition text-sm sm:text-base"
                  >
                    Accept Delivery
                  </button>
                  <button
                    onClick={() => rejectDelivery(req.assignmentId)}
                    className="flex-1 bg-red-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-red-700 transition text-sm sm:text-base"
                  >
                    Reject Delivery
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {showDeliverModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeliverModal(false)} />
          <div className="relative bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg sm:text-xl font-bold mb-1">Confirm Delivery</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the Order ID to confirm this delivery</p>
            <input
              type="text"
              value={deliveredOrderId}
              onChange={(e) => setDeliveredOrderId(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Order ID"
            />
            <div className="flex gap-3">
              <button
                onClick={markDelivered}
                className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-green-700 transition"
              >
                Confirm Delivered
              </button>
              <button
                onClick={() => setShowDeliverModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
