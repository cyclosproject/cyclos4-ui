import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Currency, VoucherInfo, VoucherStatusEnum, VoucherTransaction } from 'app/api/models';
import { ApiI18nService } from 'app/core/api-i18n.service';
import { FormatService } from 'app/core/format.service';
import { PagedResults } from 'app/shared/paged-results';
import { PageData } from 'app/ui/shared/page-data';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';
import { BehaviorSubject } from 'rxjs';

/**
 * Component used to display the voucher information
 */
@Component({
  selector: 'voucher-details',
  templateUrl: 'voucher-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherDetailsComponent extends VoucherBasePageComponent implements OnInit {
  VoucherStatusEnum = VoucherStatusEnum;

  voucher: VoucherInfo;
  currency: Currency;
  redeemOnWeekDays: string;
  transactions$ = new BehaviorSubject<PagedResults<VoucherTransaction>>(null);

  constructor(
    public format: FormatService,
    public apiI18n: ApiI18nService,
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.voucher = this.state.voucher;
    if (!this.voucher?.token) {
      this.state.exit();
      return;
    }
    this.currency = this.voucher.type.configuration.currency;
    if (this.voucher.status === VoucherStatusEnum.OPEN) {
      this.redeemOnWeekDays = this.format.formatWeekDays(this.voucher.redeemOnWeekDays) || this.i18n.voucher.redeem.onDaysAny;
    }

    if (this.voucher.hasTransactions) {
      this.updateTransactions();
    }

    // Add a shortcut to go back
    this.addEscapeShortcut(() => this.state.exit());

    this.title = this.i18n.voucher.info.title;
  }

  updateTransactions(pageData?: PageData) {
    this.voucherService.searchVoucherInfoTransactions$Response({
      token: this.state.token,
      pin: this.state.pin,
      page: pageData?.page,
      pageSize: pageData?.pageSize ?? 20
    }).subscribe(resp => this.transactions$.next(PagedResults.from(resp)));
  }

  hasUser(transactions: PagedResults<VoucherTransaction>) {
    return !!transactions?.results?.find(t => t.user);
  }
}
