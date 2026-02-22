"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
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

const destinationIcon = new L.DivIcon({
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

export default function DeliveryBoyPage() {
  const params = useParams();
  const orderId = (params?.orderId as string) ?? "demo-order-123";
  const watchIdRef = useRef<number | null>(null);

  console.log("Params:", params);

  const assignmentId = params?.assignmentId;

  console.log("Assignment ID:", assignmentId);

  const [myLocation,    setMyLocation]    = useState<[number, number] | null>(null);
  const [customerLoc,   setCustomerLoc]   = useState<[number, number] | null>(null);
  const [lastUpdate,    setLastUpdate]    = useState("");
  const [distance,      setDistance]      = useState<number | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isTracking,    setIsTracking]    = useState(false);
  const [accuracy,      setAccuracy]      = useState<number | null>(null);
  const[orderid,SetorderId]=useState();
  useEffect(()=>{
  console.log("the order data",assignmentId)
},[])
  useEffect(() => {
    if (myLocation && customerLoc) setDistance(haversineKm(myLocation, customerLoc));
  }, [myLocation, customerLoc]);
  useEffect(() => {
  const saved = localStorage.getItem(
    `customer_location_${orderId}`
  );

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (isValidCoords(parsed)) {
        setCustomerLoc(parsed);
      }
    } catch (err) {
      console.error("Invalid stored location");
    }
  }
}, [orderId]);
  useEffect(() => {
    const socket = getSocket();

    if (socket.connected) {
      socket.emit("join-order", orderId);
    } else {
      socket.on("connect", () => socket.emit("join-order", orderId));
    }

    socket.on("customer-location", (data: any) => {
      console.log("the customer location data",data)
      SetorderId(data.orderId)
      if (data.orderId && data.orderId !== orderId) return;
      const loc: [number, number] = [Number(data.lat), Number(data.lon)];
      if (isValidCoords(loc)){
        setCustomerLoc(loc);
        localStorage.setItem(
      `customer_location_${orderId}`,
      JSON.stringify(loc)
    );
      }
         
    });

    return () => {
      socket.off("customer-location");
      socket.emit("leave-order", orderId);
    };
  }, [orderId]);
  useEffect(()=>{
    console.log("the customer location after socket",customerLoc);
    console.log("the order id",orderid)
  })
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported.");
      return;
    }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        localStorage.setItem(
    `delivery_location_${orderId}`,
    JSON.stringify(loc)
      );
        console.log("the mylocation data",loc)
        if (!isValidCoords(loc)) return;
        setMyLocation(loc);
        setAccuracy(pos.coords.accuracy ?? null);
        setLastUpdate(new Date().toLocaleTimeString());
        setIsTracking(true);
        setLocationError("");
        getSocket().emit("deli-loc", { orderId, lat: loc[0], lon: loc[1] });
      },
      (err) => {
        setIsTracking(false);
        const msgs: Record<number, string> = {
          1: "Location permission denied.",
          2: "Position unavailable.",
          3: "Timed out. Retrying…",
        };
        setLocationError(msgs[err.code] ?? err.message);
        if (err.code === 3) setTimeout(startTracking, 3000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, [orderId]);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [startTracking]);

  const mapCenter: [number, number] = myLocation ?? customerLoc ?? [28.6139, 77.209];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold shrink-0">🏍️</div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Delivery Tracker</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Order #{orderId}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shrink-0 ${isTracking ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            <span className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
            <span className="hidden sm:inline">{isTracking ? "Live Tracking" : "Waiting for GPS..."}</span>
            <span className="inline sm:hidden">{isTracking ? "Live" : "Waiting..."}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {locationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <div>
              {locationError}
              <button onClick={startTracking} className="underline font-semibold ml-1">Retry</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "My Location",  value: myLocation  ? `${myLocation[0].toFixed(4)}, ${myLocation[1].toFixed(4)}`   : "—" },
            { label: "Customer",     value: customerLoc ? `${customerLoc[0].toFixed(4)}, ${customerLoc[1].toFixed(4)}` : "Waiting…" },
            { label: "Distance",     value: distance !== null ? `${distance.toFixed(2)} km` : "—" },
            { label: "GPS Accuracy", value: accuracy  !== null ? `±${Math.round(accuracy)} m` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow p-2.5 sm:p-4 text-center min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{value}</p>
            </div>
          ))}
        </div>

        {lastUpdate && (
          <p className="text-xs text-gray-400 text-right">
            Last updated: <span className="font-medium text-gray-600">{lastUpdate}</span>
          </p>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-[320px] sm:h-[420px] md:h-[500px]">
            <MapContainer
              center={mapCenter}
              zoom={15}
              className="h-full w-full"
              key={myLocation ? "located" : "default"}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {myLocation && (
                <>
                  <Circle center={myLocation} radius={30} pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.15, weight: 2 }} />
                  <Marker position={myLocation} icon={deliveryIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-bold mb-1">🏍️ You</p>
                        <p className="text-xs text-gray-600">Delivery Person</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{myLocation[0].toFixed(6)}, {myLocation[1].toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {customerLoc && (
                <>
                  <Circle center={customerLoc} radius={30} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.15, weight: 2 }} />
                  <Marker position={customerLoc} icon={destinationIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-bold mb-1">👤 Customer</p>
                        <p className="text-xs text-gray-600">Delivery Destination</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{customerLoc[0].toFixed(6)}, {customerLoc[1].toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {myLocation && customerLoc && (
                <Polyline positions={[myLocation, customerLoc]} color="#8b5cf6" weight={4} opacity={0.7} dashArray="10,10" />
              )}

              {myLocation && <MapFlyTo center={myLocation} />}
            </MapContainer>
          </div>

          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t flex flex-wrap gap-4 justify-center text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white" style={{ fontSize: 9 }}>🏍</div>
              <span className="text-gray-700 font-medium">You (Delivery)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white" style={{ fontSize: 9 }}>👤</div>
              <span className="text-gray-700 font-medium">Customer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500 opacity-70" />
              <span className="text-gray-700 font-medium">Route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}