import crypto from "crypto";

export function generateTicketId() {
  // Example: TCK-3F9A72B1
  return "TCK-" + crypto.randomUUID().split("-")[0].toUpperCase();
}
