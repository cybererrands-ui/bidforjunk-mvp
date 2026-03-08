import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OfferKind, OfferStatus } from "@/lib/types";

interface Offer {
  id: string;
  kind: OfferKind;
  status: OfferStatus;
  price_cents: number;
  notes?: string;
  created_at: string;
  provider?: { display_name: string; avg_rating?: number };
}

interface OfferThreadProps {
  offers: Offer[];
  isCustomer?: boolean;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
}

export function OfferThread({ offers, isCustomer = false, onAccept, onReject }: OfferThreadProps) {
  if (!offers || offers.length === 0) {
    return (
      <Card>
        <p className="text-gray-600 text-center py-8">No offers yet. Check back later!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <Card key={offer.id}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{offer.kind === "bid" ? "Bid" : "Counter-offer"}</h3>
              {offer.provider && (
                <p className="text-sm text-gray-600">
                  {offer.provider.display_name}
                  {offer.provider.avg_rating && ` • ${offer.provider.avg_rating}★`}
                </p>
              )}
            </div>
            <Badge
              variant={
                offer.status === "accepted" ? "success" : offer.status === "rejected" ? "danger" : "default"
              }
            >
              {offer.status}
            </Badge>
          </div>
          <div className="mb-4">
            <p className="text-3xl font-bold text-brand-600">{formatCurrency(offer.price_cents)}</p>
            {offer.notes && <p className="text-gray-600 text-sm mt-2 italic">{offer.notes}</p>}
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500">{formatDate(offer.created_at)}</span>
            {isCustomer && offer.status === "active" && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onReject?.(offer.id)}>
                  Reject
                </Button>
                <Button size="sm" onClick={() => onAccept?.(offer.id)}>
                  Accept
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
