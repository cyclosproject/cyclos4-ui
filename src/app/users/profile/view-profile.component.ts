import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { PhoneKind, PhoneView, UserView } from 'app/api/models';
import { ContactsService, UsersService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { MapsService } from 'app/core/maps.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { words } from 'app/shared/helper';
import { OperationHelperService } from 'app/core/operation-helper.service';

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
export class ViewProfileComponent extends BasePageComponent<UserView> implements OnInit {
  constructor(
    injector: Injector,
    private usersService: UsersService,
    private contactsService: ContactsService,
    private operationsHelper: OperationHelperService,
    public maps: MapsService) {
    super(injector);
  }

  key: string;
  shortName: string;
  mobilePhone: PhoneView;
  landLinePhone: PhoneView;
  mobilePhones: PhoneView[];
  landLinePhones: PhoneView[];

  get user(): UserView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.key = this.route.snapshot.paramMap.get('key');
    if (this.key == null && this.login.user != null) {
      this.key = ApiHelper.SELF;
    }
    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      this.usersService.viewUser({ user: this.key })
        .subscribe(user => {
          this.data = user;
        }, (resp: HttpErrorResponse) => {
          if ([ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
            this.notification.error(this.messages.user.profile.noPermission);
            this.breadcrumb.back();
            this.data = {};
          } else {
            defaultHandling(resp);
          }
        });
    });
  }

  onDataInitialized(user: UserView) {
    this.shortName = words(user.name || user.display, MAX_SIZE_SHORT_NAME);

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
    if ((this.login.user || {}).id === user.id && user.permissions.profile.editProfile) {
      actions.push(new HeadingAction('edit', this.messages.general.edit, () => {
        this.router.navigate(['users', 'my-profile', 'edit']);
      }, true));
    }
    if (contact.add) {
      actions.push(new HeadingAction('add_circle_outline', this.messages.user.profile.addContact, () => {
        this.addContact();
      }));
    }
    if (contact.remove) {
      actions.push(new HeadingAction('remove_circle_outline', this.messages.user.profile.removeContact, () => {
        this.removeContact();
      }));
    }
    if (payment.userToUser) {
      actions.push(new HeadingAction('payment', this.messages.user.profile.pay, () => {
        this.router.navigate(['/banking', 'payment', this.key]);
      }));
    }
    if (marketplace.viewAdvertisements || marketplace.viewWebshop) {
      actions.push(new HeadingAction('shopping_basket', this.messages.user.profile.viewAds, () => {
        this.router.navigate(['/marketplace', 'user', this.key]);
      }));
    }
    // Custom operations
    for (const operation of permissions.operations || []) {
      actions.push(this.operationsHelper.headingAction(operation, user.id));
    }
    this.headingActions = actions;
  }

  private addContact(): any {
    this.contactsService.createContact({
      user: ApiHelper.SELF,
      body: {
        contact: this.user.id
      }
    }).subscribe(() => {
      this.notification.snackBar(this.messages.user.profile.addContactDone(this.shortName));
      this.reload();
    });
  }

  private removeContact(): any {
    this.contactsService.deleteContact({ id: this.user.contact.id }).subscribe(() => {
      this.notification.snackBar(this.messages.user.profile.removeContactDone(this.shortName));
      this.reload();
    });
  }

  get myProfile(): boolean {
    return !!this.user && (this.login.user || {}).id === this.user.id;
  }

  get title(): string {
    return this.myProfile ? this.messages.user.title.myProfile : this.shortName;
  }

}
