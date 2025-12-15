import React from "react";
import Navbar from "../components/Navbar";
import AttendanceForm from "../components/AttendanceForm";

export default function AttendancePage() {
    return (
        <div className="attendance-page">
            <Navbar />
            <AttendanceForm />
        </div>
    );
}
