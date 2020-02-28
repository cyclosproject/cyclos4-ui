import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdKind, BasicProfileFieldEnum, PhoneKind, PhoneView, RoleEnum, UserRelationshipEnum, UserView } from 'app/api/models';
import { ContactsService, UsersService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { MapsService } from 'app/core/maps.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { RecordHelperService } from 'app/core/records-helper.service';
import { UserHelperService } from 'app/core/user-helper.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { empty, words } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

export const MAX_SIZE_SHORT_NAME = 25;

/**
 * Displays an user profile
 */
@Component({
  selector: 'view-profile',
  templateUrl: 'view-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewProfileComponent extends BaseViewPageComponent<UserView> implements OnInit {
  constructor(
    injector: Injector,
    private usersService: UsersService,
    private contactsService: ContactsService,
    private operationsHelper: OperationHelperService,
    private recordsHelper: RecordHelperService,
    public maps: MapsService,
    public userHelper: UserHelperService) {
    super(injector);
  }

  param: string;
  shortName: string;
  mobilePhone: PhoneView;
  landLinePhone: PhoneView;
  mobilePhones: PhoneView[];
  landLinePhones: PhoneView[];
  imageEnabled: boolean;

  showActions$ = new BehaviorSubject(false);
  bankingActions: HeadingAction[] = [];
  managementActions: HeadingAction[] = [];

  get user(): UserView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.stateManager.manageValue(this.showActions$, 'showActions');
    this.param = this.route.snapshot.params.user || ApiHelper.SELF;
    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      this.addSub(this.usersService.viewUser({ user: this.param })
        .subscribe(user => {
          this.data = user;
        }, (resp: HttpErrorResponse) => {
          if ([ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
            this.notification.error(this.i18n.user.profile.noPermission);
            this.breadcrumb.back();
            this.data = {};
          } else {
            defaultHandling(resp);
          }
        }));
    });
  }

  onDataInitialized(user: UserView) {
    this.shortName = words(user.name || user.display, MAX_SIZE_SHORT_NAME);
    const enabledFields = user.enabledProfileFields;
    this.imageEnabled = enabledFields == null || enabledFields.includes(BasicProfileFieldEnum.IMAGE);

    // We'll show the phones either as single or multiple
    this.mobilePhones = user.phones.filter(p => p.type === PhoneKind.MOBILE);
    this.landLinePhones = user.phones.filter(p => p.type === PhoneKind.LAND_LINE);
    if (this.mobilePhones.length === 1) {
      this.mobilePhone = this.mobilePhones[0];
      this.mobilePhones = [];
    }
    if (this.landLinePhones.length === 1) {
      this.landLinePhone = this.landLinePhones[0];
      this.landLinePhones = [];
    }

    const operator = user.role === RoleEnum.OPERATOR;

    // Get the actions
    const permissions = user.permissions || {};
    const profile = permissions.profile || {};
    const passwords = permissions.passwords || {};
    const identityProviders = permissions.identityProviders || {};
    const accountTypes = (permissions.accounts || []).map(a => a.type);
    const contact = permissions.contact || {};
    const payment = permissions.payment || {};
    const scheduledPayments = permissions.scheduledPayments || {};
    const authorizedPayments = permissions.authorizedPayments || {};
    const marketplace = permissions.marketplace || {};
    const webshop = marketplace.webshop || {};
    const notificationSettings = permissions.notificationSettings || {};
    const status = permissions.status || {};
    const group = permissions.group || {};
    const operators = permissions.operators || {};
    const brokering = permissions.brokering || {};
    const vouchers = permissions.vouchers || {};

    if (user.relationship === UserRelationshipEnum.SELF) {
      // For the own user, we just show the edit as a top-level action
      if (profile.editProfile) {
        const edit = new HeadingAction('edit', this.i18n.general.edit, () => {
          this.router.navigateByUrl(this.router.url + '/edit');
        }, true);
        edit.position = 'title';
        this.headingActions = [edit];
      }
    } else {
      // For others, will have actions in sections
      const manager = [
        UserRelationshipEnum.ADMINISTRATOR,
        UserRelationshipEnum.BROKER,
        UserRelationshipEnum.OWNER,
        UserRelationshipEnum.SAME_OWNER
      ].includes(user.relationship);
      for (const accountType of accountTypes) {
        this.bankingActions.push(new HeadingAction('account_balance', this.i18n.user.profile.viewAccount(accountType.name), () => {
          this.router.navigate(['/banking', this.param, 'account', ApiHelper.internalNameOrId(accountType)]);
        }));
      }
      if (payment.systemToUser) {
        this.bankingActions.push(new HeadingAction('payment', this.i18n.user.profile.paySystemToUser, () => {
          this.router.navigate(['/banking', ApiHelper.SYSTEM, 'payment', this.param]);
        }));
      }
      if (payment.asUserToUser) {
        this.bankingActions.push(new HeadingAction('payment', this.i18n.user.profile.payAsUserToUser, () => {
          this.router.navigate(['/banking', this.param, 'payment']);
        }));
      }
      if (payment.asUserToSelf) {
        this.bankingActions.push(new HeadingAction('payment', this.i18n.user.profile.payAsUserToSelf, () => {
          this.router.navigate(['/banking', this.param, 'payment', ApiHelper.SELF]);
        }));
      }
      if (payment.asUserToSystem) {
        this.bankingActions.push(new HeadingAction('payment', this.i18n.user.profile.payAsUserToSystem, () => {
          this.router.navigate(['/banking', this.param, 'payment', ApiHelper.SYSTEM]);
        }));
      }
      if (scheduledPayments.view) {
        this.bankingActions.push(new HeadingAction('schedule', this.i18n.user.profile.viewScheduledPayments, () => {
          this.router.navigate(['/banking', this.param, 'scheduled-payments']);
        }));
      }
      if (authorizedPayments.view) {
        this.bankingActions.push(new HeadingAction('assignment_turned_in', this.i18n.user.profile.viewAuthorizedPayments, () => {
          this.router.navigate(['/banking', this.param, 'authorized-payments']);
        }));
      }
      if (vouchers.viewBought) {
        this.bankingActions.push(new HeadingAction('shopping_cart', this.i18n.user.profile.viewBoughtVouchers, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'bought']);
        }));
      }
      if (vouchers.buy) {
        this.bankingActions.push(new HeadingAction('shopping_cart', this.i18n.user.profile.buyVouchers, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'buy']);
        }));
      }

      if (vouchers.viewRedeemed) {
        this.bankingActions.push(new HeadingAction('search', this.i18n.user.profile.viewRedeemedVouchers, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'redeemed']);
        }));
      }
      if (vouchers.redeem) {
        this.bankingActions.push(new HeadingAction('payment', this.i18n.user.profile.redeemVoucher, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'redeem']);
        }));
      }
      if (profile.editProfile) {
        this.managementActions.push(new HeadingAction('edit', this.i18n.user.profile.edit, () => {
          this.router.navigateByUrl(this.router.url + '/edit');
        }));
      }
      if (passwords.manage) {
        this.managementActions.push(new HeadingAction('vpn_key', this.i18n.user.profile.managePasswords, () => {
          this.router.navigate(['/users', this.param, 'passwords']);
        }));
      }
      if (identityProviders.view) {
        this.managementActions.push(new HeadingAction('perm_identity', this.i18n.user.profile.viewIdentityProviders, () => {
          this.router.navigate(['/users', this.param, 'identity-providers']);
        }));
      }
      if (status.view) {
        this.managementActions.push(new HeadingAction('how_to_reg',
          operator ? this.i18n.user.profile.statusOperator : this.i18n.user.profile.statusUser,
          () => {
            this.router.navigate(['/users', this.param, 'status']);
          }));
      }
      if (group.view) {
        this.managementActions.push(new HeadingAction('supervised_user_circle',
          operator ? this.i18n.user.profile.groupOperator : this.i18n.user.profile.groupUser,
          () => {
            this.router.navigate(['/users', this.param, 'group']);
          }));
      }
      if (brokering.viewMembers) {
        this.managementActions.push(new HeadingAction('assignment_ind', this.i18n.user.profile.viewBrokerings, () => {
          this.router.navigate(['/users', this.param, 'brokerings']);
        }));
      }
      if (brokering.viewBrokers) {
        this.managementActions.push(new HeadingAction('assignment_ind', this.i18n.user.profile.viewBrokers, () => {
          this.router.navigate(['/users', this.param, 'brokers']);
        }));
      }
      if (operators.viewOperators) {
        this.managementActions.push(new HeadingAction('supervisor_account', this.i18n.user.profile.viewOperators, () => {
          this.router.navigate(['/users', this.param, 'operators']);
        }));
      }
      const actions = manager ? this.managementActions : [];
      if (contact.add) {
        actions.push(new HeadingAction('add_circle_outline', this.i18n.user.profile.addContact, () => {
          this.addContact();
        }));
      }
      if (contact.remove) {
        actions.push(new HeadingAction('remove_circle_outline', this.i18n.user.profile.removeContact, () => {
          this.removeContact();
        }));
      }
      if (payment.userToUser) {
        actions.push(new HeadingAction('payment', this.i18n.user.profile.pay, () => {
          this.router.navigate(['/banking', ApiHelper.SELF, 'payment', this.param]);
        }));
      }
      if (marketplace.simple.view) {
        actions.push(new HeadingAction('shopping_basket', this.i18n.user.profile.viewAds, () => {
          this.router.navigate(['/marketplace', this.param, AdKind.SIMPLE, 'list']);
        }));
      }
      if (marketplace.webshop.view) {
        actions.push(new HeadingAction('shopping_basket', this.i18n.user.profile.viewWebshop, () => {
          this.router.navigate(['/marketplace', this.param, AdKind.WEBSHOP, 'list']);
        }));
      }
      if (marketplace.webshop.viewPurchases) {
        this.managementActions.push(new HeadingAction('shop_two', this.i18n.user.profile.purchases, () => {
          this.router.navigate(['/marketplace', this.param, 'purchases']);
        }));
      }
      if (marketplace.webshop.viewSales) {
        this.managementActions.push(new HeadingAction('local_offer', this.i18n.user.profile.sales, () => {
          this.router.navigate(['/marketplace', this.param, 'sales']);
        }));
      }
      if (marketplace.viewInterests) {
        this.managementActions.push(new HeadingAction('star', this.i18n.user.profile.adInterests, () => {
          this.router.navigate(['/marketplace', this.param, 'ad-interests']);
        }));
      }
      if (webshop.viewSettings) {
        this.managementActions.push(new HeadingAction('local_shipping', this.i18n.user.profile.deliveryMethods, () => {
          this.router.navigate(['/marketplace', this.param, 'delivery-methods']);
        }));
        this.managementActions.push(new HeadingAction('store', this.i18n.user.profile.webshopSettings, () => {
          this.router.navigate(['/marketplace', this.param, 'webshop-settings', 'view']);
        }));
      }
      if (notificationSettings.view) {
        this.managementActions.push(new HeadingAction('notifications_off', this.i18n.user.profile.notificationSettings, () => {
          this.router.navigate(['/users', this.param, 'notification-settings']);
        }));
      }
      // Records
      for (const record of permissions.records || []) {
        actions.push(new HeadingAction('library_books', this.i18n.record.action(
          { type: record.type.pluralName, count: record.count }), () => {
            this.router.navigateByUrl(this.recordsHelper.resolvePath(record, this.param));
          }));
      }
      // Custom operations
      for (const operation of permissions.operations || []) {
        actions.push(this.operationsHelper.headingAction(operation, user.id));
      }
      if (!empty(actions) && actions.length < 6) {
        this.headingActions = actions;
      } else if (!empty(this.bankingActions) || !empty(this.managementActions)) {
        this.updateHeadingActions();
      }
    }
  }

  private updateHeadingActions() {
    const show = !this.showActions$.value;
    const icon = show ? 'play_circle_outline' : 'clear';
    const label = show ? this.i18n.user.profile.showActions : this.i18n.user.profile.hideActions;
    const headingAction = new HeadingAction(icon, label, () => {
      this.showActions$.next(show);
      this.updateHeadingActions();
    }, true);
    headingAction.position = 'title';
    this.headingActions = [headingAction];
  }

  private addContact(): any {
    this.addSub(this.contactsService.createContact({
      user: ApiHelper.SELF,
      body: {
        contact: this.user.id
      }
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.user.profile.addContactDone(this.shortName));
      this.reload();
    }));
  }

  private removeContact(): any {
    this.addSub(this.contactsService.deleteContact({ id: this.user.contact.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.user.profile.removeContactDone(this.shortName));
      this.reload();
    }));
  }

  get myProfile(): boolean {
    return !!this.user && (this.login.user || {}).id === this.user.id;
  }

  get title(): string {
    return this.myProfile ? this.i18n.user.title.myProfile : this.shortName;
  }

  get mobileTitle(): string {
    return this.myProfile ? this.i18n.user.mobileTitle.myProfile : this.i18n.user.mobileTitle.userProfile;
  }

  /**
   * Will show the activation date when it is different than the registration date
   */
  get showActivationDate(): boolean {
    return this.user.activationDate
      && this.format.formatAsDate(this.user.activationDate) !== this.format.formatAsDate(this.user.registrationDate);
  }

  get showOperatorOwner(): boolean {
    return this.user.role === RoleEnum.OPERATOR &&
      ![UserRelationshipEnum.OWNER, UserRelationshipEnum.SAME_OWNER].includes(this.user.relationship);
  }

  resolveMenu(user: UserView) {
    switch (user.relationship) {
      case UserRelationshipEnum.OWNER:
      case UserRelationshipEnum.SAME_OWNER:
        return Menu.MY_OPERATORS;
      case UserRelationshipEnum.BROKER:
        return Menu.MY_BROKERED_USERS;
      default:
        return this.login.user ? Menu.SEARCH_USERS : Menu.PUBLIC_DIRECTORY;
    }
  }
}
