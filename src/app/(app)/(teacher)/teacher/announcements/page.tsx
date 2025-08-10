"use client";

import Link from "next/link";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { AnnouncementCard } from "~/_components/shared/AnnouncementCard";
import { api } from "~/trpc/react";
import { useState } from "react";

export default function TeacherAnnouncementsPage() {
  const {
    data: announcements,
    isLoading,
    error,
  } = api.public.announcement.list.useQuery();

  // Function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation currentPath="Announcements" />
      <h1 className="section-title mb-6 text-2xl font-semibold">
        Announcements
      </h1>

      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p>Failed to load announcements. Please try again later.</p>
        </div>
      )}

      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <AnnouncementCard
              key={announcement.id}
              id={announcement.id}
              title={announcement.title}
              excerpt={announcement.excerpt}
              date={formatDate(announcement.createdAt)}
              content={announcement.content}
              author={announcement.author}
              isLatest={index === 0}
            />
          ))}
        </div>
      ) : !isLoading && !error ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">
          No announcements available at this time.
        </div>
      ) : null}
    </div>
  );
}
