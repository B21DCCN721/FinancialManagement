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
  const scrollYRef = React.useRef(0)

  // Lock body scroll
  // Dùng overflow:hidden thôi (không position:fixed) để tránh làm hỏng scroll container
  // iOS Safari bounce được xử lý bằng overscroll-behavior:none trên modal overlay
  React.useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
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
          {/* Backdrop */}
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
            Overlay đồng thời là scroll container:
            - z-[51] để nằm trên backdrop (z-50) nhưng click-through đến backdrop không bị block
            - overflow-y-auto + height:100dvh → tự co theo bàn phím ảo Android Chrome
            - overscroll-behavior:none → fix iOS Safari bounce scroll qua body
            - pointer-events:none trên overlay để click backdrop vẫn hoạt động
            - pointer-events:auto chỉ trên modal content
          */}
          <div
            className="fixed inset-0 z-51 overflow-y-auto"
            style={{
              height: "100dvh",
              overscrollBehavior: "none",
              WebkitOverflowScrolling: "touch",
              pointerEvents: "none",
            }}
          >
            <div className="flex min-h-full items-start justify-center px-4 pb-8 pt-16 sm:pt-24">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className={cn(
                  "relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg shadow-black/20 text-left",
                  className
                )}
                style={{
                  WebkitFontSmoothing: "antialiased",
                  pointerEvents: "auto",  // chỉ modal content nhận events
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                  <div className="flex items-center justify-between">
                    {title && (
                      <h2 className="text-xl font-bold text-foreground leading-none tracking-tight">
                        {title}
                      </h2>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="-mr-2 -mt-2 rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                {children}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}