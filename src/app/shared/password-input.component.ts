import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Host, Injector,
  Input, OnInit, Optional, Output, SkipSelf, ViewChild,
} from '@angular/core';
import { AbstractControl, ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { PasswordInput, PasswordInputMethodEnum, PasswordModeEnum, PaymentPreview, SendMediumEnum } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { NotificationService } from 'app/core/notification.service';
import { ActionWithIcon } from 'app/shared/action';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { truthyAttr } from 'app/shared/helper';
import { LayoutService } from 'app/core/layout.service';
import { chunk } from 'lodash-es';
import { SvgIcon } from 'app/core/svg-icon';
import { PosService } from 'app/api/services/pos.service';

/**
 * Component used to display a password input
 */
@Component({
  selector: 'password-input',
  templateUrl: 'password-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: PasswordInputComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: PasswordInputComponent, multi: true },
  ],
})
export class PasswordInputComponent
  extends BaseControlComponent<string>
  implements OnInit, Validator {

  @Input() pos: boolean;
  @Input() paymentPreview: PaymentPreview;

  @Input() passwordInput: PasswordInput;

  @Input() placeholder: string;

  @Input() autocomplete = 'off';

  private _showIcon: boolean | string = false;
  @Input() get showIcon(): boolean | string {
    return this._showIcon;
  }
  set showIcon(showIcon: boolean | string) {
    this._showIcon = truthyAttr(showIcon);
  }

  @Output() enter = new EventEmitter<string>();

  @Output() otpSent = new EventEmitter<void>();

  @ViewChild('passwordField') passwordField: ElementRef;
  @ViewChild('vkDisplay') vkDisplay: ElementRef;

  virtualKeyboard: boolean;
  currentVKCombinations: string[][];
  enteredVKPassword: string[];

  otp: boolean;
  otpActions: ActionWithIcon[];

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private authService: AuthService,
    private posService: PosService,
    private notificationService: NotificationService,
    public layout: LayoutService) {
    super(injector, controlContainer);
  }

  ngOnInit(): void {
    super.ngOnInit();
    const input = this.passwordInput;

    // Initialize the one-time-password fields
    this.otp = input.mode === PasswordModeEnum.OTP;
    if (this.otp) {
      this.otpActions = (input.otpSendMediums || [])
        .map(medium => this.requestOtpAction(medium))
        .filter(action => action != null);
    }

    // Initialize the virtual keyboard fields
    this.virtualKeyboard = input.inputMethod === PasswordInputMethodEnum.VIRTUAL_KEYBOARD;
    if (this.virtualKeyboard) {
      this.enteredVKPassword = [];
      this.updateVKButtons();
    }

    // Ensure we have a proper placeholder
    if (this.placeholder == null) {
      this.placeholder = this.passwordInput.name;
    }
  }

  /**
   * Returns an action to request a new OTP
   * @param medium The send medium
   */
  private requestOtpAction(medium: SendMediumEnum): ActionWithIcon {
    let icon: SvgIcon;
    let label: string;
    switch (medium) {
      case SendMediumEnum.EMAIL:
        icon = SvgIcon.Envelope;
        label = this.i18n.general.sendMedium.email;
        break;
      case SendMediumEnum.SMS:
        icon = SvgIcon.Phone;
        label = this.i18n.general.sendMedium.sms;
        break;
      default:
        return null;
    }
    return new ActionWithIcon(icon, label, () => {
      let request;
      if (this.pos) {
        request = this.posService.receivePaymentOtp({ medium, body: this.paymentPreview.payment });
      } else {
        request = this.dataForFrontendHolder.auth.pendingSecondaryPassword
          ? this.authService.newOtpForSecondaryPassword({ medium }) : this.authService.newOtp({ medium });
      }
      this.addSub(request.subscribe(res => {
        this.notificationService.snackBar(
          this.i18n.password.otpSent(this.pos ? this.paymentPreview.fromAccount.user.display : (res || []).join(', ')));
        this.otpSent.emit(null);
      }));
    });
  }

  vkKey(combination: string) {
    this.enteredVKPassword.push(combination);
    this.updateVKButtons();
  }

  vkClear() {
    this.enteredVKPassword = [];
    this.updateVKButtons();
  }

  vkBack() {
    this.enteredVKPassword.splice(this.enteredVKPassword.length - 1, 1);
    this.updateVKButtons();
  }

  private updateVKButtons(): void {
    if (this.enteredVKPassword.length < this.passwordInput.buttons.length) {
      this.currentVKCombinations = chunk(this.passwordInput.buttons[this.enteredVKPassword.length], this.passwordInput.buttonsPerRow);
    }
    this.formControl.setValue(this.enteredVKPassword.length === 0 ? ''
      : this.passwordInput.virtualKeyboardId + '|' + this.enteredVKPassword.join('|'));
  }

  onDisabledChange(isDisabled: boolean): void {
    if (this.passwordField && this.passwordField.nativeElement) {
      this.passwordField.nativeElement.disabled = isDisabled;
    }
  }

  focus() {
    if (this.passwordField && this.passwordField.nativeElement) {
      this.passwordField.nativeElement.focus();
    }
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (!c.touched) {
      return null;
    }
    const value = c.value;
    if (value == null || value === '') {
      return {
        required: true,
      };
    }
    return null;
  }

  otpDisableMessageFunction(medium: string): (remaining: number) => string {
    return () => this.i18n.password.otpReceiveBySent(medium);
  }

  registerOnValidatorChange() {
  }
}
