"use client";

import { useState } from "react";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { BlogPostCard } from "~/_components/features/shared/BlogPostCard";
import { PaginationControls } from "~/_components/features/shared/PaginationControls";
import { api } from "~/trpc/react";

export default function TeacherBlogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = api.public.blog.listPublished.useQuery({
    page: currentPage,
    limit: 6, // Match the previous POSTS_PER_PAGE constant
  });

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation currentPath="Blog" />
      <h1 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
        Blogs With Steamy & Creamy
      </h1>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p>Failed to load blog posts. Please try again later.</p>
        </div>
      )}

      {/* Blog Post Grid */}
      {data && data.posts && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {data.posts.map((post) => (
            <BlogPostCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              imageUrl={post.imageUrl || "https://placekitten.com/400/300"} // Fallback image
            />
          ))}
        </div>
      )}

      {/* Show message if no posts */}
      {data && data.posts && data.posts.length === 0 && (
        <p className="my-8 text-center text-gray-500">No blog posts found.</p>
      )}

      {/* Pagination - Always show when data is loaded */}
      {data && data.posts && data.posts.length > 0 && (
        <div className="mt-6 flex justify-center">
          <PaginationControls
            currentPage={data.currentPage}
            totalPages={Math.max(1, data.totalPages)} // Ensure at least 1 page
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
