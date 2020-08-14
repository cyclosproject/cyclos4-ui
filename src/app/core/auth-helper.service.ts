import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  AccountKind, AccountWithOwner, AvailabilityEnum, IdentityProvider,
  IdentityProviderCallbackResult, IdentityProviderRequestResult,
  PasswordInput, PasswordModeEnum, RoleEnum, User
} from 'app/api/models';
import { IdentityProvidersService } from 'app/api/services';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { NextRequestState } from 'app/core/next-request-state';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { Observable, Subject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Helper service for authentication / password common functions
 */
@Injectable({
  providedIn: 'root',
})
export class AuthHelperService {

  private identityProviderSubscription: Subscription;

  constructor(
    private i18n: I18n,
    private dataForUiHolder: DataForUiHolder,
    private formBuilder: FormBuilder,
    private identityProvidersService: IdentityProvidersService,
    private pushNotifications: PushNotificationsService,
    private nextRequestState: NextRequestState) {
  }

  /**
   * Returns a key used for guests to upload temporary images / files
   */
  get guestKey(): string {
    if (this.dataForUiHolder.user != null) {
      return '';
    }
    const name = 'GuestKey';
    let key = localStorage.getItem(name);
    if (empty(key)) {
      key = `${new Date().getTime()}_${Math.random() * Number.MAX_SAFE_INTEGER}`;
      localStorage.setItem(name, key);
    }
    return key;
  }

  /**
   * Returns whether the given URL key / user / account represents the logged user
   * @param key The key / user
   */
  isSelf(key: string | User | AccountWithOwner): boolean {
    if (empty(key) || key === ApiHelper.SELF) {
      return true;
    }
    if (key === ApiHelper.SYSTEM) {
      // System is self only for admins
      return this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR;
    }
    const user = this.dataForUiHolder.user;
    if (user) {
      if (typeof key === 'string') {
        return user.id === key;
      } else {
        // May be User or AccountWithOwner
        if (key['kind']) {
          // key is an AccountWithOwner
          if (key['kind'] === AccountKind.SYSTEM) {
            // System account is self only for admins
            return this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR;
          } else {
            // User account is self if the id matches the logged user id
            return key.user.id === user.id;
          }
        } else {
          // key is a user
          return key.id === user.id;
        }
      }
    } else {
      // Not logged-in: never self
      return false;
    }
  }

  /**
   * Returns whether the given URL user is the same logged user or the same operator owner
   * @param user The user
   */
  isSelfOrOwner(user: User): boolean {
    if (!user) {
      return true;
    }
    const loggedUser = this.dataForUiHolder.user;
    const possibleIds = [];
    if (user.id) {
      possibleIds.push(user.id);
    }
    if (user.user && user.user.id) {
      possibleIds.push(user.user.id);
    }
    return loggedUser.user && possibleIds.includes(loggedUser.user.id)
      || possibleIds.includes(loggedUser.id);
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
    return this.isSelf(key) && this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR;
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
    } else if (device === AvailabilityEnum.OPTIONAL && passwordInput.hasActiveDevice) {
      // On optional device, if there's an active device, the user can confirm, regardless of the password
      return true;
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
      response: ['', Validators.required],
    });
  }

  /**
   * Opens a popup with a request for an identity provider
   */
  identityProviderPopup(idp: IdentityProvider, type: 'login' | 'register' | 'wizard' | 'link', group?: string, key?: string):
    Observable<IdentityProviderCallbackResult> {
    const observable = new Subject<IdentityProviderCallbackResult>();

    // Open a popup which will redirect the user to the identity provider
    const win = ApiHelper.openPopup(this.i18n.identityProvider.popup(idp.name), 600, 600);

    // Build the request according to the request type
    let request: Observable<IdentityProviderRequestResult>;
    switch (type) {
      case 'login':
        this.nextRequestState.nextAsGuest();
        request = this.identityProvidersService.prepareIdentityProviderLogin({ identityProvider: idp.internalName });
        break;
      case 'register':
        this.nextRequestState.nextAsGuest();
        request = this.identityProvidersService.prepareIdentityProviderRegistration({
          identityProvider: idp.internalName,
          group,
        });
        break;
      case 'wizard':
        this.nextRequestState.nextAsGuest();
        request = this.identityProvidersService.prepareIdentityProviderWizard({
          identityProvider: idp.internalName,
          key
        });
        break;
      case 'link':
        request = this.identityProvidersService.prepareIdentityProviderLink({ identityProvider: idp.internalName });
        break;
    }
    request.pipe(first()).subscribe(result => {
      // We got the response and need to observe changes. For logged user it will be already registered. For guests, we need a new one.
      const guest = !this.dataForUiHolder.user;
      if (guest) {
        this.pushNotifications.openForIdentityProviderCallback(result.requestId);
      }
      // Whenever the callback result is received, notify the resulting Observable
      this.identityProviderSubscription = this.pushNotifications.identityProviderCallback$.subscribe(callback => {
        if (result.requestId === callback.requestId) {
          // When as guest, close the opened push notifications stream
          if (guest) {
            this.pushNotifications.close();
          }
          // Remove the previous subscription, if any
          if (this.identityProviderSubscription) {
            this.identityProviderSubscription.unsubscribe();
            this.identityProviderSubscription = null;
          }
          // The callback is really for this request
          observable.next(callback);
        }
      });

      // Go to the provider URL
      win.location.assign(result.url);
    });
    return observable;
  }

}
