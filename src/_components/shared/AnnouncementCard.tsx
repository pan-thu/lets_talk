"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ContentSection {
  sectionTitle: string;
  sectionContent: string | string[];
}

interface AnnouncementCardProps {
  id: string | number;
  title: string;
  excerpt: string;
  date?: string;
  content?: ContentSection[];
  author?: string;
  isLatest?: boolean;
}

export function AnnouncementCard({
  id,
  title,
  excerpt,
  date,
  content,
  author,
  isLatest = false,
}: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(isLatest);

  // Update expansion state if isLatest prop changes
  useEffect(() => {
    if (isLatest) {
      setIsExpanded(true);
    }
  }, [isLatest]);

  return (
    <div className="rounded-lg bg-white shadow-md">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => content && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-[var(--color-dark-text)]">
            {title}
          </h3>
          {date && <p className="mb-2 text-xs text-gray-500">{date}</p>}
          {!isExpanded && (
            <p className="line-clamp-2 text-sm text-gray-700">{excerpt}</p>
          )}
        </div>
        {content && (
          <div className="ml-4 flex items-center text-gray-500 transition-transform duration-200">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-5 w-5 transition-transform duration-200" />
            )}
          </div>
        )}
      </div>

      {/* Expandable content with smooth height transition */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-100 p-4">
          <hr className="mb-4 border-gray-200" />

          {/* Content Sections */}
          <div className="space-y-5">
            {content?.map((section, index) => (
              <section key={index}>
                <h4 className="mb-2 text-base font-semibold text-[var(--color-dark-text)]">
                  <span className="mr-2">・</span>
                  {section.sectionTitle}
                </h4>
                {Array.isArray(section.sectionContent) ? (
                  <ul className="ml-6 list-outside list-none space-y-1 text-gray-700">
                    {section.sectionContent.map((item, itemIndex) => (
                      <li key={itemIndex} className="relative pl-4">
                        <span className="absolute top-0 left-0 text-[var(--color-dark-text)]">
                          -
                        </span>
                        {item.split("\n").map((line, lineIdx) => (
                          <span key={lineIdx} className="block">
                            {line}
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-line text-gray-700">
                    {section.sectionContent}
                  </p>
                )}
              </section>
            ))}
          </div>

          {/* Author */}
          {author && (
            <div className="mt-6 border-t border-gray-200 pt-4 text-right">
              <p className="font-semibold text-[var(--color-dark-text)]">
                {author}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
