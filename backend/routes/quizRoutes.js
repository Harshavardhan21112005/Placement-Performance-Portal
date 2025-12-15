// routes/quizRoutes.js
import express from "express";
import { authPR,authPRorStudent } from "../middleware/authMiddleware.js";
import { getBranchesByDate, getPresentRolls, createQuiz } from "../controllers/quizController.js";
import { updateQuizMarks } from "../controllers/quizController.js"
import { getQuizzesByDate } from "../controllers/quizController.js"
import { getQuizMarks } from "../controllers/quizController.js"
import {deleteQuiz} from "../controllers/quizController.js"
import {getStudentQuizMonths} from "../controllers/quizController.js"
import {getMonthlyQuizGraph} from "../controllers/quizController.js"
const router = express.Router();

//make pr to choose only valid branches for uploading quiz marks
router.get("/branches", authPR, getBranchesByDate);

//make pr to give marks only for present roll numbers
router.post("/rolls", authPR, getPresentRolls);

//to upload quiz marks
router.post("/create-quiz", authPR, createQuiz);
//to delete the quiz
router.put("/delete-quiz",authPR,deleteQuiz);

router.get("/getQuizzesByDate", authPR ,getQuizzesByDate);
router.get("/getQuizMarks", getQuizMarks); 
//to edit the marks
router.put("/update-marks", authPR, updateQuizMarks);
router.get("/quizmonths", authPRorStudent, getStudentQuizMonths);


router.get("/quizgraph", authPRorStudent, getMonthlyQuizGraph);

export default router;