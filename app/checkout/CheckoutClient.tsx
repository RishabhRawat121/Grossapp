"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSocket } from "../lib/socket";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

export default function TrackOrder({ orderId }: { orderId: string }) {
  const socketRef = useRef<any>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-order", orderId);

    const handleLocation = (data: any) => {
      if (!data) return;

      const lat = data?.lat;
      const lon = data?.lon;

      if (lat == null || lon == null) return;

      const parsedLat = Number(lat);
      const parsedLon = Number(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon)) return;

      setLocation([parsedLat, parsedLon]);
    };

    socket.on("deli-loc", handleLocation);

    return () => {
      socket.off("deli-loc", handleLocation);
      socket.emit("leave-order", orderId);
    };
  }, [orderId]);

  if (!location) {
    return (
      <div className="p-6 text-center text-lg">
        Waiting for delivery location...
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <MapContainer
        center={location}
        zoom={16}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={location} />
      </MapContainer>
    </div>
  );
}
