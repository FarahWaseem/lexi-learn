export const dashboardMockData = {
  user: {
    name: "Ali",
    streakDays: 3,
  },
  stats: {
    newWords: 50,
    completedLessons: 4,
    totalTime: 100, 
    goalProgress: 30,
  },
  lessons: [
    {
      id: 1,
      title: "Lesson 1",
      desc: "Basic greetings and phrases",
      vocabs: [
        { en: "hello", ar: "مرحبا" },
        { en: "good morning", ar: "صباح الخير" },
        { en: "thank you", ar: "شكراً" },
      ],
    },
    {
      id: 2,
      title: "Lesson 2",
      desc: "Introducing yourself",
      vocabs: [
        { en: "name", ar: "اسم" },
        { en: "hobby", ar: "هواية" },
        { en: "work", ar: "عمل" },
      ],
    },
    {
      id: 3,
      title: "Lesson 3",
      desc: "Talking about family",
      vocabs: [
        { en: "father", ar: "أب" },
        { en: "mother", ar: "أم" },
        { en: "brother", ar: "أخ" },
      ],
    },
  ],
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
