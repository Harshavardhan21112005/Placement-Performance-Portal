import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  pr_roll_number: {
    type: String,
    required: true, // PR who uploaded
  },
  presents: {
    type: [String], // array of roll numbers
    default: [],
  },
  absents: {
    type: [String],
    default: [],
  },
  title: {
    type: String,
    required: true, // title of the attendance/class
  },
  note: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  branch: {
    type: String,
    enum: ["SS", "TCS", "CS", "DS"], // only allows these 4 values
    required: true,
  },
});

// Optional: index on createdAt for faster sorting
attendanceSchema.index({ createdAt: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
