import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Currency, VoucherDataForBuy } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

@Component({
  selector: 'buy-vouchers-step-form',
  templateUrl: 'buy-vouchers-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyVouchersStepFormComponent extends BaseComponent {

  @Input() data: VoucherDataForBuy;
  @Input() form: FormGroup;

  @Input() customFieldControlsMap: Map<string, FormControl>;

  constructor(injector: Injector) {
    super(injector);
  }

  get currency(): Currency {
    return this.data.account.currency;
  }
}
