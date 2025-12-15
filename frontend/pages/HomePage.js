import React from "react";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div
      className="Home"
      style={{
        backgroundColor: "#fffaf0", // soft cream background
        minHeight: "100vh",         // cover full page height
        margin: 0,
        padding: 0,
      }}
    >
      <Navbar />
      <h1>Welcome Home</h1>
    </div>
  );
}
