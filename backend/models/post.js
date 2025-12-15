
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  post_id: { type: String, required: true, unique: true },
  created_by: {
    roll_number: { type: String, required: true },
    name: { type: String, required: true }
  },
  batch: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  images: { type: [String], default: [] },
  note: { type: String },

  likes: [
    {
      roll_number: String,
      name: String
    }
  ],

  comments: [
    {
      roll_number: String,
      name: String,
      comment: String
    }
  ]
});

export default mongoose.model("Post", postSchema);
