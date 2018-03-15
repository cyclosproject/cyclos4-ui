import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { TransactionView, AuthorizationStatusEnum } from 'app/api/models';

/**
 * Displays a confirmation that the payment was performed
 */
@Component({
  selector: 'payment-done',
  templateUrl: 'payment-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentDoneComponent extends BaseComponent {
  constructor(
    injector: Injector) {
    super(injector);
  }

  @Input()
  payment: TransactionView;

  get pendingAuth(): boolean {
    return this.payment.authorizationStatus === AuthorizationStatusEnum.PENDING;
  }
}
