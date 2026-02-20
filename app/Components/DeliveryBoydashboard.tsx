"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getSocket } from "@/app/lib/socket";
import { motion } from "framer-motion";
import { Package, MapPin } from "lucide-react";

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
}

export default function DeliveryBoyPage() {
  const { data: session } = useSession();
const userId = (session?.user as any)?.id;

  const dispatch = useDispatch();
  const location = useSelector(
    (state: RootState) => state.location.locationData
  );

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
  const [total, setTotal] = useState();
  const [status, setStatus] = useState("not-delivered");
  const [accept, Setaccept] = useState<Boolean>(false);
  const [deliveredOrders, setDeliveredOrders] = useState<Set<string>>(new Set());

  // Load delivered orders from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('deliveredOrders');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDeliveredOrders(new Set(parsed));
      } catch (err) {
        console.error("Error parsing localStorage:", err);
      }
    }
  }, []);

  // Save delivered orders to localStorage whenever it changes
  useEffect(() => {
    if (deliveredOrders.size > 0) {
      localStorage.setItem('deliveredOrders', JSON.stringify(Array.from(deliveredOrders)));
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
      if (!data.orderId || !data.assignmentId) return;

      const newRequest: DeliveryRequest = {
        _id: data._id,
        order: data.orderId,
        assignmentId: data.assignmentId,
        customerAddress: data.customerAddress || "Address not available",
        status: data.status || "broadcasted",
        address: data.address,
        deliveryBoyContact: data.deliveryBoyContact,
      };

      setRequests((prev) => {
        if (prev.some((r) => r.assignmentId === newRequest.assignmentId)) {
          return prev;
        }
        return [...prev, newRequest];
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    return () => {
      socket.off("identity");
      socket.off("new-delivery-request");
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [userId]);

  // Join order room
  useEffect(() => {
    if (!activeOrderId || !socketRef.current) return;

    socketRef.current.emit("join-order", activeOrderId);

    const handleJoinConfirm = (data: any) => {
      setJoinedRoom(true);
    };

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
        const res = await fetch(
          `/api/deliveryBoy/get-assignment?userId=${userId}`
        );
        const data = await res.json();
        console.log("the order data", data);
        if (!Array.isArray(data.data)) return;
        
        if (data.data[0]?.total) {
          setTotal(data.data[0].total);
        }

        setRequests((prev) => {
          const existingIds = new Set(prev.map((r) => r.assignmentId));
          
          const mapped = data.data
            .filter((r: any) => !existingIds.has(r.assignmentId))
            .map((r: any) => ({
              _id: r._id || r.assignmentId, 
              order: r.order,
              assignmentId: r.assignmentId,
              customerAddress: r.customerAddress || "Address not available",
              status: r.status,
              address: r.address,
              deliveryBoyContact: r.deliveryBoyContact,
              orderStatus: r.orderStatus,
            }));

          const acceptedDelivery = data.data.find(
            (r: any) => r.status === "accept"
          );

          if (acceptedDelivery) {
            setIsTracking(true);
            setActiveOrderId(acceptedDelivery.order);
          }

          // Check for delivered orders from API and update localStorage
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

  useEffect(() => {
    console.log("the total is", total);
  }, [total]);

  // Location tracking
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
            dispatch(
              setLocation({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                name: "Delivery Boy Live Location",
              })
            );

            if (socketRef.current?.connected && joinedRoom) {
              socketRef.current.emit("deli-loc", {
                orderId: activeOrderId,
                lat: latitude,
                lon: longitude,
              });
            }
          }
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (err) => {
        console.error("Geolocation error:", err.code, err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userId, isTracking, activeOrderId, dispatch, joinedRoom]);

  const acceptDelivery = async (requestId: string) => {
    console.log("Accept delivery triggered for:", requestId);
    const req = requests.find((r) => r._id === requestId);
    
    if (!req) {
      console.error("Request not found for ID:", requestId);
      return;
    }

    const assignmentId = req.assignmentId;
    const orderId = req.order;

    if (!orderId || !assignmentId) {
      console.error("Order ID or Assignment ID not found");
      return;
    }

    try {
      const res = await fetch(`/api/deliveryBoy/patch-assign/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", userId }),
      });

      if (!res.ok) {
        console.error("Failed to accept delivery");
        return;
      }
      Setaccept(true);
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: "accept" } : r
        )
      );

      setActiveOrderId(orderId);
      setIsTracking(true);

      setMessage("Delivery accepted successfully! Location tracking active.");
    } catch (err) {
      console.error("Error accepting delivery:", err);
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
    } catch (err) {
      setMessage("Something went wrong");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const openDeliverModal = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setShowDeliverModal(true);
  };

  const markDelivered = async () => {
    console.log("Mark delivered triggered");
    try {
      const res = await fetch(`/api/deliveryBoy/delivery-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: deliveredOrderId, total: total }),
      });
      const data = await res.json();

      console.log("Mark delivery response:", data.data);

      if (data.data.status === "delivered") {
        setStatus(data.data.status);
        
        // Add order to delivered orders set and save to localStorage
        setDeliveredOrders((prev) => {
          const newSet = new Set(prev);
          newSet.add(deliveredOrderId);
          return newSet;
        });
        
        // Update the request status in the state
        setRequests((prev) =>
          prev.map((r) =>
            r.order === deliveredOrderId ? { ...r, orderStatus: "delivered" } : r
          )
        );
      }
      
      if (!res.ok) return;

      setMessage("Order marked as delivered successfully!");
      setShowDeliverModal(false);
      setDeliveredOrderId("");
    } catch (err) {
      console.error("Error marking delivered:", err);
      setMessage("Something went wrong");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8">
        Delivery Requests ({requests.length})
      </h1>

      {message && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
            <p className="font-semibold">{message}</p>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-center text-gray-500">
          {isConnected
            ? "No delivery requests yet. Waiting for orders..."
            : "Connecting to server..."}
        </p>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {requests.map((req, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-xl shadow-md p-6 sm:p-8 w-[48rem]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-black text-xl sm:text-2xl font-bold">
                    Order #{req.order || "N/A"}
                  </p>
                  <div className="mt-2 text-sm sm:text-base text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-green-600 mt-0.5" />
                      <span>{req.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Package size={16} className="text-green-600" />
                      <span className="font-bold capitalize">{req.status}</span>
                    </div>
                  </div>
                </div>

                {req.status === "accept" ? (
                  deliveredOrders.has(req.order) ? (
                    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg font-semibold">
                      <Package size={20} />
                      <span>Delivered</span>
                    </div>
                  ) : (
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Link
                        href={`/Deliveryboy/${req.order}`}
                        className="w-full sm:w-auto block bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition text-center"
                      >
                        Live Track
                      </Link>

                      <button
                        onClick={() => openDeliverModal(req.assignmentId)}
                        className="w-full sm:w-auto block bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )
                ) : req.status === "delivered" ? (
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg font-semibold">
                    <Package size={20} />
                    <span>Delivered</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => acceptDelivery(req._id)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      Accept Delivery
                    </button>
                    <button
                      onClick={() => rejectDelivery(req.assignmentId)}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      Reject Delivery
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showDeliverModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>

          <div className="relative bg-white/70 backdrop-blur-lg rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Enter Order ID</h2>
            <input
              type="text"
              value={deliveredOrderId}
              onChange={(e) => setDeliveredOrderId(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4"
              placeholder="Enter Order ID"
            />
            <div className="flex gap-3">
              <button
                onClick={markDelivered}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold"
              >
                Submit
              </button>
              <button
                onClick={() => setShowDeliverModal(false)}
                className="flex-1 bg-gray-300 text-black py-3 rounded-lg font-semibold"
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