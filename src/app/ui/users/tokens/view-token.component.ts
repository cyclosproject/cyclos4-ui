import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { CustomFieldTypeEnum, ImageSizeEnum, PhysicalTokenTypeEnum, RoleEnum, TokenStatusEnum, TokenView } from 'app/api/models';
import { TokensService } from 'app/api/services/tokens.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { AssignTokenComponent } from 'app/ui/users/tokens/assign-token.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { SvgIcon } from 'app/core/svg-icon';
import { TokenHelperService } from 'app/ui/core/token-helper.service';

/**
 * Displays a token details
 */
@Component({
  selector: 'view-token',
  templateUrl: 'view-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewTokenComponent extends BaseViewPageComponent<TokenView> implements OnInit {

  id: string;
  qrCodeUrl$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private userHelper: UserHelperService,
    private modal: BsModalService,
    private tokenHelper: TokenHelperService,
    private tokenService: TokensService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.tokenService.viewToken({ id: this.id }).subscribe(data => this.data = data));
  }

  isQrCode(token: TokenView): boolean {
    return token.type.physicalType === PhysicalTokenTypeEnum.QR_CODE;
  }

  onDataInitialized(token: TokenView) {
    if (this.isQrCode(token)) {
      this.getTokenQrCodeUrl();
    }
    const headingActions: HeadingAction[] = [];
    // Assign
    if (token.assign) {
      headingActions.push(new HeadingAction(SvgIcon.PersonPlus, this.i18n.token.action.assign, () => {
        if (token.status === TokenStatusEnum.UNASSIGNED) {
          this.modal.show(AssignTokenComponent, {
            class: 'modal-form',
            initialState: { token: this.id, updateAction: () => this.reload() },
          });
        }
      }));
    }
    // Set activation deadline
    if (token.setActivationDeadline) {
      headingActions.push(new HeadingAction(SvgIcon.CalendarEvent, this.i18n.token.action.changeDeadline, () => {
        this.notification.confirm({
          title: this.i18n.token.action.changeDeadline,
          customFields: [{
            internalName: 'deadline',
            name: this.i18n.token.activationDeadline,
            type: CustomFieldTypeEnum.DATE,
            required: true
          }],
          callback: params =>
            this.tokenService.setTokenActivationDeadline({ id: this.id, date: params.customValues.deadline })
              .subscribe(() => this.notifyDoneAndReload(this.i18n.token.action.done.deadlineChanged))
        });
      }));
    }
    // Set expiry date
    if (token.setExpiryDate) {
      headingActions.push(new HeadingAction(SvgIcon.CalendarEvent, this.i18n.token.action.changeExpiry, () => {
        this.notification.confirm({
          title: this.i18n.token.action.changeExpiry,
          customFields: [{
            internalName: 'expiry',
            name: this.i18n.token.expiryDate,
            type: CustomFieldTypeEnum.DATE,
            required: true
          }],
          callback: params =>
            this.tokenService.setTokenExpiryDate({ id: this.id, date: params.customValues.expiry })
              .subscribe(() => this.notifyDoneAndReload(this.i18n.token.action.done.expiryChanged))
        });
      }));
    }
    // Block
    if (token.block) {
      headingActions.push(new HeadingAction(SvgIcon.Lock, this.i18n.token.action.block, () => {
        this.tokenService.blockToken({ id: this.id }).subscribe(() => this.notifyDoneAndReload(this.i18n.token.action.done.blocked));
      }));
    }
    // Unblock
    if (token.unblock) {
      headingActions.push(new HeadingAction(SvgIcon.Unlock, this.i18n.token.action.unblock, () => {
        this.tokenService.unblockToken({ id: this.id }).subscribe(() => this.notifyDoneAndReload(this.i18n.token.action.done.unblocked));
      }));
    }
    // Activate
    if (token.activate) {
      headingActions.push(new HeadingAction(this.tokenHelper.icon(token.type), this.i18n.token.action.activate, () => {
        this.tokenService.activatePendingToken({ id: this.id })
          .subscribe(() => this.notifyDoneAndReload(this.i18n.token.action.done.activated));
      }));
    }
    // Cancel
    if (token.cancel) {
      headingActions.push(new HeadingAction(SvgIcon.XCircle, this.i18n.token.action.cancel, () => {
        this.notification.confirm({
          title: this.i18n.token.action.cancel,
          message: this.i18n.token.action.message.cancel,
          callback: () =>
            this.tokenService.cancelToken({ id: this.id })
              .subscribe(() => this.notifyDoneAndReload(this.i18n.token.action.done.canceled))
        });
      }));
    }
    this.headingActions = headingActions;
  }

  notifyDoneAndReload(notification: string) {
    this.notification.snackBar(notification);
    this.reload();
  }
  getTokenQrCodeUrl() {
    this.addSub(this.tokenService.getTokenQrCode({ id: this.id, size: ImageSizeEnum.MEDIUM })
      .subscribe(qrCode => this.qrCodeUrl$.next(URL.createObjectURL(qrCode))));
  }

  statusDisplay(status: TokenStatusEnum) {
    return this.userHelper.tokenStatus(status);
  }

  showUser(): boolean {
    return !(this.authHelper.isSelf(this.data.user) || (this.data.user?.user && this.authHelper.isSelf(this.data.user.user)));
  }

  valueLabel(): string {
    return this.data.type.physicalType === PhysicalTokenTypeEnum.NFC_TAG ? this.i18n.token.label : this.i18n.token.value;
  }

  showDeadLine(): boolean {
    return this.data.status === TokenStatusEnum.ACTIVATION_EXPIRED || this.data.status === TokenStatusEnum.PENDING;
  }

  showExpiryDate(): boolean {
    return [TokenStatusEnum.ACTIVE, TokenStatusEnum.BLOCKED, TokenStatusEnum.CANCELED, TokenStatusEnum.EXPIRED].includes(this.data.status);
  }

  resolveMenu(view: TokenView) {
    if (this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR) {
      return new ActiveMenu(Menu.USER_TOKENS, { tokenType: view.type });
    }
    if (this.authHelper.isSelf(view.user)) {
      return new ActiveMenu(Menu.MY_TOKENS, { tokenType: view.type });
    }
    if (view.user.user && this.authHelper.isSelf(view.user.user)) {
      return Menu.MY_OPERATORS;
    }
    if (this.dataForFrontendHolder.role === RoleEnum.BROKER) {
      return Menu.MY_BROKERED_USERS;
    }
    return Menu.SEARCH_USERS;
  }
}
