import { Card } from "@/components/ui/card";

interface MetricsCardProps {
  label: string;
  value: string | number;
  change?: number;
  variant?: "default" | "success" | "warning" | "danger";
}

export function MetricsCard({ label, value, change, variant = "default" }: MetricsCardProps) {
  const colors = {
    default: "text-gray-900",
    success: "text-green-600",
    warning: "text-orange-600",
    danger: "text-red-600",
  };

  return (
    <Card>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${colors[variant]}`}>{value}</p>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${change > 0 ? "text-green-600" : "text-red-600"}`}>
          {change > 0 ? "+" : ""}{change}% from last period
        </p>
      )}
    </Card>
  );
}
