import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  }
});

const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
export default PasswordResetToken;
