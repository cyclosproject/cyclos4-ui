import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Currency, VoucherDataForBuy } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'buy-vouchers-step-form',
  templateUrl: 'buy-vouchers-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVouchersStepFormComponent extends BaseComponent implements OnInit {
  @Input() data: VoucherDataForBuy;
  @Input() form: FormGroup;

  countLabel$ = new BehaviorSubject('');

  fixedAmount: string;

  constructor(injector: Injector, public authHelper: AuthHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const range = this.data.amountRange;
    if (range?.min && range?.min === range.max) {
      this.fixedAmount = range.min;
      this.form.patchValue({ amount: this.fixedAmount });
    }
    this.addSub(this.form.valueChanges.subscribe(v => this.updateCountLabel(v)));
    this.updateCountLabel(this.form.value);
  }

  private updateCountLabel(value: any) {
    const count = value?.count;
    this.countLabel$.next(
      !count || count === 1 || count === '1' ? this.i18n.transaction.amount : this.i18n.voucher.amountPerVoucher
    );
  }

  get currency(): Currency {
    return this.data.account.currency;
  }
}
