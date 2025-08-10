import { notFound } from "next/navigation";
import Image from "next/image";
import BreadcrumbsWithAnimation from "~/_components/ui/BreadcrumbsWithAnimation";
import { api } from "~/trpc/server";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Try to fetch the blog post by slug
  try {
    const resolvedParams = await params;
    const post = await api.public.blog.getBySlug({ slug: resolvedParams.slug });

    // Format the published date
    const formattedDate = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unpublished";

    return (
      <div className="flex h-full flex-col">
        <BreadcrumbsWithAnimation
          currentPath={post.title}
          parentPaths={[{ name: "Blog", path: "/blog" }]}
        />

        <article className="mx-auto max-w-3xl">
          {/* Featured Image */}
          {post.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={800}
                height={400}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}

          {/* Title and Meta */}
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl">
              {post.title}
            </h1>
            <div className="flex items-center text-sm text-gray-600">
              <span>Published: {formattedDate}</span>
              {post.author && (
                <>
                  <span className="mx-2">•</span>
                  <span>By: {post.author.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* If the content is Markdown, you'd use a Markdown renderer here.
               For now, we'll just display it as plain text with basic formatting
               or dangerouslySetInnerHTML if it has HTML */}
            <div
              className="leading-relaxed text-gray-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </div>
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    notFound();
  }
}
