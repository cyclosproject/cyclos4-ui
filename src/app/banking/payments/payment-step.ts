/**
 * The steps needed to perform a payment
 */
export type PaymentStep = 'kind' | 'idMethod' | 'user' | 'type' | 'fields' | 'confirm' | 'done';

export module PaymentStep {
  export const KIND: PaymentStep = 'kind';
  export const ID_METHOD: PaymentStep = 'idMethod';
  export const USER: PaymentStep = 'user';
  export const TYPE: PaymentStep = 'type';
  export const FIELDS: PaymentStep = 'fields';
  export const CONFIRM: PaymentStep = 'confirm';  
  export const DONE: PaymentStep = 'done';
  
  export function values(): PaymentStep[] {
    return [KIND, ID_METHOD, USER, TYPE, FIELDS, CONFIRM, DONE];
  }
}
