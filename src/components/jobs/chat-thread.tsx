"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { sendMessage } from "@/actions/messages";
import { submitCounterOffer, acceptOffer } from "@/actions/offers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { OfferKind, OfferStatus } from "@/lib/types";

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

interface Offer {
  id: string;
  job_id: string;
  provider_id: string;
  customer_id: string;
  kind: OfferKind;
  status: OfferStatus;
  price_cents: number;
  notes: string | null;
  turn_number: number;
  expires_at: string | null;
  created_at: string;
  sender_name?: string;
}

type TimelineEntry =
  | { type: "message"; data: Message; created_at: string }
  | { type: "offer"; data: Offer; created_at: string };

interface ChatThreadProps {
  jobId: string;
  currentUserId: string;
  currentUserRole: "customer" | "provider";
}

function OfferBadge({ kind, status }: { kind: OfferKind; status: OfferStatus }) {
  const kindLabels: Record<OfferKind, string> = {
    bid: "Bid",
    counter: "Counter-Offer",
    accept: "Accepted",
  };

  const statusVariant: Record<OfferStatus, "default" | "success" | "warning" | "danger"> = {
    active: "warning",
    accepted: "success",
    rejected: "danger",
    expired: "default",
  };

  return (
    <div className="flex gap-2">
      <Badge variant="info">{kindLabels[kind]}</Badge>
      <Badge variant={statusVariant[status]}>{status}</Badge>
    </div>
  );
}

export function ChatThread({ jobId, currentUserId, currentUserRole }: ChatThreadProps) {
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Fetch messages and offers
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [messagesRes, offersRes] = await Promise.all([
        supabase
          .from("messages")
          .select(
            `
            id, job_id, sender_id, content, created_at,
            sender:profiles!messages_sender_id_fkey (
              id, display_name, avatar_url, role
            )
          `
          )
          .eq("job_id", jobId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true }),

        supabase
          .from("offers")
          .select(
            `
            id, job_id, provider_id, customer_id, kind, status,
            price_cents, notes, turn_number, expires_at, created_at,
            provider:profiles!offers_provider_id_fkey ( display_name ),
            customer:profiles!offers_customer_id_fkey ( display_name )
          `
          )
          .eq("job_id", jobId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true }),
      ]);

      if (messagesRes.data) {
        setMessages(messagesRes.data as unknown as Message[]);
      }

      if (offersRes.data) {
        const mapped = offersRes.data.map((o: any) => ({
          ...o,
          sender_name:
            o.kind === "bid" || o.kind === "counter"
              ? o.provider?.display_name || o.customer?.display_name || "Unknown"
              : o.customer?.display_name || "Unknown",
        }));
        setOffers(mapped);
      }

      setLoading(false);
    }

    fetchData();
  }, [jobId, supabase]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, offers]);

  // Build interleaved timeline
  const timeline: TimelineEntry[] = [
    ...messages.map(
      (m): TimelineEntry => ({ type: "message", data: m, created_at: m.created_at })
    ),
    ...offers.map(
      (o): TimelineEntry => ({ type: "offer", data: o, created_at: o.created_at })
    ),
  ].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const text = messageText;
    setMessageText("");

    startTransition(async () => {
      try {
        await sendMessage(jobId, currentUserId, text);
        // Refetch messages after sending
        const { data } = await supabase
          .from("messages")
          .select(
            `
            id, job_id, sender_id, content, created_at,
            sender:profiles!messages_sender_id_fkey (
              id, display_name, avatar_url, role
            )
          `
          )
          .eq("job_id", jobId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (data) setMessages(data as unknown as Message[]);
      } catch (err) {
        console.error("Failed to send message:", err);
        setMessageText(text); // Restore on failure
      }
    });
  };

  const handleCounterOffer = () => {
    const priceDollars = parseFloat(counterPrice);
    if (isNaN(priceDollars) || priceDollars <= 0) return;

    const priceCents = Math.round(priceDollars * 100);

    setShowCounterForm(false);
    setCounterPrice("");
    setCounterNotes("");

    startTransition(async () => {
      try {
        await submitCounterOffer(
          jobId,
          currentUserId,
          priceCents,
          counterNotes || undefined
        );
        // Refetch offers
        const { data } = await supabase
          .from("offers")
          .select(
            `
            id, job_id, provider_id, customer_id, kind, status,
            price_cents, notes, turn_number, expires_at, created_at,
            provider:profiles!offers_provider_id_fkey ( display_name ),
            customer:profiles!offers_customer_id_fkey ( display_name )
          `
          )
          .eq("job_id", jobId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (data) {
          const mapped = data.map((o: any) => ({
            ...o,
            sender_name:
              o.kind === "bid" || o.kind === "counter"
                ? o.provider?.display_name || o.customer?.display_name || "Unknown"
                : o.customer?.display_name || "Unknown",
          }));
          setOffers(mapped);
        }
      } catch (err) {
        console.error("Failed to submit counter-offer:", err);
      }
    });
  };

  const handleAcceptOffer = (offerId: string) => {
    startTransition(async () => {
      try {
        await acceptOffer(offerId);
        // Refetch offers
        const { data } = await supabase
          .from("offers")
          .select(
            `
            id, job_id, provider_id, customer_id, kind, status,
            price_cents, notes, turn_number, expires_at, created_at,
            provider:profiles!offers_provider_id_fkey ( display_name ),
            customer:profiles!offers_customer_id_fkey ( display_name )
          `
          )
          .eq("job_id", jobId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (data) {
          const mapped = data.map((o: any) => ({
            ...o,
            sender_name:
              o.kind === "bid" || o.kind === "counter"
                ? o.provider?.display_name || o.customer?.display_name || "Unknown"
                : o.customer?.display_name || "Unknown",
          }));
          setOffers(mapped);
        }
      } catch (err) {
        console.error("Failed to accept offer:", err);
      }
    });
  };

  function isOfferExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px] pr-1"
      >
        {timeline.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No messages or offers yet. Start the conversation!
          </p>
        )}

        {timeline.map((entry) => {
          if (entry.type === "message") {
            const msg = entry.data;
            const isOwn = msg.sender_id === currentUserId;

            return (
              <div
                key={`msg-${msg.id}`}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 ${
                    isOwn
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${isOwn ? "text-brand-100" : "text-gray-500"}`}>
                    {msg.sender?.display_name || "Unknown"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-brand-200" : "text-gray-400"
                    }`}
                  >
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          // Offer entry
          const offer = entry.data;
          const expired = offer.status === "active" && isOfferExpired(offer.expires_at);
          const canAccept =
            offer.status === "active" &&
            !expired &&
            ((currentUserRole === "customer" && offer.provider_id !== currentUserId) ||
              (currentUserRole === "provider" && offer.customer_id !== currentUserId));

          return (
            <Card key={`offer-${offer.id}`} className="border-brand-200 bg-brand-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {offer.sender_name || "Unknown"}
                  </p>
                  <OfferBadge kind={offer.kind} status={expired ? "expired" : offer.status} />
                </div>
                <p className="text-2xl font-bold text-brand-700">
                  {formatCurrency(offer.price_cents)}
                </p>
              </div>

              {offer.notes && (
                <p className="text-sm text-gray-600 italic mt-2">{offer.notes}</p>
              )}

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-100">
                <div className="text-xs text-gray-500">
                  <span>Turn {offer.turn_number}</span>
                  <span className="mx-2">-</span>
                  <span>{timeAgo(offer.created_at)}</span>
                  {offer.expires_at && offer.status === "active" && !expired && (
                    <span className="ml-2 text-amber-600">
                      Expires {timeAgo(offer.expires_at)}
                    </span>
                  )}
                  {expired && (
                    <span className="ml-2 text-red-600 font-medium">Expired</span>
                  )}
                </div>

                {canAccept && (
                  <Button
                    size="sm"
                    onClick={() => handleAcceptOffer(offer.id)}
                    disabled={isPending}
                  >
                    Accept
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Counter-offer form */}
      {showCounterForm && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <h4 className="font-semibold text-sm mb-3">Submit Counter-Offer</h4>
          <div className="space-y-3">
            <Input
              label={`Price (${CURRENCY_SYMBOL})`}
              type="number"
              min="1"
              step="0.01"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              placeholder="Enter your counter price"
              required
            />
            <Textarea
              label="Notes (optional)"
              value={counterNotes}
              onChange={(e) => setCounterNotes(e.target.value)}
              placeholder="Explain your counter-offer..."
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCounterOffer}
                disabled={isPending || !counterPrice}
              >
                Send Counter-Offer
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowCounterForm(false);
                  setCounterPrice("");
                  setCounterNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Message input + actions */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isPending || !messageText.trim()}
          >
            Send
          </Button>
        </div>
        <div className="mt-2">
          {!showCounterForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCounterForm(true)}
            >
              Counter-Offer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
