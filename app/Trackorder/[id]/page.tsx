"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/app/lib/socket";

function isValidCoordinates(coords: any): coords is [number, number] {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number" &&
    !isNaN(coords[0]) &&
    !isNaN(coords[1])
  );
}

export default function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;

  const { data: session } = useSession();
  const router = useRouter();
  const socketRef = useRef<any>(null);

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [deliveryLoc, setDeliveryLoc] = useState<[number, number] | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  const calculateDistance = (loc1: [number, number], loc2: [number, number]) => {
    const R = 6371;
    const dLat = ((loc2[0] - loc1[0]) * Math.PI) / 180;
    const dLon = ((loc2[1] - loc1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1[0] * Math.PI) / 180) *
        Math.cos((loc2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (userLoc && deliveryLoc) {
      const dist = calculateDistance(userLoc, deliveryLoc);
      setDistance(dist);
      const minutes = Math.round((dist / 30) * 60);
      setEta(minutes <= 1 ? "Arriving now" : `~${minutes} mins away`);
    }
  }, [userLoc, deliveryLoc]);

  // Restore delivery location from localStorage
  useEffect(() => {
    if (!orderId) return;
    const storageKey = `delivery-location-${orderId}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (isValidCoordinates(parsed.location)) {
          setDeliveryLoc(parsed.location);
          setLastUpdate(parsed.timestamp || "");
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [orderId]);

  // Socket connection
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsSocketConnected(true);
      socket.emit("join-order", orderId);
    };
    const handleDisconnect = () => setIsSocketConnected(false);

    if (socket.connected) handleConnect();

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("deli-loc", (data: any) => {
      if (!data || !data.lat || !data.lon) return;
      if (data.orderId && data.orderId !== orderId) return;
      const loc: [number, number] = [Number(data.lat), Number(data.lon)];
      if (!isValidCoordinates(loc)) return;
      setDeliveryLoc(loc);
      setLastUpdate(new Date().toLocaleTimeString());
      localStorage.setItem(
        `delivery-location-${orderId}`,
        JSON.stringify({
          location: loc,
          timestamp: new Date().toLocaleTimeString(),
          savedAt: new Date().toISOString(),
        })
      );
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("deli-loc");
      if (socket.connected) socket.emit("leave-order", orderId);
    };
  }, [orderId]);

  // Track user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        localStorage.setItem("userloc", JSON.stringify(loc));
        if (socketRef.current?.connected && (session?.user as any)?.id && orderId) {
          socketRef.current.emit("customer-location", {
            userId: (session?.user as any)?.id,
            orderId,
            lat: loc[0],
            lon: loc[1],
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [(session?.user as any)?.id, orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">

      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                👤
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Track Your Order</h1>
                <p className="text-sm text-gray-500">Order #{orderId}</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ETA Banner */}
        {eta && (
          <div className="bg-green-500 text-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-3xl font-bold">{eta}</p>
            <p className="text-green-100 mt-1">Delivery person is on the way</p>
          </div>
        )}

        {/* Socket Status */}
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSocketConnected ? "bg-green-500" : "bg-red-400"}`}></div>
          <p className="text-sm text-gray-600">
            {isSocketConnected ? "Live tracking active" : "Connecting..."}
          </p>
        </div>

        {/* Delivery Boy Location */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🏍️ Delivery Person</h2>
          {deliveryLoc ? (
            <div className="bg-green-50 rounded-xl p-4 space-y-1">
              <p className="text-green-700 font-medium">✅ On the way</p>
              <p className="text-sm text-gray-600">Lat: {deliveryLoc[0].toFixed(6)}</p>
              <p className="text-sm text-gray-600">Lng: {deliveryLoc[1].toFixed(6)}</p>
              {lastUpdate && (
                <p className="text-xs text-gray-400">Last updated: {lastUpdate}</p>
              )}
              <a
                href={`https://www.google.com/maps?q=${deliveryLoc[0]},${deliveryLoc[1]}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-500 underline"
              >
                View on Google Maps
              </a>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400">Waiting for delivery person location...</p>
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
        </div>

        {/* Your Location */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🏠 Your Location</h2>
          {userLoc ? (
            <div className="bg-blue-50 rounded-xl p-4 space-y-1">
              <p className="text-blue-700 font-medium">✅ Location detected</p>
              <p className="text-sm text-gray-600">Lat: {userLoc[0].toFixed(6)}</p>
              <p className="text-sm text-gray-600">Lng: {userLoc[1].toFixed(6)}</p>
              <a
                href={`https://www.google.com/maps?q=${userLoc[0]},${userLoc[1]}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-500 underline"
              >
                View on Google Maps
              </a>
            </div>
          ) : (
            <p className="text-gray-400">Detecting your location...</p>
          )}
        </div>

        {/* Distance */}
        {distance !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2">📏 Distance Away</h2>
            <p className="text-4xl font-bold text-purple-600">{distance.toFixed(2)} km</p>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-lg px-6 py-4">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-gray-700 font-medium">You (Customer)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-gray-700 font-medium">Delivery Boy</span>
            </div>
          </div>
        </div>

        {/* View Route Button */}
        {userLoc && deliveryLoc && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <a
              href={`https://www.google.com/maps/dir/${deliveryLoc[0]},${deliveryLoc[1]}/${userLoc[0]},${userLoc[1]}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              🗺️ View Route on Google Maps
            </a>
          </div>
        )}

      </div>
    </div>
  );
}