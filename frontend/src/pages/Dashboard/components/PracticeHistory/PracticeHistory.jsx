import React from "react";
import "./PracticeHistory.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PracticeHistory() {
  const data = [
    { day: "Sat", time: 30 },
    { day: "Sun", time: 20 },
    { day: "Mon", time: 25 },
    { day: "Tue", time: 10 },
    { day: "Wed", time: 40 },
    { day: "Thu", time: 35 },
    { day: "Fri", time: 15 },
  ];

  return (
    <div className="practice-history card">
      <div className="section-header">
        <h3 className="heading">Practice History</h3>
        <span className="week-label">this week</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="day" stroke="#8884d8" />
          <YAxis stroke="#8884d8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="time"
            stroke="var(--color-green)"
            strokeWidth={3}
            dot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
