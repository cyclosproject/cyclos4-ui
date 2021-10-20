import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { VoucherTypeDetailed } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * List the voucher types the logged user can generate.
 */
@Component({
  selector: 'generate-vouchers-step-list-types',
  templateUrl: 'generate-vouchers-step-list-types.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateVouchersStepListTypesComponent extends BaseComponent {

  @Input() types: VoucherTypeDetailed[];

  @Output() typeSelected = new EventEmitter<VoucherTypeDetailed>();

  constructor(injector: Injector) {
    super(injector);
  }

  get selectType() {
    return (type: VoucherTypeDetailed) => this.typeSelected.emit(type);
  }
}
