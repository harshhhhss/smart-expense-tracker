// utils/autoCategory.js
// Keyword-based auto category detection
// Checks description words against keyword lists and returns best match

const categoryKeywords = {
  Food: [
    "pizza","burger","food","lunch","dinner","breakfast","cafe","coffee","tea",
    "restaurant","swiggy","zomato","hotel","snack","biryani","dosa","sandwich",
    "juice","meal","eat","tiffin","bakery","dessert","ice cream","chai"
  ],
  Travel: [
    "uber","ola","bus","train","metro","cab","auto","taxi","flight","ticket",
    "travel","trip","petrol","fuel","diesel","toll","parking","rapido","redbus",
    "irctc","railway","airport","commute","ride","booking"
  ],
  Shopping: [
    "amazon","flipkart","myntra","mall","shop","clothes","shirt","dress","shoes",
    "bag","grocery","supermarket","market","big bazaar","dmart","reliance","store",
    "purchase","order","delivery","fashion","jeans","jacket","watch","accessory"
  ],
  Entertainment: [
    "netflix","prime","hotstar","spotify","movie","cinema","pvr","inox","game",
    "concert","show","theatre","disney","youtube","music","stream","party",
    "event","ticket","fun","outing","club","bar","bowling","arcade"
  ],
  Health: [
    "doctor","hospital","medicine","pharmacy","clinic","health","medical","gym",
    "fitness","yoga","apollo","vaccine","test","lab","diagnostic","tablet",
    "chemist","prescription","insurance","dental","eye","physiotherapy","ayurveda"
  ],
  Utilities: [
    "electricity","water","wifi","internet","broadband","gas","recharge","mobile",
    "phone","bill","postpaid","airtel","jio","bsnl","vi","maintenance","rent",
    "emi","subscription","tax","society","housekeeping","maid","cook"
  ],
  Education: [
    "course","udemy","coursera","book","college","school","fees","tuition","class",
    "exam","study","library","notebook","pen","stationery","coaching","lecture",
    "workshop","seminar","certificate","degree","internship","training"
  ],
  "Personal Care": [
    "salon","haircut","spa","parlour","nykaa","cosmetic","makeup","skincare",
    "shampoo","soap","grooming","perfume","deodorant","cream","lotion","barber",
    "facial","waxing","manicure","pedicure","hygiene"
  ],
};

/**
 * Detects category from a description string
 * @param {string} description - user-entered expense description
 * @returns {string} - matched category or "Other"
 */
const detectCategory = (description) => {
  if (!description || description.trim() === "") return null; // null = don't override

  const lower = description.toLowerCase();
  const words = lower.split(/[\s,.-]+/); // split on spaces and punctuation

  let bestMatch = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;

    for (const keyword of keywords) {
      // Check full word match or substring match
      if (words.some(word => word === keyword) || lower.includes(keyword)) {
        // Full word match scores higher than substring
        score += words.some(word => word === keyword) ? 2 : 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestScore > 0 ? bestMatch : null; // null = couldn't detect
};

module.exports = { detectCategory };