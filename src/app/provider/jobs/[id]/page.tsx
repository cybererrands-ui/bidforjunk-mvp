"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { JUNK_TYPES } from "@/lib/constants";
import { JobStatus } from "@/lib/types";
import { submitOffer } from "@/actions/offers";
import { markInProgress } from "@/actions/dispatch";
import { confirmCompletion } from "@/actions/confirmations";
import { sendMessage, getMessages } from "@/actions/messages";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

export default function ProviderJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [dispatch, setDispatch] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bidPrice, setBidPrice] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Get current user profile
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, role")
        .eq("user_id", userData.user.id)
        .single();

      setProfile(profileData);

      // Fetch job
      const { data: jobData } = await supabase
        .from("jobs")
        .select(
          `
          *,
          customer:profiles!jobs_customer_id_fkey (
            id,
            display_name,
            email
          )
        `
        )
        .eq("id", params.id)
        .single();

      setJob(jobData);

      // Fetch offers for this job by this provider
      if (profileData) {
        const { data: offersData } = await supabase
          .from("offers")
          .select("*")
          .eq("job_id", params.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        setOffers(offersData || []);
      }

      // Fetch dispatch assignment if any
      const { data: dispatchData } = await supabase
        .from("dispatch_assignments")
        .select("*")
        .eq("job_id", params.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setDispatch(dispatchData);

      // Fetch confirmation status
      const { data: confirmData } = await supabase
        .from("confirmations")
        .select("*")
        .eq("job_id", params.id)
        .maybeSingle();

      setConfirmation(confirmData);

      // Fetch messages
      try {
        const msgs = await getMessages(params.id);
        setMessages((msgs as any as Message[]) || []);
      } catch {
        // Messages may fail if none exist
      }
    } finally {
      setPageLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`provider-messages:${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${params.id}`,
        },
        async () => {
          try {
            const msgs = await getMessages(params.id);
            setMessages((msgs as any as Message[]) || []);
          } catch {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, supabase]);

  // Polling fallback — ensures real-time feel even if Supabase
  // Realtime publication is not yet enabled on the messages table
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(params.id);
        setMessages((msgs as any as Message[]) || []);
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  const myOffers = profile
    ? offers.filter((o) => o.provider_id === profile.id)
    : [];
  const hasUserBid = myOffers.some((o) => o.kind === "bid");
  const isAssignedToMe =
    dispatch && profile && dispatch.provider_id === profile.id;

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!bidPrice) throw new Error("Please enter a bid price");
      if (!profile) throw new Error("Not authenticated");

      await submitOffer(
        params.id,
        profile.id,
        Math.round(parseFloat(bidPrice) * 100),
        bidNotes || undefined
      );

      setBidPrice("");
      setBidNotes("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInProgress = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await markInProgress(params.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark in progress");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await confirmCompletion(params.id, "provider");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm completion"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !profile) return;
    setLoading(true);
    try {
      await sendMessage(params.id, profile.id, chatMessage);
      setChatMessage("");
      const msgs = await getMessages(params.id);
      setMessages((msgs as any as Message[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Job Not Found</h2>
        <p className="text-gray-600 mt-2">
          This job may have been removed or you don&apos;t have access.
        </p>
      </div>
    );
  }

  const customer = job.customer as any;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-600 mt-1">
            {job.location_city}, {job.location_state}
          </p>
        </div>
        <JobStatusBadge status={job.status as JobStatus} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content: left 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {/* Job details */}
          <Card>
            <h2 className="font-semibold text-lg mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{job.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Junk Types</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.junk_types?.map((type: string) => (
                    <Badge key={type} variant="info">
                      {JUNK_TYPES[type as keyof typeof JUNK_TYPES] ?? type}
                    </Badge>
                  ))}
                </div>
              </div>

              {job.estimated_volume && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Volume</p>
                  <p className="mt-1">{job.estimated_volume}</p>
                </div>
              )}

              {job.budget_cents && (
                <div>
                  <p className="text-sm text-gray-600">Customer Budget</p>
                  <p className="mt-1 font-medium">
                    {formatCurrency(job.budget_cents)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="mt-1">{job.location_address}</p>
              </div>

              {job.preferred_time && (
                <div>
                  <p className="text-sm text-gray-600">Preferred Time</p>
                  <p className="mt-1">{job.preferred_time}</p>
                </div>
              )}

              {/* Photos */}
              {job.photos_urls && job.photos_urls.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.photos_urls.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Job photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="mt-1">{formatDate(job.created_at)}</p>
              </div>
            </div>
          </Card>

          {/* Dispatch info (when dispatched to this provider) */}
          {isAssignedToMe && dispatch && (
            <Card>
              <h2 className="font-semibold text-lg mb-4">Dispatch Details</h2>
              <div className="space-y-2 text-sm">
                {dispatch.scheduled_date && (
                  <p>
                    <strong>Scheduled Date:</strong>{" "}
                    {formatDate(dispatch.scheduled_date)}
                  </p>
                )}
                {dispatch.scheduled_time_start && (
                  <p>
                    <strong>Time Window:</strong>{" "}
                    {dispatch.scheduled_time_start} -{" "}
                    {dispatch.scheduled_time_end}
                  </p>
                )}
              </div>

              {/* Action buttons based on status */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {job.status === "dispatched" && (
                  <Button
                    onClick={handleMarkInProgress}
                    loading={actionLoading}
                  >
                    Mark In Progress
                  </Button>
                )}

                {job.status === "in_progress" && (
                  <Button
                    onClick={handleMarkComplete}
                    loading={actionLoading}
                  >
                    Mark Complete
                  </Button>
                )}

                {job.status === "completed" && confirmation && (
                  <div className="space-y-2">
                    {confirmation.provider_confirmed ? (
                      <Badge variant="success">You confirmed completion</Badge>
                    ) : (
                      <Button
                        onClick={handleMarkComplete}
                        loading={actionLoading}
                      >
                        Confirm Work Completed
                      </Button>
                    )}
                    {confirmation.customer_confirmed ? (
                      <Badge variant="success" className="ml-2">
                        Customer confirmed
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Waiting for customer confirmation...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Chat / Messages thread */}
          <Card>
            <h2 className="font-semibold text-lg mb-4">Messages</h2>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-medium">
                All communication must stay on BidForJunk. Sharing contact
                information (phone, email, social media) is prohibited. Any
                transactions conducted outside the platform are at the
                customer&apos;s sole risk and not covered by our escrow
                protection or dispute resolution.
              </p>
            </div>

            {messages.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          isMe
                            ? "bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-80">
                          {msg.sender?.display_name ?? "Unknown"}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p className="text-xs mt-1 opacity-60">
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">
                No messages yet. Start the conversation!
              </p>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <Button type="submit" loading={loading} size="sm">
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar: right col */}
        <div className="space-y-6">
          {/* Your bid / offers info */}
          {myOffers.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4">Your Offers</h2>
              <div className="space-y-3">
                {myOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium capitalize">
                        {offer.kind}
                      </span>
                      <Badge
                        variant={
                          offer.status === "accepted"
                            ? "success"
                            : offer.status === "rejected"
                              ? "danger"
                              : "default"
                        }
                      >
                        {offer.status}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-brand-600">
                      {formatCurrency(offer.price_cents)}
                    </p>
                    {offer.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        {offer.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(offer.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Agreed price */}
          {job.agreed_price_cents && (
            <Card>
              <h2 className="font-semibold mb-2">Agreed Price</h2>
              <p className="text-3xl font-bold text-brand-600">
                {formatCurrency(job.agreed_price_cents)}
              </p>
            </Card>
          )}

          {/* Bid form -- show only if job is open and provider hasn't bid */}
          {!hasUserBid && job.status === "open" && (
            <Card>
              <h2 className="font-semibold mb-4">Place Your Bid</h2>

              <form onSubmit={handleSubmitBid} className="space-y-4">
                <Input
                  label="Your Bid Price (CAD)"
                  type="number"
                  step="0.01"
                  min="1"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />

                <Textarea
                  label="Notes (Optional)"
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  placeholder="Tell the customer about your experience, equipment, timeline..."
                  rows={4}
                />

                <Button type="submit" loading={loading} className="w-full">
                  Submit Bid
                </Button>
              </form>
            </Card>
          )}

          {/* Status-specific sidebar actions */}
          {!isAssignedToMe && job.status === "dispatched" && (
            <Card>
              <p className="text-sm text-gray-600">
                This job has been dispatched to another provider.
              </p>
            </Card>
          )}

          {job.status === "in_progress" && isAssignedToMe && (
            <Card>
              <h2 className="font-semibold mb-2">Job In Progress</h2>
              <p className="text-sm text-gray-600">
                Complete the work and mark it done when finished.
              </p>
              <Button
                onClick={handleMarkComplete}
                loading={actionLoading}
                className="w-full mt-4"
              >
                Mark Complete
              </Button>
            </Card>
          )}

          {/* Customer info */}
          {customer && (
            <Card>
              <h2 className="font-semibold mb-2">Customer</h2>
              <p className="text-sm">{customer.display_name}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
