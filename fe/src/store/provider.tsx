"use client"

import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { makeStore } from "./store"
import { persistStore } from "redux-persist"
import React from "react"

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // Thay vì dùng useRef và cập nhật trong lúc render (vi phạm rule của React 19), 
  // chúng ta dùng useState với lazy initializer để khởi tạo chính xác 1 lần.
  const [{ store, persistor }] = React.useState(() => {
    const newStore = makeStore()
    const newPersistor = persistStore(newStore)
    return { store: newStore, persistor: newPersistor }
  })

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
