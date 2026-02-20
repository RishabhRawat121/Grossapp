import mongoose from "mongoose";

interface IGrocery {
  _id:mongoose.Types.ObjectId
  name: string;
  category: string;
  price: number;   
  unit: string;
  image?: string;
  createdAt?:Date,
  updatedAt?:Date,
}

const grocerySchema = new mongoose.Schema<IGrocery>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Fruits & Vegetables",
        "Dairy & Eggs",
        "Rice, Atta & Grain",
        "Snacks & Biscuits",
        "Spices & Masalas",
        "Beverages & Drinks",
        "Personal Care",
        "Household Essentials",
        "Instant & Packaged food", 
        "Baby & Pet Care",
      ],
      required: true,
    },
    price: {
      type: Number, 
      required: true,
    },
    unit: {
      type: String,
      enum: ["kg", "g", "liter", "ml", "piece", "pack"],
      required: true,
    },
    image: {
      type: String,
      default: "", 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Grocery ||
mongoose.model("Grocery", grocerySchema);
