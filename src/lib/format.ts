export function formatPrice(price: number) {
  return price.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
