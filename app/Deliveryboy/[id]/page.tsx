"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
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

// Mock socket for testing
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
      Object.keys(listeners).forEach(key => delete listeners[key]);
    },
    trigger: (event: string, data: any) => {
      listeners[event]?.forEach(cb => cb(data));
    }
  };
};

export default function DeliveryBoyPage() {
  const orderId = "demo-order-123";
  const socketRef = useRef<any>(null);

  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [customerLoc, setCustomerLoc] = useState<[number, number] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [distance, setDistance] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (loc1: [number, number], loc2: [number, number]) => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2[0] - loc1[0]) * Math.PI / 180;
    const dLon = (loc2[1] - loc1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1[0] * Math.PI / 180) * Math.cos(loc2[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Update distance when locations change
  useEffect(() => {
    if (myLocation && customerLoc) {
      const dist = calculateDistance(myLocation, customerLoc);
      setDistance(dist);
    }
  }, [myLocation, customerLoc]);

  /* =========================
     RESTORE FROM LOCAL STORAGE
  ========================= */
  useEffect(() => {
    try {
      // Restore my delivery location from storage
      const deliveryData = localStorage.getItem(`delivery-location-${orderId}`);
      if (deliveryData) {
        const parsed = JSON.parse(deliveryData);
        if (isValidCoordinates(parsed.location)) {
          setMyLocation(parsed.location);
          setLastUpdate(parsed.timestamp || "");
          setIsTracking(true);
        }
      }

      // Restore customer location from "userloc" storage
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

  /* =========================
     SOCKET CONNECTION
  ========================= */
  useEffect(() => {
    const socket = createMockSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-order", orderId);
    });

    // Listen for customer location updates
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

  /* =========================
     MY LOCATION TRACKING (DELIVERY BOY)
  ========================= */
  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setMyLocation(loc);
        setLastUpdate(new Date().toLocaleTimeString());

        // Save to localStorage
        const storageKey = `delivery-location-${orderId}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            location: loc,
            timestamp: new Date().toLocaleTimeString(),
            savedAt: new Date().toISOString()
          })
        );

        // Emit to socket
        socketRef.current?.emit("deli-loc", {
          orderId,
          lat: loc[0],
          lon: loc[1],
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId, isTracking]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const mapCenter = myLocation || customerLoc || [28.6139, 77.2090];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                🏍️
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Delivery Tracker</h1>
                <p className="text-sm text-gray-500">Order #{orderId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-[500px]">
            {mapCenter ? (
              <MapContainer
                center={mapCenter}
                zoom={15}
                className="h-full w-full"
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* My Location (Delivery Boy - Green) */}
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

                {/* Customer Location (Blue) */}
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

                {/* Route Line */}
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
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <div className="text-gray-600 text-lg">Initializing map...</div>
                </div>
              </div>
            )}
          </div>

          {/* Map Legend */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-gray-700 font-medium">You (Delivery)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-gray-700 font-medium">Customer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-1 bg-purple-500 opacity-70"></div>
                <span className="text-gray-700 font-medium">Route</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
        