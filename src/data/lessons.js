export const sampleLessons = {
  shopping: {
    topic: 'Shopping',
    hiddenTopic: true,
    image: 'https://source.unsplash.com/300x200/?shopping,mall,store',
    vocabulary: [
      'market', 'price', 'buy', 'sell', 'customer', 'shop', 'money', 'product',
    ],
    description: 'Learn vocabulary and phrases for shopping and buying things',
    iceBreaker: {
      type: 'price_guess',
      title: 'Price Guessing Game! 🛒',
      description: 'Guess the price of these common items!',
      questions: [
        { item: "a loaf of bread", price: 3.50 },
        { item: "a gallon of milk", price: 2.99 },
        { item: "a dozen eggs", price: 4.25 }
      ]
    },
  },
  food: {
    topic: 'Food & Cooking',
    hiddenTopic: true,
    image: 'https://source.unsplash.com/300x200/?food,cooking,kitchen',
    vocabulary: [
      'cook', 'recipe', 'ingredient', 'delicious', 'spicy', 'sweet', 'kitchen', 'meal',
    ],
    description: 'Explore food vocabulary and cooking terms',
    iceBreaker: {
      type: 'taste_challenge',
      title: 'Taste Challenge! 🍎',
      description: 'Can you describe these flavors?',
      questions: [
        { item: "sweet apple", price: 0 },
        { item: "spicy pepper", price: 0 }
      ]
    },
  },
  travel: {
    topic: 'Travel & Transportation',
    hiddenTopic: true,
    image: 'https://source.unsplash.com/300x200/?travel,airport,vacation',
    vocabulary: [
      'airport', 'ticket', 'journey', 'destination', 'luggage', 'passport', 'hotel', 'tourist',
    ],
    description: 'Essential vocabulary for traveling and transportation',
    iceBreaker: {
      type: 'destination_match',
      title: 'Where in the World? 🌍',
      description: 'Match the landmark to the country!',
      questions: [
        { item: "Eiffel Tower", price: 0 },
        { item: "Pyramids", price: 0 }
      ]
    },
  },
};