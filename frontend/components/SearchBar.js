import React from "react";
import "./Navbar.css";

export default function SearchBar() {
  return (
    <div className="search-container">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search"
        className="search-bar"
      />
    </div>
  );
}
