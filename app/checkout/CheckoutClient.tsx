"use client";

import  { useState, useEffect, useRef } from "react";
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

function MapUpdater({ location }: { location: [number, number] }) {
  const map = useMap();

  useEffect(() => {
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

  const [paymentMethod, setPaymentMethod] =
    useState<"cod" | "online">("cod");

  const [location, setLocation] =
    useState<[number, number] | null>(null);

  const [delivery] = useState(40);
  const [total, setTotal] = useState(0);

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

  useEffect(() => {
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
  }, []);

  useEffect(() => {
   const uid = (session?.user as any)?.id || user?._id;
    if (!uid) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("identity", uid);

    const onConnect = () => {
      socket.emit("identity", uid);
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [(session?.user as any)?.id, user?._id]);

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        name: user.name || "",
        phone: user.mobile || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation([
          pos.coords.latitude,
          pos.coords.longitude,
        ]),
      () => toast.error("Location permission denied")
    );
  }, []);

  useEffect(() => {
    if (!location) return;

    axios
      .get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          format: "json",
          lat: location[0],
          lon: location[1],
        },
      })
      .then((res) => {
        setAddress((prev) => ({
          ...prev,
          fulladdress: res.data.display_name || "",
          city: res.data.address?.city || "",
          state: res.data.address?.state || "",
          pin: res.data.address?.postcode || "",
          latitute: location[0].toString(),
          longitute: location[1].toString(),
        }));
      });
  }, [location]);

  useEffect(() => {
    const subtotal =
      cart.reduce(
        (acc, item) =>
          acc + item.price * item.quantity,
        0
      ) || 0;

    setTotal(subtotal + delivery);
  }, [cart, delivery]);

  const orderItems = cart.map((item) => ({
    groceries: item._id,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
  }));

  const placeOrder = () => {
    if (!location) return toast.error("Select location");

    if (!socketRef.current?.connected) {
      return toast.error("Socket not connected");
    }

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
      const { data: res } = await axios.post(
        "/api/user/payment",
        {
          userId: user?._id,
          items: orderItems,
          paymentMethod: "online",
          totalAmount: total,
          address,
        }
      );

      window.location.href = res.url;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Payment failed"
      );
    }
  };

  return (
    <div className="w-[92%] md:w-[80%] mx-auto py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Delivery Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={address.name} readOnly className="border p-2 rounded" />
              <input value={address.phone} readOnly className="border p-2 rounded" />
              <input value={address.fulladdress} readOnly className="border p-2 rounded md:col-span-2" />
              <input value={address.city} readOnly className="border p-2 rounded" />
              <input value={address.state} readOnly className="border p-2 rounded" />
              <input value={address.pin} readOnly className="border p-2 rounded md:col-span-2" />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Locate on Map
            </h2>

            <div className="h-72 rounded overflow-hidden">
              {location && (
                <MapContainer center={location} zoom={16} className="w-full h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={location} draggable />
                  <Popup>Your Location</Popup>
                  <MapUpdater location={location} />
                </MapContainer>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold">
              Payment Method
            </h2>

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
            <h2 className="text-xl font-semibold mb-4">
              Total
            </h2>

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={
                paymentMethod === "online"
                  ? paymentOnline
                  : placeOrder
              }
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