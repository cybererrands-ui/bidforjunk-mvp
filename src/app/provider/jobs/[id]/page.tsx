"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { JUNK_TYPES } from "@/lib/constants";
import { submitOffer } from "@/actions/offers";
import { formatDate } from "@/lib/utils";

export default function ProviderJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [bidPrice, setBidPrice] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUserBid, setHasUserBid] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", params.id)
        .single();

      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("job_id", params.id)
        .is("deleted_at", null);

      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = userData.user
        ? await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userData.user.id)
            .single()
        : { data: null };

      setJob(jobData);
      setOffers(offersData || []);

      if (profile && offersData) {
        const userHasBid = offersData.some(
          (o) => o.provider_id === profile.id && o.kind === "bid"
        );
        setHasUserBid(userHasBid);
      }
    };

    loadData();
  }, [params.id]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!bidPrice) throw new Error("Please enter a bid price");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userData.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      await submitOffer(
        params.id,
        profile.id,
        Math.round(parseFloat(bidPrice) * 100),
        bidNotes || undefined
      );

      setBidPrice("");
      setBidNotes("");
      setHasUserBid(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1>{job.title}</h1>
        <p className="text-gray-600 mt-2">
          {job.location_city}, {job.location_state}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="mt-2">{job.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Junk Types</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.junk_types.map((type: string) => (
                    <Badge key={type} variant="info">
                      {JUNK_TYPES[type as keyof typeof JUNK_TYPES]}
                    </Badge>
                  ))}
                </div>
              </div>

              {job.estimated_volume && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Volume</p>
                  <p className="mt-2">{job.estimated_volume}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="mt-2">{job.location_address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="mt-2">{formatDate(job.created_at)}</p>
              </div>
            </div>
          </Card>

          {offers.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4">
                Other Bids ({offers.length})
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{offers.length} bid(s) received</p>
              </div>
            </Card>
          )}
        </div>

        {!hasUserBid && (
          <Card>
            <h2 className="font-semibold mb-4">Place Your Bid</h2>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitBid} className="space-y-4">
              <Input
                label="Your Bid Price ($)"
                type="number"
                step="0.01"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                placeholder="0.00"
                required
              />

              <Textarea
                label="Notes (Optional)"
                value={bidNotes}
                onChange={(e) => setBidNotes(e.target.value)}
                placeholder="Tell the customer about your experience..."
                rows={4}
              />

              <Button type="submit" loading={loading} className="w-full">
                Submit Bid
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
