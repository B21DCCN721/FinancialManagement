import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/lib/api/types"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user?: User }>
    ) => {
      // Chỉ cập nhật token nếu được truyền vào thực sự (tránh ghi đè bằng chuỗi rỗng)
      if (action.payload.accessToken) state.accessToken = action.payload.accessToken
      if (action.payload.refreshToken) state.refreshToken = action.payload.refreshToken
      
      if (action.payload.user) {
        state.user = action.payload.user
      }
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    clearAuth: (state) => {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
    },
  },
})

export const { setCredentials, updateUser, clearAuth } = authSlice.actions
export default authSlice.reducer
