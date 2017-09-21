import {
  ElementRef, Component, Input, Output, EventEmitter,
  ViewChild, AfterViewInit, ChangeDetectorRef, forwardRef, Provider, ChangeDetectionStrategy, OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, AbstractControl, ValidationErrors } from "@angular/forms";
import { PasswordInput } from "app/api/models";
import { PasswordInputMethodEnum } from "app/api/models";
import { PasswordModeEnum } from "app/api/models";
import { SendMediumEnum } from 'app/api/models';
import { OtpError } from 'app/api/models';
import { OtpErrorCode } from 'app/api/models';

import { AuthService } from "app/api/services/auth.service";

import { NotificationService } from "app/core/notification.service";
import { GeneralMessages } from "app/messages/general-messages";

import { MdInput, MdGridList } from "@angular/material";

// Contains a mapping between OTP send mediums and material icon ligatures
const OTP_ICONS = {}
OTP_ICONS[SendMediumEnum.EMAIL] = 'email';
OTP_ICONS[SendMediumEnum.SMS] = 'textsms';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PASSWORD_INPUT_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PasswordInputComponent),
  multi: true
};

// Definition of the exported NG_VALIDATORS provider
export const PASSWORD_INPUT_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => PasswordInputComponent),
  multi: true
}

/**
 * Component used to display a password input
 */
@Component({
  selector: 'password-input',
  templateUrl: 'password-input.component.html',
  styleUrls: ['password-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PASSWORD_INPUT_VALUE_ACCESSOR,
    PASSWORD_INPUT_VALIDATOR
  ]
})
export class PasswordInputComponent implements OnInit, AfterViewInit, ControlValueAccessor, Validator {
  
  //contains the current characters combination shown in the VK
  currentVKCombinations: string[];
  enteredVKPassword: string[] = [];

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

  get disabled(): boolean {
    return this.passwordComponent == null ? false : this.passwordComponent.nativeElement.disabled || false;
  }
  set disabled(disabled: boolean)  {
    if (this.passwordComponent) this.passwordComponent.nativeElement.disabled = disabled;
  }

  @ViewChild("passwordComponent")
  passwordComponent: ElementRef;

  @ViewChild("vkButtons")
  vkButtons: MdGridList;

  @Input() placeholder: string;

  @Input() showIcon: boolean;

  @Output() onEnter = new EventEmitter<string>();

  @Output() otpSent = new EventEmitter<void>();

  private _password: string;
  get password(): string {
    return this._password;
  }
  set password(password: string) {
    if (this._password === password) {
      return;
    }
    this._password = password;
    this.emitPasswordChange();
  }

  virtualKeyboard: boolean;
  otpIcons: any = OTP_ICONS;
  otpMediums: any;

  private _passwordInput: PasswordInput;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private generalMessages: GeneralMessages,
    private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.otpMediums = {}
    this.otpMediums[SendMediumEnum.EMAIL] = this.generalMessages.passwordOtpMediumEmail();
    this.otpMediums[SendMediumEnum.SMS] = this.generalMessages.passwordOtpMediumSms();

    if (this.placeholder == null) {
      this.placeholder = this.passwordInput.name;
    }
  }

  ngAfterViewInit(): void {
    if (this.passwordComponent) {
      this.passwordComponent.nativeElement.focus();
      this.changeDetector.detectChanges();
    }
    // For some reason, Firefox don't respect height, but only min-height
    // on the MdGridList. We hope this doesn't break in future Angular Material versions.
    if (this.vkButtons) {
      let vk = <any>this.vkButtons;
      let ref: ElementRef = vk._element;
      let el: HTMLElement = ref.nativeElement;
      el.style.minHeight = el.style.height;
    }
  }

  @Input()
  set passwordInput(value: PasswordInput) {
    this._passwordInput = value;
    this.virtualKeyboard = value.inputMethod == PasswordInputMethodEnum.VIRTUAL_KEYBOARD;
    if (this.virtualKeyboard) {
      this.enteredVKPassword = [];
      this.updateVKButtons()
    }
  }

  get passwordInput(): PasswordInput {
    return this._passwordInput
  }

  vkKey(combination: string) {
    this.enteredVKPassword.push(combination)
    this.updateVKButtons()
  }

  vkClear() {
    this.enteredVKPassword = []
    this.updateVKButtons()
  }

  vkBack() {
    this.enteredVKPassword.splice(this.enteredVKPassword.length - 1, 1)
    this.updateVKButtons()
  }

  emitPasswordChange() {
    this.changeCallback(this._password);
    this.validatorChangeCallback();
  }

  requestOtp(medium: SendMediumEnum): void {
    this.authService.newOtp(medium)
      .then(resp => {
        let arg = resp.data.join(", ");
        var message: string;
        switch (medium) {
          case SendMediumEnum.EMAIL:
            message = this.generalMessages.passwordOtpSentEmail(arg);
            break;
          case SendMediumEnum.SMS:
            message = this.generalMessages.passwordOtpSentSms(arg);
            break;
          default:
            // Unhandled medium
            message = "The OTP was sent to " + arg;
            break;
        }
        let dialog = this.notificationService.info(message);
        this.otpSent.emit(null);
        if (this.passwordComponent) {
          dialog.afterClosed().subscribe(() => {
            this.passwordComponent.nativeElement.focus();
          });
        }
      })
      .catch(error => {
        this.notificationService.error(this.generalMessages.passwordOtpError());
      })
  }

  private updateVKButtons(): void {
    if (this.passwordComponent) {
      // update the input to simulate a new entered character      
      this.passwordComponent.nativeElement.value = "*".repeat(this.enteredVKPassword.length)
    }
    if (this.enteredVKPassword.length < this._passwordInput.buttons.length) {
      this.currentVKCombinations = this.passwordInput.buttons[this.enteredVKPassword.length]
    }
    this.password = this._passwordInput.id + "|" + this.enteredVKPassword.join("|");
  }

  // ControlValueAccessor methods
  writeValue(obj: any): void {
    this.password = obj;
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    if (this.passwordComponent) {
      this.passwordComponent.nativeElement.disabled = isDisabled;
    }
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (c.value == null || c.value === '') {
      return {
        required: true
      }
    }
    let length: number;
    if (this.passwordInput.inputMethod == PasswordInputMethodEnum.VIRTUAL_KEYBOARD) {
      length = this.enteredVKPassword.length;
    } else {
      length = this._password.length;
    }
    if (length < this.passwordInput.minLength) {
      return {
        "length": {
          "min": this.passwordInput.minLength
        }
      }
    }
    return null;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }

  focus() {
    this.passwordComponent.nativeElement.focus();
  }

}