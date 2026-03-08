import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface DispatchCardProps {
  jobTitle: string;
  providerName: string;
  scheduledDate?: string;
  timeWindow?: string;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function DispatchCard({ jobTitle, providerName, scheduledDate, timeWindow, onEdit, onCancel }: DispatchCardProps) {
  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold">{jobTitle}</h3>
          <p className="text-sm text-gray-600">Assigned to: {providerName}</p>
        </div>
      </div>
      {scheduledDate && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Scheduled:</strong> {formatDate(scheduledDate)}
          </p>
          {timeWindow && (
            <p className="text-sm text-gray-600">
              <strong>Time:</strong> {timeWindow}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {onEdit && <Button variant="secondary" size="sm" onClick={onEdit}>Edit</Button>}
        {onCancel && <Button variant="danger" size="sm" onClick={onCancel}>Cancel</Button>}
      </div>
    </Card>
  );
}
