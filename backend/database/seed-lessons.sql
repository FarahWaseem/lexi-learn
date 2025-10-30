-- ============================================
-- LexiLearn Seed Data - Complete Lessons Database
-- 60 Days of English Learning (A1 to B2)
-- ============================================

-- Clear existing data first (in correct order due to foreign key constraints)
DELETE FROM topic_questions;
DELETE FROM topic_words;
DELETE FROM daily_topics;

-- Reset sequences to start from 1
ALTER SEQUENCE daily_topics_id_seq RESTART WITH 1;
ALTER SEQUENCE topic_words_id_seq RESTART WITH 1;
ALTER SEQUENCE topic_questions_id_seq RESTART WITH 1;

-- ============================================
-- INSERT DAILY TOPICS (60 Lessons)
-- ============================================
INSERT INTO daily_topics (day_number, title_en, level, content, estimated_minutes) VALUES

-- A1 Level (Days 1-10) - Beginner
(1, 'Introductions & Greetings', 'A1', 'Master basic introductions, greetings, and personal information sharing. Learn essential phrases for meeting new people and building confidence in social interactions.', 10),
(2, 'Family & Relationships', 'A1', 'Explore family vocabulary, describe relationships, and talk about family members. Practice describing your family structure and relationships.', 10),
(3, 'Daily Routines & Time', 'A1', 'Learn to describe your daily activities, tell time, and discuss routines. Master time expressions and common daily activities vocabulary.', 10),
(4, 'Food & Dining', 'A1', 'Discover food vocabulary, restaurant phrases, and dining etiquette. Learn to order food, describe tastes, and discuss culinary preferences.', 10),
(5, 'Hobbies & Interests', 'A1', 'Express your interests, hobbies, and leisure activities. Learn to discuss what you enjoy doing in your free time.', 10),
(6, 'Weather & Seasons', 'A1', 'Describe weather conditions, seasonal changes, and their impact on daily life. Learn weather vocabulary and seasonal expressions.', 10),
(7, 'Travel & Transportation', 'A1', 'Master essential travel vocabulary, transportation modes, and basic travel situations. Learn to navigate and ask for directions.', 10),
(8, 'Education & School', 'A1', 'Discuss educational topics, school life, and learning experiences. Learn vocabulary related to education and academic life.', 10),
(9, 'Work & Career Basics', 'A1', 'Explore basic workplace vocabulary, job descriptions, and professional interactions. Learn to talk about work and career aspirations.', 10),
(10, 'Health & Wellbeing', 'A1', 'Discuss health, fitness, and wellbeing topics. Learn to describe how you feel and talk about healthy lifestyle choices.', 10),

-- A2 Level (Days 11-20) - Elementary
(11, 'Housing & Neighborhood', 'A2', 'Describe your living situation, neighborhood, and housing preferences. Learn to discuss different types of accommodation and community life.', 12),
(12, 'Directions & Navigation', 'A2', 'Master giving and following directions, using maps, and navigating public transportation. Learn to help others find their way around.', 12),
(13, 'Appointments & Scheduling', 'A2', 'Learn to make appointments, manage schedules, and handle time-related commitments. Practice professional scheduling language.', 12),
(14, 'Healthcare & Medical', 'A2', 'Discuss health issues, medical appointments, and pharmacy visits. Learn to describe symptoms and understand medical advice.', 12),
(15, 'Banking & Finance', 'A2', 'Master financial vocabulary, banking services, and money management basics. Learn to handle financial transactions and budgeting.', 12),
(16, 'Shopping & Consumerism', 'A2', 'Navigate shopping experiences, compare products, and handle customer service situations. Learn shopping vocabulary and consumer rights.', 12),
(17, 'Restaurants & Food Service', 'A2', 'Master restaurant interactions, food service vocabulary, and dining experiences. Learn to handle reservations, orders, and complaints.', 12),
(18, 'Customer Service & Complaints', 'A2', 'Learn to handle customer service situations, make complaints, and resolve issues professionally. Master service-related vocabulary.', 12),
(19, 'Events & Celebrations', 'A2', 'Discuss social events, celebrations, and special occasions. Learn to plan events and participate in social gatherings.', 12),
(20, 'Nature & Environment', 'A2', 'Explore environmental topics, outdoor activities, and nature-related vocabulary. Learn to discuss environmental issues and conservation.', 12),

-- B1 Level (Days 21-40) - Intermediate
(21, 'Sports & Fitness', 'B1', 'Discuss sports, fitness goals, and physical activities. Learn to describe exercise routines and fitness achievements.', 15),
(22, 'Entertainment & Media', 'B1', 'Talk about movies, TV shows, music, and entertainment preferences. Learn to give recommendations and discuss media content.', 15),
(23, 'Music & Arts', 'B1', 'Explore musical preferences, artistic expressions, and cultural events. Learn to discuss different art forms and cultural experiences.', 15),
(24, 'Reading & Literature', 'B1', 'Discuss books, reading habits, and literary preferences. Learn to give book recommendations and discuss literature.', 15),
(25, 'Environment & Sustainability', 'B1', 'Engage in environmental discussions, sustainability practices, and ecological awareness. Learn to discuss environmental challenges and solutions.', 15),
(26, 'Community & Volunteering', 'B1', 'Discuss community involvement, volunteer work, and social causes. Learn to talk about civic engagement and social responsibility.', 15),
(27, 'Time Management & Productivity', 'B1', 'Master productivity techniques, time management strategies, and organizational skills. Learn to discuss efficiency and goal achievement.', 15),
(28, 'Learning & Study Strategies', 'B1', 'Explore effective learning methods, study techniques, and educational approaches. Learn to discuss learning preferences and academic success.', 15),
(29, 'Travel Planning & Experiences', 'B1', 'Plan trips, discuss travel experiences, and handle travel-related situations. Learn to share travel stories and give travel advice.', 15),
(30, 'Cultural Awareness & Diversity', 'B1', 'Discuss cultural differences, diversity, and cross-cultural communication. Learn to navigate cultural interactions respectfully.', 15),
(31, 'Problem Solving & Decision Making', 'B1', 'Master problem-solving techniques, decision-making processes, and analytical thinking. Learn to discuss challenges and solutions.', 15),
(32, 'Communication & Conflict Resolution', 'B1', 'Develop communication skills, handle conflicts, and improve interpersonal relationships. Learn to navigate difficult conversations.', 15),
(33, 'Teamwork & Collaboration', 'B1', 'Discuss teamwork, collaboration, and group dynamics. Learn to work effectively in teams and manage group projects.', 15),
(34, 'Presentations & Public Speaking', 'B1', 'Master presentation skills, public speaking, and effective communication. Learn to deliver engaging presentations and speeches.', 15),
(35, 'Digital Communication & Etiquette', 'B1', 'Navigate digital communication, email etiquette, and online interactions. Learn professional digital communication skills.', 15),
(36, 'Career Development & Job Hunting', 'B1', 'Explore career planning, job searching, and professional development. Learn to discuss career goals and job market trends.', 15),
(37, 'Interview Skills & Professional Communication', 'B1', 'Master interview techniques, professional communication, and career advancement. Learn to present yourself professionally.', 15),
(38, 'Workplace Dynamics & Professional Relationships', 'B1', 'Navigate workplace relationships, professional dynamics, and career growth. Learn to handle workplace challenges effectively.', 15),
(39, 'Personal Finance & Money Management', 'B1', 'Discuss financial planning, budgeting, and money management strategies. Learn to make informed financial decisions.', 15),
(40, 'Digital Safety & Cybersecurity', 'B1', 'Master online safety, cybersecurity awareness, and digital privacy. Learn to protect yourself in the digital world.', 15),

-- B2 Level (Days 41-60) - Upper Intermediate
(41, 'Critical Thinking & Analysis', 'B2', 'Develop critical thinking skills, analytical reasoning, and logical argumentation. Learn to evaluate information and form reasoned opinions.', 18),
(42, 'Media Literacy & News Analysis', 'B2', 'Master media literacy, news analysis, and information evaluation. Learn to critically assess media content and sources.', 18),
(43, 'Debating & Argumentation', 'B2', 'Engage in debates, develop argumentation skills, and handle controversial topics. Learn to present and defend positions effectively.', 18),
(44, 'Technology & Ethics', 'B2', 'Discuss technological advancements, ethical implications, and digital ethics. Learn to navigate technology-related moral dilemmas.', 18),
(45, 'Globalization & International Relations', 'B2', 'Explore global issues, international relations, and cultural globalization. Learn to discuss global trends and their local impact.', 18),
(46, 'Sustainable Living & Environmental Action', 'B2', 'Engage in environmental activism, sustainable living practices, and ecological responsibility. Learn to advocate for environmental causes.', 18),
(47, 'Mental Health & Wellbeing', 'B2', 'Discuss mental health awareness, wellbeing strategies, and emotional intelligence. Learn to support mental health conversations.', 18),
(48, 'Creativity & Innovation', 'B2', 'Explore creative thinking, innovation processes, and artistic expression. Learn to foster creativity and innovative solutions.', 18),
(49, 'Leadership & Management', 'B2', 'Develop leadership skills, management techniques, and team leadership. Learn to lead effectively and inspire others.', 18),
(50, 'Lifelong Learning & Personal Development', 'B2', 'Master continuous learning, personal growth, and skill development. Learn to create effective learning strategies and goals.', 18),
(51, 'Networking & Professional Relationships', 'B2', 'Build professional networks, develop relationships, and advance careers. Learn to network effectively and maintain professional connections.', 18),
(52, 'Advanced Public Speaking & Persuasion', 'B2', 'Master advanced presentation skills, persuasive communication, and influential speaking. Learn to captivate and persuade audiences.', 18),
(53, 'Research & Information Literacy', 'B2', 'Develop research skills, information literacy, and academic writing. Learn to conduct thorough research and evaluate sources.', 18),
(54, 'Negotiation & Persuasion', 'B2', 'Master negotiation techniques, persuasive communication, and conflict resolution. Learn to achieve win-win outcomes in negotiations.', 18),
(55, 'Strategic Decision Making', 'B2', 'Develop strategic thinking, complex decision-making, and long-term planning. Learn to make informed strategic decisions.', 18),
(56, 'Innovation & Change Management', 'B2', 'Lead innovation initiatives, manage change, and drive organizational transformation. Learn to foster innovation and manage transitions.', 18),
(57, 'Design Thinking & User Experience', 'B2', 'Master design thinking, user experience principles, and creative problem-solving. Learn to design solutions with user needs in mind.', 18),
(58, 'Storytelling & Narrative Communication', 'B2', 'Develop storytelling skills, narrative communication, and engaging presentation techniques. Learn to craft compelling stories and messages.', 18),
(59, 'Goal Setting & Habit Formation', 'B2', 'Master goal-setting techniques, habit formation, and personal productivity. Learn to achieve long-term goals and build lasting habits.', 18),
(60, 'Reflection & Future Planning', 'B2', 'Engage in self-reflection, future planning, and personal growth assessment. Learn to evaluate progress and plan for continued development.', 18);

-- ============================================
-- INSERT TOPIC WORDS (6 words per lesson = 360 words total)
-- ============================================
INSERT INTO topic_words (topic_id, term, meaning, example) VALUES

-- Day 1: Introductions & Greetings
(1, 'greet', 'يحيي', 'I greet my neighbors every morning.'),
(1, 'introduce', 'يعرف', 'Let me introduce myself to you.'),
(1, 'pleasure', 'سرور', 'It is a pleasure to meet you.'),
(1, 'acquaintance', 'معارف', 'She is a new acquaintance of mine.'),
(1, 'handshake', 'مصافحة', 'A firm handshake shows confidence.'),
(1, 'welcome', 'مرحب', 'Welcome to our English class!'),

-- Day 2: Family & Relationships
(2, 'siblings', 'أشقاء', 'I have two siblings in my family.'),
(2, 'generation', 'جيل', 'My grandparents are from a different generation.'),
(2, 'ancestry', 'أصل', 'I am proud of my ancestry.'),
(2, 'nephew', 'ابن أخ', 'My nephew is learning to walk.'),
(2, 'cousin', 'ابن عم', 'My cousin lives in another city.'),
(2, 'in-law', 'صهر', 'My brother-in-law is very kind.'),

-- Day 3: Daily Routines & Time
(3, 'schedule', 'جدول', 'I follow a strict daily schedule.'),
(3, 'punctual', 'منضبط', 'Being punctual is very important.'),
(3, 'postpone', 'يؤجل', 'I had to postpone my meeting.'),
(3, 'deadline', 'موعد نهائي', 'The deadline is next Friday.'),
(3, 'priority', 'أولوية', 'Family is my top priority.'),
(3, 'efficient', 'فعال', 'I try to be more efficient.'),

-- Day 4: Food & Dining
(4, 'appetizer', 'مقبلات', 'We ordered an appetizer to share.'),
(4, 'beverage', 'مشروب', 'What beverage would you like?'),
(4, 'delicious', 'لذيذ', 'This pasta is absolutely delicious.'),
(4, 'ingredients', 'مكونات', 'Fresh ingredients make better meals.'),
(4, 'recipe', 'وصفة', 'Can you share this recipe?'),
(4, 'dessert', 'حلوى', 'I always save room for dessert.'),

-- Day 5: Hobbies & Interests
(5, 'passion', 'شغف', 'Photography is my greatest passion.'),
(5, 'leisure', 'وقت فراغ', 'I enjoy leisure activities on weekends.'),
(5, 'creative', 'خلاق', 'She is very creative with crafts.'),
(5, 'collect', 'يجمع', 'I collect vintage postcards.'),
(5, 'skill', 'مهارة', 'Learning a new skill takes time.'),
(5, 'enthusiast', 'متحمس', 'He is a music enthusiast.'),

-- Day 6: Weather & Seasons
(6, 'forecast', 'توقعات الطقس', 'Check the weather forecast before going out.'),
(6, 'temperature', 'درجة الحرارة', 'The temperature dropped significantly today.'),
(6, 'humidity', 'رطوبة', 'The humidity makes it feel hotter.'),
(6, 'precipitation', 'هطول', 'We expect precipitation this afternoon.'),
(6, 'breeze', 'نسيم', 'A gentle breeze cooled us down.'),
(6, 'climate', 'مناخ', 'The climate here is very mild.'),

-- Day 7: Travel & Transportation
(7, 'itinerary', 'خطة السفر', 'Here is my travel itinerary.'),
(7, 'destination', 'وجهة', 'Paris is my dream destination.'),
(7, 'journey', 'رحلة', 'The journey took eight hours.'),
(7, 'passport', 'جواز سفر', 'Don''t forget your passport.'),
(7, 'luggage', 'أمتعة', 'My luggage is very heavy.'),
(7, 'accommodation', 'إقامة', 'We found great accommodation downtown.'),

-- Day 8: Education & School
(8, 'curriculum', 'منهج', 'The curriculum includes many subjects.'),
(8, 'assignment', 'واجب', 'I have a difficult assignment due.'),
(8, 'scholarship', 'منحة', 'She received a full scholarship.'),
(8, 'graduation', 'تخرج', 'Graduation day was very emotional.'),
(8, 'knowledge', 'معرفة', 'Knowledge is the key to success.'),
(8, 'academic', 'أكاديمي', 'He has strong academic performance.'),

-- Day 9: Work & Career Basics
(9, 'profession', 'مهنة', 'Teaching is a noble profession.'),
(9, 'colleague', 'زميل عمل', 'My colleague helped me with the project.'),
(9, 'promotion', 'ترقية', 'I hope to get a promotion soon.'),
(9, 'resume', 'سيرة ذاتية', 'Update your resume regularly.'),
(9, 'interview', 'مقابلة', 'The job interview went very well.'),
(9, 'qualification', 'مؤهل', 'What qualifications do you have?'),

-- Day 10: Health & Wellbeing
(10, 'nutrition', 'تغذية', 'Good nutrition is essential for health.'),
(10, 'exercise', 'تمرين', 'Regular exercise keeps you healthy.'),
(10, 'wellness', 'رفاهية', 'Wellness includes mental and physical health.'),
(10, 'meditation', 'تأمل', 'Meditation helps reduce stress.'),
(10, 'therapy', 'علاج', 'Therapy can be very helpful.'),
(10, 'recovery', 'شفاء', 'The recovery process takes time.'),

-- Day 11: Housing & Neighborhood
(11, 'apartment', 'شقة', 'I live in a small apartment.'),
(11, 'landlord', 'مالك العقار', 'The landlord is very helpful.'),
(11, 'neighborhood', 'حي', 'This is a quiet neighborhood.'),
(11, 'furniture', 'أثاث', 'I need to buy new furniture.'),
(11, 'utilities', 'مرافق', 'Utilities are included in the rent.'),
(11, 'lease', 'عقد إيجار', 'The lease expires next month.'),

-- Day 12: Directions & Navigation
(12, 'intersection', 'تقاطع', 'Turn left at the intersection.'),
(12, 'landmark', 'معلم', 'The church is a famous landmark.'),
(12, 'route', 'طريق', 'What is the best route?'),
(12, 'distance', 'مسافة', 'The distance is about 5 kilometers.'),
(12, 'navigate', 'يتنقل', 'I can navigate using GPS.'),
(12, 'destination', 'وجهة', 'We reached our destination safely.'),

-- Day 13: Appointments & Scheduling
(13, 'appointment', 'موعد', 'I have a doctor appointment.'),
(13, 'reschedule', 'إعادة جدولة', 'Can we reschedule the meeting?'),
(13, 'availability', 'توفر', 'What is your availability?'),
(13, 'confirmation', 'تأكيد', 'Please send a confirmation email.'),
(13, 'cancellation', 'إلغاء', 'There is no cancellation fee.'),
(13, 'postpone', 'يؤجل', 'I need to postpone our meeting.'),

-- Day 14: Healthcare & Medical
(14, 'symptom', 'عرض', 'What are your symptoms?'),
(14, 'prescription', 'وصفة طبية', 'I need a prescription for medicine.'),
(14, 'diagnosis', 'تشخيص', 'The diagnosis was very clear.'),
(14, 'treatment', 'علاج', 'The treatment is working well.'),
(14, 'recovery', 'شفاء', 'I wish you a speedy recovery.'),
(14, 'pharmacy', 'صيدلية', 'The pharmacy is open 24 hours.'),

-- Day 15: Banking & Finance
(15, 'account', 'حساب', 'I opened a new bank account.'),
(15, 'deposit', 'إيداع', 'I need to deposit money.'),
(15, 'withdraw', 'سحب', 'Can I withdraw cash here?'),
(15, 'balance', 'رصيد', 'What is my account balance?'),
(15, 'interest', 'فائدة', 'The interest rate is very low.'),
(15, 'budget', 'ميزانية', 'I need to create a budget.'),

-- Day 16: Shopping & Consumerism
(16, 'purchase', 'شراء', 'This was a good purchase.'),
(16, 'discount', 'خصم', 'This item has a discount.'),
(16, 'refund', 'استرداد', 'I would like a refund please.'),
(16, 'warranty', 'ضمان', 'This product has a warranty.'),
(16, 'receipt', 'إيصال', 'Keep your receipt for records.'),
(16, 'exchange', 'تبديل', 'Can I exchange this item?'),

-- Day 17: Restaurants & Food Service
(17, 'reservation', 'حجز', 'I made a dinner reservation.'),
(17, 'waiter', 'نادل', 'The waiter is very polite.'),
(17, 'menu', 'قائمة الطعام', 'Can I see the menu?'),
(17, 'bill', 'فاتورة', 'Can I have the bill please?'),
(17, 'tip', 'بقشيش', 'Leave a tip for good service.'),
(17, 'special', 'طبق خاص', 'What is today''s special?'),

-- Day 18: Customer Service & Complaints
(18, 'complaint', 'شكوى', 'I have a complaint about service.'),
(18, 'resolution', 'حل', 'We found a good resolution.'),
(18, 'satisfaction', 'رضا', 'Customer satisfaction is our priority.'),
(18, 'escalate', 'تصعيد', 'I need to escalate this issue.'),
(18, 'feedback', 'تغذية راجعة', 'Please provide your feedback.'),
(18, 'representative', 'ممثل', 'I spoke to a customer service representative.'),

-- Day 19: Events & Celebrations
(19, 'celebration', 'احتفال', 'The celebration was wonderful.'),
(19, 'anniversary', 'ذكرى', 'Today is our wedding anniversary.'),
(19, 'ceremony', 'مراسم', 'The graduation ceremony was beautiful.'),
(19, 'festival', 'مهرجان', 'The music festival was amazing.'),
(19, 'tradition', 'تقليد', 'This is a family tradition.'),
(19, 'occasion', 'مناسبة', 'What a special occasion!'),

-- Day 20: Nature & Environment
(20, 'landscape', 'منظر طبيعي', 'The landscape is breathtaking.'),
(20, 'wildlife', 'حياة برية', 'We saw wildlife in the forest.'),
(20, 'conservation', 'حفظ', 'Conservation is very important.'),
(20, 'ecosystem', 'نظام بيئي', 'The ecosystem is very fragile.'),
(20, 'sustainable', 'مستدام', 'We need sustainable solutions.'),
(20, 'pollution', 'تلوث', 'Air pollution is a serious problem.'),

-- Day 21: Sports & Fitness
(21, 'athlete', 'رياضي', 'She is a professional athlete.'),
(21, 'training', 'تدريب', 'Training requires dedication and discipline.'),
(21, 'competition', 'منافسة', 'The competition was very intense.'),
(21, 'endurance', 'قدرة على التحمل', 'Running builds endurance.'),
(21, 'flexibility', 'مرونة', 'Yoga improves flexibility.'),
(21, 'motivation', 'تحفيز', 'Motivation is key to success.'),

-- Day 22: Entertainment & Media
(22, 'entertainment', 'ترفيه', 'Movies are great entertainment.'),
(22, 'audience', 'جمهور', 'The audience loved the show.'),
(22, 'performance', 'أداء', 'The performance was outstanding.'),
(22, 'celebrity', 'مشهور', 'She is a famous celebrity.'),
(22, 'streaming', 'بث', 'I prefer streaming over cable.'),
(22, 'episode', 'حلقة', 'This episode was very exciting.'),

-- Day 23: Music & Arts
(23, 'melody', 'لحن', 'I love this melody.'),
(23, 'rhythm', 'إيقاع', 'This song has a great rhythm.'),
(23, 'harmony', 'تناغم', 'The harmony is beautiful.'),
(23, 'instrument', 'آلة موسيقية', 'I play several instruments.'),
(23, 'concert', 'حفلة موسيقية', 'The concert was amazing.'),
(23, 'artistic', 'فني', 'She has great artistic talent.'),

-- Day 24: Reading & Literature
(24, 'literature', 'أدب', 'I love English literature.'),
(24, 'author', 'مؤلف', 'The author is very famous.'),
(24, 'novel', 'رواية', 'This novel is very long.'),
(24, 'chapter', 'فصل', 'I finished chapter three.'),
(24, 'plot', 'حبكة', 'The plot is very interesting.'),
(24, 'character', 'شخصية', 'The main character is complex.'),

-- Day 25: Environment & Sustainability
(25, 'sustainability', 'استدامة', 'Sustainability is crucial for our future.'),
(25, 'renewable', 'متجدد', 'Solar energy is renewable.'),
(25, 'carbon', 'كربون', 'We need to reduce carbon emissions.'),
(25, 'recycle', 'إعادة تدوير', 'We should recycle more often.'),
(25, 'conservation', 'حفظ', 'Wildlife conservation is important.'),
(25, 'green', 'أخضر', 'Green energy is the future.'),

-- Day 26: Community & Volunteering
(26, 'volunteer', 'متطوع', 'I volunteer at the local hospital.'),
(26, 'community', 'مجتمع', 'Community service is rewarding.'),
(26, 'charity', 'جمعية خيرية', 'I donate to several charities.'),
(26, 'donation', 'تبرع', 'Please make a donation.'),
(26, 'outreach', 'تواصل', 'Community outreach is important.'),
(26, 'impact', 'تأثير', 'We want to make a positive impact.'),

-- Day 27: Time Management & Productivity
(27, 'productivity', 'إنتاجية', 'Productivity has improved significantly.'),
(27, 'efficiency', 'كفاءة', 'Efficiency is key to success.'),
(27, 'deadline', 'موعد نهائي', 'The deadline is approaching.'),
(27, 'priority', 'أولوية', 'Set your priorities clearly.'),
(27, 'schedule', 'جدول', 'I follow a strict schedule.'),
(27, 'focus', 'تركيز', 'Focus on one task at a time.'),

-- Day 28: Learning & Study Strategies
(28, 'strategy', 'استراتيجية', 'What is your study strategy?'),
(28, 'technique', 'تقنية', 'This technique works very well.'),
(28, 'method', 'طريقة', 'The method is very effective.'),
(28, 'approach', 'نهج', 'I like this learning approach.'),
(28, 'retention', 'احتفاظ', 'Memory retention improves with practice.'),
(28, 'comprehension', 'فهم', 'Reading comprehension is important.'),

-- Day 29: Travel Planning & Experiences
(29, 'adventure', 'مغامرة', 'Travel is always an adventure.'),
(29, 'explore', 'يستكشف', 'I love to explore new places.'),
(29, 'culture', 'ثقافة', 'I enjoy learning about different cultures.'),
(29, 'experience', 'تجربة', 'This was an amazing experience.'),
(29, 'journey', 'رحلة', 'The journey was unforgettable.'),
(29, 'discover', 'يكتشف', 'I discovered many interesting places.'),

-- Day 30: Cultural Awareness & Diversity
(30, 'diversity', 'تنوع', 'Diversity makes our world richer.'),
(30, 'culture', 'ثقافة', 'I respect different cultures.'),
(30, 'tradition', 'تقليد', 'This is an old tradition.'),
(30, 'custom', 'عرف', 'This is a local custom.'),
(30, 'heritage', 'تراث', 'I am proud of my heritage.'),
(30, 'identity', 'هوية', 'Cultural identity is important.'),

-- Day 31: Problem Solving & Decision Making
(31, 'solution', 'حل', 'We found a good solution.'),
(31, 'challenge', 'تحدي', 'This is a difficult challenge.'),
(31, 'strategy', 'استراتيجية', 'We need a new strategy.'),
(31, 'analysis', 'تحليل', 'The analysis was thorough.'),
(31, 'evaluation', 'تقييم', 'We need to do an evaluation.'),
(31, 'implementation', 'تنفيذ', 'Implementation starts next week.'),

-- Day 32: Communication & Conflict Resolution
(32, 'conflict', 'صراع', 'We resolved the conflict peacefully.'),
(32, 'resolution', 'حل', 'The resolution was satisfactory.'),
(32, 'negotiation', 'تفاوض', 'Negotiation skills are important.'),
(32, 'compromise', 'تنازل', 'We reached a good compromise.'),
(32, 'mediation', 'وساطة', 'Mediation helped resolve the issue.'),
(32, 'understanding', 'فهم', 'Mutual understanding is essential.'),

-- Day 33: Teamwork & Collaboration
(33, 'collaboration', 'تعاون', 'Collaboration leads to better results.'),
(33, 'teamwork', 'عمل جماعي', 'Teamwork is essential for success.'),
(33, 'cooperation', 'تعاون', 'Cooperation makes everything easier.'),
(33, 'coordination', 'تنسيق', 'Good coordination is important.'),
(33, 'partnership', 'شراكة', 'We formed a strong partnership.'),
(33, 'synergy', 'تآزر', 'The team has great synergy.'),

-- Day 34: Presentations & Public Speaking
(34, 'presentation', 'عرض', 'The presentation was very clear.'),
(34, 'audience', 'جمهور', 'The audience was engaged.'),
(34, 'delivery', 'تقديم', 'Your delivery was excellent.'),
(34, 'confidence', 'ثقة', 'Confidence is key to success.'),
(34, 'persuasion', 'إقناع', 'Persuasion skills are valuable.'),
(34, 'engagement', 'تفاعل', 'Audience engagement was high.'),

-- Day 35: Digital Communication & Etiquette
(35, 'etiquette', 'آداب', 'Digital etiquette is important.'),
(35, 'professional', 'مهني', 'Keep communication professional.'),
(35, 'appropriate', 'مناسب', 'Use appropriate language.'),
(35, 'respectful', 'محترم', 'Always be respectful online.'),
(35, 'courteous', 'مهذب', 'Be courteous in all communications.'),
(35, 'boundary', 'حدود', 'Respect personal boundaries.'),

-- Day 36: Career Development & Job Hunting
(36, 'career', 'مهنة', 'Career development is important.'),
(36, 'opportunity', 'فرصة', 'This is a great opportunity.'),
(36, 'advancement', 'تقدم', 'I hope for career advancement.'),
(36, 'networking', 'شبكة علاقات', 'Networking helps find opportunities.'),
(36, 'mentor', 'مرشد', 'I have a great mentor.'),
(36, 'growth', 'نمو', 'Personal growth is continuous.'),

-- Day 37: Interview Skills & Professional Communication
(37, 'interview', 'مقابلة', 'The interview went very well.'),
(37, 'competency', 'كفاءة', 'Show your competencies clearly.'),
(37, 'experience', 'خبرة', 'Highlight your relevant experience.'),
(37, 'achievement', 'إنجاز', 'Discuss your key achievements.'),
(37, 'potential', 'إمكانات', 'Show your potential for growth.'),
(37, 'impression', 'انطباع', 'Make a good first impression.'),

-- Day 38: Workplace Dynamics & Professional Relationships
(38, 'workplace', 'مكان العمل', 'The workplace culture is positive.'),
(38, 'dynamics', 'ديناميكيات', 'Workplace dynamics are complex.'),
(38, 'relationship', 'علاقة', 'Professional relationships matter.'),
(38, 'communication', 'تواصل', 'Clear communication is essential.'),
(38, 'respect', 'احترام', 'Mutual respect is important.'),
(38, 'trust', 'ثقة', 'Trust builds strong teams.'),

-- Day 39: Personal Finance & Money Management
(39, 'finance', 'مالية', 'Personal finance is important.'),
(39, 'investment', 'استثمار', 'Smart investment grows wealth.'),
(39, 'savings', 'مدخرات', 'Build your savings account.'),
(39, 'expense', 'مصروف', 'Track your expenses carefully.'),
(39, 'budget', 'ميزانية', 'Create a realistic budget.'),
(39, 'financial', 'مالي', 'Financial planning is crucial.'),

-- Day 40: Digital Safety & Cybersecurity
(40, 'security', 'أمان', 'Digital security is important.'),
(40, 'privacy', 'خصوصية', 'Protect your privacy online.'),
(40, 'password', 'كلمة مرور', 'Use strong passwords.'),
(40, 'encryption', 'تشفير', 'Encryption protects your data.'),
(40, 'vulnerability', 'نقطة ضعف', 'Fix security vulnerabilities.'),
(40, 'protection', 'حماية', 'Use protection software.'),

-- Day 41: Critical Thinking & Analysis
(41, 'analysis', 'تحليل', 'Critical analysis is important.'),
(41, 'evaluation', 'تقييم', 'Evaluate information carefully.'),
(41, 'reasoning', 'استدلال', 'Logical reasoning is essential.'),
(41, 'evidence', 'دليل', 'Look for solid evidence.'),
(41, 'conclusion', 'استنتاج', 'Draw logical conclusions.'),
(41, 'perspective', 'منظور', 'Consider different perspectives.'),

-- Day 42: Media Literacy & News Analysis
(42, 'literacy', 'معرفة', 'Media literacy is crucial.'),
(42, 'credibility', 'مصداقية', 'Check source credibility.'),
(42, 'bias', 'تحيز', 'Recognize media bias.'),
(42, 'verification', 'تحقق', 'Verify information before sharing.'),
(42, 'source', 'مصدر', 'Use reliable sources.'),
(42, 'fact', 'حقيقة', 'Distinguish facts from opinions.'),

-- Day 43: Debating & Argumentation
(43, 'debate', 'مناظرة', 'The debate was intense.'),
(43, 'argument', 'حجة', 'Present a strong argument.'),
(43, 'evidence', 'دليل', 'Support with evidence.'),
(43, 'counterpoint', 'نقطة مضادة', 'Consider counterpoints.'),
(43, 'persuasion', 'إقناع', 'Use persuasion techniques.'),
(43, 'consensus', 'إجماع', 'Try to reach consensus.'),

-- Day 44: Technology & Ethics
(44, 'ethics', 'أخلاقيات', 'Technology ethics are important.'),
(44, 'privacy', 'خصوصية', 'Protect user privacy.'),
(44, 'responsibility', 'مسؤولية', 'Take responsibility for technology use.'),
(44, 'impact', 'تأثير', 'Consider technology''s impact.'),
(44, 'regulation', 'تنظيم', 'Technology needs regulation.'),
(44, 'accountability', 'مساءلة', 'Ensure accountability in tech.'),

-- Day 45: Globalization & International Relations
(45, 'globalization', 'عولمة', 'Globalization connects the world.'),
(45, 'international', 'دولي', 'International cooperation is important.'),
(45, 'trade', 'تجارة', 'Global trade benefits everyone.'),
(45, 'culture', 'ثقافة', 'Cultural exchange enriches societies.'),
(45, 'economy', 'اقتصاد', 'The global economy is interconnected.'),
(45, 'cooperation', 'تعاون', 'International cooperation is essential.'),

-- Day 46: Sustainable Living & Environmental Action
(46, 'sustainable', 'مستدام', 'Sustainable living is important.'),
(46, 'environmental', 'بيئي', 'Environmental protection is crucial.'),
(46, 'conservation', 'حفظ', 'Resource conservation matters.'),
(46, 'renewable', 'متجدد', 'Use renewable energy sources.'),
(46, 'waste', 'نفايات', 'Reduce waste production.'),
(46, 'footprint', 'بصمة', 'Reduce your carbon footprint.'),

-- Day 47: Mental Health & Wellbeing
(47, 'wellbeing', 'رفاهية', 'Mental wellbeing is important.'),
(47, 'stress', 'توتر', 'Manage stress effectively.'),
(47, 'anxiety', 'قلق', 'Anxiety affects many people.'),
(47, 'therapy', 'علاج', 'Therapy can be helpful.'),
(47, 'support', 'دعم', 'Seek support when needed.'),
(47, 'resilience', 'مرونة', 'Build emotional resilience.'),

-- Day 48: Creativity & Innovation
(48, 'creativity', 'إبداع', 'Creativity drives innovation.'),
(48, 'innovation', 'ابتكار', 'Innovation solves problems.'),
(48, 'imagination', 'خيال', 'Use your imagination freely.'),
(48, 'original', 'أصلي', 'Be original in your ideas.'),
(48, 'inspiration', 'إلهام', 'Find inspiration everywhere.'),
(48, 'breakthrough', 'اختراق', 'This is a major breakthrough.'),

-- Day 49: Leadership & Management
(49, 'leadership', 'قيادة', 'Leadership requires vision.'),
(49, 'management', 'إدارة', 'Good management is essential.'),
(49, 'vision', 'رؤية', 'Share your vision clearly.'),
(49, 'motivation', 'تحفيز', 'Motivate your team.'),
(49, 'delegation', 'تفويض', 'Learn effective delegation.'),
(49, 'inspiration', 'إلهام', 'Inspire others to succeed.'),

-- Day 50: Lifelong Learning & Personal Development
(50, 'learning', 'تعلم', 'Lifelong learning is important.'),
(50, 'development', 'تطوير', 'Personal development never stops.'),
(50, 'growth', 'نمو', 'Focus on continuous growth.'),
(50, 'skill', 'مهارة', 'Develop new skills regularly.'),
(50, 'knowledge', 'معرفة', 'Knowledge is power.'),
(50, 'improvement', 'تحسين', 'Strive for constant improvement.'),

-- Day 51: Networking & Professional Relationships
(51, 'networking', 'شبكة علاقات', 'Networking opens doors.'),
(51, 'connection', 'اتصال', 'Build meaningful connections.'),
(51, 'relationship', 'علاقة', 'Nurture professional relationships.'),
(51, 'opportunity', 'فرصة', 'Networking creates opportunities.'),
(51, 'contact', 'جهة اتصال', 'Maintain your contacts.'),
(51, 'collaboration', 'تعاون', 'Collaboration builds success.'),

-- Day 52: Advanced Public Speaking & Persuasion
(52, 'speaking', 'تحدث', 'Public speaking is an art.'),
(52, 'persuasion', 'إقناع', 'Master persuasion techniques.'),
(52, 'influence', 'تأثير', 'Use influence wisely.'),
(52, 'charisma', 'كاريزما', 'Charisma attracts audiences.'),
(52, 'eloquence', 'بلاغة', 'Eloquence moves people.'),
(52, 'impact', 'تأثير', 'Make a lasting impact.'),

-- Day 53: Research & Information Literacy
(53, 'research', 'بحث', 'Thorough research is important.'),
(53, 'investigation', 'تحقيق', 'Investigation reveals truth.'),
(53, 'methodology', 'منهجية', 'Use proper methodology.'),
(53, 'citation', 'اقتباس', 'Include proper citations.'),
(53, 'reference', 'مرجع', 'Use reliable references.'),
(53, 'accuracy', 'دقة', 'Accuracy is essential.'),

-- Day 54: Negotiation & Persuasion
(54, 'negotiation', 'تفاوض', 'Negotiation is an art.'),
(54, 'bargaining', 'مساومة', 'Bargaining requires skill.'),
(54, 'compromise', 'تنازل', 'Find good compromises.'),
(54, 'agreement', 'اتفاق', 'Reach fair agreements.'),
(54, 'leverage', 'نفوذ', 'Use leverage wisely.'),
(54, 'outcome', 'نتيجة', 'Negotiate for good outcomes.'),

-- Day 55: Strategic Decision Making
(55, 'strategy', 'استراتيجية', 'Strategy guides decisions.'),
(55, 'decision', 'قرار', 'Make informed decisions.'),
(55, 'planning', 'تخطيط', 'Strategic planning is crucial.'),
(55, 'analysis', 'تحليل', 'Analyze before deciding.'),
(55, 'risk', 'مخاطرة', 'Assess risks carefully.'),
(55, 'outcome', 'نتيجة', 'Consider all outcomes.'),

-- Day 56: Innovation & Change Management
(56, 'innovation', 'ابتكار', 'Innovation drives progress.'),
(56, 'change', 'تغيير', 'Change is inevitable.'),
(56, 'transformation', 'تحول', 'Transformation requires vision.'),
(56, 'adaptation', 'تكيف', 'Adaptation is key.'),
(56, 'evolution', 'تطور', 'Evolution is continuous.'),
(56, 'revolution', 'ثورة', 'Revolution changes everything.'),

-- Day 57: Design Thinking & User Experience
(57, 'design', 'تصميم', 'Good design solves problems.'),
(57, 'user', 'مستخدم', 'Focus on user needs.'),
(57, 'experience', 'تجربة', 'User experience matters.'),
(57, 'interface', 'واجهة', 'Design intuitive interfaces.'),
(57, 'usability', 'قابلية الاستخدام', 'Usability is crucial.'),
(57, 'accessibility', 'إمكانية الوصول', 'Ensure accessibility for all.'),

-- Day 58: Storytelling & Narrative Communication
(58, 'storytelling', 'سرد القصص', 'Storytelling is powerful.'),
(58, 'narrative', 'سرد', 'Create compelling narratives.'),
(58, 'character', 'شخصية', 'Develop strong characters.'),
(58, 'plot', 'حبكة', 'Build engaging plots.'),
(58, 'theme', 'موضوع', 'Explore meaningful themes.'),
(58, 'audience', 'جمهور', 'Know your audience.'),

-- Day 59: Goal Setting & Personal Development
(59, 'goal', 'هدف', 'Set clear goals.'),
(59, 'plan', 'خطة', 'Make detailed plans.'),
(59, 'progress', 'تقدم', 'Track your progress.'),
(59, 'achievement', 'إنجاز', 'Celebrate achievements.'),
(59, 'motivation', 'تحفيز', 'Stay motivated.'),
(59, 'discipline', 'انضباط', 'Build discipline.'),

-- Day 60: Future Planning & Career Development
(60, 'future', 'مستقبل', 'Plan for the future.'),
(60, 'career', 'مهنة', 'Build your career.'),
(60, 'opportunity', 'فرصة', 'Seize opportunities.'),
(60, 'network', 'شبكة', 'Build your network.'),
(60, 'skill', 'مهارة', 'Develop new skills.'),
(60, 'success', 'نجاح', 'Define your success.');

-- Insert questions for each lesson (6 questions per lesson = 360 questions total)
INSERT INTO topic_questions (topic_id, question_idx, prompt_en, answer_type) VALUES
-- Day 1: Introductions
(1, 1, 'What is your name and how do you introduce yourself?', 'voice'),
(1, 2, 'Where are you from and what do you like about your hometown?', 'voice'),
(1, 3, 'What do you do for work or study?', 'voice'),
(1, 4, 'What are your main hobbies and interests?', 'voice'),
(1, 5, 'How would you describe your personality in three words?', 'voice'),
(1, 6, 'What is something unique about you that others might find interesting?', 'voice'),

-- Day 2: Family
(2, 1, 'Tell me about your family members and their relationships.', 'voice'),
(2, 2, 'What family traditions do you have?', 'voice'),
(2, 3, 'Who in your family are you closest to and why?', 'voice'),
(2, 4, 'Describe a memorable family gathering or celebration.', 'voice'),
(2, 5, 'What values did your family teach you?', 'voice'),
(2, 6, 'How has your family influenced who you are today?', 'voice'),

-- Day 3: Daily Routines
(3, 1, 'Describe your typical morning routine.', 'voice'),
(3, 2, 'What time do you wake up and go to bed?', 'voice'),
(3, 3, 'What do you do during your lunch break?', 'voice'),
(3, 4, 'How do you relax after a long day?', 'voice'),
(3, 5, 'What is your favorite part of the day and why?', 'voice'),
(3, 6, 'How do you prepare for the next day?', 'voice'),

-- Day 4: Food & Drinks
(4, 1, 'What is your favorite type of cuisine and why?', 'voice'),
(4, 2, 'Describe your ideal breakfast, lunch, and dinner.', 'voice'),
(4, 3, 'Do you prefer cooking at home or eating out?', 'voice'),
(4, 4, 'What is a traditional dish from your country?', 'voice'),
(4, 5, 'Tell me about a memorable dining experience.', 'voice'),
(4, 6, 'What food would you like to try from another culture?', 'voice'),

-- Day 5: Hobbies
(5, 1, 'What are your main hobbies and how often do you do them?', 'voice'),
(5, 2, 'How did you get interested in your favorite hobby?', 'voice'),
(5, 3, 'What hobby would you like to learn and why?', 'voice'),
(5, 4, 'Do you prefer indoor or outdoor activities?', 'voice'),
(5, 5, 'How do your hobbies help you relax or stay active?', 'voice'),
(5, 6, 'Have you ever turned a hobby into something more serious?', 'voice'),

-- Day 6: Weather
(6, 1, 'What is your favorite type of weather and why?', 'voice'),
(6, 2, 'How does weather affect your mood and activities?', 'voice'),
(6, 3, 'Describe the weather in your country during different seasons.', 'voice'),
(6, 4, 'What activities do you enjoy in different weather conditions?', 'voice'),
(6, 5, 'Have you experienced extreme weather? Tell me about it.', 'voice'),
(6, 6, 'How do you prepare for different weather conditions?', 'voice'),

-- Day 7: Travel Basics
(7, 1, 'What is your favorite way to travel and why?', 'voice'),
(7, 2, 'Describe your most memorable trip.', 'voice'),
(7, 3, 'What country or city would you like to visit?', 'voice'),
(7, 4, 'How do you plan your trips?', 'voice'),
(7, 5, 'What is essential to pack when traveling?', 'voice'),
(7, 6, 'Tell me about a travel experience that taught you something.', 'voice'),

-- Day 8: School Life
(8, 1, 'What was your favorite subject in school and why?', 'voice'),
(8, 2, 'Describe your ideal learning environment.', 'voice'),
(8, 3, 'What study methods work best for you?', 'voice'),
(8, 4, 'Tell me about a teacher who influenced you.', 'voice'),
(8, 5, 'What skills did you learn in school that you still use?', 'voice'),
(8, 6, 'How do you stay motivated when studying difficult subjects?', 'voice'),

-- Day 9: Work Basics
(9, 1, 'What do you do for work and what do you enjoy about it?', 'voice'),
(9, 2, 'Describe your ideal work environment.', 'voice'),
(9, 3, 'What skills are most important in your job?', 'voice'),
(9, 4, 'How do you handle work stress and deadlines?', 'voice'),
(9, 5, 'What career goals do you have?', 'voice'),
(9, 6, 'Tell me about a challenging project you worked on.', 'voice'),

-- Day 10: Health & Wellbeing
(10, 1, 'What do you do to stay healthy?', 'voice'),
(10, 2, 'How do you manage stress in your daily life?', 'voice'),
(10, 3, 'What is your exercise routine?', 'voice'),
(10, 4, 'How important is sleep to you?', 'voice'),
(10, 5, 'What healthy habits would you like to develop?', 'voice'),
(10, 6, 'How do you maintain work-life balance?', 'voice'),

-- Day 11: Housing & Neighborhood
(11, 1, 'Describe your current home and what you like about it.', 'voice'),
(11, 2, 'What makes a neighborhood feel like home to you?', 'voice'),
(11, 3, 'If you could live anywhere, where would it be?', 'voice'),
(11, 4, 'What amenities are important to you in a neighborhood?', 'voice'),
(11, 5, 'Tell me about your ideal home.', 'voice'),
(11, 6, 'How do you make a new place feel like home?', 'voice'),

-- Day 12: Directions & Transportation
(12, 1, 'How do you usually get around in your city?', 'voice'),
(12, 2, 'Describe the public transportation system in your area.', 'voice'),
(12, 3, 'What is the most convenient way to travel long distances?', 'voice'),
(12, 4, 'Have you ever gotten lost? How did you find your way?', 'voice'),
(12, 5, 'What transportation would you like to see improved?', 'voice'),
(12, 6, 'How do you navigate in a new city?', 'voice'),

-- Day 13: Appointments & Scheduling
(13, 1, 'How do you organize your daily schedule?', 'voice'),
(13, 2, 'What tools do you use to manage your time?', 'voice'),
(13, 3, 'How do you handle unexpected schedule changes?', 'voice'),
(13, 4, 'What is your strategy for avoiding being late?', 'voice'),
(13, 5, 'How do you balance work and personal appointments?', 'voice'),
(13, 6, 'Tell me about a time when scheduling was particularly challenging.', 'voice'),

-- Day 14: At the Doctor & Pharmacy
(14, 1, 'How often do you visit the doctor?', 'voice'),
(14, 2, 'What do you do to maintain good health?', 'voice'),
(14, 3, 'Describe a time when you had to explain symptoms to a doctor.', 'voice'),
(14, 4, 'How do you manage medications and prescriptions?', 'voice'),
(14, 5, 'What questions do you ask when visiting a pharmacy?', 'voice'),
(14, 6, 'How do you prepare for medical appointments?', 'voice'),

-- Day 15: Banking & Money Basics
(15, 1, 'How do you manage your personal finances?', 'voice'),
(15, 2, 'What banking services do you use most often?', 'voice'),
(15, 3, 'How do you budget for monthly expenses?', 'voice'),
(15, 4, 'What financial goals do you have?', 'voice'),
(15, 5, 'How do you handle unexpected expenses?', 'voice'),
(15, 6, 'What advice would you give someone about managing money?', 'voice'),

-- Day 16: Grocery Shopping
(16, 1, 'How often do you go grocery shopping?', 'voice'),
(16, 2, 'What is your shopping strategy?', 'voice'),
(16, 3, 'How do you decide what to buy?', 'voice'),
(16, 4, 'What is your favorite grocery store and why?', 'voice'),
(16, 5, 'How do you save money while shopping?', 'voice'),
(16, 6, 'Tell me about a time you tried a new product.', 'voice'),

-- Day 17: Restaurants & Cafés
(17, 1, 'What type of restaurants do you prefer?', 'voice'),
(17, 2, 'Describe your ideal dining experience.', 'voice'),
(17, 3, 'How do you choose where to eat?', 'voice'),
(17, 4, 'What is your favorite cuisine?', 'voice'),
(17, 5, 'Tell me about a memorable restaurant experience.', 'voice'),
(17, 6, 'How do you handle dietary restrictions when dining out?', 'voice'),

-- Day 18: Customer Service & Complaints
(18, 1, 'Describe a time when you had to make a complaint.', 'voice'),
(18, 2, 'How do you handle poor customer service?', 'voice'),
(18, 3, 'What makes good customer service?', 'voice'),
(18, 4, 'How do you stay calm when dealing with problems?', 'voice'),
(18, 5, 'Tell me about a time you received excellent customer service.', 'voice'),
(18, 6, 'How do you write a formal complaint letter?', 'voice'),

-- Day 19: Events & Celebrations
(19, 1, 'Describe your favorite celebration or holiday.', 'voice'),
(19, 2, 'How do you plan a birthday party?', 'voice'),
(19, 3, 'What traditions do you have in your family?', 'voice'),
(19, 4, 'Tell me about a memorable event you attended.', 'voice'),
(19, 5, 'How do you choose gifts for special occasions?', 'voice'),
(19, 6, 'What makes a celebration successful?', 'voice'),

-- Day 20: Nature & Outdoors
(20, 1, 'Describe your favorite outdoor activity.', 'voice'),
(20, 2, 'How do you prepare for a hiking trip?', 'voice'),
(20, 3, 'Tell me about a beautiful natural place you visited.', 'voice'),
(20, 4, 'What environmental issues concern you?', 'voice'),
(20, 5, 'How do you enjoy nature in your daily life?', 'voice'),
(20, 6, 'What outdoor activity would you like to try?', 'voice'),

-- Day 21: Sports & Fitness
(21, 1, 'Describe your exercise routine.', 'voice'),
(21, 2, 'What sports do you enjoy watching or playing?', 'voice'),
(21, 3, 'How do you stay motivated to exercise?', 'voice'),
(21, 4, 'Tell me about a fitness goal you achieved.', 'voice'),
(21, 5, 'What are the benefits of regular exercise?', 'voice'),
(21, 6, 'How do you choose the right sport for you?', 'voice'),

-- Day 22: Movies & TV
(22, 1, 'Describe your favorite movie or TV show.', 'voice'),
(22, 2, 'What genres do you prefer and why?', 'voice'),
(22, 3, 'How do you choose what to watch?', 'voice'),
(22, 4, 'Tell me about a character you found interesting.', 'voice'),
(22, 5, 'Do you prefer watching alone or with others?', 'voice'),
(22, 6, 'What makes a good movie or series?', 'voice'),

-- Day 23: Music & Concerts
(23, 1, 'Describe your music taste and favorite artists.', 'voice'),
(23, 2, 'Tell me about a concert you attended or want to attend.', 'voice'),
(23, 3, 'How does music affect your mood?', 'voice'),
(23, 4, 'What instruments can you play or would like to learn?', 'voice'),
(23, 5, 'How do you discover new music?', 'voice'),
(23, 6, 'What role does music play in your daily life?', 'voice'),

-- Day 24: Books & Reading
(24, 1, 'What types of books do you enjoy reading?', 'voice'),
(24, 2, 'Tell me about a book that changed your perspective.', 'voice'),
(24, 3, 'How do you choose what to read next?', 'voice'),
(24, 4, 'Do you prefer physical books or e-books?', 'voice'),
(24, 5, 'What is your reading routine?', 'voice'),
(24, 6, 'How has reading improved your English?', 'voice'),

-- Day 25: Environment & Sustainability
(25, 1, 'What environmental issues concern you most?', 'voice'),
(25, 2, 'How do you practice sustainability in daily life?', 'voice'),
(25, 3, 'Tell me about an eco-friendly habit you adopted.', 'voice'),
(25, 4, 'What can individuals do to help the environment?', 'voice'),
(25, 5, 'How do you reduce waste in your home?', 'voice'),
(25, 6, 'What environmental changes have you noticed?', 'voice'),

-- Day 26: Volunteering & Community
(26, 1, 'What causes are you passionate about?', 'voice'),
(26, 2, 'Tell me about a volunteer experience you had.', 'voice'),
(26, 3, 'How do you contribute to your community?', 'voice'),
(26, 4, 'What skills can you offer as a volunteer?', 'voice'),
(26, 5, 'How does volunteering benefit both you and others?', 'voice'),
(26, 6, 'What would you like to volunteer for in the future?', 'voice'),

-- Day 27: Time Management
(27, 1, 'How do you organize your daily schedule?', 'voice'),
(27, 2, 'What time management techniques work for you?', 'voice'),
(27, 3, 'Tell me about a time you successfully met a deadline.', 'voice'),
(27, 4, 'How do you prioritize your tasks?', 'voice'),
(27, 5, 'What distracts you most and how do you handle it?', 'voice'),
(27, 6, 'How do you balance work and personal time?', 'voice'),

-- Day 28: Study Strategies
(28, 1, 'What study methods work best for you?', 'voice'),
(28, 2, 'How do you prepare for important exams?', 'voice'),
(28, 3, 'Tell me about a learning technique you discovered.', 'voice'),
(28, 4, 'Do you prefer studying alone or in groups?', 'voice'),
(28, 5, 'How do you stay motivated while learning?', 'voice'),
(28, 6, 'What advice would you give to new learners?', 'voice'),

-- Day 29: Travel Planning
(29, 1, 'How do you plan your trips?', 'voice'),
(29, 2, 'Tell me about your dream destination.', 'voice'),
(29, 3, 'What factors do you consider when choosing accommodation?', 'voice'),
(29, 4, 'How do you budget for travel?', 'voice'),
(29, 5, 'What travel apps do you find most useful?', 'voice'),
(29, 6, 'How do you research local customs before traveling?', 'voice'),

-- Day 30: Cultural Differences
(30, 1, 'What cultural differences have surprised you?', 'voice'),
(30, 2, 'How do you adapt to new cultural environments?', 'voice'),
(30, 3, 'Tell me about a cultural misunderstanding you experienced.', 'voice'),
(30, 4, 'What cultural traditions do you find interesting?', 'voice'),
(30, 5, 'How do you show respect in different cultures?', 'voice'),
(30, 6, 'What have you learned from other cultures?', 'voice'),

-- Day 31: Problem Solving
(31, 1, 'Describe your approach to solving problems.', 'voice'),
(31, 2, 'Tell me about a challenging problem you solved.', 'voice'),
(31, 3, 'How do you break down complex issues?', 'voice'),
(31, 4, 'When do you ask for help with problems?', 'voice'),
(31, 5, 'How do you learn from failed solutions?', 'voice'),
(31, 6, 'What problem-solving tools do you use?', 'voice'),

-- Day 32: Conflict & Communication
(32, 1, 'How do you handle disagreements?', 'voice'),
(32, 2, 'Tell me about a conflict you resolved successfully.', 'voice'),
(32, 3, 'What communication skills are most important?', 'voice'),
(32, 4, 'How do you express your opinions respectfully?', 'voice'),
(32, 5, 'What makes communication effective?', 'voice'),
(32, 6, 'How do you listen actively in conversations?', 'voice'),

-- Day 33: Teamwork & Collaboration
(33, 1, 'What makes a good team member?', 'voice'),
(33, 2, 'Tell me about a successful team project.', 'voice'),
(33, 3, 'How do you contribute to team goals?', 'voice'),
(33, 4, 'How do you handle difficult team members?', 'voice'),
(33, 5, 'What leadership qualities do you admire?', 'voice'),
(33, 6, 'How do you build trust in teams?', 'voice'),

-- Day 34: Presentations Basics
(34, 1, 'How do you prepare for presentations?', 'voice'),
(34, 2, 'Tell me about a presentation you gave.', 'voice'),
(34, 3, 'What techniques help reduce presentation anxiety?', 'voice'),
(34, 4, 'How do you engage your audience?', 'voice'),
(34, 5, 'What makes a presentation memorable?', 'voice'),
(34, 6, 'How do you handle questions during presentations?', 'voice'),

-- Day 35: Email & Message Etiquette
(35, 1, 'What makes a good professional email?', 'voice'),
(35, 2, 'How do you handle email overload?', 'voice'),
(35, 3, 'Tell me about an email misunderstanding you experienced.', 'voice'),
(35, 4, 'When do you choose email over phone calls?', 'voice'),
(35, 5, 'How do you write clear subject lines?', 'voice'),
(35, 6, 'What email habits do you find annoying?', 'voice'),

-- Day 36: Job Hunting
(36, 1, 'How do you search for job opportunities?', 'voice'),
(36, 2, 'Tell me about your ideal job.', 'voice'),
(36, 3, 'What skills do you highlight in applications?', 'voice'),
(36, 4, 'How do you prepare for job interviews?', 'voice'),
(36, 5, 'What questions do you ask potential employers?', 'voice'),
(36, 6, 'How do you follow up after interviews?', 'voice'),

-- Day 37: Interviews
(37, 1, 'What interview questions do you find most challenging?', 'voice'),
(37, 2, 'Tell me about a successful interview experience.', 'voice'),
(37, 3, 'How do you research companies before interviews?', 'voice'),
(37, 4, 'What questions do you ask interviewers?', 'voice'),
(37, 5, 'How do you handle interview nerves?', 'voice'),
(37, 6, 'What makes a candidate stand out?', 'voice'),

-- Day 38: Workplace Communication
(38, 1, 'How do you communicate with colleagues effectively?', 'voice'),
(38, 2, 'Tell me about a workplace communication challenge.', 'voice'),
(38, 3, 'How do you give constructive feedback?', 'voice'),
(38, 4, 'Describe a successful team meeting you led.', 'voice'),
(38, 5, 'How do you handle miscommunication?', 'voice'),
(38, 6, 'What is your approach to written communication?', 'voice'),

-- Day 39: Personal Finance & Money Management
(39, 1, 'How do you manage your monthly budget?', 'voice'),
(39, 2, 'Tell me about a financial goal you achieved.', 'voice'),
(39, 3, 'What is your approach to saving money?', 'voice'),
(39, 4, 'How do you make investment decisions?', 'voice'),
(39, 5, 'Describe a time you had to cut expenses.', 'voice'),
(39, 6, 'What financial advice would you give to others?', 'voice'),

-- Day 40: Digital Safety & Online Security
(40, 1, 'How do you protect your online accounts?', 'voice'),
(40, 2, 'Tell me about a cybersecurity threat you avoided.', 'voice'),
(40, 3, 'What are your password management strategies?', 'voice'),
(40, 4, 'How do you identify phishing attempts?', 'voice'),
(40, 5, 'Describe your approach to social media privacy.', 'voice'),
(40, 6, 'What online safety tips do you follow?', 'voice'),

-- Day 41: Critical Thinking & Analysis
(41, 1, 'How do you evaluate information before believing it?', 'voice'),
(41, 2, 'Tell me about a time you changed your mind based on evidence.', 'voice'),
(41, 3, 'What is your process for making important decisions?', 'voice'),
(41, 4, 'How do you identify bias in arguments?', 'voice'),
(41, 5, 'Describe a problem you solved using critical thinking.', 'voice'),
(41, 6, 'What questions do you ask when analyzing information?', 'voice'),

-- Day 42: News Analysis & Media Literacy
(42, 1, 'How do you verify news sources?', 'voice'),
(42, 2, 'Tell me about a news story that surprised you.', 'voice'),
(42, 3, 'How do you distinguish between facts and opinions?', 'voice'),
(42, 4, 'What role does social media play in news consumption?', 'voice'),
(42, 5, 'Describe how you stay informed about current events.', 'voice'),
(42, 6, 'How do you handle conflicting news reports?', 'voice'),

-- Day 43: Debating & Argumentation
(43, 1, 'How do you prepare for a debate?', 'voice'),
(43, 2, 'Tell me about a controversial topic you discussed.', 'voice'),
(43, 3, 'How do you present evidence effectively?', 'voice'),
(43, 4, 'What is your approach to counterarguments?', 'voice'),
(43, 5, 'Describe a time you persuaded someone to change their view.', 'voice'),
(43, 6, 'How do you maintain respect during disagreements?', 'voice'),

-- Day 44: Ethics & Technology
(44, 1, 'How do you balance technology benefits with privacy concerns?', 'voice'),
(44, 2, 'Tell me about an ethical dilemma involving technology.', 'voice'),
(44, 3, 'What are your thoughts on artificial intelligence ethics?', 'voice'),
(44, 4, 'How do you approach data privacy in your daily life?', 'voice'),
(44, 5, 'Describe the impact of technology on society.', 'voice'),
(44, 6, 'What ethical guidelines should tech companies follow?', 'voice'),

-- Day 45: Globalization & Cultural Exchange
(45, 1, 'How has globalization affected your community?', 'voice'),
(45, 2, 'Explain a challenge globalization creates.', 'voice'),
(45, 3, 'Tell about a global trend that reached your city.', 'voice'),
(45, 4, 'Discuss local culture vs. global brands.', 'voice'),
(45, 5, 'Compare online remote work and local jobs.', 'voice'),
(45, 6, 'In one sentence, your "think global, act local" idea.', 'voice'),

-- Day 46: Sustainability in Daily Life
(46, 1, 'Describe how you reduce energy or water use.', 'voice'),
(46, 2, 'Explain a small habit with a big impact.', 'voice'),
(46, 3, 'Tell about choosing durable products.', 'voice'),
(46, 4, 'Discuss "needs" vs. "wants".', 'voice'),
(46, 5, 'Share how you persuade friends to join.', 'voice'),
(46, 6, 'In one sentence, your sustainability rule.', 'voice'),

-- Day 47: Mental Health Awareness
(47, 1, 'Describe a routine that protects your mental health.', 'voice'),
(47, 2, 'Explain how you support a friend under stress.', 'voice'),
(47, 3, 'Tell about setting healthy boundaries.', 'voice'),
(47, 4, 'Discuss stigma and how to reduce it.', 'voice'),
(47, 5, 'Compare rest and productivity for well-being.', 'voice'),
(47, 6, 'In one sentence, a kindness to yourself this week.', 'voice'),

-- Day 48: Creativity & Innovation
(48, 1, 'Describe a creative project you did.', 'voice'),
(48, 2, 'Explain how constraints can boost creativity.', 'voice'),
(48, 3, 'Tell about learning from a failed experiment.', 'voice'),
(48, 4, 'Discuss brainstorming vs. solo thinking.', 'voice'),
(48, 5, 'Share how you capture new ideas daily.', 'voice'),
(48, 6, 'In one sentence, your creativity habit.', 'voice'),

-- Day 49: Leadership Basics
(49, 1, 'Describe a time you led a small team.', 'voice'),
(49, 2, 'Explain how you delegate fairly.', 'voice'),
(49, 3, 'Tell about motivating someone to improve.', 'voice'),
(49, 4, 'Discuss leading by example vs. instruction.', 'voice'),
(49, 5, 'Share how you give credit to others.', 'voice'),
(49, 6, 'In one sentence, your leadership principle.', 'voice'),

-- Day 50: Lifelong Learning
(50, 1, 'Describe a new skill you learned recently.', 'voice'),
(50, 2, 'Explain your system for regular learning.', 'voice'),
(50, 3, 'Tell about learning from a mentor or peer.', 'voice'),
(50, 4, 'Discuss online courses vs. books.', 'voice'),
(50, 5, 'Share how you avoid burnout while learning.', 'voice'),
(50, 6, 'In one sentence, your learning motto.', 'voice'),

-- Day 51: Networking
(51, 1, 'Describe how you start a conversation at events.', 'voice'),
(51, 2, 'Explain a polite follow-up message.', 'voice'),
(51, 3, 'Tell about helping someone first before asking.', 'voice'),
(51, 4, 'Discuss online vs. in-person networking.', 'voice'),
(51, 5, 'Share how to keep contacts warm.', 'voice'),
(51, 6, 'In one sentence, your networking rule.', 'voice'),

-- Day 52: Public Speaking (Advanced)
(52, 1, 'Describe how you manage stage fright.', 'voice'),
(52, 2, 'Explain your structure for a persuasive talk.', 'voice'),
(52, 3, 'Tell about using stories and data together.', 'voice'),
(52, 4, 'Discuss handling tough audience questions.', 'voice'),
(52, 5, 'Share how you rehearse effectively.', 'voice'),
(52, 6, 'In one sentence, your opening hook.', 'voice'),

-- Day 53: Research & Fact-Checking
(53, 1, 'Describe how you search and filter sources.', 'voice'),
(53, 2, 'Explain evaluating credibility quickly.', 'voice'),
(53, 3, 'Tell about finding conflicting data.', 'voice'),
(53, 4, 'Discuss citing sources simply.', 'voice'),
(53, 5, 'Share organizing notes for a report.', 'voice'),
(53, 6, 'In one sentence, your rule for accuracy.', 'voice'),

-- Day 54: Negotiation
(54, 1, 'Describe a win-win outcome you achieved.', 'voice'),
(54, 2, 'Explain preparing your BATNA simply.', 'voice'),
(54, 3, 'Tell about asking for more value politely.', 'voice'),
(54, 4, 'Discuss when to walk away.', 'voice'),
(54, 5, 'Share using silence as a tool.', 'voice'),
(54, 6, 'In one sentence, your negotiation rule.', 'voice'),

-- Day 55: Decision-Making
(55, 1, 'Describe a hard decision and your steps.', 'voice'),
(55, 2, 'Explain pros/cons and trade-offs.', 'voice'),
(55, 3, 'Tell about deciding with limited info.', 'voice'),
(55, 4, 'Discuss intuition vs. analysis.', 'voice'),
(55, 5, 'Share a simple decision rule you use.', 'voice'),
(55, 6, 'In one sentence, how you avoid regret.', 'voice'),

-- Day 56: Innovation at Work
(56, 1, 'Describe improving a process you use.', 'voice'),
(56, 2, 'Explain pitching a new idea to your team.', 'voice'),
(56, 3, 'Tell about testing an experiment cheaply.', 'voice'),
(56, 4, 'Discuss learning from failed pilots.', 'voice'),
(56, 5, 'Share measuring impact simply.', 'voice'),
(56, 6, 'In one sentence, your innovation habit.', 'voice'),

-- Day 57: Design Thinking
(57, 1, 'Describe empathizing with users.', 'voice'),
(57, 2, 'Explain defining a clear problem.', 'voice'),
(57, 3, 'Tell about ideation you facilitated.', 'voice'),
(57, 4, 'Discuss prototyping and testing quickly.', 'voice'),
(57, 5, 'Share iterating after feedback.', 'voice'),
(57, 6, 'In one sentence, your DT principle.', 'voice'),

-- Day 58: Storytelling for Impact
(58, 1, 'Describe a story that moved you to act.', 'voice'),
(58, 2, 'Explain the structure you like (beginning–middle–end).', 'voice'),
(58, 3, 'Tell about using a personal example in talks.', 'voice'),
(58, 4, 'Discuss data storytelling simply.', 'voice'),
(58, 5, 'Share how you make a message memorable.', 'voice'),
(58, 6, 'In one sentence, your story''s moral.', 'voice'),

-- Day 59: Goals & Habits
(59, 1, 'Describe a goal and why it matters.', 'voice'),
(59, 2, 'Explain breaking a goal into steps.', 'voice'),
(59, 3, 'Tell about tracking and celebrating progress.', 'voice'),
(59, 4, 'Discuss preventing relapse or stopping.', 'voice'),
(59, 5, 'Share accountability methods that work.', 'voice'),
(59, 6, 'In one sentence, your goal for this month.', 'voice'),

-- Day 60: Reflection & Next Steps
(60, 1, 'Reflect on your progress over 60 days.', 'voice'),
(60, 2, 'Explain a habit you will keep and why.', 'voice'),
(60, 3, 'Tell about one skill that improved most.', 'voice'),
(60, 4, 'Discuss challenges and how you overcame them.', 'voice'),
(60, 5, 'Share your plan for the next 30 days.', 'voice'),
(60, 6, 'In one sentence, a message to your future self.', 'voice');

COMMIT;
