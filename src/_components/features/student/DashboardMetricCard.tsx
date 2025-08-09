// src/app/_components/dashboard/DashboardMetricCard.tsx
interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
}

export function DashboardMetricCard({
  title,
  value,
  unit,
}: DashboardMetricCardProps) {
  return (
    <div className="flex flex-col">
      {/* Value area with pink background, rounded top corners and width 95% */}
      <div className="w-[95%] self-center rounded-t-lg bg-[var(--color-pink)]">
        <div className="flex items-center justify-center px-12 py-4">
          <span className="text-7xl text-[var(--color-dark-text)]">
            {value}
          </span>
        </div>
      </div>

      {/* Label area with white background - 100% width */}
      <div className="w-full bg-white px-4 py-3 text-center shadow-md">
        <span className="text-base text-[var(--color-light-text)]">
          {title} {unit && `(${unit})`}
        </span>
      </div>
    </div>
  );
}
