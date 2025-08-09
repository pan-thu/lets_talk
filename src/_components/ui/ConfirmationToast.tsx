"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface ConfirmationToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function ConfirmationToast({
  message,
  isVisible,
  onClose,
  duration = 4000,
}: ConfirmationToastProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setAnimationClass("toast-enter");

      if (duration > 0) {
        const timer = setTimeout(() => {
          setAnimationClass("toast-exit");
          setTimeout(() => {
            setShouldRender(false);
            onClose();
          }, 300); // Match animation duration
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setAnimationClass("toast-exit");
      setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }
  }, [isVisible, duration, onClose]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed right-4 bottom-4 z-50 ${animationClass}`}>
      <div className="flex items-center space-x-3 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg">
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setAnimationClass("toast-exit");
            setTimeout(() => {
              setShouldRender(false);
              onClose();
            }, 300);
          }}
          className="ml-2 rounded-full p-1 transition-colors hover:bg-green-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
