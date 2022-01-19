import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Currency, VoucherDataForBuy } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';

@Component({
  selector: 'send-voucher-step-form',
  templateUrl: 'send-voucher-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendVoucherStepFormComponent extends BaseComponent {

  @Input() data: VoucherDataForBuy;
  @Input() form: FormGroup;
  fixedAmount: string;

  constructor(
    injector: Injector,
    public authHelper: AuthHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const range = this.data.amountRange;
    if (range?.min && range?.min === range.max) {
      this.fixedAmount = range.min;
      this.form.patchValue({ amount: this.fixedAmount });
    }
  }

  get currency(): Currency {
    return this.data.account.currency;
  }
}
