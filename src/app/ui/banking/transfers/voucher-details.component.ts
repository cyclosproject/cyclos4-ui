import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { Voucher, VoucherCreationTypeEnum } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Displays fields of a voucher
 */
@Component({
  selector: 'voucher-details',
  templateUrl: 'voucher-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherDetailsComponent extends BaseComponent {
  VoucherCreationTypeEnum = VoucherCreationTypeEnum;

  @Input() voucher: Voucher;

  constructor(injector: Injector) {
    super(injector);
  }
}
