"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, Circle, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getSocket } from "@/app/lib/socket";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const deliveryIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)">
    <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:16px;margin-top:-2px">🏍️</div>
  </div>`,
  iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
});

const customerIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)">
    <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:16px;margin-top:-2px">👤</div>
  </div>`,
  iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
});

function isValidCoords(c: any): c is [number, number] {
  return (
    Array.isArray(c) && c.length === 2 &&
    typeof c[0] === "number" && typeof c[1] === "number" &&
    !isNaN(c[0]) && !isNaN(c[1]) &&
    Math.abs(c[0]) <= 90 && Math.abs(c[1]) <= 180
  );
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (prev.current && map.distance(prev.current, center) < 5) return;
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1 });
    prev.current = center;
  }, [center, map]);
  return null;
}

export default function TrackOrderPage({ params }: { params: { id: string } }) {
  const orderId = params.id;
  const { data: session } = useSession();
  const router = useRouter();
  const socketRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [userLoc,      setUserLoc]      = useState<[number, number] | null>(null);
  const [deliveryLoc,  setDeliveryLoc]  = useState<[number, number] | null>(null);
  const [isConnected,  setIsConnected]  = useState(false);
  const [lastUpdate,   setLastUpdate]   = useState("");
  const [distance,     setDistance]     = useState<number | null>(null);
  const [eta,          setEta]          = useState<string | null>(null);

  useEffect(() => {
    if (userLoc && deliveryLoc) {
      const dist = haversineKm(userLoc, deliveryLoc);
      setDistance(dist);
      const minutes = Math.round((dist / 30) * 60);
      setEta(minutes <= 1 ? "Arriving now" : `~${minutes} mins away`);
    }
  }, [userLoc, deliveryLoc]);

  useEffect(() => {
  if (!orderId) return;
  
  console.log("orderId from params:", orderId); 
  
  const socket = getSocket();
  socketRef.current = socket;

  console.log("Socket already connected?", socket.connected); 

  const handleConnect = () => {
    setIsConnected(true);
    console.log("🔌 Socket connected, ID:", socket.id); 
    console.log("📤 Joining room:", `order_${orderId}`); 
    socket.emit("join-order", orderId);
  };

  if (socket.connected) {
    handleConnect();
  } else {
    socket.once("connect", handleConnect); 
  }


  socket.onAny((event, ...args) => {
    console.log(" ANY EVENT:", event, args);
  });

// ✅ AFTER
socket.on("deli-loc", (data: any) => {
  console.log("✅ FRONTEND received deli-loc:", data);
  
  const lat = typeof data.lat === "number" ? data.lat : parseFloat(data.lat);
  const lon = typeof data.lon === "number" ? data.lon : parseFloat(data.lon);
  
  if (!isNaN(lat) && !isNaN(lon)) {
    const coords: [number, number] = [lat, lon];
    setDeliveryLoc(coords);
    setLastUpdate(new Date().toLocaleTimeString());
    
   
    localStorage.setItem(
      `delivery_location_${orderId}`,
      JSON.stringify(coords)
    );
  }
});

  return () => {
    socket.offAny();
    socket.off("connect", handleConnect);
 
    socket.off("deli-loc");
    if (socket.connected) socket.emit("leave-order", `order_${orderId}`);
  };
}, [orderId]);
  useEffect(() => {
  const saved = localStorage.getItem(
    `delivery_location_${orderId}`
  );
  console.log("the saved location",saved)
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (isValidCoords(parsed)) {
        setDeliveryLoc(parsed);
      }
    } catch (err) {
      console.error("Invalid stored delivery location");
    }
  }
}, [orderId]);
  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        const socket = socketRef.current;
        if (socket?.connected && orderId) {
          socket.emit("customer-location", {
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

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [(session?.user as any)?.id, orderId]);

  const mapCenter: [number, number] = userLoc ?? deliveryLoc ?? [28.6139, 77.209];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold shrink-0">📦</div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Track Your Order</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Order #{orderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shrink-0 ${isConnected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
              <span className="hidden sm:inline">{isConnected ? "Live" : "Connecting..."}</span>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-200 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {eta && (
          <div className="bg-green-500 text-white rounded-2xl shadow-lg p-5 text-center">
            <p className="text-3xl font-bold">{eta}</p>
            <p className="text-green-100 mt-1 text-sm">Delivery person is on the way</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "My Location",   value: userLoc     ? `${userLoc[0].toFixed(4)}, ${userLoc[1].toFixed(4)}`         : "Detecting…" },
            { label: "Delivery Boy",  value: deliveryLoc ? `${deliveryLoc[0].toFixed(4)}, ${deliveryLoc[1].toFixed(4)}` : "Waiting…" },
            { label: "Distance",      value: distance !== null ? `${distance.toFixed(2)} km` : "—" },
            { label: "Last Update",   value: lastUpdate || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow p-2.5 sm:p-4 text-center min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-[320px] sm:h-[420px] md:h-[500px]">
            <MapContainer
              center={mapCenter}
              zoom={15}
              className="h-full w-full"
              key={userLoc ? "located" : "default"}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {userLoc && (
                <>
                  <Circle center={userLoc} radius={30} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.15, weight: 2 }} />
                  <Marker position={userLoc} icon={customerIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-bold mb-1">👤 You</p>
                        <p className="text-xs text-gray-600">Your Location</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{userLoc[0].toFixed(6)}, {userLoc[1].toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {deliveryLoc && (
                <>
                  <Circle center={deliveryLoc} radius={30} pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.15, weight: 2 }} />
                  <Marker position={deliveryLoc} icon={deliveryIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-bold mb-1">🏍️ Delivery Boy</p>
                        <p className="text-xs text-gray-600">On the way to you</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{deliveryLoc[0].toFixed(6)}, {deliveryLoc[1].toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {userLoc && deliveryLoc && (
                <Polyline positions={[userLoc, deliveryLoc]} color="#8b5cf6" weight={4} opacity={0.7} dashArray="10,10" />
              )}

              {userLoc && <MapFlyTo center={userLoc} />}
            </MapContainer>
          </div>

          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t flex flex-wrap gap-4 justify-center text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white" style={{ fontSize: 9 }}>👤</div>
              <span className="text-gray-700 font-medium">You (Customer)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white" style={{ fontSize: 9 }}>🏍</div>
              <span className="text-gray-700 font-medium">Delivery Boy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500 opacity-70" />
              <span className="text-gray-700 font-medium">Route</span>
            </div>
          </div>
        </div>

        {!deliveryLoc && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl text-sm text-center">
            🚀 Waiting for delivery boy to start tracking...
          </div>
        )}

      </div>
    </div>
  );
}
