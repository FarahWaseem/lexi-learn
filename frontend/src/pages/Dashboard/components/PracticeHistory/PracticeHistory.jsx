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
  Area,
  AreaChart,
} from "recharts";

export default function PracticeHistory() {
  const data = [
    { day: "Sat", time: 30 },
    { day: "Sun", time: 20 },
    { day: "Mon", time: 25 },
    { day: "Tue", time: 10 },
    { day: "Wed", time: 40 },
    { day: "Thu", time: 35 },
    { day: "Fri", time: 30 },
  ];

  return (
    <div className="practice-history card">
      <div className="section-header">
        <h3 className="heading">Practice History</h3>
        <span className="week-label">this week</span>
      </div>

  <ResponsiveContainer width="100%" height={240}>
  <AreaChart
    data={data}
    margin={{ top: 10, right: 0, left: 20, bottom: 0 }} // ✅ رجعنا margin يسار موجب بدل سالب
  >
    <defs>
      <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E8F4E4" stopOpacity={1} />
        <stop offset="93%" stopColor="rgba(211, 252, 197, 0.09)" stopOpacity={0.2} />
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
      domain={[0, 40]}
      width={60}           // ✅ مساحة كافية للنصوص
      tickMargin={8}       // ✅ مسافة خفيفة عن الخط
      dx={-5}              // ✅ إزاحة بسيطة لتكون داخل التشارت مش خارجه
    />
    <Tooltip
      cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
    />
    <Area
      type="monotone"
      dataKey="time"
      stroke="var(--color-green)"
      strokeWidth={3}
      fill="url(#colorTime)"
      dot={{ r: 5, fill: "white", stroke: "var(--color-green)", strokeWidth: 2 }}
      activeDot={{
        r: 6,
        fill: "var(--color-green)",
        stroke: "white",
        strokeWidth: 2,
      }}
    />
  </AreaChart>
</ResponsiveContainer>


    </div>
  );
}
