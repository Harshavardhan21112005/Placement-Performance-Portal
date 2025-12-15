import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  roll_number: { type: String, required: true, unique: true }, // primary key
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  branch: { type: String },
  linkedin_id: { type: String, unique: true, sparse: true },
  git_id: { type: String, unique: true, sparse: true },
  leetcode_id: { type: String, unique: true, sparse: true }, // ✅ new field
  role: { type: String, enum: ["student", "CR", "PR", "admin"], required: true },

  badge: [
    {
      month: { type: String },
      count: { type: Number, default: 1 }
    }
  ]
});

export default mongoose.model("User", userSchema);
