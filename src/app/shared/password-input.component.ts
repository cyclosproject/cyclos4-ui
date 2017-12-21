import {
  ElementRef, Component, Input, Output, EventEmitter, ViewChild, AfterViewInit,
  ChangeDetectorRef, forwardRef, Provider, ChangeDetectionStrategy, OnDestroy, SkipSelf, Host, Optional
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator,
  AbstractControl, ValidationErrors, ControlContainer
} from '@angular/forms';
import { PasswordInput } from 'app/api/models';
import { PasswordInputMethodEnum } from 'app/api/models';
import { SendMediumEnum } from 'app/api/models';

import { AuthService } from 'app/api/services/auth.service';

import { NotificationService } from 'app/core/notification.service';
import { GeneralMessages } from 'app/messages/general-messages';

import { MatGridList } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';
import { BaseControlComponent } from 'app/shared/base-control.component';

// Contains a mapping between OTP send mediums and material icon ligatures
const OTP_ICONS = {};
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
};

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
export class PasswordInputComponent
  extends BaseControlComponent<string>
  implements OnDestroy, AfterViewInit, Validator {

  // Contains the current characters combination shown in the VK
  currentVKCombinations: string[];
  enteredVKPassword: string[] = [];

  @ViewChild('passwordComponent')
  passwordComponent: ElementRef;

  @ViewChild('vkButtons')
  vkButtons: MatGridList;

  @Input() placeholder: string;

  @Input() showIcon: boolean;

  @Output() enter = new EventEmitter<string>();

  @Output() otpSent = new EventEmitter<void>();

  virtualKeyboard: boolean;
  otpIcons: any = OTP_ICONS;
  otpMediums: any;

  private _passwordInput: PasswordInput;

  private subscriptions: Subscription[] = [];

  private validatorChangeCallback = () => { };

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private authService: AuthService,
    private notificationService: NotificationService,
    private generalMessages: GeneralMessages,
    private changeDetector: ChangeDetectorRef) {
    super(controlContainer);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.otpMediums = {};
    this.otpMediums[SendMediumEnum.EMAIL] = this.generalMessages.passwordOtpMediumEmail();
    this.otpMediums[SendMediumEnum.SMS] = this.generalMessages.passwordOtpMediumSms();

    if (this.placeholder == null) {
      this.placeholder = this.passwordInput.name;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    if (this.passwordComponent) {
      this.passwordComponent.nativeElement.focus();
      this.changeDetector.detectChanges();
    }
    // For some reason, Firefox don't respect height, but only min-height
    // on the MatGridList. We hope this doesn't break in future Angular Material versions.
    if (this.vkButtons) {
      const vk = <any>this.vkButtons;
      const ref: ElementRef = vk._element;
      const el: HTMLElement = ref.nativeElement;
      el.style.minHeight = el.style.height;
    }
  }

  @Input()
  set passwordInput(value: PasswordInput) {
    this._passwordInput = value;
    this.virtualKeyboard = value.inputMethod === PasswordInputMethodEnum.VIRTUAL_KEYBOARD;
    if (this.virtualKeyboard) {
      this.enteredVKPassword = [];
      this.updateVKButtons();
    }
  }

  get passwordInput(): PasswordInput {
    return this._passwordInput;
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

  requestOtp(medium: SendMediumEnum): void {
    this.authService.newOtp(medium)
      .subscribe(mediums => {
        const arg = mediums.join(', ');
        let message: string;
        switch (medium) {
          case SendMediumEnum.EMAIL:
            message = this.generalMessages.passwordOtpSentEmail(arg);
            break;
          case SendMediumEnum.SMS:
            message = this.generalMessages.passwordOtpSentSms(arg);
            break;
          default:
            // Unhandled medium
            message = 'The OTP was sent to ' + arg;
            break;
        }
        const dialog$ = this.notificationService.info(message);
        this.otpSent.emit(null);
        if (this.passwordComponent) {
          // There are 2 subscriptions here: one for the dialog result, another one for the afterClosed() event
          this.subscriptions.push(dialog$.subscribe(dialog => {
            this.subscriptions.push(dialog.afterClosed().subscribe(() => {
              this.passwordComponent.nativeElement.focus();
            }));
          }));
        }
      });
  }

  private updateVKButtons(): void {
    if (this.passwordComponent) {
      // update the input to simulate a new entered character
      this.passwordComponent.nativeElement.value = '*'.repeat(this.enteredVKPassword.length);
    }
    if (this.enteredVKPassword.length < this._passwordInput.buttons.length) {
      this.currentVKCombinations = this.passwordInput.buttons[this.enteredVKPassword.length];
    }
    this.formControl.setValue(this._passwordInput.id + '|' + this.enteredVKPassword.join('|'));
  }

  onDisabledChange(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.passwordComponent) {
      this.passwordComponent.nativeElement.disabled = isDisabled;
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
    const length = value.length;
    if (length < this.passwordInput.minLength) {
      return {
        'minlength': {
          'requiredLength': this.passwordInput.minLength,
          'actualLength': length
        }
      };
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
