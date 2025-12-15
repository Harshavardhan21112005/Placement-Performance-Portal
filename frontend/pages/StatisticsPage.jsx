import React, { useEffect, useState } from "react";
import axios from "axios";
import AttendanceGraph from "../components/AttendanceGraph";

const StatisticsPage = () => {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/attendance/months", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMonths(res.data.availableMonths);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMonths();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Placement Class Statistics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {months.map((m, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedMonth(m)}
            className={`p-4 rounded-lg shadow cursor-pointer text-center 
                       ${selectedMonth?.title === m.title ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {m.title}
          </div>
        ))}
      </div>

      {selectedMonth && (
        <AttendanceGraph month={selectedMonth.month} year={selectedMonth.year} />
      )}
    </div>
  );
};

export default StatisticsPage;
