"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { assignDispatch } from "@/actions/dispatch";

interface DispatchFormProps {
  jobId: string;
  providerOptions: Array<{ value: string; label: string }>;
}

export function DispatchForm({ jobId, providerOptions }: DispatchFormProps) {
  const router = useRouter();
  const [providerId, setProviderId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) {
      setError("Please select a provider");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await assignDispatch(
        jobId,
        providerId,
        scheduledDate || undefined,
        timeStart || undefined,
        timeEnd || undefined
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign dispatch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAssign} className="space-y-3 pt-3 border-t border-gray-200">
      {error && (
        <div className="p-2 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <Select
        label="Assign Provider"
        options={providerOptions}
        value={providerId}
        onChange={(e) => setProviderId(e.target.value)}
        required
      />

      <Input
        label="Scheduled Date"
        type="date"
        value={scheduledDate}
        onChange={(e) => setScheduledDate(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time"
          type="time"
          value={timeStart}
          onChange={(e) => setTimeStart(e.target.value)}
        />
        <Input
          label="End Time"
          type="time"
          value={timeEnd}
          onChange={(e) => setTimeEnd(e.target.value)}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Assign &amp; Dispatch
      </Button>
    </form>
  );
}
