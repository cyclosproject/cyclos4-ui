import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Host,
  HostBinding,
  Injector,
  Input,
  OnInit,
  Optional,
  Output,
  SkipSelf,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import {
  PasswordInput,
  PasswordInputMethodEnum,
  PasswordModeEnum,
  PaymentPreview,
  SendMediumEnum
} from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { PosService } from 'app/api/services/pos.service';
import { LayoutService } from 'app/core/layout.service';
import { NotificationService } from 'app/core/notification.service';
import { SvgIcon } from 'app/core/svg-icon';
import { ActionWithIcon } from 'app/shared/action';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { truthyAttr } from 'app/shared/helper';
import { chunk } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Component used to display a password input
 */
@Component({
  selector: 'password-input',
  templateUrl: 'password-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: PasswordInputComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: PasswordInputComponent, multi: true }
  ]
})
export class PasswordInputComponent extends BaseControlComponent<string> implements OnInit, Validator {
  @HostBinding('class.form-field') classFormField = true;

  @Input() passwordInput: PasswordInput;

  @Input() paymentPreview: PaymentPreview;

  @Input() pos: boolean;

  @Input() placeholder: string;

  @Input() autocomplete = 'new-password';

  private _disableAutocomplete: boolean | string = false;
  @Input() get disableAutocomplete(): boolean | string {
    return this._disableAutocomplete;
  }
  set disableAutocomplete(disableAutocomplete: boolean | string) {
    this._disableAutocomplete = truthyAttr(disableAutocomplete);
  }

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
  otpCountdownAction: (remainingSeconds: number) => void;
  otpCountdownLabel$: BehaviorSubject<String>;
  otpButtonsDisabled$ = new BehaviorSubject<boolean>(false);
  passwordFieldType: string;

  visible = false;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private authService: AuthService,
    private posService: PosService,
    private notificationService: NotificationService,
    public layout: LayoutService
  ) {
    super(injector, controlContainer);
  }

  ngOnInit(): void {
    super.ngOnInit();
    const input = this.passwordInput;

    // Initialize the one-time-password fields
    this.otp = input.mode === PasswordModeEnum.OTP;
    if (this.otp) {
      this.otpCountdownLabel$ = new BehaviorSubject(null);
      this.otpCountdownAction = remainingSeconds => {
        if (remainingSeconds > 0) {
          this.otpCountdownLabel$.next(this.i18n.password.otp.countdownLabel(remainingSeconds));
        } else {
          this.otpButtonsDisabled$.next(false);
          this.otpCountdownLabel$.next(null);
        }
      };
      this.otpActions = [];
      if (input.otpSendMediums.includes(SendMediumEnum.EMAIL)) {
        this.otpActions.push(this.requestOtpAction(SendMediumEnum.EMAIL, input.emailToSendOtp));
      }
      if (input.otpSendMediums.includes(SendMediumEnum.SMS)) {
        if (input.mobilePhonesToSendOtp?.length > 0) {
          input.mobilePhonesToSendOtp.forEach(phone =>
            this.otpActions.push(this.requestOtpAction(SendMediumEnum.SMS, phone.number, phone.id))
          );
        } else {
          this.otpActions.push(this.requestOtpAction(SendMediumEnum.SMS, null));
        }
      }
    }

    if (this.disableAutocomplete) {
      const mockInput = document.createElement('input');
      mockInput.style.setProperty('-webkit-text-security', 'disc');
      const supportTextSecurity = mockInput.style.getPropertyValue('-webkit-text-security');
      if (!!supportTextSecurity || this.hasTextSecurityDisc()) {
        this.passwordFieldType = input.passwordType.onlyNumeric ? 'tel' : 'text';
      } else {
        this.passwordFieldType = 'password';
      }
    } else {
      this.passwordFieldType = 'password';
    }

    // Initialize the virtual keyboard fields
    this.virtualKeyboard = input.passwordType.inputMethod === PasswordInputMethodEnum.VIRTUAL_KEYBOARD;
    if (this.virtualKeyboard) {
      this.enteredVKPassword = [];
      this.updateVKButtons();
    }

    // Ensure we have a proper placeholder
    if (this.placeholder == null) {
      this.placeholder = this.passwordInput.name;
    }
  }

  hasTextSecurityDisc(): boolean {
    let present = false;
    (document as any).fonts.forEach(p1 => {
      if (!present && p1.family && 'text-security-disc' === p1.family.replace(/"/g, '')) {
        present = true;
      }
      return null;
    });
    return present;
  }

  otpCountdownButtonDisabledKey(label: string): (remainingSeconds: string) => string {
    return () => label + ' *';
  }

  onKeypress(event: KeyboardEvent): void {
    if (this.passwordInput.onlyNumeric) {
      if (!event.key.match(/[0-9]/)) {
        event.preventDefault();
      }
    }
  }

  /**
   * Returns an action to request a new OTP
   * @param medium The send medium
   */
  private requestOtpAction(medium: SendMediumEnum, value: string, phoneId?: string): ActionWithIcon {
    let icon: SvgIcon;
    let label: string;
    let mobilePhones;
    switch (medium) {
      case SendMediumEnum.EMAIL:
        mobilePhones = [];
        icon = SvgIcon.Envelope;
        label = this.i18n.password.otp.sendToEmail(value ? '(' + value + ')' : '');
        break;
      case SendMediumEnum.SMS:
        mobilePhones = [phoneId];
        icon = SvgIcon.Phone;
        label = this.i18n.password.otp.sendToPhone(value ? '(' + value + ')' : '');
        break;
      default:
        return null;
    }

    return new ActionWithIcon(icon, label, () => {
      this.otpButtonsDisabled$.next(true);
      let request: Observable<any>;
      if (this.pos) {
        request = this.posService.receivePaymentOtp({ medium, body: this.paymentPreview.payment });
      } else {
        request = this.dataForFrontendHolder.auth.loginConfirmation
          ? this.authService.newOtpForLoginConfirmation({ medium, mobilePhones })
          : this.authService.newOtp({ medium, mobilePhones });
      }
      this.addSub(
        request.subscribe(res => {
          this.notificationService.snackBar(
            this.i18n.password.otp.sent(
              this.pos
                ? this.paymentPreview.fromOperator?.display ?? this.paymentPreview.fromAccount.user.display
                : (res || []).join(', ')
            )
          );
          this.otpSent.emit(null);
        })
      );
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
      this.currentVKCombinations = chunk(
        this.passwordInput.buttons[this.enteredVKPassword.length],
        this.passwordInput.buttonsPerRow
      );
    }
    this.formControl.setValue(
      this.enteredVKPassword.length === 0
        ? ''
        : this.passwordInput.virtualKeyboardId + '|' + this.enteredVKPassword.join('|')
    );
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
        required: true
      };
    }
    return null;
  }

  otpDisableMessageFunction(medium: string): (remaining: number) => string {
    return () => this.i18n.password.otp.receiveBySent(medium);
  }

  registerOnValidatorChange() {}

  toggleVisibility() {
    this.visible = !this.visible;
  }
}
