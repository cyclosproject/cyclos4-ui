import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { VoucherTypeDetailed } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * List the voucher types the logged user can buy for himself or (if manager) for other user.
 */
@Component({
  selector: 'buy-vouchers-step-list-types',
  templateUrl: 'buy-vouchers-step-list-types.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyVouchersStepListTypesComponent extends BaseComponent {

  @Input() types: VoucherTypeDetailed[];

  @Output() typeSelected = new EventEmitter<VoucherTypeDetailed>();

  constructor(injector: Injector) {
    super(injector);
  }

  get selectType() {
    return (type: VoucherTypeDetailed) => this.typeSelected.emit(type);
  }
}
