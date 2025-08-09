"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { PostStatus } from "@prisma/client";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";

export default function AdminBlogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    post: any | null;
  }>({ isOpen: false, post: null });
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    post: any | null;
  }>({ isOpen: false, post: null });

  // Form states
  const [blogPostForm, setBlogPostForm] = useState({
    title: "",
    content: "",
    summary: "",
    tags: "",
    status: PostStatus.DRAFT,
  });

  // Queries and mutations
  const {
    data: blogPostsData,
    isLoading: blogPostsLoading,
    error: blogPostsError,
  } = api.admin.management.listAllBlogPosts.useQuery({
    page: currentPage,
    limit: 12,
    search: searchTerm || undefined,
  });

  const utils = api.useUtils();

  const createBlogPostMutation =
    api.admin.management.createBlogPost.useMutation({
      onSuccess: () => {
        utils.admin.management.listAllBlogPosts.invalidate();
        setIsCreateModalOpen(false);
        setBlogPostForm({
          title: "",
          content: "",
          summary: "",
          tags: "",
          status: PostStatus.DRAFT,
        });
        alert("Blog post created successfully!");
      },
      onError: (error) => {
        alert(`Error creating blog post: ${error.message}`);
      },
    });

  const updateBlogPostMutation =
    api.admin.management.updateBlogPost.useMutation({
      onSuccess: () => {
        utils.admin.management.listAllBlogPosts.invalidate();
        setEditModalState({ isOpen: false, post: null });
        alert("Blog post updated successfully!");
      },
      onError: (error) => {
        alert(`Error updating blog post: ${error.message}`);
      },
    });

  const deleteBlogPostMutation =
    api.admin.management.deleteBlogPost.useMutation({
      onSuccess: () => {
        utils.admin.management.listAllBlogPosts.invalidate();
        setDeleteModalState({ isOpen: false, post: null });
        alert("Blog post deleted successfully!");
      },
      onError: (error) => {
        alert(`Error deleting blog post: ${error.message}`);
      },
    });

  // Handlers
  const handleCreateBlogPost = () => {
    if (blogPostForm.title && blogPostForm.content) {
      createBlogPostMutation.mutate({
        ...blogPostForm,
        tags: blogPostForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    }
  };

  const handleUpdateBlogPost = () => {
    if (editModalState.post && blogPostForm.title && blogPostForm.content) {
      updateBlogPostMutation.mutate({
        blogPostId: editModalState.post.id,
        ...blogPostForm,
        tags: blogPostForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    }
  };

  const handleDeleteBlogPost = () => {
    if (deleteModalState.post) {
      deleteBlogPostMutation.mutate({
        blogPostId: deleteModalState.post.id,
      });
    }
  };

  const openEditModal = (post: any) => {
    setBlogPostForm({
      title: post.title,
      content: post.content,
      summary: post.summary || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      status: post.status,
    });
    setEditModalState({ isOpen: true, post });
  };

  const getStatusBadgeClass = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return "bg-green-100 text-green-800";
      case PostStatus.DRAFT:
        return "bg-yellow-100 text-yellow-800";
      case PostStatus.ARCHIVED:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PUBLISHED:
        return <CheckCircle className="h-4 w-4" />;
      case PostStatus.DRAFT:
        return <Clock className="h-4 w-4" />;
      case PostStatus.ARCHIVED:
        return <XCircle className="h-4 w-4" />;
    }
  };

  if (blogPostsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (blogPostsError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-red-600">
            Error loading blog posts: {blogPostsError.message}
          </p>
        </div>
      </div>
    );
  }

  const { blogPosts, pagination } = blogPostsData || {
    blogPosts: [],
    pagination: { page: 1, pages: 1, total: 0 },
  };

  const stats = {
    total: pagination.total,
    published: blogPosts.filter((p) => p.status === PostStatus.PUBLISHED)
      .length,
    draft: blogPosts.filter((p) => p.status === PostStatus.DRAFT).length,
    archived: blogPosts.filter((p) => p.status === PostStatus.ARCHIVED).length,
  };

  return (
    <div className="flex h-full flex-col">
      <BreadcrumbsWithAnimation
        parentPaths={[{ name: "Admin", path: "/admin/dashboard" }]}
        currentPath="Blog Management"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Blog Management
          </h1>
          <p className="text-gray-600">Create and manage blog posts</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Blog Post
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.published}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.archived}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border-gray-300 py-2 pr-4 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:w-80"
          />
        </div>
      </div>

      {/* Blog Posts Grid */}
      {blogPosts.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? "No blog posts found" : "No blog posts yet"}
          </h3>
          <p className="mt-2 text-gray-600">
            {searchTerm
              ? "Try adjusting your search."
              : "Get started by creating your first blog post."}
          </p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="mb-3 line-clamp-3 text-sm text-gray-600">
                      {post.summary}
                    </p>
                  )}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        post.status,
                      )}`}
                    >
                      {getStatusIcon(post.status)}
                      {post.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>
                      Created {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </span>
                    {post.author && (
                      <>
                        <span className="mx-2">•</span>
                        <span>by {post.author.name}</span>
                      </>
                    )}
                  </div>
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(post)}
                  className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteModalState({ isOpen: true, post })}
                  className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
                {post.slug && (
                  <button
                    onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                    className="inline-flex items-center gap-1 rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * 12 + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 12, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            : "text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create Blog Post Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Blog Post"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Blog Post Title"
            value={blogPostForm.title}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                title: e.target.value,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <textarea
            placeholder="Summary (optional)"
            value={blogPostForm.summary}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                summary: e.target.value,
              })
            }
            rows={2}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <textarea
            placeholder="Blog Post Content"
            value={blogPostForm.content}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                content: e.target.value,
              })
            }
            rows={6}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={blogPostForm.tags}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                tags: e.target.value,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <select
            value={blogPostForm.status}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                status: e.target.value as PostStatus,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={PostStatus.DRAFT}>Draft</option>
            <option value={PostStatus.PUBLISHED}>Published</option>
            <option value={PostStatus.ARCHIVED}>Archived</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createBlogPostMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateBlogPost}
              disabled={
                !blogPostForm.title ||
                !blogPostForm.content ||
                createBlogPostMutation.isPending
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createBlogPostMutation.isPending
                ? "Creating..."
                : "Create Blog Post"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Blog Post Modal */}
      <Modal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, post: null })}
        title="Edit Blog Post"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Blog Post Title"
            value={blogPostForm.title}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                title: e.target.value,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <textarea
            placeholder="Summary (optional)"
            value={blogPostForm.summary}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                summary: e.target.value,
              })
            }
            rows={2}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <textarea
            placeholder="Blog Post Content"
            value={blogPostForm.content}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                content: e.target.value,
              })
            }
            rows={6}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={blogPostForm.tags}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                tags: e.target.value,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <select
            value={blogPostForm.status}
            onChange={(e) =>
              setBlogPostForm({
                ...blogPostForm,
                status: e.target.value as PostStatus,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={PostStatus.DRAFT}>Draft</option>
            <option value={PostStatus.PUBLISHED}>Published</option>
            <option value={PostStatus.ARCHIVED}>Archived</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalState({ isOpen: false, post: null })}
              disabled={updateBlogPostMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateBlogPost}
              disabled={
                !blogPostForm.title ||
                !blogPostForm.content ||
                updateBlogPostMutation.isPending
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateBlogPostMutation.isPending
                ? "Updating..."
                : "Update Blog Post"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Blog Post Modal */}
      <Modal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, post: null })}
        title="Delete Blog Post"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete "{deleteModalState.post?.title}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalState({ isOpen: false, post: null })}
              disabled={deleteBlogPostMutation.isPending}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteBlogPost}
              disabled={deleteBlogPostMutation.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteBlogPostMutation.isPending
                ? "Deleting..."
                : "Delete Blog Post"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


