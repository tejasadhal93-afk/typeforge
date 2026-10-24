const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true,
    minlength: 3, maxlength: 24,
    match: [/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"]
  },
  email: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Valid email required"]
  },
  passwordHash: { type: String, required: true },
  bestWpm:         { type: Number, default: 0 },
  avgWpm:          { type: Number, default: 0 },
  avgAccuracy:     { type: Number, default: 100 },
  totalSessions:   { type: Number, default: 0 },
  totalTimeMinutes:{ type: Number, default: 0 },
  unlockedAchievements: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => { delete ret.passwordHash; return ret; }
});

module.exports = mongoose.model("User", userSchema);
