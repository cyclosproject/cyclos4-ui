import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountType, OperatorGroupAccountAccessEnum, OperatorGroupDataForEdit,
  OperatorGroupDataForNew, TransferTypeWithCurrency, User,
} from 'app/api/models';
import { OperatorGroupsService } from 'app/api/services';
import { UserHelperService } from 'app/core/user-helper.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FieldOption } from 'app/shared/field-option';
import { empty, enumValues, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { Observable } from 'rxjs';

/**
 * Operator group form - either to create or edit
 */
@Component({
  selector: 'operator-group-form',
  templateUrl: 'operator-group-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorGroupFormComponent
  extends BasePageComponent<OperatorGroupDataForEdit | OperatorGroupDataForNew>
  implements OnInit {

  id: string;
  create: boolean;
  user: string;
  self: boolean;
  singleAccount: boolean;
  form: FormGroup;
  accountAccessOptions: FieldOption[];

  constructor(
    injector: Injector,
    public userHelper: UserHelperService,
    private operatorGroupsService: OperatorGroupsService) {
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
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));
    const values = enumValues<OperatorGroupAccountAccessEnum>(OperatorGroupAccountAccessEnum);
    this.accountAccessOptions = values.map(value => ({
      value,
      text: this.userHelper.operatorGroupAccountAccess(value),
    }));
  }

  onDataInitialized(data: OperatorGroupDataForEdit | OperatorGroupDataForNew) {
    this.self = this.authHelper.isSelf(data.user);
    const group = data.operatorGroup;
    this.form = this.formBuilder.group({
      name: [group.name, Validators.required],
      description: group.description,
    });
    if (!empty(data.accountTypes)) {
      this.singleAccount = data.accountTypes.length === 1;
      const accountControls: FormGroup = this.formBuilder.group({});
      for (const at of data.accountTypes) {
        const accountValue = (group.accounts[at.id] || group.accounts[at.internalName]) || {};
        const notificationAmount = accountValue.notificationAmount || {};
        accountControls.setControl(at.id, this.formBuilder.group({
          access: [accountValue.access || OperatorGroupAccountAccessEnum.NONE, Validators.required],
          notificationAmount: this.formBuilder.group({
            min: notificationAmount.min,
            max: notificationAmount.max,
          }),
        }));
      }
      this.form.setControl('accounts', accountControls);
    }
    if (!empty(data.paymentTypes)) {
      const paymentControls: FormGroup = this.formBuilder.group({});
      for (const pt of data.paymentTypes) {
        const paymentValue = (group.payments[pt.id] || group.payments[pt.internalName]) || {};
        paymentControls.setControl(pt.id, this.formBuilder.group({
          perform: paymentValue.perform,
          maxAmountPerDay: paymentValue.maxAmountPerDay,
          requiresAuthorization: paymentValue.requiresAuthorization,
          authorize: paymentValue.authorize,
        }));
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
    if (data.canViewAdvertisements) {
      this.form.addControl('viewAdvertisements', new FormControl(group.viewAdvertisements));
    }
    if (data.broker) {
      this.form.addControl('brokering', new FormControl(group.brokering));
    }
    if (!empty(data.operations)) {
      this.form.addControl('operations', new FormControl(group.operations));
    }
    if (group['version']) {
      this.form.addControl('version', new FormControl(group['version']));
    }
  }

  paymentTypes(at: AccountType): TransferTypeWithCurrency[] {
    return (this.data.paymentTypes || []).filter(pt => pt.from.id === at.id);
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;
    const request: Observable<string | void> = this.create
      ? this.operatorGroupsService.createOperatorGroup({ user: this.user, body: value })
      : this.operatorGroupsService.updateOperatorGroup({ id: this.id, body: value });
    this.addSub(request.subscribe(id => {
      this.notification.snackBar(this.create
        ? this.i18n.operatorGroup.created
        : this.i18n.operatorGroup.saved);
      this.router.navigate(['/users', 'operator-groups', id || this.id]);
    }));
  }

  get restrictPaymentsToUsers(): User[] {
    return (this.data as OperatorGroupDataForEdit).restrictPaymentsToUsers;
  }

  resolveMenu(data: OperatorGroupDataForEdit | OperatorGroupDataForNew) {
    return this.authHelper.userMenu(data.user, Menu.OPERATOR_GROUPS);
  }
}
