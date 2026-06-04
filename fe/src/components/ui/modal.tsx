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
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className={cn(
                "w-full max-w-lg pointer-events-auto rounded-xl border bg-background p-6 shadow-lg shadow-black/20",
                className
              )}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                <div className="flex items-center justify-between">
                  {title && <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
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
        </>
      )}
    </AnimatePresence>
  );
}
