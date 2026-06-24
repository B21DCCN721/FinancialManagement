import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, persistReducer } from "redux-persist"
import storage from "./storage"

import authReducer from "./authSlice"
import financeReducer from "./financeSlice"
import { baseApi } from "@/lib/api/baseApi"

// Chỉ persist auth state (token) – không persist RTK Query cache
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["accessToken", "refreshToken", "user"],
}

const appReducer = combineReducers({
  // Persisted slices
  auth: persistReducer(authPersistConfig, authReducer),

  // UI state slice (không persist để tránh stale data)
  finance: financeReducer,

  // Centralized RTK Query API reducer
  [baseApi.reducerPath]: baseApi.reducer,
})

const rootReducer = (state: any, action: any) => {
  if (action.type === "auth/clearAuth") {
    // Reset toàn bộ Redux state (bao gồm RTK Query cache) về trạng thái ban đầu khi đăng xuất
    // Điều này giúp tránh việc user mới đăng nhập vào vẫn nhìn thấy dữ liệu cache của user cũ
    state = undefined
  }
  return appReducer(state, action)
}

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(baseApi.middleware),
  })
  
  // Bật tính năng refetchOnFocus và refetchOnReconnect cho RTK Query
  setupListeners(store.dispatch)
  
  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
