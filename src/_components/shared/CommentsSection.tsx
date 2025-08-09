"use client";

import { useState } from "react";
import { Reply } from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

interface CommentsSectionProps {
  lessonId: number;
}

interface CommentData {
  id: number;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
  replies?: CommentData[];
}

interface ReplyComponentProps {
  comment: CommentData;
  lessonId: number;
  level: number;
  onReply: (commentId: number) => void;
  replyingTo: number | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  onCancelReply: () => void;
  isSubmitting: boolean;
  currentUserInitials: string;
  getInitials: (name: string | null) => string;
  formatTimeAgo: (date: Date) => string;
}

function ReplyComponent({
  comment,
  lessonId,
  level,
  onReply,
  replyingTo,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  isSubmitting,
  currentUserInitials,
  getInitials,
  formatTimeAgo,
}: ReplyComponentProps) {
  const maxLevel = 3;
  const canReply = level < maxLevel;
  const avatarSize = level === 0 ? "h-10 w-10" : "h-8 w-8";
  const textSize = level === 0 ? "text-sm" : "text-xs";
  const bgColor = level === 0 ? "bg-gray-500" : "bg-gray-400";

  return (
    <div className="flex space-x-3">
      <div
        className={`flex ${avatarSize} items-center justify-center rounded-full ${bgColor} ${textSize} font-semibold text-white`}
      >
        {getInitials(comment.user.name)}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className={`${textSize} font-semibold text-gray-900`}>
            {comment.user.name || "Anonymous"}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>
        <p className={`mt-1 ${textSize} leading-relaxed text-gray-700`}>
          {comment.content}
        </p>

        {canReply && (
          <div className="mt-2 flex items-center space-x-4">
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center space-x-1 text-gray-500 transition-colors hover:text-blue-600"
              disabled={isSubmitting}
            >
              <Reply className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </button>
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-3 flex space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-xs font-semibold text-white">
              {currentUserInitials}
            </div>
            <div className="flex-1">
              <textarea
                placeholder={`Reply to ${comment.user.name || "Anonymous"}...`}
                className="w-full resize-none border-b border-gray-300 bg-transparent p-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={1}
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={onCancelReply}
                  className="rounded-full px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyText.trim() || isSubmitting}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    replyText.trim() && !isSubmitting
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  {isSubmitting ? "Posting..." : "Reply"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div
            className={`mt-4 space-y-3 ${level < 2 ? "ml-4 border-l border-gray-200 pl-4" : ""}`}
          >
            {comment.replies.map((reply) => (
              <ReplyComponent
                key={reply.id}
                comment={reply}
                lessonId={lessonId}
                level={level + 1}
                onReply={onReply}
                replyingTo={replyingTo}
                replyText={replyText}
                onReplyTextChange={onReplyTextChange}
                onSubmitReply={onSubmitReply}
                onCancelReply={onCancelReply}
                isSubmitting={isSubmitting}
                currentUserInitials={currentUserInitials}
                getInitials={getInitials}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsSection({ lessonId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: session } = useSession();
  const utils = api.useUtils();

  // Fetch comments
  const { data: comments, isLoading } =
    api.student.lessonComment.listByLesson.useQuery({
      lessonId,
    });

  // Add comment mutation
  const addComment = api.student.lessonComment.add.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      setReplyText("");
      utils.student.lessonComment.listByLesson.invalidate({ lessonId });
    },
    onError: (error) => {
      alert(`Error adding comment: ${error.message}`);
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    addComment.mutate({
      lessonId,
      content: newComment.trim(),
    });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyText.trim()) return;

    addComment.mutate({
      lessonId,
      content: replyText.trim(),
      parentId,
    });
  };

  const handleReplyClick = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentUserInitials = getInitials(session?.user?.name || null);

  // Count total comments including nested replies
  const countTotalComments = (comments: CommentData[]): number => {
    return comments.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countTotalComments(comment.replies) : 0)
      );
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="mt-8 w-full rounded-lg bg-white p-4 shadow-md md:p-6">
        <div className="text-center">Loading comments...</div>
      </div>
    );
  }

  const totalComments = comments ? countTotalComments(comments) : 0;

  return (
    <div className="mt-8 w-full rounded-lg bg-white p-4 shadow-md md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="section-title text-xl font-semibold">
          Comments & Questions
        </h2>
        <span className="text-sm text-gray-500">{totalComments} comments</span>
      </div>

      {/* Add Comment Section */}
      <div className="mb-6 flex space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
          {currentUserInitials}
        </div>
        <div className="flex-1">
          <textarea
            placeholder="Add a comment..."
            className="w-full resize-none border-b border-gray-300 bg-transparent p-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={1}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={addComment.isPending}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={() => setNewComment("")}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              disabled={addComment.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || addComment.isPending}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                newComment.trim() && !addComment.isPending
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              {addComment.isPending ? "Posting..." : "Comment"}
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments?.map((comment) => (
          <ReplyComponent
            key={comment.id}
            comment={comment}
            lessonId={lessonId}
            level={0}
            onReply={handleReplyClick}
            replyingTo={replyingTo}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            onSubmitReply={handleSubmitReply}
            onCancelReply={handleCancelReply}
            isSubmitting={addComment.isPending}
            currentUserInitials={currentUserInitials}
            getInitials={getInitials}
            formatTimeAgo={formatTimeAgo}
          />
        ))}

        {comments?.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No comments yet. Be the first to ask a question!
          </div>
        )}
      </div>
    </div>
  );
}
