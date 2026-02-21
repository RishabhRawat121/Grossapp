"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const customerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function isValidCoordinates(c: any): c is [number, number] {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    typeof c[0] === "number" &&
    typeof c[1] === "number" &&
    !isNaN(c[0]) &&
    !isNaN(c[1])
  );
}

const createMockSocket = () => {
  const listeners: Record<string, Function[]> = {};
  return {
    on: (event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },
    emit: (event: string, data?: any) => {
      console.log(`Socket emit: ${event}`, data);
    },
    off: () => {
      Object.keys(listeners).forEach((key) => delete listeners[key]);
    },
    trigger: (event: string, data: any) => {
      listeners[event]?.forEach((cb) => cb(data));
    },
  };
};

const calculateDistance = (loc1: [number, number], loc2: [number, number]): number => {
  const R = 6371;
  const dLat = ((loc2[0] - loc1[0]) * Math.PI) / 180;
  const dLon = ((loc2[1] - loc1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1[0] * Math.PI) / 180) *
      Math.cos((loc2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function DeliveryBoyPage() {
  const orderId = "demo-order-123";
  const socketRef = useRef<any>(null);

  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [customerLoc, setCustomerLoc] = useState<[number, number] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    console.log("myLocation updated:", myLocation);
  }, [myLocation]);

  useEffect(() => {
    if (myLocation && customerLoc) {
      setDistance(calculateDistance(myLocation, customerLoc));
    }
  }, [myLocation, customerLoc]);

  useEffect(() => {
    try {
      const deliveryData = localStorage.getItem(`delivery-location-${orderId}`);
      if (deliveryData) {
        const parsed = JSON.parse(deliveryData);
        if (isValidCoordinates(parsed.location)) {
          setMyLocation(parsed.location);
          setLastUpdate(parsed.timestamp || "");
        }
      }
      const userLocData = localStorage.getItem("userloc");
      if (userLocData) {
        const parsed = JSON.parse(userLocData);
        if (isValidCoordinates(parsed)) {
          setCustomerLoc(parsed);
        }
      }
    } catch (error) {
      console.error("Error restoring from storage:", error);
    }
  }, [orderId]);

  useEffect(() => {
    const socket = createMockSocket();
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join-order", orderId));

    socket.on("customer-location", (data: any) => {
      if (data.orderId && data.orderId !== orderId) return;
      const loc: [number, number] = [Number(data.lat), Number(data.lon)];
      if (!isValidCoordinates(loc)) return;
      setCustomerLoc(loc);
      localStorage.setItem("userloc", JSON.stringify(loc));
    });

    return () => {
      socket.off();
      socket.emit("leave-order", orderId);
    };
  }, [orderId]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyLocation(loc);
        setLastUpdate(new Date().toLocaleTimeString());
        setIsTracking(true);
        setLocationError("");

        localStorage.setItem(
          `delivery-location-${orderId}`,
          JSON.stringify({
            location: loc,
            timestamp: new Date().toLocaleTimeString(),
            savedAt: new Date().toISOString(),
          })
        );

        socketRef.current?.emit("deli-loc", {
          orderId,
          lat: loc[0],
          lon: loc[1],
        });
      },
      (error) => {
        setIsTracking(false);
        const messages: Record<number, string> = {
          1: "Location permission denied. Please allow access in your browser settings.",
          2: "Position unavailable. Check your GPS or network connection.",
          3: "Location request timed out. Retrying...",
        };
        const msg = messages[error.code] || `Location error: ${error.message}`;
        console.error("Geolocation error:", msg);
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId]);

  const mapCenter: [number, number] = myLocation || customerLoc || [28.6139, 77.209];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold shrink-0">
                🏍️
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Delivery Tracker</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Order #{orderId}</p>
              </div>
            </div>
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shrink-0 ${
                isTracking ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                  isTracking ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                }`}
              />
              <span className="hidden xs:inline sm:inline">
                {isTracking ? "Live Tracking" : "Waiting for GPS..."}
              </span>
              <span className="inline sm:hidden">
                {isTracking ? "Live" : "Waiting..."}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {locationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{locationError}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl shadow p-2.5 sm:p-4 text-center">
            <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">My Location</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
              {myLocation
                ? `${myLocation[0].toFixed(3)}, ${myLocation[1].toFixed(3)}`
                : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-2.5 sm:p-4 text-center">
            <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Distance</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800">
              {distance !== null ? `${distance.toFixed(2)} km` : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-2.5 sm:p-4 text-center">
            <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">Updated</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
              {lastUpdate || "—"}
            </p>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-[320px] sm:h-[420px] md:h-[500px]">
            <MapContainer center={mapCenter} zoom={15} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {myLocation && (
                <Marker position={myLocation} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-center">
                      <div className="text-lg font-bold mb-1">🏍️ You</div>
                      <div className="text-sm text-gray-600">Delivery Person</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {myLocation[0].toFixed(6)}, {myLocation[1].toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {customerLoc && (
                <Marker position={customerLoc} icon={customerIcon}>
                  <Popup>
                    <div className="text-center">
                      <div className="text-lg font-bold mb-1">👤 Customer</div>
                      <div className="text-sm text-gray-600">Delivery Destination</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {customerLoc[0].toFixed(6)}, {customerLoc[1].toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {myLocation && customerLoc && (
                <Polyline
                  positions={[myLocation, customerLoc]}
                  color="#8b5cf6"
                  weight={4}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              )}

              <MapUpdater center={myLocation || mapCenter} />
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t">
            <div className="flex flex-wrap gap-3 sm:gap-6 justify-center text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white shadow" />
                <span className="text-gray-700 font-medium">You (Delivery)</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-500 rounded-full border-2 border-white shadow" />
                <span className="text-gray-700 font-medium">Customer</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 sm:w-10 h-1 bg-purple-500 opacity-70" />
                <span className="text-gray-700 font-medium">Route</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
