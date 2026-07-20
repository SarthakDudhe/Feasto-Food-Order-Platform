import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, default: "Scooter" },
  status: { type: String, default: "Available" },
  isVerified: { type: Boolean, default: false }
}, { minimize: false });

const riderModel = mongoose.models.rider || mongoose.model("rider", riderSchema);
export default riderModel;
