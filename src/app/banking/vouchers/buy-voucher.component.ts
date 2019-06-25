import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit
} from '@angular/core';
import { VoucherDataForBuy } from 'app/api/models/voucher-data-for-buy';
import { VouchersService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { BehaviorSubject } from 'rxjs';
import { Currency } from 'app/api/models';
import { FormGroup, FormControl } from '@angular/forms';

export type BuyVoucherStep = 'form' | 'confirm' | 'done';

@Component({
  selector: 'buy-voucher',
  templateUrl: 'buy-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVoucherComponent extends BasePageComponent<VoucherDataForBuy>
  implements OnInit {
  step$ = new BehaviorSubject<BuyVoucherStep>(null);
  /**
   * The voucher type
   */
  typeParam: string;
  userParam: string;

  form: FormGroup;

  constructor(injector: Injector, private voucherService: VouchersService) {
    super(injector);
  }

  get step(): BuyVoucherStep {
    return this.step$.value;
  }
  set step(step: BuyVoucherStep) {
    this.step$.next(step);
  }

  ngOnInit() {
    super.ngOnInit();
    const params = this.route.snapshot.params;
    this.typeParam = params.type;
    this.userParam = this.authHelper.isSelf(params.user)
      ? this.ApiHelper.SELF
      : params.user;

    this.voucherService
      .getVoucherDataForBuy({ user: this.userParam, type: this.typeParam })
      .subscribe(data => (this.data = data));
    this.form = this.formBuilder.group({
      count: new FormControl(''),
      amount: new FormControl('')
    });
  }

  onDataInitialized() {
    this.step = 'form';
  }

  get currency(): Currency {
    return this.data.account.currency;
  }
  toConfirm() {
    this.step = 'confirm';
  }
}
