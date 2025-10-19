export const dashboardMockData = {
  user: {
    name: "Ali",
    streakDays: 3,
  },
  stats: {
    newWords: 50,
    completedLessons: 4,
    totalTime: 100, // minutes
    goalProgress: 30,
  },
  lessons: [
    { id: 1, title: "Lesson 1", desc: "Basic greetings and phrases" },
    { id: 2, title: "Lesson 2", desc: "Introducing yourself" },
  ],
  vocabs: ["always", "hobby", "introduce"],
  practiceHistory: [
    { day: "Sat", minutes: 10 },
    { day: "Sun", minutes: 20 },
    { day: "Mon", minutes: 15 },
    { day: "Tue", minutes: 25 },
    { day: "Wed", minutes: 5 },
    { day: "Thu", minutes: 30 },
    { day: "Fri", minutes: 0 },
  ],
};
