export const detectCategory = (description = "") => {
  const text = description.toLowerCase();

  const rules = {
    Food: ["pizza", "burger", "food", "lunch", "dinner", "zomato", "swiggy", "cafe", "restaurant"],
    Transport: ["uber", "ola", "bus", "train", "metro", "fuel", "petrol", "cab", "auto"],
    Shopping: ["amazon", "flipkart", "shirt", "shoes", "clothes", "mall", "shopping"],
    Entertainment: ["movie", "netflix", "prime", "game", "spotify", "concert"],
    Bills: ["electricity", "wifi", "internet", "bill", "recharge", "rent"],
    Health: ["medicine", "doctor", "hospital", "pharmacy"],
    Education: ["book", "course", "tuition", "exam", "college"],
    Travel: ["hotel", "flight", "trip", "travel"]
  };

  for (const category in rules) {
    if (rules[category].some((word) => text.includes(word))) {
      return category;
    }
  }

  return "Miscellaneous";
};