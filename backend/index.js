import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/authRoutes.js";
import 'dotenv/config';   // <-- auto-runs dotenv.config()
import attendanceRoutes from "./routes/attendanceRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import cors from "cors";

dotenv.config();
console.log("JWT_SECRET =", process.env.JWT_SECRET);

connectDB();

const app = express();

app.use(cors({
  origin: "http://localhost:3000", // your frontend URL
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));


app.use(express.json()); // parse JSON bodies

// Routes
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/quizzes", quizRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
