import mongoose from "mongoose";

interface IDeliveryAssignment {
  _id?: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  broadcastedTo: mongoose.Types.ObjectId[];
  assignedTo?: mongoose.Types.ObjectId | null;
  status: "broadcasted" | "accept" | "completed" | "rejected";
  acceptedAt?: Date;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
  deliveryBoyName?: string;
  deliveryBoyContact?: string;
  latitude?: number;
  longitude?: number;
  lastLocationUpdate?: Date;
  total?:Number
}

const deliveryAssignmentSchema = new mongoose.Schema<IDeliveryAssignment>(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    broadcastedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
    },
    lastLocationUpdate: {
      type: Date,
      required: false,
    },
    total:{
      type:Number,
      required:true,
    },
    status: {
      type: String,
      enum: ["broadcasted", "accept", "completed", "rejected"],
      default: "broadcasted",
    },
    deliveryBoyName: {
      type: String,
      required: false,
    },
    deliveryBoyContact: {
      type: String,
      required: false,
    },
    acceptedAt: {
      type: Date,        // ✅ FIXED: Added 'type:'
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.DeliveryAssignment ||
  mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);