import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdKind, BasicProfileFieldEnum, PhoneKind, PhoneView, RoleEnum,
  UserProfileSectionEnum, UserRelationshipEnum, UserView
} from 'app/api/models';
import { ContactsService } from 'app/api/services/contacts.service';
import { UsersService } from 'app/api/services/users.service';
import { ErrorStatus } from 'app/core/error-status';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { words } from 'app/shared/helper';
import { MapsService } from 'app/ui/core/maps.service';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { RecordHelperService } from 'app/ui/core/records-helper.service';
import { TokenHelperService } from 'app/ui/core/token-helper.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { WizardHelperService } from 'app/ui/core/wizard-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export const MAX_SIZE_SHORT_NAME = 25;

/**
 * Displays an user profile
 */
@Component({
  selector: 'view-profile',
  templateUrl: 'view-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewProfileComponent extends BaseViewPageComponent<UserView> implements OnInit {
  constructor(
    injector: Injector,
    private usersService: UsersService,
    private contactsService: ContactsService,
    private operationHelper: OperationHelperService,
    private wizardHelper: WizardHelperService,
    private recordHelper: RecordHelperService,
    private tokenHelper: TokenHelperService,
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
    const paymentRequests = permissions.paymentRequests || {};
    const scheduledPayments = permissions.scheduledPayments || {};
    const authorizedPayments = permissions.authorizedPayments || {};
    const marketplace = permissions.marketplace || {};
    const simpleAds = marketplace.simple || {};
    const webshop = marketplace.webshop || {};
    const notificationSettings = permissions.notificationSettings || {};
    const status = permissions.status || {};
    const group = permissions.group || {};
    const agreements = permissions.agreements || {};
    const operators = permissions.operators || {};
    const brokering = permissions.brokering || {};
    const vouchers = permissions.vouchers || {};
    const documents = permissions.documents || {};
    const tokens = permissions.tokens || [];
    const products = permissions.products || {};

    const manager = [UserRelationshipEnum.ADMINISTRATOR, UserRelationshipEnum.BROKER, UserRelationshipEnum.OWNER]
      .includes(user.relationship);

    if (user.relationship === UserRelationshipEnum.SELF) {
      // For the own user, we just show the edit as a top-level action
      if (profile.editProfile) {
        const edit = new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => {
          this.router.navigateByUrl(this.router.url + '/edit');
        }, true);
        this.headingActions = [edit];
      }
    } else {
      // For others, will have actions in sections
      if (accountTypes.length > 6) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2, this.i18n.user.profile.accountsSummary, () => {
          this.router.navigate(['/banking', this.param, 'accounts-summary']);
        }));
      } else {
        for (const accountType of accountTypes) {
          this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2, this.i18n.user.profile.viewAccount(accountType.name), () => {
            this.router.navigate(['/banking', this.param, 'account', ApiHelper.internalNameOrId(accountType)]);
          }));
        }
      }

      if (payment.userToUser) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowRight, this.i18n.user.profile.pay, () => {
          this.router.navigate(['/banking', ApiHelper.SELF, 'payment', this.param]);
        }));
      }
      if (payment.systemToUser) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowRight, this.i18n.user.profile.paySystemToUser, () => {
          this.router.navigate(['/banking', ApiHelper.SYSTEM, 'payment', this.param]);
        }));
      }
      if (payment.asUserToUser) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowRight, this.i18n.user.profile.payAsUserToUser, () => {
          this.router.navigate(['/banking', this.param, 'payment']);
        }));
      }
      if (payment.asUserToSelf) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeftRight, this.i18n.user.profile.payAsUserToSelf, () => {
          this.router.navigate(['/banking', this.param, 'payment', ApiHelper.SELF]);
        }));
      }
      if (payment.asUserToSystem) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowRight, this.i18n.user.profile.payAsUserToSystem, () => {
          this.router.navigate(['/banking', this.param, 'payment', ApiHelper.SYSTEM]);
        }));
      }
      if (paymentRequests.sendFromSystem) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.user.profile.requestPaymentFromSystem, () => {
          this.router.navigate(['/banking', ApiHelper.SYSTEM, 'payment-request', this.param]);
        }));
      }
      if (paymentRequests.sendFromUser) {
        const label = manager ? this.i18n.user.profile.requestPaymentFromUser : this.i18n.user.profile.requestPayment;
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, label, () => {
          this.router.navigate(['/banking', ApiHelper.SELF, 'payment-request', this.param]);
        }));
      }
      if (paymentRequests.sendAsUserToUser) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.user.profile.requestPaymentAsUserFromUser, () => {
          this.router.navigate(['/banking', this.param, 'payment-request']);
        }));
      }
      if (paymentRequests.sendAsUserToSystem) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.user.profile.requestPaymentAsUserFromSystem, () => {
          this.router.navigate(['/banking', this.param, 'payment-request', ApiHelper.SYSTEM]);
        }));
      }
      if (paymentRequests.view) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Wallet2ArrowLeft, this.i18n.user.profile.viewPaymentRequests, () => {
          this.router.navigate(['/banking', this.param, 'payment-requests']);
        }));
      }
      if (scheduledPayments.view) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Clock, this.i18n.user.profile.viewScheduledPayments, () => {
          this.router.navigate(['/banking', this.param, 'installments']);
        }));
      }
      const balanceLimitsPermissions = permissions.balanceLimits || {};
      if (balanceLimitsPermissions.view) {
        this.bankingActions.push(new HeadingAction(SvgIcon.ArrowDownUp, this.i18n.user.profile.accountsBalanceLimits, () => {
          this.router.navigate(['/banking', this.param, 'account-balance-limits']);
        }));
      }
      const paymentLimitsPermissions = permissions.paymentLimits || {};
      if (paymentLimitsPermissions.view) {
        this.bankingActions.push(new HeadingAction(SvgIcon.ArrowDownUp, this.i18n.user.profile.accountsPaymentLimits, () => {
          this.router.navigate(['/banking', this.param, 'account-payment-limits']);
        }));
      }
      if (authorizedPayments.view) {
        this.bankingActions.push(new HeadingAction(SvgIcon.CheckCircle, this.i18n.user.profile.viewAuthorizedPayments, () => {
          this.router.navigate(['/banking', this.param, 'authorized-payments']);
        }));
      }
      if (vouchers.viewBought) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Ticket, this.i18n.user.profile.viewBoughtVouchers, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'bought']);
        }));
      }
      if (vouchers.buy) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Ticket, this.i18n.user.profile.buyVouchers, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'buy']);
        }));
      }

      if (vouchers.viewRedeemed) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Ticket, this.i18n.user.profile.viewRedeemedVouchers, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'redeemed']);
        }));
      }
      if (vouchers.redeem) {
        this.bankingActions.push(new HeadingAction(SvgIcon.Ticket, this.i18n.user.profile.redeemVoucher, () => {
          this.router.navigate(['/banking', this.param, 'vouchers', 'redeem']);
        }));
      }
      if (profile.editProfile) {
        this.managementActions.push(new HeadingAction(SvgIcon.Pencil, this.i18n.user.profile.edit, () => {
          this.router.navigateByUrl(this.router.url + '/edit');
        }));
      }
      if (passwords.manage) {
        this.managementActions.push(new HeadingAction(SvgIcon.Key, this.i18n.user.profile.managePasswords, () => {
          this.router.navigate(['/users', this.param, 'passwords']);
        }));
      }
      if (identityProviders.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonBadge, this.i18n.user.profile.viewIdentityProviders, () => {
          this.router.navigate(['/users', this.param, 'identity-providers']);
        }));
      }
      if (status.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonCheck,
          operator ? this.i18n.user.profile.statusOperator : this.i18n.user.profile.statusUser,
          () => {
            this.router.navigate(['/users', this.param, 'status']);
          }));
      }
      if (group.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.People,
          operator ? this.i18n.user.profile.groupOperator : this.i18n.user.profile.groupUser,
          () => {
            this.router.navigate(['/users', this.param, 'group']);
          }));
      }
      if (agreements.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.UiChecks, this.i18n.user.profile.agreements,
          () => {
            this.router.navigate(['/users', this.param, 'agreements']);
          }));
      }
      if (brokering.viewMembers) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonSquareOutline, this.i18n.user.profile.viewBrokerings, () => {
          this.router.navigate(['/users', this.param, 'brokerings']);
        }));
      }
      if (brokering.viewBrokers) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonSquareOutline, this.i18n.user.profile.viewBrokers, () => {
          this.router.navigate(['/users', this.param, 'brokers']);
        }));
      }
      if (operators.viewOperators) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonCircleOutline, this.i18n.user.profile.viewOperators, () => {
          this.router.navigate(['/users', this.param, 'operators']);
        }));
      }
      if (products.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.Shield, this.i18n.user.profile.products, () => {
          this.router.navigate(['/users', this.param, 'product-assignment']);
        }));
      }
      if (contact.add) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonPlus, this.i18n.user.profile.addContact, () => {
          this.addContact();
        }));
      }
      if (contact.remove) {
        this.managementActions.push(new HeadingAction(SvgIcon.PersonDash, this.i18n.user.profile.removeContact, () => {
          this.removeContact();
        }));
      }
      if (simpleAds.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.Basket, this.i18n.user.profile.viewAds, () => {
          this.router.navigate(['/marketplace', this.param, AdKind.SIMPLE, 'list']);
        }));
      }
      if (webshop.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.Basket, this.i18n.user.profile.viewWebshop, () => {
          this.router.navigate(['/marketplace', this.param, AdKind.WEBSHOP, 'list']);
        }));
      }
      if (webshop.viewPurchases) {
        this.managementActions.push(new HeadingAction(SvgIcon.Cart3, this.i18n.user.profile.purchases, () => {
          this.router.navigate(['/marketplace', this.param, 'purchases']);
        }));
      }
      if (webshop.viewSales) {
        this.managementActions.push(new HeadingAction(SvgIcon.Receipt, this.i18n.user.profile.sales, () => {
          this.router.navigate(['/marketplace', this.param, 'sales']);
        }));
      }
      if (marketplace.viewInterests) {
        this.managementActions.push(new HeadingAction(SvgIcon.Star, this.i18n.user.profile.adInterests, () => {
          this.router.navigate(['/marketplace', this.param, 'ad-interests']);
        }));
      }
      if (webshop.viewSettings) {
        this.managementActions.push(new HeadingAction(SvgIcon.Truck, this.i18n.user.profile.deliveryMethods, () => {
          this.router.navigate(['/marketplace', this.param, 'delivery-methods']);
        }));
        this.managementActions.push(new HeadingAction(SvgIcon.Gear, this.i18n.user.profile.webshopSettings, () => {
          this.router.navigate(['/marketplace', this.param, 'webshop-settings', 'view']);
        }));
      }
      for (const token of tokens) {
        this.managementActions.push(new HeadingAction(this.tokenHelper.icon(token.type), token.type.pluralName, () => {
          this.router.navigate(['/users', this.param, 'tokens', token.type.id]);
        }));
      }
      if (notificationSettings.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.BellSlash, this.i18n.user.profile.notificationSettings, () => {
          this.router.navigate(['/users', this.param, 'notification-settings']);
        }));
      }
      if (permissions.privacySettings?.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.EyeSlash, this.i18n.user.profile.privacySettings, () => {
          this.router.navigate(['/users', this.param, 'privacy-settings']);
        }));
      }
      // References
      if (permissions.references?.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.Star, this.i18n.user.profile.references, () => {
          this.router.navigate(['/users', this.param, 'references', 'search']);
        }));
      }
      // Documents
      if (documents.view) {
        this.managementActions.push(new HeadingAction(SvgIcon.FileEarmarkText, this.i18n.document.action(user.documents?.count), () => {
          this.router.navigate(['/users', this.param, 'documents', 'search']);
        }));
      }
      // Records
      for (const record of permissions.records || []) {
        const type = record.type;
        const addTo = type.userProfileSection === UserProfileSectionEnum.BANKING
          ? this.bankingActions : this.managementActions;
        const icon = this.recordHelper.icon(type);
        const recordDetails = user.records[type.id] || user.records[type.internalName];
        addTo.push(new HeadingAction(icon, this.i18n.record.action(
          { type: type.pluralName, count: recordDetails?.count }), () => {
            this.router.navigateByUrl(this.recordHelper.resolvePath(record, this.param));
          }));
      }
      // Custom operations
      for (const operation of permissions.operations || []) {
        const addTo = operation.userProfileSection === UserProfileSectionEnum.BANKING
          ? this.bankingActions : this.managementActions;
        addTo.push(this.operationHelper.headingAction(operation, user.id));
      }
      // Wizards
      for (const wizard of permissions.wizards || []) {
        const addTo = wizard.userProfileSection === UserProfileSectionEnum.BANKING
          ? this.bankingActions : this.managementActions;
        addTo.push(this.wizardHelper.headingAction(wizard, user.id));
      }
      const actionsCount = this.bankingActions.length + this.managementActions.length;
      if (actionsCount > 0) {
        if (manager) {
          this.updateHeadingActions();
        } else {
          this.headingActions = [...this.bankingActions, ...this.managementActions];
        }
      }
    }
  }

  referencesPath() {
    return ['/users', this.param, 'references', 'search'];
  }

  private updateHeadingActions() {
    const show = !this.showActions$.value;
    const icon = show ? SvgIcon.FilePlay : SvgIcon.FileX;
    const label = show ? this.i18n.user.profile.showActions : this.i18n.user.profile.hideActions;
    const headingAction = new HeadingAction(icon, label, () => {
      this.showActions$.next(show);
      this.updateHeadingActions();
    }, true);
    this.headingActions = [headingAction];
  }

  private addContact(): any {
    this.addSub(this.contactsService.createContact({
      user: ApiHelper.SELF,
      body: {
        contact: this.user.id,
      },
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
