import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { ContactNew, TransactionSubjectsEnum, Transfer, TransferView, User, Voucher, VoucherCreationTypeEnum, VoucherStatusEnum, VoucherTransactionKind } from 'app/api/models';
import { ContactsService } from 'app/api/services/contacts.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { LoginService } from 'app/ui/core/login.service';
import { BehaviorSubject } from 'rxjs';

/**
 * Displays fields of a transfer or payment
 */
@Component({
  selector: 'transfer-details',
  templateUrl: 'transfer-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferDetailsComponent extends BaseComponent implements OnInit {

  VoucherTransactionKind = VoucherTransactionKind;
  VoucherCreationTypeEnum = VoucherCreationTypeEnum;

  @Input() transfer: TransferView;
  @Input() headingActions: HeadingAction[];
  @Input() usersWhichCanAddToContacts: TransactionSubjectsEnum;

  canAddReceiverToContacts$: BehaviorSubject<boolean>;

  lastAuthComment: string;
  hasAdditionalData: boolean;

  constructor(
    injector: Injector,
    public login: LoginService,
    private contactService: ContactsService,
    private bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const transaction = this.transfer.transaction || {};
    if (!empty(transaction.authorizations)) {
      this.lastAuthComment = transaction.authorizations[0].comments;
    }
    this.hasAdditionalData = !empty(this.lastAuthComment)
      || !!this.transfer.parent
      || !empty(this.transfer.children);

    this.canAddReceiverToContacts$ = new BehaviorSubject(this.usersWhichCanAddToContacts === TransactionSubjectsEnum.TO
      || this.usersWhichCanAddToContacts === TransactionSubjectsEnum.BOTH);
  }

  path(transfer: Transfer): string[] {
    return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(transfer)];
  }

  get toLink() {
    return (transfer: Transfer) => this.path(transfer);
  }

  voucherPath(voucher: Voucher): string[] {
    return voucher?.id ? ['/banking', 'vouchers', 'view', voucher.id] : null;
  }

  showNewPaymentButton(): boolean {
    return history.state.url;
  }

  navigateToPerformNew() {
    this.router.navigateByUrl(history.state.url);
  }

  addReceiverToContacts() {
    this.addUserToContacts(this.transfer.to.user);
  }


  addUserToContacts(user: User) {
    const contact: ContactNew = { contact: user.id };
    this.addSub(this.contactService.createContact({ user: ApiHelper.SELF, body: contact })
      .subscribe(() => {
        this.notification.info(this.i18n.transaction.doneUserAddedToContacts(user.display));
        this.canAddReceiverToContacts$.next(false);
      }));
  }

  get toVoucherLink() {
    return (voucher: Voucher) => this.voucherPath(voucher);
  }

  get hasVoucherExpirationDate(): boolean {
    return !!this.transfer.transaction?.boughtVouchers?.find(v => v.status === VoucherStatusEnum.OPEN);
  }
}
