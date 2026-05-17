import RecurringExpense from "../models/RecurringExpense.js";
import Expense from "../models/Expense.js";

// Create a recurring expense
export const createRecurringExpense = async (req, res, next) => {
  try {
    const { amount, category, description, frequency, startDate, endDate } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const recurringExp = await RecurringExpense.create({
      user: req.user._id,
      amount,
      category,
      description,
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null
    });

    res.status(201).json({ recurringExpense: recurringExp });
  } catch (error) {
    next(error);
  }
};

// Get all recurring expenses for user
export const getRecurringExpenses = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ recurring });
  } catch (error) {
    next(error);
  }
};

// Update recurring expense
export const updateRecurringExpense = async (req, res, next) => {
  try {
    const { amount, category, description, frequency, startDate, endDate, active } = req.body;

    if (amount && amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const recurring = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        amount,
        category,
        description,
        frequency,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        active
      },
      { new: true, runValidators: true }
    );

    if (!recurring) {
      return res.status(404).json({ message: "Recurring expense not found" });
    }

    res.json({ recurringExpense: recurring });
  } catch (error) {
    next(error);
  }
};

// Delete recurring expense
export const deleteRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!recurring) {
      return res.status(404).json({ message: "Recurring expense not found" });
    }

    res.json({ message: "Recurring expense deleted", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// Process recurring expenses (called daily/periodically)
export const processRecurringExpenses = async (req, res, next) => {
  try {
    const now = new Date();
    const active = await RecurringExpense.find({ active: true });

    let processed = 0;

    for (const recurring of active) {
      // Check if should create expense
      const lastCreated = recurring.lastCreated ? new Date(recurring.lastCreated) : recurring.startDate;
      const shouldCreate = shouldCreateExpense(lastCreated, recurring.frequency, now);

      if (shouldCreate && isWithinDateRange(now, recurring.startDate, recurring.endDate)) {
        // Create expense
        await Expense.create({
          user: recurring.user,
          amount: recurring.amount,
          category: recurring.category,
          description: recurring.description || `Recurring: ${recurring.category}`,
          date: now,
          autoTagged: false
        });

        // Update lastCreated
        await RecurringExpense.updateOne(
          { _id: recurring._id },
          { lastCreated: now }
        );

        processed++;
      }
    }

    res.json({ message: `Processed ${processed} recurring expenses` });
  } catch (error) {
    next(error);
  }
};

// Helper: Check if expense should be created based on frequency
const shouldCreateExpense = (lastCreated, frequency, now) => {
  const diffMs = now - lastCreated;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (frequency) {
    case "daily":
      return diffDays >= 1;
    case "weekly":
      return diffDays >= 7;
    case "biweekly":
      return diffDays >= 14;
    case "monthly":
      return diffDays >= 30 || hasMonthPassed(lastCreated, now);
    case "quarterly":
      return diffDays >= 90;
    case "yearly":
      return diffDays >= 365;
    default:
      return false;
  }
};

// Helper: Check if a month has passed
const hasMonthPassed = (lastDate, currentDate) => {
  return (
    currentDate.getFullYear() > lastDate.getFullYear() ||
    (currentDate.getFullYear() === lastDate.getFullYear() &&
      currentDate.getMonth() > lastDate.getMonth())
  );
};

// Helper: Check if date is within range
const isWithinDateRange = (date, startDate, endDate) => {
  const time = date.getTime();
  const start = startDate.getTime();
  const end = endDate ? endDate.getTime() : Infinity;
  return time >= start && time <= end;
};
