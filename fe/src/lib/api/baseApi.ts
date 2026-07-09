import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithAuth } from "./baseQuery"

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["User", "Transaction", "Budget", "Goal", "Category", "Report", "SpendingLimit"],
  endpoints: () => ({}),
})
