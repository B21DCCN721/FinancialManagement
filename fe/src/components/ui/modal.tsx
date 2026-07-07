"use client";

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  // Lock body scroll — dùng position:fixed để fix iOS Safari bounce scroll
  // và lưu scrollY để restore đúng vị trí khi đóng modal
  const scrollYRef = React.useRef(0)

  React.useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollYRef.current}px`
      document.body.style.width = "100%"
    } else {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      window.scrollTo(0, scrollYRef.current)
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
    }
  }, [isOpen])

  // Đóng modal khi nhấn Escape
  React.useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — z-50 để nằm trên sidebar overlay (z-40) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/*
            Scroll container:
            - Dùng `dvh` thay vì `vh` → tự co lại khi bàn phím ảo bật trên Android Chrome
            - overflow-y-auto cho phép scroll nội dung modal nếu form dài
            - isolate tạo stacking context riêng, tránh tranh chấp scroll với sidebar
            - overscroll-contain ngăn scroll lan ra body khi kéo đến đầu/cuối modal
          */}
          <div
            className="fixed inset-0 z-50 isolate"
            style={{ height: "100dvh" }}
          >
            <div
              className="h-full overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex min-h-full items-start justify-center p-4 text-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                  className={cn(
                    "relative w-full max-w-lg pointer-events-auto rounded-xl border bg-background p-6 shadow-lg shadow-black/20 text-left mt-16 mb-4",
                    className
                  )}
                  style={{ WebkitFontSmoothing: "antialiased" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                    <div className="flex items-center justify-between">
                      {title && <h2 className="text-xl font-bold text-foreground leading-none tracking-tight">{title}</h2>}
                      <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 -mt-2 rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </div>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                  </div>
                  {children}
                </motion.div>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}