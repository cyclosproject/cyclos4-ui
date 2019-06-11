import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { PhoneKind, PhoneView, UserView, BasicProfileFieldEnum } from 'app/api/models';
import { ContactsService, UsersService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { MapsService } from 'app/core/maps.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { words } from 'app/shared/helper';

export const MAX_SIZE_SHORT_NAME = 25;

/**
 * Displays an user profile
 */
@Component({
  selector: 'view-profile',
  templateUrl: 'view-profile.component.html',
  styleUrls: ['view-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewProfileComponent extends BaseViewPageComponent<UserView> implements OnInit {
  constructor(
    injector: Injector,
    private usersService: UsersService,
    private contactsService: ContactsService,
    private operationsHelper: OperationHelperService,
    public maps: MapsService) {
    super(injector);
  }

  param: string;
  self: boolean;
  shortName: string;
  mobilePhone: PhoneView;
  landLinePhone: PhoneView;
  mobilePhones: PhoneView[];
  landLinePhones: PhoneView[];
  imageEnabled: boolean;

  get user(): UserView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || ApiHelper.SELF;
    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      this.addSub(this.usersService.viewUser({ user: this.param })
        .subscribe(user => {
          this.data = user;
          this.self = this.authHelper.isSelf(user) || user.user != null && this.authHelper.isSelf(user.user);
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

    // Get the actions
    const actions: HeadingAction[] = [];
    const permissions = user.permissions || {};
    const contact = permissions.contact || {};
    const payment = permissions.payment || {};
    const marketplace = permissions.marketplace || {};
    const status = permissions.status || {};
    const operators = permissions.operators || {};
    const brokering = permissions.brokering || {};
    if (user.permissions.profile.editProfile) {
      actions.push(new HeadingAction('edit', this.i18n.general.edit, () => {
        this.router.navigateByUrl(this.router.url + '/edit');
      }, true));
    }
    if (brokering.viewMembers) {
      actions.push(new HeadingAction('assignment_ind', this.i18n.user.profile.viewBrokerings, () => {
        this.router.navigate(['/users', this.param, 'brokerings']);
      }));
    }
    if (operators.viewOperators) {
      actions.push(new HeadingAction('supervisor_account', this.i18n.user.profile.viewOperators, () => {
        this.router.navigate(['/users', this.param, 'operators']);
      }));
    }
    if (status.view) {
      actions.push(new HeadingAction('how_to_reg', this.i18n.user.profile.status, () => {
        this.router.navigate(['/users', this.param, 'status']);
      }));
    }
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
        this.router.navigate(['/banking', 'payment', this.param]);
      }));
    }
    if (marketplace.viewAdvertisements || marketplace.viewWebshop) {
      actions.push(new HeadingAction('shopping_basket', this.i18n.user.profile.viewAds, () => {
        this.router.navigate(['/marketplace', 'user', this.param]);
      }));
    }
    // Custom operations
    for (const operation of permissions.operations || []) {
      actions.push(this.operationsHelper.headingAction(operation, user.id));
    }
    this.headingActions = actions;
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

}
