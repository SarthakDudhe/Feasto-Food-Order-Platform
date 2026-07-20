import mongoose from "mongoose"


const orderSchema = new mongoose.Schema({
  userId:           { type: String,  required: true },
  items:            { type: Array,   required: true },
  amount:           { type: Number,  required: true },
  address:          { type: Object,  required: true },
  coupon:           { type: Object,  default: null  },
  status:           { type: String,  default: "Food Processing" },
  date:             { type: Date,    default: Date.now },
  payment:          { type: Boolean, default: false  },

  // Customer notes / cooking instructions (e.g., "Less spicy, no onions")
  notes:            { type: String,  default: "" },

  // ── Rider assignment & Validation ─────────────────────────────────
  riderId:          { type: mongoose.Schema.Types.ObjectId, ref: 'rider', default: null },
  riderName:        { type: String,  default: "" },
  riderPhone:       { type: String,  default: "" },
  deliveryOtp:      { type: String,  default: "" },
  
  // ── Chat Messaging ──────────────────────────────────────────────
  chat: [
    {
      sender: { type: String, enum: ["Customer", "Rider"], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  // GPS coordinates set by admin (or future rider app)
  // [lng, lat] in decimal degrees – used to place the live map pin
  riderLat:         { type: Number,  default: null },
  riderLng:         { type: Number,  default: null },

  // Timestamp of the last location update (shown on TrackOrder as "last seen")
  riderUpdatedAt:   { type: Date,    default: null },
})

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema) 
export default orderModel
