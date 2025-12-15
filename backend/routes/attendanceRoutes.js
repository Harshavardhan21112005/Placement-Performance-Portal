import express from "express";
import { createAttendance } from "../controllers/attendanceController.js";
import { authPR,authAdmin,authPRorStudent  } from "../middleware/authMiddleware.js";
import { getBranchStudents } from "../controllers/attendanceController.js";
import { getBranchesByDate } from "../controllers/attendanceController.js";
import { getAttendanceByDateBranch } from "../controllers/attendanceController.js";
import { updateAttendanceByDateBranch } from "../controllers/attendanceController.js";
import { deleteAttendanceByDate } from "../controllers/attendanceController.js";
import { getMonthlyAttendanceGraph,getAvailableMonths } from "../controllers/attendanceController.js";

const router = express.Router();

//used to get the students belonging to the branch of pr who uploads
router.get("/branch-students", authPR, getBranchStudents);

//upload the attendance 
router.post("/create",authPR, createAttendance);

//for getting which branches had pc on that day 
router.get("/branches", authAdmin, getBranchesByDate);

//to show admin who are present and absent for editing the attendance
router.get("/by-branch", authAdmin, getAttendanceByDateBranch);

//admin updates the attendance
router.put("/update", authAdmin, updateAttendanceByDateBranch);

//deleting attendnace for pr
router.delete("/deleteattendance",authPR, deleteAttendanceByDate);

//graphs
router.get("/months", authPRorStudent, getAvailableMonths);
router.get("/graph", authPRorStudent, getMonthlyAttendanceGraph);


export default router;