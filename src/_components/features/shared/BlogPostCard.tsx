import Image from "next/image";
import Link from "next/link";

interface BlogPostCardProps {
  slug: string;
  title: string; // For alt text and potentially for overlay if design changes
  imageUrl: string;
}

export function BlogPostCard({ slug, title, imageUrl }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block overflow-hidden rounded-lg shadow-md transition-shadow duration-200 hover:shadow-xl"
    >
      <div className="aspect-[4/3] max-h-[220px] w-full">
        {" "}
        {/* Increased height from 180px to 220px */}
        <Image
          src={imageUrl}
          alt={title}
          width={320} // Smaller width
          height={240} // Smaller height
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-2 text-sm font-medium text-gray-800">{title}</div>{" "}
      {/* Added title below image */}
    </Link>
  );
}
