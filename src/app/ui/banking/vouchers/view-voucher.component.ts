import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  CreateDeviceConfirmation, CustomFieldDetailed, CustomFieldSizeEnum, CustomFieldTypeEnum, DeviceConfirmationTypeEnum,
  ImageSizeEnum, LinkedEntityTypeEnum, Transaction, TransactionAuthorizationStatusEnum, UserMenuEnum, VoucherActionEnum,
  VoucherCancelActionEnum, VoucherCreationTypeEnum, VoucherPinStatusForRedeemEnum, VoucherStatusEnum, VoucherTransaction, VoucherView
} from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { validateBeforeSubmit } from 'app/shared/helper';
import { PagedResults } from 'app/shared/paged-results';
import { VoucherChangePinDialogComponent } from 'app/ui/banking/vouchers/voucher-change-pin-dialog.component';
import { VoucherNotificationSettingsDialogComponent } from 'app/ui/banking/vouchers/voucher-notification-settings-dialog.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-view-voucher',
  templateUrl: './view-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewVoucherComponent extends BaseViewPageComponent<VoucherView> implements OnInit {

  VoucherStatusEnum = VoucherStatusEnum;
  VoucherPinStatusForRedeemEnum = VoucherPinStatusForRedeemEnum;
  VoucherCreationTypeEnum = VoucherCreationTypeEnum;

  transactions$ = new BehaviorSubject<PagedResults<VoucherTransaction>>(null);
  qrCodeUrl$ = new BehaviorSubject<string>(null);
  createCancelDeviceConfirmation: () => CreateDeviceConfirmation;
  createChangeExpirationDeviceConfirmation: () => CreateDeviceConfirmation;
  canConfirm: boolean;
  confirmationPassword: FormControl;
  redeemOnDays: string;
  showTransactionsUser$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    public bankingHelper: BankingHelperService,
    private modal: BsModalService
  ) { super(injector); }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.addSub(this.voucherService.viewVoucher({ key }).subscribe(voucher => this.data = voucher));
    this.addSub(this.transactions$.subscribe(tx => {
      this.showTransactionsUser$.next(!!(tx?.results?.find(t => t.user)));
    }));
  }

  onDataInitialized(data: VoucherView) {
    if (data.showQrCode) {
      this.addSub(this.voucherService.getVoucherQrCode({ key: data.id, size: ImageSizeEnum.MEDIUM })
        .subscribe(image => this.qrCodeUrl$.next(URL.createObjectURL(image))));
    }
    this.createCancelDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.MANAGE_VOUCHER,
      voucher: data.id,
      voucherAction: VoucherActionEnum.CANCEL,
    });
    this.createChangeExpirationDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.MANAGE_VOUCHER,
      voucher: data.id,
      voucherAction: VoucherActionEnum.CHANGE_EXPIRATION,
    });
    this.canConfirm = this.authHelper.canConfirm(data.confirmationPasswordInput);
    if (data.confirmationPasswordInput) {
      this.confirmationPassword = this.formBuilder.control('confirmationPassword', Validators.required);
    }
    this.headingActions = this.initActions(data);
    if (data.status === VoucherStatusEnum.OPEN) {
      const days = data.redeemOnWeekDays?.length;
      if (![0, 7].includes(days)) {
        // When there is a specified subset for redeeming, show the days
        this.redeemOnDays = data.redeemOnWeekDays.map(d => this.format.weekDay(d)).join(', ');
      } else {
        this.redeemOnDays = this.i18n.voucher.redeem.onDaysAny;
      }
    }
    if (data.hasTransactions) {
      setTimeout(() => this.updateTransactions());
    }
  }

  updateTransactions() {
    this.addSub(this.voucherService.searchVoucherTransactions$Response({ key: this.data.id })
      .subscribe(r => this.transactions$.next(PagedResults.from(r))));
  }

  initActions(voucher: VoucherView): HeadingAction[] {
    const actions: HeadingAction[] = this.exportHelper.headingActions(voucher.exportFormats,
      f => this.voucherService.exportVoucher$Response({
        format: f.internalName,
        key: voucher.id
      }));
    if (voucher.cancelAction) {
      const label = voucher.cancelAction === VoucherCancelActionEnum.CANCEL_AND_REFUND
        ? this.i18n.voucher.cancel.cancelAndRefund
        : voucher.cancelAction === VoucherCancelActionEnum.CANCEL_AND_CHARGEBACK
          ? this.i18n.voucher.cancel.cancelAndChargeback
          : this.i18n.general.cancel;
      actions.push(new HeadingAction(SvgIcon.XCircle, label, () => {
        // Handle the case that the confirmation password cannot be used
        if (!this.canConfirm) {
          this.notification.warning(this.authHelper.getConfirmationMessage(voucher.confirmationPasswordInput));
          return;
        }
        // A confirmation is required
        this.confirmation.confirm({
          title: this.cancelConfirmationTitle(voucher.cancelAction),
          passwordInput: voucher.confirmationPasswordInput,
          createDeviceConfirmation: this.createCancelDeviceConfirmation,
          callback: params => this.cancel(params.confirmationPassword),
        });
      }));
    }
    if (voucher.canAssign) {
      actions.push(new HeadingAction(SvgIcon.PersonBadge, this.i18n.voucher.assign, () => {
        // A confirmation is required
        this.confirmation.confirm({
          title: this.i18n.voucher.assign,
          customFields: this.assignFields,
          callback: res => {
            this.addSub(this.voucherService.assignVoucher({
              key: voucher.id,
              body: {
                user: res.customValues.user
              },
            }).subscribe(() => {
              this.notification.snackBar(this.i18n.voucher.assigned);
              this.reload();
            }));
          },
        });
      }));
    }
    if (voucher.canChangeExpirationDate) {
      actions.push(new HeadingAction(SvgIcon.CalendarEvent, this.i18n.voucher.changeExpirationDate, () => {
        // Handle the case that the confirmation password cannot be used
        if (!this.canConfirm) {
          this.notification.warning(this.authHelper.getConfirmationMessage(voucher.confirmationPasswordInput));
          return;
        }
        // A confirmation is required
        this.confirmation.confirm({
          title: this.i18n.voucher.changeExpirationDate,
          passwordInput: voucher.confirmationPasswordInput,
          createDeviceConfirmation: this.createChangeExpirationDeviceConfirmation,
          customFields: this.changeExpirationFields,
          callback: res => {
            this.addSub(this.voucherService.changeVoucherExpirationDate({
              key: voucher.id,
              confirmationPassword: res.confirmationPassword,
              body: {
                comments: res.customValues.comments,
                newExpirationDate: res.customValues.newExpirationDate,
              },
            }).subscribe(() => {
              this.notification.snackBar(this.i18n.voucher.expirationDateChanged);
              this.reload();
            }));
          },
        });
      }));
    }
    if (voucher.canResendEmail) {
      actions.push(new HeadingAction(SvgIcon.At, this.i18n.voucher.resendEmail.label, () => {
        // Handle the case that the confirmation password cannot be used
        if (!this.canConfirm) {
          this.notification.warning(this.authHelper.getConfirmationMessage(voucher.confirmationPasswordInput));
          return;
        }
        // A confirmation is required
        this.confirmation.confirm({
          title: this.i18n.voucher.resendEmail.label,
          message: this.i18n.voucher.resendEmail.confirmation(voucher.email),
          callback: () => {
            this.addSub(this.voucherService.resendVoucherEmail({
              key: voucher.id
            }).subscribe(() => {
              this.notification.snackBar(this.i18n.voucher.resendEmail.done);
              this.reload();
            }));
          },
        });
      }));
    }
    if (voucher.canChangeNotificationSettings) {
      actions.push(new HeadingAction(SvgIcon.Gear, this.i18n.voucher.notificationSettings.label, () => {
        // Handle the case that the confirmation password cannot be used
        if (!voucher.requireOldPinForChange && !this.canConfirm) {
          this.notification.warning(this.authHelper.getConfirmationMessage(voucher.confirmationPasswordInput));
          return;
        }
        // Show the pop-up
        const ref = this.modal.show(VoucherNotificationSettingsDialogComponent, {
          class: 'modal-form',
          initialState: { voucher },
        });
        const component = ref.content as VoucherNotificationSettingsDialogComponent;
        this.addSub(component.done.subscribe(() => {
          this.notification.snackBar(this.i18n.voucher.notificationSettings.done);
          this.reload();
        }));
      }));
    }
    if (voucher.canChangePin) {
      actions.push(new HeadingAction(SvgIcon.Key, this.i18n.voucher.changePin.label, () => {
        if (!voucher.requireOldPinForChange && !this.canConfirm) {
          this.notification.warning(this.authHelper.getConfirmationMessage(voucher.confirmationPasswordInput));
          return;
        }
        // Show the pop-up
        const ref = this.modal.show(VoucherChangePinDialogComponent, {
          class: 'modal-form',
          initialState: { voucher },
        });
        const component = ref.content as VoucherChangePinDialogComponent;
        this.addSub(component.done.subscribe(() => {
          this.notification.snackBar(this.i18n.voucher.changePin.done);
          this.reload();
        }));
      }));
    }
    if (voucher.canUnblockPin) {
      actions.push(new HeadingAction(SvgIcon.Unlock, this.i18n.voucher.unblockPin.unblockPin, () => {
        this.addSub(this.voucherService.unblockVoucherPin({
          key: voucher.id
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.voucher.unblockPin.done);
          this.reload();
        }));
      }));
    }
    return actions;
  }

  cancel(confirmationPassword?: string) {
    if (!confirmationPassword && this.confirmationPassword) {
      confirmationPassword = this.confirmationPassword.value;
    }
    if (!validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }
    this.addSub(this.voucherService.cancelVoucher({ key: this.data.id, confirmationPassword })
      .subscribe(() => {
        this.reload();
        this.notification.snackBar(this.i18n.voucher.cancel.done);
      }));
  }

  cancelConfirmationTitle(cancelAction: VoucherCancelActionEnum): string {
    switch (cancelAction) {
      case VoucherCancelActionEnum.CANCEL_AND_REFUND:
        return this.i18n.voucher.cancel.refundConfirmation;
      case VoucherCancelActionEnum.CANCEL_AND_CHARGEBACK:
        return this.i18n.voucher.cancel.chargebackConfirmation;
      case VoucherCancelActionEnum.CANCEL_PENDING_PACK:
        return this.i18n.voucher.cancel.packConfirmation;
      case VoucherCancelActionEnum.CANCEL_GENERATED:
        return this.i18n.voucher.cancel.confirmation;
      case VoucherCancelActionEnum.CANCEL_PENDING_SINGLE:
        return this.i18n.voucher.cancel.confirmation;
    }
  }

  private get changeExpirationFields(): CustomFieldDetailed[] {
    return [{
      internalName: 'newExpirationDate',
      name: this.i18n.general.newExpirationDate,
      type: CustomFieldTypeEnum.DATE,
      required: true,
    },
    {
      internalName: 'comments',
      name: this.i18n.general.comments,
      type: CustomFieldTypeEnum.TEXT,
    }];
  }

  private get assignFields(): CustomFieldDetailed[] {
    return [{
      internalName: 'user',
      name: this.i18n.general.user,
      size: CustomFieldSizeEnum.LARGE,
      type: CustomFieldTypeEnum.LINKED_ENTITY,
      linkedEntityType: LinkedEntityTypeEnum.USER,
      required: true,
    }];
  }

  /**
   * Returns the path to the given transaction
   */
  transactionPath(transfer: Transaction): string[] {
    if (transfer.authorizationStatus === null ||
      transfer.authorizationStatus === TransactionAuthorizationStatusEnum.AUTHORIZED) {
      return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(transfer)];
    } else {
      return ['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(transfer)];
    }
  }

  get toVoucherTransactionLink() {
    return (row: VoucherTransaction) => this.voucherTransactionPath(row);
  }

  voucherTransactionPath(row: VoucherTransaction) {
    return ['/banking', 'voucher-transactions', 'view', row.id];
  }

  viewVoucherTransaction(row: VoucherTransaction) {
    this.router.navigate(this.voucherTransactionPath(row));
  }

  resolveVoucherTransactionsTitle(): string {
    return this.data.topUpEnabled ? this.i18n.voucher.transactions : this.i18n.voucher.transactionsRedeems;
  }

  resolveMenu(voucher: VoucherView) {
    const isBuyer = voucher.buyer && this.authHelper.isSelfOrOwner(voucher.buyer);
    const isOwner = voucher.owner && this.authHelper.isSelfOrOwner(voucher.owner);
    const auth = this.dataForFrontendHolder.auth;
    if (isBuyer || isOwner) {
      return this.dataForFrontendHolder.dataForFrontend.voucherBuyingMenu == UserMenuEnum.MARKETPLACE ? Menu.SEARCH_MY_VOUCHERS_MARKETPLACE
        : Menu.SEARCH_MY_VOUCHERS_BANKING;
    } else if (auth?.permissions?.vouchers?.vouchers?.find(p => p.configuration.id === voucher?.type?.configuration?.id && p.view)) {
      return Menu.SEARCH_VOUCHERS;
    } else {
      return this.menu.searchUsersMenu();
    }
  }

}
