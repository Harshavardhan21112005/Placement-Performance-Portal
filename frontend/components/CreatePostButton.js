import React, { useState } from "react";
import "./CreatePostButton.css";

export default function CreatePostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [images, setImages] = useState([]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 1) {
      alert("You can upload only 1 image.");
      return;
    }
    setImages([...images, ...files]);
  };

  return (
    <>
      {/* Post Button */}
      <button className="nav-item" onClick={() => setIsModalOpen(true)}>
        <span className="icon">➕</span>
        <span className="label">Post</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Create a Post</h2>

            {/* Text Area */}
            <textarea
              className="post-textarea"
              placeholder="Type something you did today 😊"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />

            {/* Image Upload Section */}
            <div className="image-upload">
              <label htmlFor="fileInput" className="gallery-icon">
                📷
              </label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
              <span className="upload-hint">Add an image</span>
            </div>

            {/* Image Preview */}
            <div className="image-preview">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(img)}
                  alt="preview"
                  className="preview-img"
                />
              ))}
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button
                className="post-btn"
                onClick={() => {
                  alert("Post created!");
                  setIsModalOpen(false);
                  setPostText("");
                  setImages([]);
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
