// /src/data/conversationPlan.js

const DAY_MS = 24 * 60 * 60 * 1000;

export function getPlanForDate(startISO, now = new Date()) {
    const start = new Date(startISO);
    const diffDays = Math.floor((now - start) / DAY_MS);
    const index = ((diffDays % PLAN.length) + PLAN.length) % PLAN.length;
    return PLAN[index];
}

export const PLAN = [
    // ====== A1: Days 1–10 ======
    {
        day: 1, cefr: "A1", topic: "Greetings & Introductions", questions: [
            "What is your name?", "Where are you from?", "How old are you?",
            "What languages do you speak?", "What do you do (study/work)?",
            "Why are you learning English?"
        ]
    },
    {
        day: 2, cefr: "A1", topic: "Daily Routine", questions: [
            "What time do you usually wake up?", "What do you do in the morning?",
            "When do you usually eat lunch?", "What do you do in the afternoon?",
            "What time do you go to bed?", "What is your favorite part of the day?"
        ]
    },
    {
        day: 3, cefr: "A1", topic: "Family & Friends", questions: [
            "How many people are in your family?", "Who is your best friend?",
            "Describe a family member.", "How often do you see your friends?",
            "What do you do with your family?", "What do you enjoy doing with friends?"
        ]
    },
    {
        day: 4, cefr: "A1", topic: "Food & Drinks", questions: [
            "What is your favorite food?", "What do you usually eat for breakfast?",
            "Do you like cooking?", "What is a typical meal in your country?",
            "What drinks do you like?", "What food don’t you like?"
        ]
    },
    {
        day: 5, cefr: "A1", topic: "Hobbies", questions: [
            "What are your hobbies?", "How often do you do them?",
            "Do you do hobbies alone or with others?", "Why do you like them?",
            "What hobby would you like to try?", "What hobby is popular in your country?"
        ]
    },
    {
        day: 6, cefr: "A1", topic: "Shopping", questions: [
            "Do you like shopping?", "Where do you usually shop?",
            "Do you prefer online or in-store?", "What was the last thing you bought?",
            "Do you like cheap or expensive products?", "What is your favorite shop?"
        ]
    },
    {
        day: 7, cefr: "A1", topic: "Places in Town", questions: [
            "What places are near your home?", "What is your favorite place in town?",
            "Where do you usually go on weekends?", "Is there a park near you?",
            "Where do you go shopping?", "How do you get around your town?"
        ]
    },
    {
        day: 8, cefr: "A1", topic: "Weather", questions: [
            "What is the weather like today?", "What is your favorite season?",
            "What do you wear in winter?", "What do you do in summer?",
            "Is the weather the same every year?", "What is your favorite weather?"
        ]
    },
    {
        day: 9, cefr: "A1", topic: "Home", questions: [
            "Do you live in a house or apartment?", "Describe your room.",
            "What do you like about your home?", "Who do you live with?",
            "What is your dream home?", "What chores do you do at home?"
        ]
    },
    {
        day: 10, cefr: "A1", topic: "Time & Appointments", questions: [
            "What time is it now?", "What time do you usually wake up?",
            "How do you plan your day?", "Are you always on time?",
            "What do you do if you are late?", "How do you remember appointments?"
        ]
    },

    // ====== A2: Days 11–20 ======
    {
        day: 11, cefr: "A2", topic: "Health", questions: [
            "How do you stay healthy?", "What do you do when you feel sick?",
            "Do you exercise?", "What is a healthy habit?", "Do you sleep well?",
            "Do you eat healthy food?"
        ]
    },
    {
        day: 12, cefr: "A2", topic: "Travel", questions: [
            "Do you like traveling?", "Where was your last trip?",
            "What is your dream destination?", "Do you travel by plane or bus?",
            "Do you prefer cities or nature?", "What do you pack when you travel?"
        ]
    },
    {
        day: 13, cefr: "A2", topic: "Work & Study", questions: [
            "What do you do?", "What subjects do you like?",
            "Do you like studying?", "What is your favorite subject?",
            "Do you prefer studying alone or with friends?", "What is your dream job?"
        ]
    },
    {
        day: 14, cefr: "A2", topic: "Technology", questions: [
            "Do you use a computer?", "What apps do you use every day?",
            "Do you like social media?", "What is your favorite gadget?",
            "How does technology help you?", "What problems does technology bring?"
        ]
    },
    {
        day: 15, cefr: "A2", topic: "Food Culture", questions: [
            "What food is traditional in your country?", "Do you like trying new food?",
            "What restaurant do you like?", "Do you eat fast food?",
            "Do you cook at home?", "What is your favorite dessert?"
        ]
    },
    {
        day: 16, cefr: "A2", topic: "Money", questions: [
            "Do you save money?", "What do you spend money on?",
            "Do you prefer cash or card?", "What was the last thing you bought?",
            "Do you like expensive things?", "What would you buy if you had a lot of money?"
        ]
    },
    {
        day: 17, cefr: "A2", topic: "Events", questions: [
            "What was the last event you went to?", "Do you like weddings?",
            "Do you celebrate birthdays?", "What is your favorite holiday?",
            "Do you like big or small parties?", "What event would you like to attend?"
        ]
    },
    {
        day: 18, cefr: "A2", topic: "Learning", questions: [
            "How do you learn best?", "Do you like studying alone or with others?",
            "What is your favorite learning method?", "Do you enjoy reading?",
            "Do you take notes?", "What is a good way to remember new words?"
        ]
    },
    {
        day: 19, cefr: "A2", topic: "Entertainment", questions: [
            "What movies do you like?", "Do you like reading books?",
            "What is your favorite series?", "Do you go to the cinema?",
            "Who is your favorite actor?", "Do you like music concerts?"
        ]
    },
    {
        day: 20, cefr: "A2", topic: "Community", questions: [
            "Do you know your neighbors?", "Do you help your community?",
            "What is one problem in your community?", "Do you recycle?",
            "Do you join events in your town?", "How can people help their community?"
        ]
    },

    // ====== B1: Days 21–40 ======
    {
        day: 21, cefr: "B1", topic: "Cultural Differences", questions: [
            "What cultures are you familiar with?", "Have you traveled abroad?",
            "What cultural traditions do you like?", "What was surprising in another culture?",
            "What is polite in your culture?", "What is impolite in your culture?"
        ]
    },
    {
        day: 22, cefr: "B1", topic: "Education Systems", questions: [
            "What is education like in your country?", "Do you like your school system?",
            "What is good about it?", "What is bad about it?",
            "What should change in education?", "What subjects are important today?"
        ]
    },
    {
        day: 23, cefr: "B1", topic: "Work-life Balance", questions: [
            "Do you have free time?", "Do people work too much?",
            "How do you relax?", "Do you take vacations?",
            "How can companies improve balance?", "What is your perfect balance?"
        ]
    },
    {
        day: 24, cefr: "B1", topic: "Healthy Lifestyle", questions: [
            "Do you exercise regularly?", "What food is healthy?",
            "Do you sleep well?", "Do you avoid stress?",
            "What habits are unhealthy?", "How can you improve your lifestyle?"
        ]
    },
    {
        day: 25, cefr: "B1", topic: "Digital Privacy", questions: [
            "Do you use social media?", "Do you share personal info?",
            "Do you trust websites?", "Do you protect your passwords?",
            "Do you use VPNs?", "Why is privacy important?"
        ]
    },
    {
        day: 26, cefr: "B1", topic: "Environment", questions: [
            "What problems does the environment face?", "Do you recycle?",
            "What can people do to help?", "Do you use plastic bags?",
            "Do you care about climate change?", "What is one eco-friendly action?"
        ]
    },
    {
        day: 27, cefr: "B1", topic: "City vs Countryside", questions: [
            "Do you live in a city or countryside?", "What is good about it?",
            "What is bad about it?", "Do you like quiet or busy places?",
            "Where would you like to live?", "What is your dream place to live?"
        ]
    },
    {
        day: 28, cefr: "B1", topic: "Problem Solving", questions: [
            "Do you like solving problems?", "What was a problem you solved?",
            "How do you solve problems at work?", "Do you ask for help?",
            "Do you solve problems alone or with others?", "What is a big problem you solved?"
        ]
    },
    {
        day: 29, cefr: "B1", topic: "Personal Growth", questions: [
            "Do you set goals?", "What is your biggest goal?",
            "How do you improve yourself?", "Do you learn new skills?",
            "Do you like challenges?", "What is one thing you improved recently?"
        ]
    },
    {
        day: 30, cefr: "B1", topic: "Presentations", questions: [
            "Have you given a presentation?", "Was it hard?",
            "How did you prepare?", "What was it about?",
            "How can you give a good presentation?", "Do you like public speaking?"
        ]
    },
    // ====== B1: Days 31–40 ======
    {
        day: 31, cefr: "B1", topic: "Debates & Opinions", questions: [
            "Do you like debating?", "What is one topic you debated?",
            "Do you listen to other opinions?", "Do you argue often?",
            "How can you respect opinions?", "What topic is difficult to debate?"
        ]
    },
    {
        day: 32, cefr: "B1", topic: "Persuasion", questions: [
            "Have you persuaded someone?", "What was it about?",
            "How do you convince others?", "Do you use facts or feelings?",
            "Do ads persuade you?", "What is the best way to persuade?"
        ]
    },
    {
        day: 33, cefr: "B1", topic: "Social Media", questions: [
            "What apps do you use?", "Do you spend much time on social media?",
            "What is good about it?", "What is bad about it?",
            "Do you follow news on social media?", "Should people limit screen time?"
        ]
    },
    {
        day: 34, cefr: "B1", topic: "News & Information", questions: [
            "Do you watch news?", "Where do you get news?",
            "Do you trust all news?", "Do you check fake news?",
            "What news interests you?", "What is the role of media?"
        ]
    },
    {
        day: 35, cefr: "B1", topic: "Inventions", questions: [
            "What invention changed your life?", "Do you admire inventors?",
            "What invention helps students?", "What invention is bad?",
            "Do you want to invent something?", "What is the greatest invention?"
        ]
    },
    {
        day: 36, cefr: "B1", topic: "Teamwork", questions: [
            "Do you work in teams?", "What is good about teamwork?",
            "What is bad about teamwork?", "Do you like leading or following?",
            "Do you help your team?", "What makes a team successful?"
        ]
    },
    {
        day: 37, cefr: "B1", topic: "Career Choices", questions: [
            "What job do you want?", "What job don’t you want?",
            "Do you want a safe job?", "Do you want a high salary?",
            "Do you want to work abroad?", "What is your dream career?"
        ]
    },
    {
        day: 38, cefr: "B1", topic: "Stress Management", questions: [
            "What makes you stressed?", "How do you relax?",
            "Do you exercise to reduce stress?", "Do you talk to friends?",
            "Do you meditate or pray?", "How can schools reduce stress?"
        ]
    },
    {
        day: 39, cefr: "B1", topic: "Global Issues", questions: [
            "What problems does the world face?", "Do you care about poverty?",
            "Do you care about pollution?", "Do you care about wars?",
            "What can young people do?", "What problem worries you most?"
        ]
    },
    {
        day: 40, cefr: "B1", topic: "Dreams & Ambitions", questions: [
            "What is your biggest dream?", "Do you want to travel the world?",
            "Do you want to study abroad?", "Do you want to start a business?",
            "Do you want to help others?", "Do you think dreams come true?"
        ]
    },

    // ====== B2: Days 41–60 ======
    {
        day: 41, cefr: "B2", topic: "Critical Thinking", questions: [
            "Do you question information?", "Do you think before deciding?",
            "Do you analyze facts?", "Do you look for evidence?",
            "How can people think critically?", "Why is critical thinking important?"
        ]
    },
    {
        day: 42, cefr: "B2", topic: "Controversial Topics", questions: [
            "What is a controversial topic?", "Have you discussed one?",
            "Why are they difficult?", "Should schools teach them?",
            "Do you avoid them?", "Why are they important?"
        ]
    },
    {
        day: 43, cefr: "B2", topic: "Ethics", questions: [
            "What is right and wrong?", "Do you follow rules?",
            "Do you tell the truth?", "Do you cheat?",
            "What is ethical at work?", "Why are ethics important?"
        ]
    },
    {
        day: 44, cefr: "B2", topic: "Technology Impact", questions: [
            "Does technology help jobs?", "Does it replace jobs?",
            "Does it change relationships?", "Does it make life faster?",
            "What are negatives of tech?", "What will tech change in 10 years?"
        ]
    },
    {
        day: 45, cefr: "B2", topic: "Culture & Identity", questions: [
            "Does culture shape identity?", "What is your cultural identity?",
            "Do you keep traditions?", "Do you adopt new habits?",
            "How do you show your culture?", "Can culture change identity?"
        ]
    },
    {
        day: 46, cefr: "B2", topic: "Globalization", questions: [
            "What is globalization?", "Do you see it in your life?",
            "Is it good or bad?", "Does it change culture?",
            "Does it help jobs?", "What future does it bring?"
        ]
    },
    {
        day: 47, cefr: "B2", topic: "Politics Basics", questions: [
            "Do you follow politics?", "Do you vote?",
            "Do you trust politicians?", "Should youth join politics?",
            "What is democracy?", "Why are laws important?"
        ]
    },
    {
        day: 48, cefr: "B2", topic: "Climate Action", questions: [
            "Do you care about climate change?", "What actions can help?",
            "Do you recycle?", "Do you reduce waste?",
            "Do you save energy?", "What action is most effective?"
        ]
    },
    {
        day: 49, cefr: "B2", topic: "Media Bias", questions: [
            "Do you trust media?", "Do you compare news?",
            "Do you notice bias?", "Why is bias harmful?",
            "Do you check sources?", "What media do you trust?"
        ]
    },
    {
        day: 50, cefr: "B2", topic: "Innovation", questions: [
            "What is innovation?", "Do you admire innovators?",
            "What innovation helps education?", "What innovation helps health?",
            "What innovation helps jobs?", "How can you innovate?"
        ]
    },
    {
        day: 51, cefr: "B2", topic: "Philosophy Basics", questions: [
            "What is happiness?", "What is truth?",
            "What is freedom?", "What is justice?",
            "Do you believe in destiny?", "Do you ask big questions?"
        ]
    },
    {
        day: 52, cefr: "B2", topic: "Art & Expression", questions: [
            "What art do you like?", "Do you draw or paint?",
            "Do you write stories?", "Do you play music?",
            "Do you think art is important?", "What art inspires you?"
        ]
    },
    {
        day: 53, cefr: "B2", topic: "Future of Work", questions: [
            "What jobs will disappear?", "What jobs will grow?",
            "Will robots replace workers?", "Will AI help people?",
            "Do you want remote work?", "What is the future of jobs?"
        ]
    },
    {
        day: 54, cefr: "B2", topic: "Society & Justice", questions: [
            "Is justice important?", "Do you trust courts?",
            "What is fairness?", "Do poor people get justice?",
            "What law should change?", "How can we make society fair?"
        ]
    },
    {
        day: 55, cefr: "B2", topic: "Cultural Exchange", questions: [
            "Have you met people from other cultures?", "What did you learn?",
            "Do you share your culture?", "Do you learn from others?",
            "Why is exchange good?", "What is the best cultural lesson?"
        ]
    },
    {
        day: 56, cefr: "B2", topic: "Science & Discovery", questions: [
            "What science do you like?", "Do you like space?",
            "Do you like medicine?", "Do you like technology?",
            "What discovery changed the world?", "What discovery will come soon?"
        ]
    },
    {
        day: 57, cefr: "B2", topic: "Human Rights", questions: [
            "What are human rights?", "Do you have them?",
            "Do all people have rights?", "Are rights respected?",
            "What right is most important?", "What rights need protection?"
        ]
    },
    {
        day: 58, cefr: "B2", topic: "Global Cooperation", questions: [
            "Do countries work together?", "Do you know the UN?",
            "Is cooperation easy?", "Why do countries fight?",
            "How can they cooperate?", "What cooperation is needed now?"
        ]
    },
    {
        day: 59, cefr: "B2", topic: "Future Technology", questions: [
            "Do you think of the future?", "What tech will appear?",
            "Will cars fly?", "Will AI think?",
            "What tech is dangerous?", "What tech excites you?"
        ]
    },
    {
        day: 60, cefr: "B2", topic: "Personal Legacy", questions: [
            "What will people remember about you?", "Do you want to leave a mark?",
            "Do you want to write a book?", "Do you want to build something?",
            "Do you want to inspire?", "What is your legacy?"
        ]
    }

];
export default PLAN;