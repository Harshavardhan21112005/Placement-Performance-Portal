import React from "react";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "./TimeInputBox.css";

export default function TimeInputBox({ startTime, setStartTime, endTime, setEndTime }) {
  return (
    <div className="time-container">
      <div className="time-box">
        <label>Start Time</label>
        <TimePicker
          onChange={setStartTime}
          value={startTime}
          format="hh:mm a"
          clearIcon={null}
          clockIcon={null}
        />
      </div>
      <div className="time-box" style={{ marginBottom: "10px" }}>
        <label>End Time</label>
        <TimePicker
          onChange={setEndTime}
          value={endTime}
          format="hh:mm a"
          clearIcon={null}
          clockIcon={null}
        />
      </div>

    </div>
  );
}
