import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected to Atlas");
    console.log("JWT_SECRET from env:", process.env.JWT_SECRET);

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // stop app if DB fails
  }
};

export default connectDB;
  