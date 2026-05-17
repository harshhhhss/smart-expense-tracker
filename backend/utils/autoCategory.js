const CATEGORY_KEYWORDS = {
  Food: [
    "zomato", "swiggy", "restaurant", "cafe", "coffee", "starbucks", "barista",
    "pizza", "burger", "sandwich", "biryani", "dosa", "idli", "thali", "meal",
    "breakfast", "lunch", "dinner", "snack", "bakery", "grocery", "groceries",
    "supermarket", "food court", "dominos", "mcdonald", "kfc", "subway"
  ],
  Travel: [
    "flight", "airline", "airport", "indigo", "air india", "vistara", "hotel",
    "booking", "makemytrip", "goibibo", "airbnb", "trip", "travel", "vacation",
    "resort", "hostel", "train", "railway", "irctc", "bus ticket", "redbus",
    "metro", "uber", "ola", "cab", "taxi", "auto", "fuel", "petrol", "diesel",
    "toll", "parking", "bus"
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "snapdeal",
    "mall", "store", "shopping", "shirt", "tshirt", "jeans", "dress", "clothes",
    "shoes", "sneakers", "watch", "bag", "electronics", "mobile", "phone",
    "laptop", "headphones", "furniture", "ikea", "decathlon"
  ],
  Entertainment: [
    "movie", "cinema", "pvr", "inox", "bookmyshow", "netflix", "prime video",
    "hotstar", "disney", "spotify", "youtube premium", "music", "concert",
    "show", "event", "game", "gaming", "steam", "playstation", "xbox",
    "theatre", "club", "bowling", "arcade"
  ],
  Education: [
    "book", "textbook", "course", "udemy", "coursera", "skillshare", "edx",
    "tuition", "coaching", "class", "school", "college", "university", "exam",
    "certification", "workshop", "seminar", "stationery", "notebook", "library",
    "fees", "admission"
  ],
  Health: [
    "doctor", "hospital", "clinic", "pharmacy", "medicine", "medicines",
    "apollo", "1mg", "netmeds", "pharmeasy", "lab", "diagnostic", "blood test",
    "health", "dental", "dentist", "therapy", "physio", "consultation",
    "insurance premium", "prescription", "vaccine", "gym", "fitness"
  ],
  Bills: [
    "electricity", "water bill", "gas bill", "wifi", "internet", "broadband",
    "mobile bill", "phone bill", "postpaid", "prepaid", "recharge", "dth",
    "rent", "maintenance", "society", "utility", "utilities", "bill payment",
    "credit card bill", "emi", "loan", "subscription", "insurance", "premium"
  ],
  Work: [
    "office", "coworking", "wework", "workspace", "client", "meeting", "business",
    "conference", "work trip", "work travel", "taxi to office", "commute",
    "software", "saas", "domain", "hosting", "aws", "github", "figma", "notion",
    "slack", "zoom", "linkedin", "printer", "stationery for office", "equipment",
    "reimbursement"
  ]
};

const normalize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getKeywordWeight = (keyword) => {
  if (keyword.includes(" ")) return 4;
  if (keyword.length >= 8) return 3;
  if (keyword.length >= 5) return 2;
  return 1;
};

export const detectCategory = (description = "") => {
  const text = normalize(description);
  if (!text) return "Miscellaneous";

  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => {
    const score = keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword || !text.includes(normalizedKeyword)) return total;
      return total + getKeywordWeight(normalizedKeyword);
    }, 0);

    return { category, score };
  });

  const bestMatch = scores
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category))[0];

  return bestMatch?.category || "Miscellaneous";
};

export { CATEGORY_KEYWORDS };
