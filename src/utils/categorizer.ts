import { ExpenseCategory } from '../types';

interface CategoryKeywordRule {
  category: ExpenseCategory;
  keywords: string[];
}

const CATEGORY_RULES: CategoryKeywordRule[] = [
  {
    category: 'Food',
    keywords: [
      'lunch', 'dinner', 'breakfast', 'brunch', 'food', 'meal', 'cafe', 'coffee',
      'starbucks', 'dunkin', 'cafeteria', 'canteen', 'groceries', 'grocery', 'supermarket',
      'trader joe', 'whole foods', 'walmart grocery', 'safeway', 'kroger', 'aldi',
      'restaurant', 'dining', 'pizza', 'dominos', 'subway', 'chipotle', 'burger',
      'mcdonald', 'taco', 'boba', 'tea', 'ramen', 'sushi', 'bakery', 'snack', 'snacks',
      'ubereats', 'uber eats', 'doordash', 'grubhub', 'swiggy', 'zomato', 'delivery',
      'shake', 'smoothie', 'bagel', 'donut', 'publix', 'panda express'
    ],
  },
  {
    category: 'Transport',
    keywords: [
      'bus', 'metro', 'train', 'subway', 'uber', 'lyft', 'taxi', 'cab', 'transit',
      'pass', 'ticket', 'gas', 'fuel', 'petrol', 'diesel', 'shell', 'chevron', 'bp',
      'parking', 'toll', 'scooter', 'lime', 'bird', 'bike', 'bicycle', 'commute',
      'amtrak', 'airline', 'flight', 'rail', 'fares'
    ],
  },
  {
    category: 'Education',
    keywords: [
      'book', 'books', 'textbook', 'tuition', 'course', 'class', 'udemy', 'coursera',
      'chegg', 'quizlet', 'canvas', 'blackboard', 'library', 'stationery', 'notebook',
      'binder', 'pens', 'calculator', 'lab', 'exam', 'fee', 'printing', 'xerox',
      'seminar', 'workshop', 'tuition fee', 'admission', 'syllabus', 'dues'
    ],
  },
  {
    category: 'Accommodation',
    keywords: [
      'rent', 'dorm', 'room', 'hostel', 'apartment', 'flat', 'lease', 'landlord',
      'electric', 'electricity', 'water bill', 'power', 'utility', 'utilities',
      'wifi', 'internet', 'broadband', 'xfinity', 'spectrum', 'verizon', 'att',
      'laundry', 'washer', 'dryer', 'trash', 'maintenance', 'housing'
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'shopping', 'clothes', 'clothing', 'apparel', 'zara', 'h&m', 'uniqlo',
      'target', 'walmart', 'shoes', 'sneakers', 'nike', 'adidas', 'electronics',
      'best buy', 'apple store', 'headphone', 'gadget', 'charger', 'backpack',
      'furniture', 'ikea', 'bedding', 'decor', 'thrift', 'shein', 'ebay'
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'spotify', 'hulu', 'disney', 'prime video', 'youtube', 'hbo',
      'movie', 'movies', 'cinema', 'theater', 'theatre', 'amc', 'ticket', 'concert',
      'gig', 'festival', 'game', 'gaming', 'steam', 'playstation', 'xbox', 'nintendo',
      'party', 'club', 'bar', 'pub', 'beer', 'drinks', 'bowling', 'arcade', 'billiards',
      'bowling', 'night out'
    ],
  },
  {
    category: 'Health',
    keywords: [
      'pharmacy', 'medicine', 'doctor', 'clinic', 'health', 'hospital', 'dental',
      'dentist', 'prescription', 'cvs', 'walgreens', 'vitamins', 'gym', 'fitness',
      'workout', 'therapy', 'counseling', 'optometry', 'glasses', 'bandages'
    ],
  },
];

export function categorizeDescription(description: string): ExpenseCategory {
  if (!description) return 'Others';
  const text = description.toLowerCase().trim();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      // Look for whole word or exact token match
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text) || text.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return 'Others';
}
