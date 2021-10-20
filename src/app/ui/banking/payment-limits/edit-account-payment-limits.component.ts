import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { AccountPaymentLimitsData, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, SetAccountPaymentLimits } from 'app/api/models';
import { PaymentLimitsService } from 'app/api/services/payment-limits.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { FieldOption } from 'app/shared/field-option';
import { validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';

/**
 * Edit account payment limtis
 */
@Component({
  selector: 'edit-account-payment-limits',
  templateUrl: 'edit-account-payment-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAccountPaymentLimitsComponent
  extends BasePageComponent<AccountPaymentLimitsData>
  implements OnInit {

  form: FormGroup;
  user: string;
  accountType: string;
  isDefaultPaymentLimit$ = new BehaviorSubject<boolean>(null);
  isDefaultDailyLimit$ = new BehaviorSubject<boolean>(null);
  isDefaultWeeklyLimit$ = new BehaviorSubject<boolean>(null);
  isDefaultMonthlyLimit$ = new BehaviorSubject<boolean>(null);

  constructor(
    injector: Injector,
    private paymentLimitsService: PaymentLimitsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.accountType = this.route.snapshot.params.accountType;
    this.addSub(this.paymentLimitsService.getAccountPaymentLimits({ user: this.user, accountType: this.accountType })
      .subscribe(data => this.data = data));
  }

  get modeOptions(): FieldOption[] {
    const options = [{ value: 'default', text: this.i18n.account.limits.productDefault }];
    options.push({ value: 'personalized', text: this.i18n.account.limits.personalized });
    return options;
  }

  mode(custom: boolean): string {
    return custom ? 'personalized' : 'default';
  }

  onDataInitialized(data: AccountPaymentLimitsData) {
    super.onDataInitialized(data);
    const paymentMode = this.mode(data.customAmountLimit);
    const dailyMode = this.mode(data.customAmountPerDayLimit);
    const weeklyMode = this.mode(data.customAmountPerWeekLimit);
    const monthlyMode = this.mode(data.customAmountPerMonthLimit);
    this.form = this.formBuilder.group({
      paymentLimitMode: paymentMode,
      amountLimit: data.amountLimit,
      dailyLimitMode: dailyMode,
      amountPerDayLimit: data.amountPerDayLimit,
      weeklyLimitMode: weeklyMode,
      amountPerWeekLimit: data.amountPerWeekLimit,
      monthlyLimitMode: monthlyMode,
      amountPerMonthLimit: data.amountPerMonthLimit,
      comment: null,
    });
    this.formControl('paymentLimitMode').valueChanges.subscribe(value => this.isDefaultPaymentLimit$.next(value === 'default'));
    this.isDefaultPaymentLimit$.next(paymentMode === 'default');
    this.formControl('dailyLimitMode').valueChanges.subscribe(value => this.isDefaultDailyLimit$.next(value === 'default'));
    this.isDefaultDailyLimit$.next(dailyMode === 'default');
    this.formControl('weeklyLimitMode').valueChanges.subscribe(value => this.isDefaultWeeklyLimit$.next(value === 'default'));
    this.isDefaultWeeklyLimit$.next(weeklyMode === 'default');
    this.formControl('monthlyLimitMode').valueChanges.subscribe(value => this.isDefaultMonthlyLimit$.next(value === 'default'));
    this.isDefaultMonthlyLimit$.next(monthlyMode === 'default');
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }

    const value = cloneDeep(this.form.value);
    value.customAmountLimit = value.paymentLimitMode !== 'default';
    if (!value.customAmountLimit) {
      delete value.amountLimit;
    }

    value.customAmountPerDayLimit = value.dailyLimitMode !== 'default';
    if (!value.customAmountPerDayLimit) {
      delete value.amountPerDayLimit;
    }

    value.customAmountPerWeekLimit = value.weeklyLimitMode !== 'default';
    if (!value.customAmountPerWeekLimit) {
      delete value.amountPerWeekLimit;
    }

    value.customAmountPerMonthLimit = value.monthlyLimitMode !== 'default';
    if (!value.customAmountPerMonthLimit) {
      delete value.amountPerMonthLimit;
    }

    delete value.creditLimitMode;
    delete value.upperCreditLimitMode;

    if (this.data.confirmationPasswordInput) {
      this.notification.confirm({
        title: this.i18n.general.confirm,
        message: this.i18n.account.paymentLimits.confirm,
        createDeviceConfirmation: this.paymentLimitsDeviceConfirmation(),
        passwordInput: this.data.confirmationPasswordInput,
        callback: res => this.doSave(value, res.confirmationPassword)
      });
    } else {
      this.doSave(value);
    }
  }

  doSave(value: SetAccountPaymentLimits, confirmationPassword?: string) {
    this.addSub(this.paymentLimitsService.setAccountPaymentLimits({
      user: this.user, accountType: this.accountType, confirmationPassword, body: value
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.account.paymentLimits.saved);
      this.reload();
    })
    );
  }

  paymentLimitsDeviceConfirmation(): () => CreateDeviceConfirmation {
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
