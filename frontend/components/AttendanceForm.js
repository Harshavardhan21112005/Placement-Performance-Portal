import React, { useState } from "react";
import TimeInputBox from "./TimeInputBox";
import "./AttendanceForm.css";
export default function AttendanceForm() {
    const students = Array.from({ length: 40 }, (_, i) => `Student ${i + 1}`);

    const [attendance, setAttendance] = useState(
        Array(students.length).fill(false)
    );
    const [comment, setComment] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // ✅ state for time
    const [startTime, setStartTime] = useState("10:00 AM");
    const [endTime, setEndTime] = useState("11:00 AM");

    // toggle single checkbox
    const handleCheckboxChange = (index) => {
        const updated = [...attendance];
        updated[index] = !updated[index];
        setAttendance(updated);
    };

    // select all
    const handleSelectAll = () =>
        setAttendance(Array(students.length).fill(true));

    // clear all
    const handleClearAll = () =>
        setAttendance(Array(students.length).fill(false));

    const handleSubmit = () => {
        if (!comment.trim()) {
            alert("Please add a comment about today’s placement class.");
            return;
        }
        setShowModal(true);
    };

    // counts
    const presentCount = attendance.filter(Boolean).length;
    const absentCount = students.length - presentCount;

    // ✅ calculate difference in minutes
    const calculateDuration = () => {
        const parseTime = (timeStr) => {
            const [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":").map(Number);

            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            return hours * 60 + minutes;
        };

        const start = parseTime(startTime);
        const end = parseTime(endTime);
        return end > start ? end - start : (24 * 60 - start) + end; // handles overnight case
    };

    const duration = calculateDuration();

    return (
        <div className="attendance-page">
            <div className="attendance-box">
            <div className="controls">
                <button onClick={handleSelectAll} className="btn select">
                    Select All
                </button>
                <button onClick={handleClearAll} className="btn clear">
                    Clear All
                </button>
            </div>

            <div className="students-list">
                {students.map((student, index) => (
                    <div key={index} className="student-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={attendance[index]}
                                onChange={() => handleCheckboxChange(index)}
                            />
                            {student}
                        </label>
                    </div>
                ))}
            </div>

            <TimeInputBox
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
            />

            <textarea
                placeholder="Comment about today’s placement class..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="comment-box"
                required
            ></textarea>

            <button onClick={handleSubmit} className="btn submit">
                Submit
            </button>

            {/* Modal for confirmation */}
            {
                showModal && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h3>Confirm Attendance</h3>
                            <p>
                                No. of Present: <b>{presentCount}</b>
                            </p>
                            <p>
                                No. of Absent: <b>{absentCount}</b>
                            </p>
                            <p>
                                Time Period: <b>{duration} minutes</b>
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn confirm"
                                    onClick={() => {
                                        setShowModal(false);
                                        setShowSuccess(true);
                                    }}
                                >
                                    Confirm
                                </button>
                                <button
                                    className="btn cancel"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Success popup */}
            {
                showSuccess && (
                    <div className="success-popup">
                        <p>✅ Attendance submitted successfully!</p>
                        <button
                            className="btn ok"
                            onClick={() => setShowSuccess(false)}
                        >
                            OK
                        </button>
                    </div>
                )
            }
        </div>
        </div>
    );
}
