"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { CreditCardIcon, Truck } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getSocket } from "../lib/socket";
import { useSession } from "next-auth/react";

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

const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

// ✅ FIX: Accept null location so we can guard inside
function MapUpdater({ location }: { location: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    // ✅ FIX: Guard against null/undefined location and its values
    if (
      !location ||
      !Array.isArray(location) ||
      location.length < 2 ||
      typeof location[0] !== "number" ||
      typeof location[1] !== "number" ||
      isNaN(location[0]) ||
      isNaN(location[1])
    ) return;

    map.setView(location, 16);
  }, [location, map]);

  return null;
}

export default function CheckoutClient() {
  const { data: session } = useSession();
  const socketRef = useRef<any>(null);

  const user = useSelector((state: RootState) => state.user.userData);
  const cart: any[] = useSelector((state: RootState) => state.cart.Cartdata);

  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [delivery] = useState(40);
  const [total, setTotal] = useState(0);
  const [mapReady, setMapReady] = useState(false); // ✅ FIX: track client-side readiness

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    fulladdress: "",
    city: "",
    state: "",
    pin: "",
    latitute: "",
    longitute: "",
  });

  // ✅ FIX: Mark map as ready only on client side to prevent SSR issues
  useEffect(() => {
    setMapReady(true);
  }, []);

  // Fix Leaflet icons — safely require only on client
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const L = require("leaflet");
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    } catch (e) {
      // Leaflet icon fix failed silently — non-critical
    }
  }, []);

  // Socket identity
  useEffect(() => {
    const uid = (session?.user as any)?.id || user?._id;
    if (!uid) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) socket.connect();
    socket.emit("identity", uid);

    const onConnect = () => socket.emit("identity", uid);
    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [(session?.user as any)?.id, user?._id]);

  // Auto fill name/phone
  useEffect(() => {
    if (!user) return;
    setAddress((prev) => ({
      ...prev,
      name: user.name || "",
      phone: user.mobile || "",
    }));
  }, [user]);

  // ✅ FIX: Get user location with strict number validation
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator?.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // ✅ FIX: Use null checks instead of falsy checks (0 is valid but falsy)
        if (pos == null || pos.coords == null) return;

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // ✅ FIX: Validate they are real finite numbers, not just truthy
        if (
          typeof lat !== "number" ||
          typeof lon !== "number" ||
          !isFinite(lat) ||
          !isFinite(lon)
        ) return;

        setLocation([lat, lon]);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        toast.error("Location permission denied");
      },
      { timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ✅ FIX: Reverse geocode with strict guards before sending to Nominatim
  useEffect(() => {
    if (
      !location ||
      !Array.isArray(location) ||
      location.length < 2 ||
      typeof location[0] !== "number" ||
      typeof location[1] !== "number" ||
      isNaN(location[0]) ||
      isNaN(location[1])
    ) return;

    const lat = location[0];
    const lon = location[1];

    axios
      .get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          format: "json",
          lat,
          lon,
        },
      })
      .then((res) => {
        // ✅ FIX: Guard every nested property before accessing
        if (!res?.data) return;

        const displayName =
          typeof res.data.display_name === "string"
            ? res.data.display_name
            : "";
        const addrObj = res.data.address ?? {};

        setAddress((prev) => ({
          ...prev,
          fulladdress: displayName,
          city: addrObj.city || addrObj.town || addrObj.village || "",
          state: addrObj.state || "",
          pin: addrObj.postcode || "",
          latitute: lat.toString(),
          longitute: lon.toString(),
        }));
      })
      .catch((err) => {
        console.warn("Reverse geocode failed:", err?.message);
      });
  }, [location]);

  // Calculate total
  useEffect(() => {
    const subtotal =
      Array.isArray(cart)
        ? cart.reduce(
            (acc, item) =>
              acc +
              (typeof item?.price === "number" ? item.price : 0) *
                (typeof item?.quantity === "number" ? item.quantity : 0),
            0
          )
        : 0;

    setTotal(subtotal + delivery);
  }, [cart, delivery]);

  const orderItems = Array.isArray(cart)
    ? cart.map((item) => ({
        groceries: item._id,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }))
    : [];

  const placeOrder = () => {
    if (!location) return toast.error("Select location");
    if (!socketRef.current?.connected)
      return toast.error("Socket not connected");

    socketRef.current.emit("orders", {
      userId: user?._id,
      items: orderItems,
      paymentMethod: "cod",
      totalAmount: total,
      address,
    });

    router.push("/user/order-success");
  };

  const paymentOnline = async () => {
    if (!location) return toast.error("Select location");

    try {
      const { data } = await axios.post("/api/user/payment", {
        userId: user?._id,
        items: orderItems,
        paymentMethod: "online",
        totalAmount: total,
        address,
      });

      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    }
  };

  // ✅ FIX: Helper to check if location is valid before rendering map
  const isValidLocation = (
    loc: [number, number] | null
  ): loc is [number, number] => {
    return (
      Array.isArray(loc) &&
      loc.length === 2 &&
      typeof loc[0] === "number" &&
      typeof loc[1] === "number" &&
      isFinite(loc[0]) &&
      isFinite(loc[1]) &&
      !isNaN(loc[0]) &&
      !isNaN(loc[1])
    );
  };

  return (
    <div className="w-[92%] md:w-[80%] mx-auto py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={address.name}
                readOnly
                placeholder="Name"
                className="border p-2 rounded"
              />
              <input
                value={address.phone}
                readOnly
                placeholder="Phone"
                className="border p-2 rounded"
              />
              <input
                value={address.fulladdress}
                readOnly
                placeholder="Full Address"
                className="border p-2 rounded md:col-span-2"
              />
              <input
                value={address.city}
                readOnly
                placeholder="City"
                className="border p-2 rounded"
              />
              <input
                value={address.state}
                readOnly
                placeholder="State"
                className="border p-2 rounded"
              />
              <input
                value={address.pin}
                readOnly
                placeholder="PIN Code"
                className="border p-2 rounded md:col-span-2"
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Locate on Map</h2>

            <div className="h-72 rounded overflow-hidden">
              {/* ✅ FIX: Only render map on client AND with a fully validated location */}
              {mapReady && isValidLocation(location) ? (
                <MapContainer
                  center={location}
                  zoom={16}
                  className="w-full h-full"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={location}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  <MapUpdater location={location} />
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                  {mapReady
                    ? "Waiting for location permission..."
                    : "Loading map..."}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold">Payment Method</h2>

            <button
              onClick={() => setPaymentMethod("online")}
              className={`w-full mt-2 p-3 rounded flex items-center gap-2 ${
                paymentMethod === "online"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <CreditCardIcon />
              Pay Online
            </button>

            <button
              onClick={() => setPaymentMethod("cod")}
              className={`w-full mt-2 p-3 rounded flex items-center gap-2 ${
                paymentMethod === "cod"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <Truck />
              Cash on Delivery
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Total</h2>

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={paymentMethod === "online" ? paymentOnline : placeOrder}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded text-lg font-semibold hover:bg-green-700"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
