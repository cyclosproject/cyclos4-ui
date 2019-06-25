import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { VoucherTypeDetailed } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * List the voucher types the logged user can buy for himself or (if manager) for other user.
 */
@Component({
  selector: 'list-voucher-types-for-buy',
  templateUrl: 'list-voucher-types-for-buy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListVoucherTypesForBuyComponent extends BaseComponent {

  @Input() types: VoucherTypeDetailed[];

  @Output() typeSelected = new EventEmitter<VoucherTypeDetailed>();

  constructor(injector: Injector) {
    super(injector);
  }

  selectType(type: VoucherTypeDetailed): void {
    this.typeSelected.next(type);
  }
}
