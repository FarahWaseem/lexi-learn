-- Seed data for lessons (compatible with Lessons.jsx)
-- This file contains sample lessons data

-- Insert sample lessons
INSERT INTO daily_topics (day_number, title_en, level, content, estimated_minutes) VALUES
(1, 'Shopping', 'A1', 'Learn basic shopping vocabulary and phrases. Practice asking for prices, sizes, and colors.', 15),
(2, 'Food & Cooking', 'A1', 'Discover food vocabulary and cooking terms. Learn to describe flavors and ingredients.', 20),
(3, 'Travel & Transportation', 'A2', 'Master travel vocabulary for airports, hotels, and transportation. Practice booking and directions.', 25),
(4, 'Family & Relationships', 'A1', 'Learn family member names and relationship terms. Practice describing your family.', 15),
(5, 'Weather & Seasons', 'A1', 'Understand weather vocabulary and seasonal descriptions. Learn to talk about climate.', 15),
(6, 'Hobbies & Free Time', 'A2', 'Explore hobby vocabulary and leisure activities. Practice describing your interests.', 20),
(7, 'Work & Career', 'A2', 'Learn professional vocabulary and job-related terms. Practice workplace conversations.', 25),
(8, 'Health & Body', 'A2', 'Master health vocabulary and body parts. Learn to describe symptoms and feelings.', 20),
(9, 'Technology & Internet', 'B1', 'Understand tech vocabulary and digital communication. Practice online interactions.', 25),
(10, 'Education & Learning', 'A2', 'Learn educational vocabulary and academic terms. Practice classroom conversations.', 20);

-- Insert sample words for each lesson
INSERT INTO topic_words (topic_id, term, meaning, example) VALUES
-- Shopping lesson words
(1, 'market', 'سوق', 'I go to the market every Saturday.'),
(1, 'price', 'سعر', 'What is the price of this shirt?'),
(1, 'buy', 'يشتري', 'I want to buy some fruits.'),
(1, 'sell', 'يبيع', 'They sell fresh vegetables here.'),
(1, 'customer', 'زبون', 'The customer is always right.'),
(1, 'shop', 'متجر', 'This shop has great prices.'),
(1, 'money', 'مال', 'I need more money for shopping.'),
(1, 'product', 'منتج', 'This product is very popular.'),

-- Food & Cooking lesson words
(2, 'cook', 'يطبخ', 'I love to cook Italian food.'),
(2, 'recipe', 'وصفة', 'Can you share this recipe with me?'),
(2, 'ingredient', 'مكون', 'What ingredients do we need?'),
(2, 'delicious', 'لذيذ', 'This soup is delicious.'),
(2, 'spicy', 'حار', 'I like spicy food.'),
(2, 'sweet', 'حلو', 'This cake is too sweet.'),
(2, 'kitchen', 'مطبخ', 'The kitchen is very clean.'),
(2, 'meal', 'وجبة', 'Dinner is my favorite meal.'),

-- Travel & Transportation lesson words
(3, 'airport', 'مطار', 'The airport is very busy today.'),
(3, 'ticket', 'تذكرة', 'I need to buy a train ticket.'),
(3, 'journey', 'رحلة', 'The journey was very long.'),
(3, 'destination', 'وجهة', 'What is your destination?'),
(3, 'luggage', 'أمتعة', 'My luggage is very heavy.'),
(3, 'passport', 'جواز سفر', 'Don\'t forget your passport.'),
(3, 'hotel', 'فندق', 'The hotel has a great view.'),
(3, 'tourist', 'سائح', 'I am a tourist in this city.'),

-- Family & Relationships lesson words
(4, 'mother', 'أم', 'My mother is a teacher.'),
(4, 'father', 'أب', 'My father works in a bank.'),
(4, 'sister', 'أخت', 'I have one sister.'),
(4, 'brother', 'أخ', 'My brother is older than me.'),
(4, 'aunt', 'عمة/خالة', 'My aunt lives in another city.'),
(4, 'uncle', 'عم/خال', 'My uncle is very funny.'),
(4, 'cousin', 'ابن عم/خال', 'I have many cousins.'),
(4, 'grandma', 'جدة', 'My grandma makes great cookies.'),

-- Weather & Seasons lesson words
(5, 'sunny', 'مشمس', 'It\'s a sunny day today.'),
(5, 'rainy', 'ممطر', 'I don\'t like rainy weather.'),
(5, 'cloudy', 'غائم', 'The sky is cloudy today.'),
(5, 'windy', 'عاصف', 'It\'s very windy outside.'),
(5, 'hot', 'حار', 'Summer is very hot here.'),
(5, 'cold', 'بارد', 'Winter is cold and snowy.'),
(5, 'storm', 'عاصفة', 'There was a big storm yesterday.'),
(5, 'rainbow', 'قوس قزح', 'Look at that beautiful rainbow!'),

-- Hobbies & Free Time lesson words
(6, 'reading', 'قراءة', 'Reading is my favorite hobby.'),
(6, 'swimming', 'سباحة', 'I go swimming every week.'),
(6, 'drawing', 'رسم', 'She is very good at drawing.'),
(6, 'music', 'موسيقى', 'I listen to music every day.'),
(6, 'dancing', 'رقص', 'Dancing is great exercise.'),
(6, 'sports', 'رياضة', 'Playing sports is healthy.'),
(6, 'gaming', 'ألعاب', 'Gaming is popular among young people.'),
(6, 'cooking', 'طبخ', 'Cooking is a useful skill.');

-- Insert sample questions for each lesson
INSERT INTO topic_questions (topic_id, question_idx, prompt_en, answer_type) VALUES
-- Shopping lesson questions
(1, 1, 'What would you say when you want to buy something in a store?', 'voice'),
(1, 2, 'How do you ask for the price of an item?', 'voice'),
(1, 3, 'What do you say when you want to try on clothes?', 'voice'),
(1, 4, 'How do you ask if they have a different size?', 'voice'),
(1, 5, 'What would you say to pay for your items?', 'voice'),
(1, 6, 'How do you ask for a receipt?', 'voice'),

-- Food & Cooking lesson questions
(2, 1, 'Describe your favorite food and why you like it.', 'voice'),
(2, 2, 'What ingredients do you need to make a simple salad?', 'voice'),
(2, 3, 'How do you describe the taste of something spicy?', 'voice'),
(2, 4, 'What would you say if food is too salty?', 'voice'),
(2, 5, 'Describe the process of cooking rice.', 'voice'),
(2, 6, 'What do you say when food tastes delicious?', 'voice'),

-- Travel & Transportation lesson questions
(3, 1, 'How do you ask for directions to the airport?', 'voice'),
(3, 2, 'What do you say when checking in at a hotel?', 'voice'),
(3, 3, 'How do you ask about the departure time of a flight?', 'voice'),
(3, 4, 'What would you say if you lost your luggage?', 'voice'),
(3, 5, 'How do you ask for a taxi to the city center?', 'voice'),
(3, 6, 'What do you say when you want to change your ticket?', 'voice'),

-- Family & Relationships lesson questions
(4, 1, 'Describe your family members and their relationships.', 'voice'),
(4, 2, 'What do you say when introducing your parents?', 'voice'),
(4, 3, 'How do you describe your siblings?', 'voice'),
(4, 4, 'What would you say about your grandparents?', 'voice'),
(4, 5, 'How do you talk about family traditions?', 'voice'),
(4, 6, 'What do you say when talking about family gatherings?', 'voice'),

-- Weather & Seasons lesson questions
(5, 1, 'Describe the weather today in your city.', 'voice'),
(5, 2, 'What do you say when it\'s raining heavily?', 'voice'),
(5, 3, 'How do you describe a beautiful sunny day?', 'voice'),
(5, 4, 'What would you say about winter weather?', 'voice'),
(5, 5, 'How do you talk about seasonal changes?', 'voice'),
(5, 6, 'What do you say when planning outdoor activities?', 'voice'),

-- Hobbies & Free Time lesson questions
(6, 1, 'What are your favorite hobbies and why?', 'voice'),
(6, 2, 'How do you describe what you do in your free time?', 'voice'),
(6, 3, 'What would you say about your weekend activities?', 'voice'),
(6, 4, 'How do you talk about sports you play?', 'voice'),
(6, 5, 'What do you say about your creative hobbies?', 'voice'),
(6, 6, 'How do you describe your music preferences?', 'voice');
