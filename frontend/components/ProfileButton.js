import React from "react";
import "./Navbar.css";

export default function ProfileButton() {
  return (
    <a href="#profile" className="nav-item">
      <span className="icon">👤</span>
      <span className="label">Profile</span>
    </a>
  );
}
