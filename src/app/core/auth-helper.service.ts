import { Inject, Injectable } from '@angular/core';
import {
  AccountKind,
  AccountWithOwner,
  CredentialTypeEnum,
  IdentityProvider,
  IdentityProviderCallbackResult,
  IdentityProviderRequestResult,
  PasswordInput,
  PasswordModeEnum,
  PasswordType,
  RoleEnum,
  User,
  UserLocale
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
  providedIn: 'root'
})
export class AuthHelperService {
  private identityProviderSubscription: Subscription;

  constructor(
    @Inject(I18nInjectionToken) private i18n: I18n,
    private dataForFrontendHolder: DataForFrontendHolder,
    private identityProvidersService: IdentityProvidersService,
    private pushNotifications: PushNotificationsService,
    private localizationService: LocalizationService,
    private nextRequestState: NextRequestState
  ) {}

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
          return key.id && (key.id === user.id || key.id === user?.user?.id);
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
      return (loggedUser.user && possibleIds.includes(loggedUser.user.id)) || possibleIds.includes(loggedUser.id);
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
   * Returns the initial credential type for the given password input
   */
  initialCredentialType(passwordInput: PasswordInput) {
    const active = passwordInput?.activeCredentials || [];
    for (const type of [CredentialTypeEnum.DEVICE, CredentialTypeEnum.TOTP, CredentialTypeEnum.PASSWORD]) {
      if (active.includes(type)) {
        return type;
      }
    }
  }

  /**
   * Returns whether the logged user can confirm with the given password input.
   * That means: either it is null, meaning no confirmation is actually needed,  if the password is an OTP, needs valid mediums to send.
   * Otherwise, there must have an active password.
   * If passwordInput is null it is assumed that no confirmation password is needed, hence, can confirm.
   */
  canConfirm(passwordInput: PasswordInput, credentialType?: CredentialTypeEnum): boolean {
    if (passwordInput == null) {
      // No confirmation is actually needed
      return true;
    }
    if (credentialType) {
      return passwordInput.activeCredentials?.includes(credentialType);
    }
    return !empty(passwordInput.activeCredentials);
  }

  /**
   * Returns the message that should be presented to users in an action confirmation
   */
  getConfirmationMessage(passwordInput: PasswordInput, selectedCredential?: CredentialTypeEnum, pos?: boolean): string {
    if (passwordInput == null) {
      return null;
    }
    const allowed = passwordInput.allowedCredentials || [];
    if (allowed.length === 0) {
      return this.i18n.password.confirmation.notPossible;
    }

    // Handle the case that there are no active credentials
    const active = passwordInput.activeCredentials || [];
    if (active.length === 0) {
      // No active credentials
      if (allowed.length === 1) {
        // There are multiple allowed confirmation credential: show a specific message
        switch (allowed[0]) {
          case CredentialTypeEnum.PASSWORD:
            return pos
              ? this.i18n.transaction.posConfirmation.notActive.password(passwordInput.passwordType?.name)
              : this.i18n.password.confirmation.notActive.password(passwordInput.passwordType?.name);
          case CredentialTypeEnum.DEVICE:
            return pos
              ? this.i18n.transaction.posConfirmation.notActive.device
              : this.i18n.password.confirmation.notActive.device;
          case CredentialTypeEnum.TOTP:
            return pos
              ? this.i18n.transaction.posConfirmation.notActive.totp
              : this.i18n.password.confirmation.notActive.totp;
          case CredentialTypeEnum.PIN:
            // Not used in this frontend
            return this.i18n.password.confirmation.notPossible;
        }
      } else {
        // There are multiple allowed confirmation credentials: show a generic message
        const names = allowed.map(ct => this.credentialTypeLabel(passwordInput, ct));
        return pos
          ? this.i18n.transaction.posConfirmation.notActive.multiple(names.join(', '))
          : this.i18n.password.confirmation.notActive.multiple(names.join(', '));
      }
    }

    const singleType = selectedCredential ? selectedCredential : active.length === 1 ? active[0] : null;
    if (singleType != null) {
      switch (singleType) {
        case CredentialTypeEnum.PASSWORD:
          return pos
            ? this.i18n.transaction.posConfirmation.password(passwordInput.passwordType?.name)
            : this.i18n.password.confirmation.password(passwordInput.passwordType?.name);
        case CredentialTypeEnum.DEVICE:
          return pos ? this.i18n.transaction.posConfirmation.device : this.i18n.password.confirmation.device;
        case CredentialTypeEnum.TOTP:
          return pos ? this.i18n.transaction.posConfirmation.totp : this.i18n.password.confirmation.totp;
        case CredentialTypeEnum.PIN:
          // Not used in this frontend
          return this.i18n.password.confirmation.notPossible;
      }
    }
    return null;
  }

  /**
   * Returns the display label of a credential type
   */
  credentialTypeLabel(passwordInput: { passwordType?: PasswordType }, credentialType: CredentialTypeEnum) {
    switch (credentialType) {
      case CredentialTypeEnum.DEVICE:
        return this.i18n.password.confirmModeDevice;
      case CredentialTypeEnum.PASSWORD:
        return passwordInput?.passwordType?.name;
      case CredentialTypeEnum.TOTP:
        return this.i18n.password.confirmModeTotp;
    }
  }

  /**
   * Indicates whether the submit button should be shown for the given password input when the given credential type is selected
   */
  showSubmit(passwordInput: PasswordInput, credentialType: CredentialTypeEnum, otpSent?: boolean) {
    if (!passwordInput || !credentialType) {
      return true;
    }
    switch (credentialType) {
      case CredentialTypeEnum.DEVICE:
      case CredentialTypeEnum.PIN:
        // Never show for device, and PIN isn't supported in this frontend
        return false;
      case CredentialTypeEnum.TOTP:
        // Always show for TOTP
        return true;
      case CredentialTypeEnum.PASSWORD:
        // For password, show when there's an active password, except if a non-reusable OTP without having sent the OTP
        if (passwordInput?.passwordType?.mode === PasswordModeEnum.OTP) {
          return otpSent || passwordInput.hasReusableOtp;
        }
        // For others, always active
        return true;
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
      `-${actualPrefix}permissions.accounts`
    ];
  }

  /**
   * Opens a popup with a request for an identity provider
   */
  identityProviderPopup(
    idp: IdentityProvider,
    type: 'login' | 'register' | 'wizard' | 'link',
    group?: string,
    key?: string,
    userAgentId?: string
  ): Observable<IdentityProviderCallbackResult> {
    const observable = new Subject<IdentityProviderCallbackResult>();

    // Open a popup which will redirect the user to the identity provider
    const win = ApiHelper.openPopup(this.i18n.identityProvider.popup(idp.name), 600, 600);

    // Build the request according to the request type
    let request: Observable<IdentityProviderRequestResult>;
    switch (type) {
      case 'login':
        this.nextRequestState.nextAsGuest();
        request = this.identityProvidersService.prepareIdentityProviderLogin({
          identityProvider: idp.internalName,
          userAgentId: userAgentId
        });
        break;
      case 'register':
        this.nextRequestState.nextAsGuest();
        request = this.identityProvidersService.prepareIdentityProviderRegistration({
          identityProvider: idp.internalName,
          group,
          userAgentId: userAgentId
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
      this.localizationService
        .saveLocalizationSettings({
          body: { locale: code }
        })
        .subscribe(() => {
          // Need to refresh the page to reload the correct translations
          window.location.reload();
        });
    } else {
      // Need to refresh the page to reload the correct translations
      window.location.reload();
    }
  }
}
