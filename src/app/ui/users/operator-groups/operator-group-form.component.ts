import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountType,
  OperatorGroupAccountAccessEnum,
  OperatorGroupDataForEdit,
  OperatorGroupDataForNew,
  OperatorGroupManage,
  TransferTypeWithCurrency,
  User
} from 'app/api/models';
import { OperatorGroupsService } from 'app/api/services/operator-groups.service';
import { FieldOption } from 'app/shared/field-option';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

export type TokenPermission = 'enable' | 'block' | 'unblock' | 'cancel';

/**
 * Operator group form - either to create or edit
 */
@Component({
  selector: 'operator-group-form',
  templateUrl: 'operator-group-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorGroupFormComponent
  extends BasePageComponent<OperatorGroupDataForEdit | OperatorGroupDataForNew>
  implements OnInit
{
  id: string;
  create: boolean;
  user: string;
  self: boolean;
  singleAccount: boolean;
  form: FormGroup;
  tokenPermissions: FormControl;
  accountAccessOptions: FieldOption[];

  constructor(
    injector: Injector,
    public userHelper: UserHelperService,
    private operatorGroupsService: OperatorGroupsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.user = this.route.snapshot.params.user;
    this.create = this.user != null;
    const request: Observable<OperatorGroupDataForEdit | OperatorGroupDataForNew> = this.create
      ? this.operatorGroupsService.getOperatorGroupDataForNew({ user: this.user })
      : this.operatorGroupsService.getOperatorGroupDataForEdit({ id: this.id });
    this.addSub(
      request.subscribe(data => {
        this.data = data;
      })
    );
    const values = [
      OperatorGroupAccountAccessEnum.NONE,
      OperatorGroupAccountAccessEnum.OWN,
      OperatorGroupAccountAccessEnum.INCOMING,
      OperatorGroupAccountAccessEnum.OUTGOING,
      OperatorGroupAccountAccessEnum.FULL
    ];
    this.accountAccessOptions = values.map(value => ({
      value,
      text: this.userHelper.operatorGroupAccountAccess(value)
    }));
  }

  onDataInitialized(data: OperatorGroupDataForEdit | OperatorGroupDataForNew) {
    this.self = this.authHelper.isSelf(data.user);
    const group = data.operatorGroup;
    this.form = this.formBuilder.group({
      name: [group.name, Validators.required],
      description: group.description
    });
    if (!empty(data.accountTypes)) {
      this.singleAccount = data.accountTypes.length === 1;
      const accountControls: FormGroup = this.formBuilder.group({});
      for (const at of data.accountTypes) {
        const accountValue = group.accounts[at.id] || group.accounts[at.internalName] || {};
        const notificationAmount = accountValue.notificationAmount || {};
        accountControls.setControl(
          at.id,
          this.formBuilder.group({
            access: [accountValue.access || OperatorGroupAccountAccessEnum.NONE, Validators.required],
            notificationAmount: this.formBuilder.group({
              min: notificationAmount.min,
              max: notificationAmount.max
            })
          })
        );
      }
      this.form.setControl('accounts', accountControls);
    }
    if (!empty(data.paymentTypes)) {
      const paymentControls: FormGroup = this.formBuilder.group({});
      for (const pt of data.paymentTypes) {
        const paymentValue = group.payments[pt.id] || group.payments[pt.internalName] || {};
        paymentControls.setControl(
          pt.id,
          this.formBuilder.group({
            perform: paymentValue.perform,
            maxAmountPerDay: paymentValue.perform ? paymentValue.maxAmountPerDay : null,
            requiresAuthorization: paymentValue.perform && paymentValue.requiresAuthorization,
            authorize: paymentValue.authorize
          })
        );
      }
      this.form.setControl('payments', paymentControls);
    }
    this.form.addControl('editOwnProfile', new FormControl(group.editOwnProfile));
    this.form.addControl('restrictPaymentsToUsers', new FormControl(group.restrictPaymentsToUsers));
    if (data.canHaveNotifications) {
      this.form.addControl('notifications', new FormControl(group.notifications));
    }
    if (data.canChargebackPayments) {
      this.form.addControl('chargebackPayments', new FormControl(group.chargebackPayments));
    }
    if (data.canReceivePayments) {
      this.form.addControl('receivePayments', new FormControl(group.receivePayments));
    }
    if (data.canRequestPayments) {
      this.form.addControl('requestPayments', new FormControl(group.requestPayments));
    }
    if (data.canViewAdvertisements) {
      this.form.addControl('viewAdvertisements', new FormControl(group.viewAdvertisements));
    }
    if (data.canManageAdvertisements) {
      this.form.addControl('manageAdvertisements', new FormControl(group.manageAdvertisements));
    }
    if (data.canHaveMessages) {
      this.form.addControl('messages', new FormControl(group.messages));
    }

    let tokenOptions: TokenPermission[] = [];
    if (group.enableToken) {
      tokenOptions.push('enable');
    }
    if (group.blockToken) {
      tokenOptions.push('block');
    }
    if (group.unblockToken) {
      tokenOptions.push('unblock');
    }
    if (group.cancelToken) {
      tokenOptions.push('cancel');
    }
    this.tokenPermissions = new FormControl(tokenOptions);

    if (data.canPerformVoucherTransactions) {
      this.form.addControl('voucherTransactions', new FormControl(group.voucherTransactions));
    }
    if (data.broker) {
      this.form.addControl('brokering', new FormControl(group.brokering));
    }
    if (!empty(data.operations)) {
      this.form.addControl('operations', new FormControl(group.operations));
    }
    if (!empty(data.recordTypes)) {
      this.form.addControl('records', new FormControl(group.records));
    }
    if (group['version']) {
      this.form.addControl('version', new FormControl(group['version']));
    }
  }

  paymentTypes(at: AccountType): TransferTypeWithCurrency[] {
    return this.paymentTypesFromId(at.id);
  }

  paymentTypesFromId(atId: string): TransferTypeWithCurrency[] {
    return (this.data.paymentTypes || []).filter(pt => pt.from.id === atId);
  }

  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value as OperatorGroupManage;
    if (value.accounts) {
      Object.keys(value.accounts)
        .filter(key => value.accounts[key].access === OperatorGroupAccountAccessEnum.NONE)
        .forEach(key => this.paymentTypesFromId(key).forEach(pt => delete value.payments[pt.id]));
    }
    const tokenPermissions = this.tokenPermissions.value as TokenPermission[];
    value.enableToken = tokenPermissions.includes('enable');
    value.blockToken = tokenPermissions.includes('block');
    value.unblockToken = tokenPermissions.includes('unblock');
    value.cancelToken = tokenPermissions.includes('cancel');
    const request: Observable<string | void> = this.create
      ? this.operatorGroupsService.createOperatorGroup({ user: this.user, body: value })
      : this.operatorGroupsService.updateOperatorGroup({ id: this.id, body: value });
    this.addSub(
      request.subscribe(id => {
        this.notification.snackBar(this.create ? this.i18n.operatorGroup.created : this.i18n.operatorGroup.saved);
        this.router.navigate(['/users', 'operator-groups', id || this.id]);
      })
    );
  }

  get restrictPaymentsToUsers(): User[] {
    return (this.data as OperatorGroupDataForEdit).restrictPaymentsToUsers;
  }

  resolveVoucherTransactionsLabel(): string {
    return this.data.topUpEnabled
      ? this.i18n.operatorGroup.voucherTransactions
      : this.i18n.operatorGroup.voucherTransactionsRedeems;
  }

  hasTokenPermissions(): boolean {
    return this.data.canEnableToken || this.data.canBlockToken || this.data.canUnblockToken || this.data.canCancelToken;
  }
  resolveMenu(data: OperatorGroupDataForEdit | OperatorGroupDataForNew) {
    return this.menu.userMenu(data.user, Menu.OPERATOR_GROUPS);
  }
}
