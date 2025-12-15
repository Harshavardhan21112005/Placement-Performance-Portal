import React, { useState } from "react";
import { Link } from "react-router-dom";  // ✅ Import Link
import LinkedInLogo from "./LinkedInLogo";
import SearchBar from "./SearchBar";
import HomeButton from "./HomeButton";
import CreatePostButton from "./CreatePostButton";
import NavbarAttendanceButton from "./NavbarAttendanceButton";
import ProfileButton from "./ProfileButton";
import PerformanceButton from "./PerformanceButton";
import "./Navbar.css";

export default function Navbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            {/* Top Navbar */}
            <nav className="navbar">
                <div className="nav-left">
                    <LinkedInLogo />
                    <SearchBar />
                </div>

                <div className="nav-right">
                    {/* Home route */}
                    <Link to="/Home">
                        <HomeButton />
                    </Link>

                    {/* Open modal */}
                    <CreatePostButton onClick={() => setIsModalOpen(true)} />

                    {/* Navigate to Attendance Page */}
                    <Link to="/AttendancePage">
                        <NavbarAttendanceButton />
                    </Link>

                    <Link to="/Profile">
                        <ProfileButton />
                    </Link>

                    <Link to="/PerformancePage">
                        <PerformanceButton />
                    </Link>
                </div>
            </nav>
        </div>
    );
}
