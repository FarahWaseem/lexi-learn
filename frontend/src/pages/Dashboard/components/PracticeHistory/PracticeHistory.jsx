import React from "react";
import "./PracticeHistory.css";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import zaytoonaReadingBook from "../../../../assets/images/zaytoonaReadingBook.png";

export default function PracticeHistory({ data: userHistory = [] }) {
  const weekDays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const data = weekDays.map((day) => {
    const record = userHistory.find((r) => r.day === day);
    return {
      day,
      minutes: record ? record.minutes : null,
    };
  });

  const isEmpty = !userHistory || userHistory.length === 0;

  return (
    <div className="practice-history card">
      <div className="section-header">
        <h3 className="heading">Practice History</h3>
        <span className="week-label">this week</span>
      </div>

      {isEmpty ? (
        <div
          style={{
            textAlign: "center",
            color: "rgba(0, 0, 0, 0.6)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            height: "220px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <img
            src={zaytoonaReadingBook}
            alt="Zaytoona reading"
            style={{ width: 96, height: 96, opacity: 0.9 }}
          />
          <p>Your practice activity will appear here once you start learning 🌱</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8F4E4" stopOpacity={1} />
                <stop
                  offset="93%"
                  stopColor="rgba(211, 252, 197, 0.09)"
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" vertical={false} />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              padding={{ left: 10, right: 10 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value} mins`}
              domain={[0, 60]} 
              width={60}
              tickMargin={8}
              dx={-5}
            />

            <Tooltip
              cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
              formatter={(value) => [`${value} mins`, "Practice Time"]}
            />

            <Area
              type="monotone"
              dataKey="minutes"
              stroke="var(--color-green)"
              strokeWidth={3}
              fill="url(#colorMinutes)"
              connectNulls={false} 
              dot={{
                r: 5,
                fill: "white",
                stroke: "var(--color-green)",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "var(--color-green)",
                stroke: "white",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
