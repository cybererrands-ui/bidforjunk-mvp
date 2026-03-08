import { Card } from "@/components/ui/card";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import Link from "next/link";
import { JobStatus } from "@/lib/types";

interface JobCardProps {
  id: string;
  title: string;
  city: string;
  state: string;
  description: string;
  status: JobStatus;
  agreedPrice?: number;
  createdAt: string;
  href: string;
}

export function JobCard({ title, city, state, description, status, agreedPrice, createdAt, href }: JobCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-gray-600 text-sm">{city}, {state}</p>
          </div>
          <JobStatusBadge status={status} />
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          {agreedPrice ? (
            <span className="font-semibold">{formatCurrency(agreedPrice)}</span>
          ) : (
            <span className="text-gray-500 text-sm">Price TBD</span>
          )}
          <span className="text-sm text-gray-500">{timeAgo(createdAt)}</span>
        </div>
      </Card>
    </Link>
  );
}
