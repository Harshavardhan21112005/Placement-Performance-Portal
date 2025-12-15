// controllers/quizController.js
import Attendance from "../models/attendance.js"; // assuming you track placement classes here
import Quiz from "../models/quiz.js";
import { getBranchFromRoll } from "../utils/getBranchFromRoll.js";
import User from "../models/users.js";

// 🔹 GET available branches on a date
export const getBranchesByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date is required" });

        // Convert input date to YYYY-MM-DD format for comparison
        const inputDate = new Date(date);
        const inputDateStr = inputDate.toISOString().split("T")[0]; // "2025-10-05"

        // Find all attendance documents
        const records = await Attendance.find({}, "branch createdAt");

        // Filter records where createdAt date matches input date
        const filteredBranches = records
            .filter(r => r.createdAt.toISOString().split("T")[0] === inputDateStr)
            .map(r => r.branch);

        // Get unique branches
        const uniqueBranches = [...new Set(filteredBranches)];

        if (uniqueBranches.length === 0) {
            return res.status(404).json({ error: "No branches  for this date" });
        }

        res.json({ date: inputDateStr, branches: uniqueBranches });
    } catch (err) {
        console.error("Error fetching branches:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const getPresentRolls = async (req, res) => {
    try {
        const { date, branchesInvolved } = req.body;

        if (!date || !Array.isArray(branchesInvolved) || branchesInvolved.length === 0) {
            return res.status(400).json({ error: "Date and branchesInvolved array are required" });
        }

        const inputDateStr = date.toString();

        // Fetch all attendance documents
        const allDocs = await Attendance.find({});

        // Filter documents by date and branch
        const filteredDocs = allDocs.filter(doc => {
            const docDateStr = doc.createdAt.toISOString().split("T")[0];
            return docDateStr === inputDateStr && branchesInvolved.includes(doc.branch);
        });

        if (filteredDocs.length === 0) {
            return res.status(404).json({ error: "No attendance records found for the given date and branches" });
        }

        // Collect all present roll numbers (deduplicate) directly in a Set
        const presentRollsSet = new Set(filteredDocs.flatMap(doc => doc.presents));

        // Fetch all users whose roll_number is in the set
        const users = await User.find(
            { roll_number: { $in: Array.from(presentRollsSet) } },
            { roll_number: 1, name: 1, _id: 0 }
        );

        // Build the dictionary: roll_number => name
        const presentStudentsDict = {};
        users.forEach(u => {
            presentStudentsDict[u.roll_number] = u.name;
        });

        res.json({ date: inputDateStr, presentStudents: presentStudentsDict });
        console.log("present rolls : ", presentRollsSet);

    } catch (err) {
        console.error("Error in getPresentRolls:", err);
        res.status(500).json({ error: "Server error" });
    }
};



export const createQuiz = async (req, res) => {
    try {
        const { dateOfQuiz, branchesInvolved, title, marks, totalMarks } = req.body;
        const uploadedBy = req.user.roll_number; // from token

        // ✅ Basic validation
        if (!dateOfQuiz || !branchesInvolved || !marks || !totalMarks) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Convert date string to Date object
        const quizDate = new Date(dateOfQuiz);

        // ✅ Validate marks
        const marksArray = Object.values(marks).map(Number);
        const maxMark = marksArray.length > 0 ? Math.max(...marksArray) : 0;
        if (maxMark > totalMarks) {
            return res.status(400).json({ error: "Some marks exceed totalMarks" });
        }

        // ✅ Compute normalized averageScore (0-100)
        const totalObtained = marksArray.reduce((sum, val) => sum + val, 0);
        const averageScore = totalMarks > 0
            ? (totalObtained / (marksArray.length * totalMarks)) * 100
            : 0;

        // ✅ Generate unique quiz ID
        const quizId = `QUIZ_${quizDate.toISOString().split("T")[0]}_${branchesInvolved.join("_")}_${Date.now()}`;

        // ✅ Create Quiz document
        const newQuiz = new Quiz({
            quizId,
            title,
            dateOfQuiz: quizDate,
            branchesInvolved,
            uploadedBy,
            marks,
            totalMarks,
            averageScore  // 👈 set normalized average here
        });

        await newQuiz.save();

        res.status(201).json({
            message: "Quiz created successfully",
            quiz: newQuiz,
        });
    } catch (err) {
        console.error("Error in createQuiz:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};


// POST /quiz/by-date

export const getQuizzesByDate = async (req, res) => {
    try {
        const { date } = req.body;
        const prRoll = req.user.roll_number; // current PR from token

        if (!date) {
            return res.status(400).json({ error: "Date is required" });
        }

        const quizDate = new Date(date);
        const nextDay = new Date(quizDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Only fetch quizzes uploaded by the current PR on that date
        const quizzes = await Quiz.find({
            uploadedBy: prRoll,
            dateOfQuiz: { $gte: quizDate, $lt: nextDay }
        }).select("quizId title branchesInvolved");

        if (!quizzes.length) {
            return res
                .status(404)
                .json({ error: `No quizzes found uploaded by you on ${date}` });
        }

        res.json({
            date,
            quizzes: quizzes.map((q) => ({
                quizId: q.quizId,
                title: q.title,
                branchesInvolved: q.branchesInvolved
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// POST /quiz/get-marks
export const getQuizMarks = async (req, res) => {
    try {
        const { quizId } = req.body;
        if (!quizId) return res.status(400).json({ error: "quizId is required" });

        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        res.json({
            quizId: quiz.quizId,
            date: quiz.dateOfQuiz,
            title: quiz.title,
            branchesInvolved: quiz.branchesInvolved,
            marks: Object.fromEntries(quiz.marks || [])
        });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// POST /quiz/update-marks
export const updateQuizMarks = async (req, res) => {
    try {
        const { quizId, marks } = req.body;

        if (!quizId || !marks) {
            return res.status(400).json({ error: "quizId and marks are required" });
        }

        // Fetch quiz from DB
        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found" });
        }

        // Convert marks object -> array
        const marksArray = Object.values(marks).map(Number);
        const maxMark = marksArray.length > 0 ? Math.max(...marksArray) : 0;

        // Validation
        if (maxMark > quiz.totalMarks) {
            return res.status(400).json({
                error: "Invalid marks entry: some marks exceed totalMarks"
            });
        }

        // ✅ Compute average in percentage
        const totalObtained = marksArray.reduce((a, b) => a + b, 0);
        const averageScore =
            marksArray.length > 0
                ? (totalObtained / (marksArray.length * quiz.totalMarks)) * 100
                : 0;

        // Save marks + average into the quiz doc
        quiz.marks = new Map(Object.entries(marks));
        quiz.averageScore = averageScore;
        await quiz.save();

        res.json({
            message: "Marks updated successfully",
            data: {
                quizId: quiz.quizId,
                totalMarks: quiz.totalMarks,
                marks: Object.fromEntries(quiz.marks),
                averageScore: quiz.averageScore
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.body;
        const prRoll = req.user.roll_number;

        if (!quizId) {
            return res.status(400).json({ error: "quizId is required" });
        }

        const deleted = await Quiz.findOneAndDelete({
            quizId,
            uploadedBy: prRoll // ensure only the uploader can delete
        });

        if (!deleted) {
            return res.status(404).json({ error: "Quiz not found or not authorized" });
        }

        res.json({ message: "Quiz deleted successfully", quizId: deleted.quizId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export const getStudentQuizMonths = async (req, res) => {
    try {
        const rollNumber = req.user.roll_number; // from token
        const branch = getBranchFromRoll(rollNumber);

        if (!branch) {
            return res.status(400).json({ error: "Invalid roll number format" });
        }

        // Fetch all quizzes that include this branch
        const quizzes = await Quiz.find({ branchesInvolved: branch });

        if (!quizzes.length) {
            return res.status(404).json({ error: "No quizzes found for this student" });
        }

        // Track unique month-year combinations
        const monthSet = new Set();

        quizzes.forEach((quiz) => {
            const date = new Date(quiz.dateOfQuiz);
            const month = date.toLocaleString("default", { month: "long" });
            const year = date.getFullYear();
            monthSet.add(`${month}-${year}`);
        });

        const availableMonths = Array.from(monthSet).map((key) => {
            const [monthName, year] = key.split("-");
            const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
            return {
                month: monthNumber,
                year: parseInt(year, 10),
                title: key
            };
        });

        // Sort ascending by year & month
        availableMonths.sort((a, b) => a.year - b.year || a.month - b.month);

        res.json({ availableMonths });
    } catch (err) {
        console.error("❌ Error in getStudentQuizMonths:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};
export const getMonthlyQuizGraph = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: "month and year are required" });
        }

        const userRoll = req.user.roll_number?.toLowerCase(); // get roll_number from token
        if (!userRoll) {
            return res.status(400).json({ error: "Invalid user roll number" });
        }

        const branch = getBranchFromRoll(userRoll); // SS, DS, CS, TCS
        if (!branch) {
            return res.status(400).json({ error: "Invalid roll number format" });
        }

        // Fetch quizzes for the month where student's branch was involved
        const quizzes = await Quiz.find({
            branchesInvolved: branch,
            createdAt: {
                $gte: new Date(`${year}-${month}-01T00:00:00.000Z`),
                $lt: new Date(`${year}-${month}-31T23:59:59.999Z`)
            }
        });

        if (!quizzes.length) {
            return res.status(404).json({ error: "No quizzes found for this month" });
        }

        const graphData = quizzes.map((q) => {
            const rawMark = q.marks[userRoll] ?? 0; // get student mark
            const studentMarkPercent = q.totalMarks > 0 ? (rawMark / q.totalMarks) * 100 : 0;

            return {
                date: q.dateOfQuiz.getDate(),
                totalMarks: q.totalMarks,
                studentMark: Math.round(studentMarkPercent),
                hasMark: rawMark !== undefined,
                averageScore: Math.round(q.averageScore), // already normalized to 100
                title: q.title || "Untitled Quiz",
                createdAt: q.dateOfQuiz,
            };
        });

        // Sort by date
        graphData.sort((a, b) => a.date - b.date);

        res.json({
            graphData,
            titles: [...new Set(graphData.map((g) => g.title))],
        });
    } catch (err) {
        console.error("Error in getMonthlyQuizGraph:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};
