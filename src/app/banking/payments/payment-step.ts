/**
 * The steps needed to perform a payment
 */
export type PaymentStep = 'kind' | 'user' | 'type' | 'fields' | 'preview' | 'done';

export module PaymentStep {
  export const KIND: PaymentStep = 'kind';
  export const USER: PaymentStep = 'user';
  export const TYPE: PaymentStep = 'type';
  export const FIELDS: PaymentStep = 'fields';
  export const PREVIEW: PaymentStep = 'preview';  
  export const DONE: PaymentStep = 'done';
  
  export function values(): PaymentStep[] {
    return [KIND, USER, TYPE, FIELDS, PREVIEW, DONE];
  }
}
