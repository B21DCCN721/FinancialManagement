import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  icon?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}

const autoCategorize = (name: string): { category: string, type: TransactionType, icon: string } => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("lương") || lowerName.includes("salary")) return { category: "Thu nhập", type: "income", icon: "💰" }
  if (lowerName.includes("kfc") || lowerName.includes("mcdonald") || lowerName.includes("ăn") || lowerName.includes("food") || lowerName.includes("cafe") || lowerName.includes("coffee") || lowerName.includes("phở")) return { category: "Ăn uống", type: "expense", icon: "🍔" }
  if (lowerName.includes("netflix") || lowerName.includes("spotify") || lowerName.includes("game") || lowerName.includes("phim") || lowerName.includes("movie")) return { category: "Giải trí", type: "expense", icon: "🎬" }
  if (lowerName.includes("grab") || lowerName.includes("uber") || lowerName.includes("taxi") || lowerName.includes("xăng") || lowerName.includes("gas")) return { category: "Di chuyển", type: "expense", icon: "🚗" }
  if (lowerName.includes("shopee") || lowerName.includes("lazada") || lowerName.includes("tiki") || lowerName.includes("amazon") || lowerName.includes("mua")) return { category: "Mua sắm", type: "expense", icon: "📦" }
  if (lowerName.includes("điện") || lowerName.includes("nước") || lowerName.includes("mạng") || lowerName.includes("internet")) return { category: "Tiện ích", type: "expense", icon: "⚡" }
  
  return { category: "Khác", type: "expense", icon: "📝" }
}

const initialState: FinanceState = {
  transactions: [
    { id: "1", name: "Netflix Subscription", category: "Giải trí", amount: 15.99, type: "expense", date: new Date().toISOString(), icon: "🎬" },
    { id: "2", name: "Lương tháng", category: "Thu nhập", amount: 4500.00, type: "income", date: new Date(Date.now() - 86400000).toISOString(), icon: "💰" },
    { id: "3", name: "Đi siêu thị", category: "Ăn uống", amount: 87.50, type: "expense", date: new Date(Date.now() - 86400000 * 2).toISOString(), icon: "🛒" },
  ],
  budgets: [
    { id: "1", category: "Ăn uống", limit: 500 },
    { id: "2", category: "Giải trí", limit: 100 },
  ],
  goals: [
    { id: "1", name: "Du lịch Nhật Bản", targetAmount: 3000, currentAmount: 1500, deadline: "2026-12-31" },
    { id: "2", name: "Quỹ khẩn cấp", targetAmount: 10000, currentAmount: 4500 },
  ],
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Omit<Transaction, "id">>) => {
      const id = Math.random().toString(36).substring(2, 9);
      let { category, type, icon } = action.payload;
      
      if (!category || category === "Tự động") {
        const autoInfo = autoCategorize(action.payload.name);
        category = autoInfo.category;
        type = autoInfo.type;
        icon = autoInfo.icon;
      }

      state.transactions.unshift({
        ...action.payload,
        id,
        category,
        type,
        icon: icon || action.payload.icon || "📝",
      });
    },
    deleteTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(tx => tx.id !== action.payload);
    },
    addBudget: (state, action: PayloadAction<Omit<Budget, "id">>) => {
      const id = Math.random().toString(36).substring(2, 9);
      state.budgets.push({ ...action.payload, id });
    },
    addGoal: (state, action: PayloadAction<Omit<Goal, "id">>) => {
      const id = Math.random().toString(36).substring(2, 9);
      state.goals.push({ ...action.payload, id });
    },
    updateGoalAmount: (state, action: PayloadAction<{ id: string; amount: number }>) => {
      const goal = state.goals.find(g => g.id === action.payload.id);
      if (goal) {
        goal.currentAmount += action.payload.amount;
      }
    },
  },
});

export const { addTransaction, deleteTransaction, addBudget, addGoal, updateGoalAmount } = financeSlice.actions;

export default financeSlice.reducer;
