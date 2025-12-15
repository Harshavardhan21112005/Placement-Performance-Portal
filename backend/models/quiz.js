import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  quizId: { type: String, required: true, unique: true },  // unique quiz id
  title: { type: String, required: true },                 // quiz name/title
  dateOfQuiz: { type: Date, required: true },              // when quiz was conducted
  createdAt: { type: Date, default: Date.now },            // when entry created

  branchesInvolved: [
    { type: String, enum: ["SS", "DS", "CS", "TCS"], required: true }
  ],

  totalMarks: { type: Number, required: true },            // maximum marks for this quiz

  marks: {
    type: Map,
    of: Number,   // key: roll_number, value: mark obtained
  },

  averageScore: { type: Number, default: 0 },             // scaled to 0-100

  uploadedBy: {
    type: String, // roll_number of uploader
    required: true
  }
});

// ✅ Automatically compute averageScore scaled to 100
quizSchema.pre("save", function(next) {
  if (this.marks && this.marks.size > 0 && this.totalMarks > 0) {
    const totalObtained = Array.from(this.marks.values()).reduce((sum, val) => sum + val, 0);
    const maxPossible = this.marks.size * this.totalMarks;
    this.averageScore = (totalObtained / maxPossible) * 100;
  } else {
    this.averageScore = 0;
  }
  next();
});

export default mongoose.model("Quiz", quizSchema);
