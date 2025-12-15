import React from "react";
import "./Navbar.css";

export default function NavbarAttendanceButton() {
  return (
    <a href="#attendance" className="nav-item">
      <span className="icon">🙋‍♂️</span>
      <span className="label">Attendance</span>
    </a>
  );
}
