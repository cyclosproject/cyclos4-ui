import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { PasswordInput, PasswordModeEnum, AvailabilityEnum } from 'app/api/models';
import { Messages } from 'app/messages/messages';
import { empty } from 'app/shared/helper';

/**
 * Helper service for authentication / password common functions
 */
@Injectable({
  providedIn: 'root'
})
export class AuthHelperService {

  constructor(
    private messages: Messages,
    private formBuilder: FormBuilder) {
  }

  /**
   * Returns whether the given password input is enabled for confirmation.
   * That means: if the password is an OTP, needs valid mediums to send.
   * Otherwise, there must have an active password.
   * If passwordInput is null it is assumed that no confirmation password is needed, hence, can confirm.
   */
  canConfirm(passwordInput: PasswordInput): boolean {
    if (passwordInput == null) {
      // No confirmation is actually needed
      return true;
    }
    const device = passwordInput.deviceAvailability || AvailabilityEnum.DISABLED;
    if (device === AvailabilityEnum.REQUIRED) {
      // Must confirm with a device. Can confirm if there's at least one active device.
      return passwordInput.hasActiveDevice;
    }
    // At this point device is either optional or disabled. Must have an active password...
    if (passwordInput.hasActivePassword) {
      return true;
    }
    // ... except if the password input mode is OTP. In this case, a password is generated 'on the fly'...
    if (passwordInput.mode === PasswordModeEnum.OTP) {
      // ... but still, needs at least one send medium
      return (passwordInput.otpSendMediums || []).length > 0;
    }
    return false;
  }

  /**
   * Returns whether a confirmation with device is possible
   */
  canConfirmWithDevice(passwordInput: PasswordInput): boolean {
    if (passwordInput == null) {
      return false;
    }
    const device = passwordInput.deviceAvailability || AvailabilityEnum.DISABLED;
    return device !== AvailabilityEnum.DISABLED && passwordInput.hasActiveDevice;
  }

  /**
   * Returns whether a confirmation with password is possible
   */
  canConfirmWithPassword(passwordInput: PasswordInput): boolean {
    if (passwordInput == null) {
      return false;
    }
    if (passwordInput.deviceAvailability === AvailabilityEnum.REQUIRED) {
      // User is required to confirm with device
      return false;
    }
    if (passwordInput.hasActivePassword) {
      // There's an active password
      return true;
    }
    // Without an active password, it might still be possible to confirm with OTP
    if (passwordInput.mode === PasswordModeEnum.OTP && !empty(passwordInput.otpSendMediums)) {
      return true;
    }
    // No usable password
    return false;
  }

  /**
   * Returns the message that should be presented to users in case a confirmation password cannot be used
   */
  getConfirmationMessage(passwordInput: PasswordInput): string {
    if (passwordInput == null) {
      return null;
    }
    const deviceRequired = passwordInput.deviceAvailability === AvailabilityEnum.REQUIRED;
    const deviceOptional = passwordInput.deviceAvailability === AvailabilityEnum.OPTIONAL;
    const deviceUsable = this.canConfirmWithDevice(passwordInput);

    const otp = passwordInput.mode === PasswordModeEnum.OTP;
    const passwordUsable = this.canConfirmWithPassword(passwordInput);
    const hasOtpSendMediums = passwordInput.mode === PasswordModeEnum.OTP && !empty(passwordInput.otpSendMediums);

    // Handle device-only confirmation, or device / password confirmation with no usable password
    if (deviceRequired || deviceOptional && !passwordUsable) {
      if (deviceUsable) {
        // Show a message to scan the QR-code
        return this.messages.auth.password.confirmDeviceActive;
      } else {
        if (deviceRequired) {
          // Device is required but has none
          return this.messages.auth.password.confirmDeviceNone;
        } else {
          // Device is optional and has no password
          if (otp) {
            return this.messages.auth.password.confirmDeviceOrOtpNoMediums;
          } else {
            return this.messages.auth.password.confirmDeviceOrPasswordNone(passwordInput.name);
          }
        }
      }
    }

    // Handle mixed device / password with a device active
    if (deviceOptional && deviceUsable) {
      // At this point we know the password is usable and the device is active, so the user can choose
      if (otp) {
        if (passwordInput.hasActivePassword) {
          return this.messages.auth.password.confirmDeviceOrOtpActive;
        } else {
          return this.messages.auth.password.confirmDeviceOrOtpRequest;
        }
      } else {
        return this.messages.auth.password.confirmDeviceOrPasswordActive(passwordInput.name);
      }
    }

    // At this point, the confirmation is with password only
    if (otp) {
      // The messages for OTP are distinct
      if (!hasOtpSendMediums) {
        return this.messages.auth.password.confirmOtpNoMediums;
      } else if (passwordInput.hasActiveDevice) {
        return this.messages.auth.password.confirmOtpActive;
      } else {
        return this.messages.auth.password.confirmOtpRequest;
      }
    } else {
      // A regular password
      if (passwordUsable) {
        return this.messages.auth.password.confirmationMessage(passwordInput.name);
      } else {
        return this.messages.auth.password.confirmNoPassword(passwordInput.name);
      }
    }
  }

  /**
   * Returns the fields that should be excluded when fetching the Auth model.
   * Contains both deprecated and unused fields.
   */
  excludedAuthFields(prefix: string): string[] {
    const actualPrefix = prefix == null ? '' : prefix + '.';
    return [
      `-${actualPrefix}permissions.records`,
      `-${actualPrefix}permissions.systemRecords`,
      `-${actualPrefix}permissions.userRecords`,
      `-${actualPrefix}permissions.operations`,
      `-${actualPrefix}permissions.accounts`,
    ];
  }

  /**
   * Returns a form that has a captcha challenge and response
   * @param formBuilder The form builder
   */
  captchaFormGroup() {
    return this.formBuilder.group({
      challenge: ['', Validators.required],
      response: ['', Validators.required]
    });
  }
}
