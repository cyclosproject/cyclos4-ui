import { Inject, Injectable } from '@angular/core';
import {
  AccountKind, AccountWithOwner, AvailabilityEnum,
  IdentityProvider,
  IdentityProviderCallbackResult, IdentityProviderRequestResult,
  PasswordInput, PasswordModeEnum, RoleEnum, User, UserLocale
} from 'app/api/models';
import { IdentityProvidersService } from 'app/api/services/identity-providers.service';
import { LocalizationService } from 'app/api/services/localization.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { NextRequestState, PreferredLocale } from 'app/core/next-request-state';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
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
    @Inject(I18nInjectionToken) private i18n: I18n,
    private dataForFrontendHolder: DataForFrontendHolder,
    private identityProvidersService: IdentityProvidersService,
    private pushNotifications: PushNotificationsService,
    private localizationService: LocalizationService,
    private nextRequestState: NextRequestState) {
  }

  /**
   * Returns a key used for guests to upload temporary images / files
   */
  get guestKey(): string {
    if (this.dataForFrontendHolder.user != null) {
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
   * Indicates whether the usr session operates in restricted access mode, that means,
   * there is some urgent situation that needs to be resolved before using the system.
   */
  get restrictedAccess(): boolean {
    return ApiHelper.isRestrictedAccess(this.dataForFrontendHolder.dataForFrontend);
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
      return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR;
    }
    const user = this.dataForFrontendHolder.user;
    if (user) {
      if (typeof key === 'string') {
        return user.id === key;
      } else {
        // May be User or AccountWithOwner
        if (key['kind']) {
          // key is an AccountWithOwner
          if (key['kind'] === AccountKind.SYSTEM) {
            // System account is self only for admins
            return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR;
          } else {
            // User account is self if the id matches the logged user id
            return key.user.id === user.id;
          }
        } else {
          // key is a user
          return key.id === user.id || key.id === user?.user?.id;
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
    const loggedUser = this.dataForFrontendHolder.user;
    if (loggedUser) {
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
    return this.isSelf(key) && this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR;
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
  getConfirmationMessage(passwordInput: PasswordInput, posConfirmation?: boolean): string {
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
        return posConfirmation ? this.i18n.transaction.confirmMessage.activeDevice : this.i18n.password.confirmMessage.activeDevice;
      } else {
        if (deviceRequired) {
          // Device is required but has none
          return posConfirmation ? this.i18n.transaction.confirmMessage.notActiveDevice : this.i18n.password.confirmMessage.notActiveDevice;
        } else {
          // Device is optional and has no password
          if (otp) {
            return posConfirmation ? this.i18n.transaction.confirmMessage.notActiveDeviceOrRenewablePasswordNoMediums(passwordInput.name)
              : this.i18n.password.confirmMessage.notActiveDeviceOrRenewablePasswordNoMediums(passwordInput.name);
          } else {
            return posConfirmation ? this.i18n.transaction.confirmMessage.notActiveDeviceOrPassword(passwordInput.name)
              : this.i18n.password.confirmMessage.notActiveDeviceOrPassword(passwordInput.name);
          }
        }
      }
    }

    // Handle mixed device / password with a device active
    if (deviceOptional && deviceUsable) {
      // At this point we know the password is usable and the device is active, so the user can choose
      if (otp) {
        if (passwordInput.hasActivePassword && hasOtpSendMediums) {
          return posConfirmation ? this.i18n.transaction.confirmMessage.activeDeviceOrRenewablePassword
            : this.i18n.password.confirmMessage.activeDeviceOrRenewablePassword;
        } else if (passwordInput.hasActivePassword) {
          return posConfirmation ? this.i18n.transaction.confirmMessage.activeDeviceOrRenewablePasswordNoMediums
            : this.i18n.password.confirmMessage.activeDeviceOrRenewablePasswordNoMediums;
        } else {
          return posConfirmation ? this.i18n.transaction.confirmMessage.activeDeviceOrNotActiveRenewablePassword
            : this.i18n.password.confirmMessage.activeDeviceOrNotActiveRenewablePassword;
        }
      } else {
        return posConfirmation ? this.i18n.transaction.confirmMessage.activeDeviceOrPassword(passwordInput.name)
          : this.i18n.password.confirmMessage.activeDeviceOrPassword(passwordInput.name);
      }
    }

    // At this point, the confirmation is with password only
    if (otp) {
      // The messages for OTP are distinct
      if (!passwordInput.hasActivePassword && !hasOtpSendMediums) {
        return posConfirmation ? this.i18n.transaction.confirmMessage.notActiveRenewablePasswordNoMediums(passwordInput.name)
          : this.i18n.password.confirmMessage.notActiveRenewablePasswordNoMediums(passwordInput.name);
      } else if (passwordInput.hasActivePassword && hasOtpSendMediums) {
        return posConfirmation ? this.i18n.transaction.confirmMessage.activeRenewablePassword
          : this.i18n.password.confirmMessage.activeRenewablePassword;
      } else if (passwordInput.hasActivePassword) {
        return posConfirmation ? this.i18n.transaction.confirmMessage.activeRenewablePasswordNoMediums
          : this.i18n.password.confirmMessage.activeRenewablePasswordNoMediums;
      } else {
        return posConfirmation ? this.i18n.transaction.confirmMessage.notActiveRenewablePassword
          : this.i18n.password.confirmMessage.notActiveRenewablePassword;
      }
    } else {
      // A regular password
      if (passwordUsable) {
        return posConfirmation ? this.i18n.transaction.confirmMessage.activePassword(passwordInput.name)
          : this.i18n.password.confirmMessage.activePassword(passwordInput.name);
      } else {
        return posConfirmation ? this.i18n.transaction.confirmMessage.notActivePassword(passwordInput.name)
          : this.i18n.password.confirmMessage.notActivePassword(passwordInput.name);
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
      const guest = !this.dataForFrontendHolder.user;
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

  /**
   * Sets the user locale
   */
  setLocale(locale: UserLocale | string) {
    const code = typeof locale === 'string' ? locale : locale.code;
    localStorage.setItem(PreferredLocale, code);
    if (this.dataForFrontendHolder.user) {
      // Save the user locale, then refresh
      this.localizationService.saveLocalizationSettings({
        body: { locale: code }
      }).subscribe(() => {
        // Need to refresh the page to reload the correct translations
        window.location.reload();
      });
    } else {
      // Need to refresh the page to reload the correct translations
      window.location.reload();
    }
  }

}
