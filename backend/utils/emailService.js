import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // make sure .env is loaded

console.log("EMAIL_USER in email.js:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists in email.js:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset OTP",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  });
};
