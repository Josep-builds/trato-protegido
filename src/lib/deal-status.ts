import type { DealStatus } from "./types";

export const STATUS_LABEL: Record<DealStatus, string> = {
  pending: "Deal created",
  buyer_verified: "Buyer verified",
  funds_held: "Funds in escrow",
  shipped: "Shipped — waiting for delivery",
  completed: "Completed",
};

export const STATUS_TIMELINE: DealStatus[] = [
  "pending",
  "buyer_verified",
  "funds_held",
  "shipped",
  "completed",
];
