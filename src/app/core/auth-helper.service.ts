import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  AccountKind, AccountWithOwner, AvailabilityEnum, PasswordInput,
  PasswordModeEnum, RoleEnum, User, UserRelationshipEnum, Transfer
} from 'app/api/models';
import { UsersService } from 'app/api/services';
import { CacheService } from 'app/core/cache.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { empty, truthyAttr } from 'app/shared/helper';
import { ActiveMenu, Menu } from 'app/shared/menu';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Helper service for authentication / password common functions
 */
@Injectable({
  providedIn: 'root'
})
export class AuthHelperService {

  constructor(
    private i18n: I18n,
    private dataForUiHolder: DataForUiHolder,
    private formBuilder: FormBuilder,
    private cache: CacheService,
    private usersService: UsersService) {
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

  /**
   * Returns the home menu, which is `Menu.HOME` for guests, or `Menu.DASHBOARD` for logged users.
   */
  homeMenu(): Menu {
    return this.dataForUiHolder.user ? Menu.DASHBOARD : Menu.HOME;
  }

  /**
   * Returns a menu according to the relation between the logged user and the given user (using `isSelfOrOwner`).
   * If self, returns the `selfMenu`. Otherwise, returns the menu to search users.
   * @param user The user being tested
   * @param selfMenu The menu when the user is self
   * @see #isSelfOrOwner
   * @see #searchUsersMenu
   */
  userMenu(user: User, selfMenu: Menu | ActiveMenu): Menu | ActiveMenu | Observable<Menu | ActiveMenu> {
    return this.isSelfOrOwner(user) ? selfMenu : this.searchUsersMenu(user);
  }

  /**
   * Returns the menu the authenticated user is expected to use to find the given user / operator:
   *
   * - Guests use `Menu.PUBLIC_DIRECTORY`.
   * - Own user use `Menu.MY_PROFILE`
   * - Own operator use `Menu.MY_OPERATORS`
   * - Members / admins always use `Menu.SEARCH_USERS`.
   * - Brokers are problemmatic, as we need to know whether the logged user is a broker of the given user or not,
   *   returning either `Menu.MY_BROKERED_USERS` or `Menu.SEARCH_USERS`.
   * @param user The user to test
   */
  searchUsersMenu(user?: User): Menu | Observable<Menu> {
    if (user) {
      if (this.isSelf(user)) {
        // Own user
        return Menu.MY_PROFILE;
      } else if (user.user) {
        // The given user is an operator. Check if own or other.
        if (this.isSelf(user.user)) {
          return Menu.MY_OPERATORS;
        }
        // Keep on, considering the operator owner as user
        user = user.user;
      }
    }


    // Determine the relationship between the user and the logged user
    const role = this.dataForUiHolder.role;
    if (role == null) {
      return Menu.PUBLIC_DIRECTORY;
    } else if (role === RoleEnum.BROKER) {
      if (!user) {
        // We don't know the user. Assume as broker.
        return Menu.MY_BROKERED_USERS;
      }
      // Broker is a problematic case, because the relation between the logged user may be either of manager or regular
      return this.cache.get(`broker_${this.dataForUiHolder.user.id}_${user.id}`, () => {
        return this.usersService
          .viewUser({ user: user.id, fields: ['relationship'] })
          .pipe(
            map(v => {
              return v.relationship === UserRelationshipEnum.BROKER;
            })
          );
      }).pipe(
        map(isBroker =>
          truthyAttr(isBroker) ? Menu.MY_BROKERED_USERS : Menu.SEARCH_USERS
        )
      );
    } else {
      // All other cases of non-self users are via search users
      return Menu.SEARCH_USERS;
    }
  }

  /**
   * Returns the menu for the given transfer. Optionally receives an expected account.
   */
  transferMenu(transfer: Transfer, accountId?: string) {
    if (accountId) {
      const auth = this.dataForUiHolder.auth || {};
      const permissions = auth.permissions || {};
      const banking = permissions.banking || {};
      const accounts = banking.accounts || [];
      const account = accounts.map(a => a.account).find(a => a.id === accountId);
      if (account) {
        return new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: account.type });
      }
    }
    return this.accountMenu(transfer.from, transfer.to);
  }

  /**
   * Returns the menu for one of the given accounts
   */
  accountMenu(from: AccountWithOwner, to: AccountWithOwner) {
    const fromSelf = this.isSelf(from);
    const toSelf = this.isSelf(to);
    if (fromSelf || toSelf) {
      // We have to assume we're viewing a self acount
      return new ActiveMenu(Menu.ACCOUNT_HISTORY, {
        accountType: fromSelf ? from.type : to.type
      });
    } else {
      // Either an admin or broker viewing other member's accounts
      return this.searchUsersMenu();
    }
  }

}
