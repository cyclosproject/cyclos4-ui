import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { VoucherDataForBuy, Currency } from 'app/api/models';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'buy-vouchers-step-form',
  templateUrl: 'buy-vouchers-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
