import Attendance from "../models/attendance.js";
import User from "../models/users.js";
import { getBranchFromRoll } from "../utils/getBranchFromRoll.js";
import Quiz from "../models/quiz.js";


export const getBranchStudents = async (req, res) => {
  try {
    const roll_number = req.user.roll_number;
    const role = req.user.role; // set by authPR middleware

    // get prefix like "23PW"
    const branchPrefix = roll_number.substring(0, 4);

    // fetch roll numbers and names that start with this prefix
    const students = await User.find(
      { roll_number: { $regex: `^${branchPrefix}`, $options: "i" } },
      { roll_number: 1, name: 1, _id: 0 }
    );

    // create dictionary: key = roll_number, value = name
    const studentDict = {};
    students.forEach((s) => {
      studentDict[s.roll_number] = s.name;
    });

    res.json(studentDict);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


// create new attendance record
export const createAttendance = async (req, res) => {
  try {
    const { title, presents, note } = req.body;
    const { roll_number } = req.user;

    // ✅ validate required fields
    if (!title || !Array.isArray(presents) || !note || !note.trim()) {
      return res
        .status(400)
        .json({ error: "Title, note, and presents[] are required" });
    }

    // derive branch prefix
    const branchPrefix = roll_number.substring(0, 4);

    let branch = "";
    if (branchPrefix.includes("pw")) branch = "SS";
    else if (branchPrefix.includes("pt")) branch = "TCS";
    else if (branchPrefix.includes("pd")) branch = "DS";
    else if (branchPrefix.includes("pc")) branch = "CS";
    else branch = "CS";

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // check if attendance exists
    const existing = await Attendance.findOne({
      branch,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: `Attendance for branch ${branch} already exists today` });
    }

    // fetch students
    const students = await User.find(
      { roll_number: { $regex: `^${branchPrefix}`, $options: "i" } },
      { roll_number: 1, _id: 0 }
    );
    const allRolls = students.map((s) => s.roll_number);

    const validPresents = presents.filter((r) => allRolls.includes(r));
    const absents = allRolls.filter((r) => !validPresents.includes(r));

    const attendance = new Attendance({
      pr_roll_number: roll_number,
      presents: validPresents,
      absents,
      title,
      note,
      branch,
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance uploaded successfully",
      data: attendance,
    });
  } catch (err) {
    console.error("❌ Error creating attendance:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getBranchesByDate = async (req, res) => {
  try {
    const { date } = req.query; // frontend sends ?date=2025-09-22
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    // Convert input date to a range (00:00 → 23:59 of that day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query attendance records for that date
    const records = await Attendance.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).select("branch");

    // Extract unique branches
    const branches = [...new Set(records.map((r) => r.branch))];

    res.json({ date, branches });
  } catch (err) {
    console.error("❌ Error fetching branches by date:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAttendanceByDateBranch = async (req, res) => {
  try {
    const { date, branch } = req.body; // frontend sends { date, branch }
    if (!date || !branch) {
      return res.status(400).json({ error: "Date and branch are required" });
    }

    // Convert date to day range
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find attendance record for that date & branch
    const record = await Attendance.findOne({
      branch,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).select("presents absents start_time end_time note");

    if (!record) {
      return res.status(404).json({ error: "No attendance found for given date & branch" });
    }

    res.json({
      date,
      branch,
      presents: record.presents,
      absents: record.absents,
      start_time: record.start_time,
      end_time: record.end_time,
      note: record.note,
    });
  } catch (err) {
    console.error("❌ Error fetching attendance by date & branch:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAttendanceByDateBranch = async (req, res) => {
  try {
    const { date, branch, presents, absents } = req.body;

    if (!date || !branch || !Array.isArray(presents) || !Array.isArray(absents)) {
      return res
        .status(400)
        .json({ error: "date, branch, presents[], absents[] are required" });
    }

    // Convert date to day range (to match createdAt)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find and update attendance doc
    const updated = await Attendance.findOneAndUpdate(
      { branch, createdAt: { $gte: startOfDay, $lte: endOfDay } },
      { $set: { presents, absents } },
      { new: true } // return updated document
    );

    if (!updated) {
      return res
        .status(404)
        .json({ error: "No attendance found for given date & branch" });
    }

    res.json({
      message: "Attendance updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Error updating attendance:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const deleteAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query; // ✅ read from query param
    const { roll_number } = req.user;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const branch = getBranchFromRoll(roll_number);
    if (!branch) {
      return res.status(400).json({ error: "Invalid roll number format" });
    }

    const result = await Attendance.deleteOne({
      branch,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `No attendance found for ${branch} on ${date}` });
    }

    res.json({ message: `Attendance deleted for ${branch} on ${date}` });
  } catch (err) {
    console.error("❌ Error deleting attendance:", err);
    res.status(500).json({ error: "Server error" });
  }
};



export const getAvailableMonths = async (req, res) => {
  try {
    const rollNumber = req.user.roll_number; // from token, e.g. "23pw09"
    const prefix = rollNumber.substring(0, 4); // "23pw"

    // ✅ Find all attendance docs uploaded by PRs of same batch+branch
    const docs = await Attendance.find({
      pr_roll_number: { $regex: `^${prefix}`, $options: "i" }
    });

    if (!docs.length) {
      return res.status(404).json({ error: "No attendance records found" });
    }

    // ✅ Extract unique month-year values
    const monthSet = new Set();

    docs.forEach(doc => {
      const created = new Date(doc.createdAt);
      const month = created.toLocaleString("default", { month: "long" }); // e.g. "March"
      const year = created.getFullYear();
      monthSet.add(`${month}-${year}`);
    });

    // ✅ Convert set into structured array
    const availableMonths = Array.from(monthSet).map(key => {
      const [monthName, year] = key.split("-");
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      return {
        month: monthNumber,
        year: parseInt(year, 10),
        title: key
      };
    });

    res.json({ availableMonths });
  } catch (err) {
    console.error("❌ Error in getAvailableMonths:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


export const getMonthlyAttendanceGraph = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userRoll = req.user.roll_number; // e.g., "23pw09"
    const prefix = userRoll.substring(0, 4); // "23pw"

    if (!month || !year) {
      return res.status(400).json({ error: "month and year are required" });
    }

    // Create date range for that month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch attendance records for that month & same branch (via PR prefix)
    const attendances = await Attendance.find({
      createdAt: { $gte: startDate, $lte: endDate },
      pr_roll_number: { $regex: `^${prefix}`, $options: "i" },
    });

    if (!attendances.length) {
      return res
        .status(404)
        .json({ error: "No attendance records found for this month" });
    }

    // Build graph data + include title
    const graphData = attendances.map((a) => {
      const totalStudents = a.presents.length + a.absents.length;
      const avg =
        totalStudents > 0 ? (a.presents.length / totalStudents) * 100 : 0;

      return {
        date: a.createdAt.getDate(),
        averageAttendance: Math.round(avg),
        userPresent: a.presents.includes(userRoll),
        title: a.title || "Untitled Session", // 👈 include title here
      };
    });

    // Sort by date ascending
    graphData.sort((x, y) => x.date - y.date);

    // Return graph data and also the first title (if needed globally)
    res.json({
      graphData,
      titles: [...new Set(graphData.map((g) => g.title))], // optional: list of unique titles
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
