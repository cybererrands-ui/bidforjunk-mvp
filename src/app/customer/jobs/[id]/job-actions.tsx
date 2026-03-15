"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { acceptOffer } from "@/actions/offers";
import { cancelJob } from "@/actions/jobs";
import { sendMessage, getMessages } from "@/actions/messages";
import { CheckCircle, XCircle, AlertTriangle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

// Accept Offer Button
export function AcceptOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      await acceptOffer(offerId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to accept offer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? "Accepting..." : "Accept Offer"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Reject Offer Button
export function RejectOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("id", offerId);
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
    >
      <XCircle className="w-4 h-4" />
      {loading ? "Rejecting..." : "Reject"}
    </button>
  );
}

// Cancel Job Button
export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this job?")) return;
    setLoading(true);
    setError(null);
    try {
      await cancelJob(jobId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to cancel job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel Job"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Confirm Completion Button
export function ConfirmCompletionButton({
  jobId,
  confirmationId,
}: {
  jobId: string;
  confirmationId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      if (confirmationId) {
        await supabase
          .from("confirmations")
          .update({
            customer_confirmed: true,
            customer_confirmed_at: new Date().toISOString(),
          })
          .eq("id", confirmationId);
      } else {
        await supabase.from("confirmations").insert({
          job_id: jobId,
          customer_confirmed: true,
          customer_confirmed_at: new Date().toISOString(),
          deadline_at: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
        });
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to confirm");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? "Confirming..." : "Confirm Job Complete"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Customer Chat Thread
interface ChatMessage {
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

export function CustomerChatThread({
  jobId,
  profileId,
}: {
  jobId: string;
  profileId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(jobId);
      setMessages((msgs as any as ChatMessage[]) || []);
    } catch {
      // Messages may fail if none exist yet
    } finally {
      setInitialLoading(false);
    }
  }, [jobId]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase, loadMessages]);

  // Polling fallback — ensures real-time feel even if Supabase
  // Realtime publication is not yet enabled on the messages table
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setLoading(true);
    setError(null);
    const text = chatMessage;
    setChatMessage("");

    try {
      await sendMessage(jobId, profileId, text);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      setChatMessage(text); // Restore on failure
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <h2 className="font-semibold text-lg mb-4">Messages</h2>
        <p className="text-gray-500 text-sm py-4">Loading messages...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-semibold text-lg mb-4">Messages</h2>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 font-medium">
          Keep all communication on BidForJunk until you accept an offer.
          Once accepted, your provider&apos;s contact info will be shared
          with you. Any work arranged outside the platform is at your
          sole risk and not covered by our dispute resolution.
        </p>
      </div>

      {messages.length > 0 ? (
        <div
          ref={scrollRef}
          className="space-y-3 max-h-96 overflow-y-auto mb-4 pr-1"
        >
          {messages.map((msg) => {
            const isMe = msg.sender_id === profileId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    isMe
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-xs font-medium mb-1 opacity-80">
                    {msg.sender?.display_name ?? "Unknown"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
          No messages yet. Send a message to the provider!
        </p>
      )}

      {error && (
        <p className="text-red-600 text-xs mb-2">{error}</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !chatMessage.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </Card>
  );
}
