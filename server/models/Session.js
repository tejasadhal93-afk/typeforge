const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mode:        { type: String, enum: ["time-trial","passage","lesson","daily","custom","music"], default: "time-trial" },
  label:       { type: String, default: "" },
  drillId:     { type: String, default: null },
  wpm:         { type: Number, required: true },
  rawWpm:      { type: Number, default: 0 },
  accuracy:    { type: Number, required: true },
  duration:    { type: Number, required: true },
  errors:      { type: Number, default: 0 },
  correctChars:{ type: Number, default: 0 },
  keyErrors:   { type: Map, of: Number, default: {} },
  streak:      { type: Number, default: 0 },
  date:        { type: Date, default: Date.now }
}, { timestamps: false, suppressReservedKeysWarning: true });

module.exports = mongoose.model("Session", sessionSchema);
