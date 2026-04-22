// ─────────────────────────────────────────────
//  config/db.js — MongoDB Connection
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Mongoose 7+ no longer needs these options, but good to be explicit
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log when connection is lost
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    // Reconnect on error
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1); // Kill the process — app cannot run without DB
  }
};

module.exports = connectDB;