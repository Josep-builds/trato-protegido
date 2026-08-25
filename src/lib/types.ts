export type DealStatus =
  | "pending"
  | "buyer_verified"
  | "funds_held"
  | "shipped"
  | "completed";

export type EscrowState = "none" | "held" | "released";

export type Deal = {
  id: string;
  seller_id: string;
  buyer_id: string | null;
  item_name: string;
  item_price: number;
  status: DealStatus;
  created_at: string;
};

export type Verification = {
  id: string;
  deal_id: string;
  buyer_id_photo_url: string | null;
  buyer_selfie_url: string | null;
  liveness_result: "pass" | "fail" | null;
  verified_at: string | null;
};

export type EscrowStatus = {
  id: string;
  deal_id: string;
  amount: number;
  status: EscrowState;
  updated_at: string;
};
