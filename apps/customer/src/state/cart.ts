export type CartItem = {
  productId: string;
  merchantId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export function upsertCartItem(items: CartItem[], next: CartItem): CartItem[] {
  if (items.length && items[0].merchantId !== next.merchantId) {
    return [{ ...next }];
  }
  const existing = items.find((i) => i.productId === next.productId);
  if (!existing) return [...items, next];
  return items.map((i) =>
    i.productId === next.productId
      ? { ...i, quantity: i.quantity + next.quantity }
      : i,
  );
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
