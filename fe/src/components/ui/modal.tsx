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
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      // Push a dummy state to intercept the Android back button
      window.history.pushState({ modalOpen: true }, "");
      
      const handlePopState = (e: PopStateEvent) => {
        // If the state is popped (user pressed back), close the modal
        onClose();
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("popstate", handlePopState);
        // If modal was closed via X button, we need to clean up the dummy state
        if (window.history.state && window.history.state.modalOpen) {
          window.history.back();
        }
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 text-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className={cn(
                  "relative w-full max-w-lg pointer-events-auto rounded-xl border bg-background p-6 shadow-lg shadow-black/20 text-left mt-16 sm:mt-24",
                  className
                )}
              style={{ WebkitFontSmoothing: "antialiased", transform: "translateZ(0)" }}
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
        </>
      )}
    </AnimatePresence>
  );
}
