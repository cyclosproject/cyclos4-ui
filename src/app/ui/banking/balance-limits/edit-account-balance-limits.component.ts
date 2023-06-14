import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { AccountBalanceLimitsData, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, SetAccountBalanceLimits } from 'app/api/models';
import { BalanceLimitsService } from 'app/api/services/balance-limits.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { FieldOption } from 'app/shared/field-option';
import { validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';

/**
 * Edit account balance limtis
 */
@Component({
  selector: 'edit-account-balance-limits',
  templateUrl: 'edit-account-balance-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAccountBalanceLimitsComponent
  extends BasePageComponent<AccountBalanceLimitsData>
  implements OnInit {

  form: FormGroup;
  user: string;
  accountType: string;
  isDefaultCreditLimit$ = new BehaviorSubject<boolean>(null);
  isDefaultUpperCreditLimit$ = new BehaviorSubject<boolean>(null);
  isUnlimitedUpperCreditLimit$ = new BehaviorSubject<boolean>(null);

  constructor(
    injector: Injector,
    private balanceLimitsService: BalanceLimitsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.accountType = this.route.snapshot.params.accountType;
    this.addSub(this.balanceLimitsService.getAccountBalanceLimits({ user: this.user, accountType: this.accountType })
      .subscribe(data => this.data = data));
  }

  get positiveModeOptions(): FieldOption[] {
    const options = [{ value: 'default', text: this.i18n.account.limits.productDefault }];
    options.push({ value: 'personalized', text: this.i18n.account.limits.personalized });
    options.push({ value: 'unlimited', text: this.i18n.account.limits.unlimited });
    return options;
  }

  get negativeModeOptions(): FieldOption[] {
    const options = [{ value: 'default', text: this.i18n.account.limits.productDefault }];
    options.push({ value: 'personalized', text: this.i18n.account.limits.personalized });
    return options;
  }

  onDataInitialized(data: AccountBalanceLimitsData) {
    super.onDataInitialized(data);
    const negativeMode = data.customCreditLimit ? 'personalized' : 'default';
    const positiveMode = data.customUpperCreditLimit ? (data.upperCreditLimit ? 'personalized' : 'unlimited') : 'default';
    this.form = this.formBuilder.group({
      creditLimitMode: negativeMode,
      creditLimit: data.creditLimit,
      upperCreditLimitMode: positiveMode,
      upperCreditLimit: data.upperCreditLimit,
      comment: null,
    });
    this.formControl('creditLimitMode').valueChanges.subscribe(value => this.onCreditLimitModeChange(value));
    this.formControl('upperCreditLimitMode').valueChanges.subscribe(value => this.onUpperCreditLimitModeChange(value));
    this.isDefaultCreditLimit$.next(negativeMode === 'default');
    this.isDefaultUpperCreditLimit$.next(positiveMode === 'default');
    this.isUnlimitedUpperCreditLimit$.next(positiveMode === 'unlimited');
  }

  onCreditLimitModeChange(value: any) {
    this.isDefaultCreditLimit$.next(value === 'default');
  }

  onUpperCreditLimitModeChange(value: any) {
    this.isDefaultUpperCreditLimit$.next(value === 'default');
    this.isUnlimitedUpperCreditLimit$.next(value === 'unlimited');
  }

  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    const value = cloneDeep(this.form.value);
    value.customCreditLimit = value.creditLimitMode !== 'default';
    if (!value.customCreditLimit) {
      delete value.creditLimit;
    }
    value.customUpperCreditLimit = value.upperCreditLimitMode !== 'default';
    if (value.upperCreditLimitMode === 'unlimited' || !value.customUpperCreditLimit) {
      delete value.upperCreditLimit;
    }

    delete value.creditLimitMode;
    delete value.upperCreditLimitMode;

    if (this.data.confirmationPasswordInput) {
      this.confirmation.confirm({
        title: this.i18n.general.confirm,
        message: this.i18n.account.balanceLimits.confirm,
        createDeviceConfirmation: this.balanceLimitsDeviceConfirmation(),
        passwordInput: this.data.confirmationPasswordInput,
        callback: res => this.doSave(value, res.confirmationPassword)
      });
    } else {
      this.doSave(value);
    }
  }

  doSave(value: SetAccountBalanceLimits, confirmationPassword?: string) {
    this.addSub(this.balanceLimitsService.setAccountBalanceLimits({
      user: this.user, accountType: this.accountType, confirmationPassword, body: value
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.account.balanceLimits.saved);
      this.reload();
    })
    );
  }

  balanceLimitsDeviceConfirmation(): () => CreateDeviceConfirmation {
    return () => ({
      type: DeviceConfirmationTypeEnum.CHANGE_ACCOUNT_LIMITS,
      account: this.data.account.id,
    });
  }

  formControl(internalName: string): AbstractControl {
    return this.form.get(internalName);
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }
}
