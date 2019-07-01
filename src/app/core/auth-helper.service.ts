import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AvailabilityEnum, PasswordInput, PasswordModeEnum, RoleEnum, User } from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { ConditionalMenu, Menu } from 'app/shared/menu';
import { trim } from 'lodash';

/**
 * Helper service for authentication / password common functions
 */
@Injectable({
  providedIn: 'root'
})
export class AuthHelperService {
  /**
   * Returns a ConditionalMenu that calls `AuthHelperService.menuByRole`
   */
  static menuByRole(myMenu: Menu, managerOnly = true): ConditionalMenu {
    return injector => {
      const authHelper = injector.get(AuthHelperService);
      return authHelper._menuByRole(myMenu, managerOnly);
    };
  }

  constructor(
    private i18n: I18n,
    private dataForUi: DataForUiHolder,
    private formBuilder: FormBuilder,
    private router: Router) {
  }

  /**
   * Returns whether the given URL key represents the logged user
   * @param key The key / user
   */
  isSelf(key: string | User): boolean {
    if (empty(key) || key === ApiHelper.SELF) {
      return true;
    }
    if (key === ApiHelper.SYSTEM) {
      // System is self only for admins
      return this.dataForUi.role === RoleEnum.ADMINISTRATOR;
    }
    const user = this.dataForUi.user;
    if (user) {
      return user.id === key || (typeof key === 'object' && key.id === user.id);
    }
    return false;
  }

  /**
   * Returns whether the given key represents 'the system'.
   * Either the string `system` or `self` when logged in as administrator.
   * @param key The key
   */
  isSystem(key: string): boolean {
    if (key === ApiHelper.SYSTEM) {
      return true;
    }
    return this.isSelf(key) && this.dataForUi.role === RoleEnum.ADMINISTRATOR;
  }


  /**
   * Returns the string `self` when the given id / user is the same as the logged user
   * @param key The key / user
   */
  orSelf(key: string | User): string {
    if (this.isSelf(key)) {
      return ApiHelper.SELF;
    } else if (typeof key === 'object') {
      return key.id;
    } else {
      return key;
    }
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
        return this.i18n.password.confirmDeviceActive;
      } else {
        if (deviceRequired) {
          // Device is required but has none
          return this.i18n.password.confirmDeviceNone;
        } else {
          // Device is optional and has no password
          if (otp) {
            return this.i18n.password.confirmDeviceOrOtpNoMediums;
          } else {
            return this.i18n.password.confirmDeviceOrPasswordNone(passwordInput.name);
          }
        }
      }
    }

    // Handle mixed device / password with a device active
    if (deviceOptional && deviceUsable) {
      // At this point we know the password is usable and the device is active, so the user can choose
      if (otp) {
        if (passwordInput.hasActivePassword) {
          return this.i18n.password.confirmDeviceOrOtpActive;
        } else {
          return this.i18n.password.confirmDeviceOrOtpRequest;
        }
      } else {
        return this.i18n.password.confirmDeviceOrPasswordActive(passwordInput.name);
      }
    }

    // At this point, the confirmation is with password only
    if (otp) {
      // The messages for OTP are distinct
      if (!hasOtpSendMediums) {
        return this.i18n.password.confirmOtpNoMediums;
      } else if (passwordInput.hasActiveDevice) {
        return this.i18n.password.confirmOtpActive;
      } else {
        return this.i18n.password.confirmOtpRequest;
      }
    } else {
      // A regular password
      if (passwordUsable) {
        return this.i18n.password.confirmationMessage(passwordInput.name);
      } else {
        return this.i18n.password.confirmNoPassword(passwordInput.name);
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

  private _menuByRole(myMenu: Menu, managerOnly = true): Menu {
    const url = trim(this.router.url, '/');
    const parts = url.split('/');
    // The first part is the module (users / banking). Assume the user is the second part
    const user = parts[1];
    if (this.isSelf(user)) {
      return myMenu;
    }
    if (this.dataForUi.role === RoleEnum.BROKER && managerOnly) {
      // A role over other users may be doing manager-only stuff. In this case, use the MY_BROKERED_USERS meny
      return Menu.MY_BROKERED_USERS;
    }
    // All other user-operation start with finding the user first
    return Menu.SEARCH_USERS;
  }
}
