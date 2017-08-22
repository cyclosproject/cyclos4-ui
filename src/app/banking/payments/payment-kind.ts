/**
 * The possible kinds of payments supported
 */
export type PaymentKind = 'user' | 'self' | 'system';

export module PaymentKind {
  export const USER: PaymentKind = "user";
  export const SELF: PaymentKind = "self";
  export const SYSTEM: PaymentKind = "system";
  export function values(): PaymentKind[] {
    return [USER, SELF, SYSTEM];
  }
}
