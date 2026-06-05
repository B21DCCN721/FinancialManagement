import { createSlice } from "@reduxjs/toolkit"

/**
 * financeSlice – chỉ giữ lại UI state nhỏ sau khi đã chuyển sang RTK Query.
 * Dữ liệu thực (transactions, budgets, goals) đều được fetch từ Backend qua RTK Query services.
 */

interface FinanceUIState {
  activePeriod: string // "YYYY-MM" format, e.g. "2026-06"
}

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const initialState: FinanceUIState = {
  activePeriod: currentPeriod(),
}

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    setActivePeriod: (state, action: { payload: string }) => {
      state.activePeriod = action.payload
    },
  },
})

export const { setActivePeriod } = financeSlice.actions
export default financeSlice.reducer
