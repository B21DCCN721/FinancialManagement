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
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const startYRef = React.useRef<number>(0); // Thay thế cho (handleTouchMove as any)._startY

  // Đồng bộ trạng thái khóa body scroll
  React.useEffect(() => {
    if (!isOpen) return;

    // Kích hoạt lock scroll khi mở
    const scrollY = window.scrollY;
    const originalStyles = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyTouchAction: document.body.style.touchAction,
      htmlOverflow: document.documentElement.style.overflow,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        e.preventDefault();
        return;
      }

      const target = e.target as Node;
      if (!scrollContainer.contains(target)) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if (scrollHeight <= clientHeight) {
        e.preventDefault();
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaY = startYRef.current - touch.clientY;

        if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
          e.preventDefault();
        }
      }
    };

    // Lắng nghe phím ESC để đóng modal (A11y)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);

      // KHÔNG khôi phục style ngay tại đây để tránh nháy giật layout khi exit animation đang chạy
      document.body.style.overflow = originalStyles.bodyOverflow;
      document.body.style.position = originalStyles.bodyPosition;
      document.body.style.top = originalStyles.bodyTop;
      document.body.style.left = originalStyles.bodyLeft;
      document.body.style.right = originalStyles.bodyRight;
      document.body.style.width = originalStyles.bodyWidth;
      document.body.style.touchAction = originalStyles.bodyTouchAction;
      document.documentElement.style.overflow = originalStyles.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onClose]);

  return (
    // Sử dụng onExitComplete để dọn dẹp mượt mà sau khi hiệu ứng biến mất kết thúc
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose} // Bấm ra ngoài backdrop tự đóng
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Scroll container */}
          <div
            ref={scrollContainerRef}
            className="fixed inset-0 z-50 overflow-y-auto h-dvh w-screen"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            <div className="flex min-h-full items-start justify-center p-4 text-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className={cn(
                  "relative w-full max-w-lg pointer-events-auto rounded-xl border bg-background p-6 shadow-lg text-left mt-16 sm:mt-24 mb-4",
                  className
                )}
              >
                <div className="flex flex-col space-y-1.5 mb-4">
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
        </>
      )}
    </AnimatePresence>
  );
}