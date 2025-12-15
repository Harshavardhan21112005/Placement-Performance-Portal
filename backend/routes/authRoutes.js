import express from "express";
import { changeUserRole, loginUser, registerAdmin } from "../controllers/userController.js";
import multer from "multer";
import { registerStudentsExcel } from "../controllers/userController.js";
import { logoutUser, forgotPassword, verifyOtp, resetPassword,verifyResetToken } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// login
router.post("/verify-otp", verifyOtp);

router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser); 
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset/:token", verifyResetToken);
router.post("/reset-password", resetPassword);
//register admin 
router.post("/register-admin", registerAdmin);

//change the role of the student
router.post("/change-role", changeUserRole);

// Multer setup (uploads stored in uploads/ folder)
const upload = multer({ dest: "uploads/" });

// Upload Excel file route
router.post("/upload-excel", upload.single("file"), registerStudentsExcel);



export default router;