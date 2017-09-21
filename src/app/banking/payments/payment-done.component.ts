import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { PaymentPreview, AccountKind, TransactionView, AuthorizationStatusEnum } from 'app/api/models';
import { ModelHelper } from 'app/shared/model-helper';

/**
 * Displays a confirmation that the payment was performed
 */
@Component({
  selector: 'payment-done',
  templateUrl: 'payment-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentDoneComponent extends BaseBankingComponent {
  constructor(
    injector: Injector) {
    super(injector);
  }

  @Input()
  payment: TransactionView;

  get from(): string {
    return ModelHelper.accountName(this.generalMessages, true, this.payment);
  }

  get to(): string {
    return ModelHelper.accountName(this.generalMessages, false, this.payment);
  }
  
  get pendingAuth(): boolean {
    return this.payment.authorizationStatus == AuthorizationStatusEnum.PENDING;
  }
}
