interface LessonDescriptionProps {
  description: string;
}

export default function LessonDescription({
  description,
}: LessonDescriptionProps) {
  return (
    <div className="self-stretch rounded-lg bg-white p-4 shadow">
      <h2 className="text-md mb-2 font-semibold text-gray-700">Description</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
