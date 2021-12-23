import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CaptchaInput, ChangeVoucherNotificationSettings, PasswordInput, VoucherCreationTypeEnum, VoucherInfo } from 'app/api/models';
import { DataForVoucherInfo } from 'app/api/models/data-for-voucher-info';
import { VoucherInfoService } from 'app/api/services/voucher-info.service';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { HeadingAction } from 'app/shared/action';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// In production the data is pre-rendered in the host page
declare const data: DataForVoucherInfo;

/**
 * Holds the DataForVoucherInfo and VoucherInfo instances
 */
@Injectable()
export class VoucherState {
  data$ = new BehaviorSubject<DataForVoucherInfo>(null);
  voucher$ = new BehaviorSubject<VoucherInfo>(null);
  title$ = new BehaviorSubject('');
  voucherHasActions$ = new BehaviorSubject(false);
  hasVoucher$ = new BehaviorSubject(false);
  processing$ = new BehaviorSubject(false);

  headingActions: HeadingAction[];

  _pin: string;
  _exitAction: HeadingAction;

  constructor(
    @Inject(I18nInjectionToken) private i18n: I18n,
    private voucherInfoService: VoucherInfoService,
    private router: Router) {
  }

  get title() {
    return this.title$.value;
  }

  set title(title: string) {
    this.title$.next(title);
  }

  get voucherHasActions() {
    return this.voucherHasActions$.value;
  }

  set voucherHasActions(hasActions: boolean) {
    this.voucherHasActions$.next(hasActions);
  }

  /**
   * Initializes the data
   */
  initialize(): Observable<DataForVoucherInfo> {
    if (data) {
      this.data$.next(data);
      return of(data);
    } else {
      // We're on development. Fetch the data.
      return this.voucherInfoService.getVoucherInfoData().pipe(
        tap(d => this.data$.next(d)));
    }
  }

  isSent(): boolean {
    return this.voucher.creationType === VoucherCreationTypeEnum.SENT;
  }

  get data(): DataForVoucherInfo {
    return this.data$.value;
  }

  get voucher(): VoucherInfo {
    return this.voucher$.value;
  }

  set voucher(voucher: VoucherInfo) {
    this.voucher$.next(voucher);
    this.createActions();
  }

  get token(): string {
    return this.voucher?.token;
  }

  get pin(): string {
    return this._pin;
  }

  set pin(pin: string) {
    this._pin = pin;
  }

  get pinInput(): PasswordInput {
    return this.voucher?.pinInput;
  }

  get forgotPinCaptchaInput(): CaptchaInput {
    return this.voucher?.forgotPinCaptchaInput;
  }

  get exitAction() {
    //in case there are more actions the exit action is shown in the toolbar of the voucher details page (breakpoint >  xs)
    if (!this._exitAction) {
      this._exitAction = new HeadingAction(SvgIcon.Logout2, this.i18n.voucher.info.exit, () => this.exit());
    }
    return this._exitAction;
  }

  /**
   * Fetch the voucher info with a given token
   */
  fetchByToken(token: string) {
    if (this.processing$.value) {
      return EMPTY;
    }
    this.processing$.next(true);
    this.voucherInfoService.getVoucherInfo({ token })
      .subscribe(
        v => {
          this.voucher = v;
          this.processing$.next(false);
          if (v.pinInput) {
            this.router.navigate(['pin']);
          } else {
            this.router.navigate(['details']);
          }
        },
        _e => this.processing$.next(false));
  }


  /**
   * Fetch the current voucher with a PIN
   */
  fetchWithPin(pin: string) {
    if (this.processing$.value || !this.voucher?.token) {
      return EMPTY;
    }
    this.processing$.next(true);
    this.voucherInfoService.getVoucherInfo({ token: this.voucher.token, pin })
      .subscribe(
        v => {
          this.voucher = v;
          this._pin = pin;
          this.processing$.next(false);
          this.router.navigate(['details']);
        },
        _e => this.processing$.next(false));
  }

  updatePin(newPin: string) {
    this.pin = newPin;
  }

  updateNotificationSettings(settings: ChangeVoucherNotificationSettings) {
    this.voucher.email = settings.email;
    this.voucher.mobilePhone = settings.mobilePhone;
    this.voucher.notificationsEnabled = settings.enableNotifications;
  }

  exit(event?: Event) {
    this.reset();
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  private reset() {
    this.voucher = null;
    this._pin = null;
    this.router.navigate(['token']);
    this.voucherHasActions = false;
    this.title = this.i18n.voucher.info.title;
  }

  private createActions() {
    this.headingActions = [];

    if (this.canChangePin()) {
      this.headingActions.push(new HeadingAction(SvgIcon.Key, this.i18n.voucher.info.changePin.action, () => this.changePin()));
    }
    if (this.canChangeNotificationSettings()) {
      this.headingActions.push(new HeadingAction(SvgIcon.Gear, this.i18n.voucher.notificationSettings.label,
        () => this.notificationSettings()));
    }

    this.voucherHasActions = this.headingActions.length > 0;
  }
  canChangePin() {
    return this.voucher?.canChangePin;

  }
  canChangeNotificationSettings() {
    return this.voucher?.canChangeNotificationSettings;
  }

  private changePin() {
    this.router.navigate(["change-pin"]);
  }

  private notificationSettings(): void {
    this.router.navigate(["notification-settings"]);
  }
}
