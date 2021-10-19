import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RoleEnum, VoucherTransaction, VoucherTransactionKind, VoucherTransactionView } from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';

@Component({
  selector: 'view-voucher-transaction',
  templateUrl: './view-voucher-transaction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewVoucherTransactionComponent extends BaseViewPageComponent<VoucherTransactionView> implements OnInit {

  title: string;
  mobileTitle: string;
  self: boolean;

  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    public bankingHelper: BankingHelperService
  ) { super(injector); }

  ngOnInit() {
    super.ngOnInit();
    const id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.voucherService.viewVoucherTransaction({ id }).subscribe(vtx => this.data = vtx));
  }

  onDataInitialized(view: VoucherTransactionView) {
    this.self = this.authHelper.isSelfOrOwner(view.user);
    this.headingActions = this.exportHelper.headingActions(view.exportFormats,
      f => this.voucherService.exportVoucherTransaction$Response({
        format: f.internalName,
        id: view.id
      }));
    switch (view.kind) {
      case VoucherTransactionKind.REDEEM:
        this.title = this.i18n.voucher.title.redeemDetails;
        this.mobileTitle = this.i18n.voucher.mobileTitle.redeemDetails;
        break;
      case VoucherTransactionKind.TOP_UP:
        this.title = this.i18n.voucher.title.topUpDetails;
        this.mobileTitle = this.i18n.voucher.mobileTitle.topUpDetails;
        break;
    }
  }

  get voucherLink() {
    return this.transaction.voucherId ? ['/banking', 'vouchers', 'view', this.transaction.voucherId] : null;
  }

  viewTransaction(row: VoucherTransaction) {
    if (row.payment) {
      this.router.navigate(this.bankingHelper.transactionPath(row.payment));
    }
  }

  resolveMenu(row: VoucherTransactionView) {
    const auth = this.dataForFrontendHolder.auth;
    if (auth.role === RoleEnum.ADMINISTRATOR) {
      return Menu.SEARCH_VOUCHERS;
    } else {
      return this.menu.userMenu(row.user, Menu.VOUCHER_TRANSACTIONS);
    }
  }

  get transaction() {
    return this.data;
  }
}
