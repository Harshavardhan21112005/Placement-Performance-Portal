import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceGraph = ({ month, year }) => {
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const token = localStorage.getItem("token"); // assuming JWT stored
        const res = await axios.get(
          `http://localhost:5000/api/attendance/graph?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGraphData(res.data.graphData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGraphData();
  }, [month, year]);

  const data = {
    labels: graphData.map(d => d.date),
    datasets: [{
      label: "Average Attendance (%)",
      data: graphData.map(d => d.averageAttendance),
      borderColor: "blue",
      fill: false,
      tension: 0.2,
      pointBackgroundColor: graphData.map(d => d.userPresent ? "green" : "red"),
      pointRadius: 6
    }]
  };

  const options = {
    scales: {
      y: { min: 0, max: 100, title: { display: true, text: "Attendance (%)" } },
      x: { title: { display: true, text: "Date" } }
    }
  };

  return <Line data={data} options={options} />;
};

export default AttendanceGraph;
