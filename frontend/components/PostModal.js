import React, { useState } from "react";
import "./Navbar.css";
import "./PostModal.css"
export default function CreatePostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="nav-item"
        onClick={() => setIsModalOpen(true)}
      >
        <span className="icon">➕</span>
        <span className="label">Post</span>
      </button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create a Post</h2>
            <textarea placeholder="What's on your mind?" />
            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button
                onClick={() => {
                  alert("Post created!"); // 👉 Replace with real logic
                  setIsModalOpen(false);
                }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
