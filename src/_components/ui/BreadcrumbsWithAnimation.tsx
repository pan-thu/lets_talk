"use client";

import { useState } from "react";
import Link from "next/link";

interface BreadcrumbsWithAnimationProps {
  currentPath: string;
  parentPaths?: { name: string; path: string }[];
}

export default function BreadcrumbsWithAnimation({
  currentPath,
  parentPaths = [],
}: BreadcrumbsWithAnimationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Animation styles based on state
  const getAnimationClasses = () => {
    if (isPressed) {
      return "scale-95 bg-opacity-20 bg-white";
    }
    if (isHovered) {
      return "scale-105";
    }
    return "";
  };

  return (
    <div className="mb-6 flex items-center">
      {/* Home link with animation */}
      <div className="flex items-center">
        <Link
          href="/dashboard"
          className="text-custom-light-text hover:text-custom-dark-text text-sm transition-all duration-300"
        >
          Home
        </Link>

        {/* Breadcrumb Separator */}
        <svg
          className="mx-2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {/* Parent paths if any */}
      {parentPaths.map((item, index) => (
        <div key={index} className="flex items-center">
          <Link
            href={item.path}
            className="text-custom-light-text hover:text-custom-dark-text text-sm transition-all duration-300"
          >
            {item.name}
          </Link>

          {/* Breadcrumb Separator */}
          <svg
            className="mx-2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      ))}

      {/* Current path with animation */}
      <div
        className={`route-indicator rounded px-2 py-1 text-sm font-medium transition-all duration-300 ${getAnimationClasses()}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
      >
        {currentPath}
      </div>
    </div>
  );
}
