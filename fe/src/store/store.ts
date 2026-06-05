import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist"
import storage from "redux-persist/lib/storage"

import authReducer from "./authSlice"
import financeReducer from "./financeSlice"
import { baseApi } from "@/lib/api/baseApi"

// Chỉ persist auth state (token) – không persist RTK Query cache
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["accessToken", "refreshToken", "user"],
}

const rootReducer = combineReducers({
  // Persisted slices
  auth: persistReducer(authPersistConfig, authReducer),

  // UI state slice (không persist để tránh stale data)
  finance: financeReducer,

  // Centralized RTK Query API reducer
  [baseApi.reducerPath]: baseApi.reducer,
})

const persistConfig = {
  key: "root",
  storage,
  // Chỉ whitelist các slice cần persist – RTK Query cache sẽ bị loại trừ
  whitelist: ["auth"],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
