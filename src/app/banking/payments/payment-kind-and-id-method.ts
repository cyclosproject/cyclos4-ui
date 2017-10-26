import { PaymentKind } from "app/banking/payments/payment-kind";
import { IdMethod } from "app/banking/payments/id-method";

/**
 * Holds a payment kind and an user identification method
 */
export class PaymentKindAndIdMethod {
  constructor(
    public label: string,
    public kind: PaymentKind,
    public idMethod: IdMethod = null) {
  }
}