import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Currency, PerformVoucherTransaction, TopUpVoucher, VoucherTopUpPreview, VoucherTransactionKind, VoucherTransactionPreview } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Component used for displaying the fields as read-only in a voucher transaction
 */
@Component({
  selector: 'voucher-transaction-step-confirm',
  templateUrl: './voucher-transaction-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherTransactionStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() preview: VoucherTransactionPreview;
  @Input() transaction: PerformVoucherTransaction;
  @Input() pinIsSent: boolean;

  self: boolean;
  currency: Currency;

  topUpPreview: VoucherTopUpPreview;
  topUp: TopUpVoucher;

  constructor(
    injector: Injector,
    private authHelper: AuthHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.self = this.authHelper.isSelf(this.preview.user);
    this.currency = this.preview.type.configuration.currency;
    if (this.preview.kind === VoucherTransactionKind.TOP_UP) {
      this.topUpPreview = this.preview as VoucherTopUpPreview;
      this.topUp = this.transaction as TopUpVoucher;
    }
  }
}
