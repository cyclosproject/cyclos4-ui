import { LatLngBounds } from '@agm/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Address, PhoneKind, PhoneView, UserView } from 'app/api/models';
import { ContactsService, UsersService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { MapsService } from 'app/core/maps.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { fitBounds, labelAddresses, words } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

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
    public maps: MapsService) {
    super(injector);
  }

  key: string;
  shortName: string;
  locatedAddresses: Address[];
  mobilePhone: PhoneView;
  landLinePhone: PhoneView;
  mobilePhones: PhoneView[];
  landLinePhones: PhoneView[];

  addressMapFitBounds$ = new BehaviorSubject<LatLngBounds>(null);

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
            this.notification.error(this.i18n('You don\'t have permission to view the profile of this user'));
            this.data = {};
          } else {
            defaultHandling(resp);
          }
        });
    });
  }

  onDataInitialized(user: UserView) {
    // Get the located addresses
    if (this.maps.enabled) {
      this.locatedAddresses = labelAddresses(user.addresses, this.i18n);
    }

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
      actions.push(new HeadingAction('edit', this.i18n('Edit'), () => {
        this.router.navigate(['users', 'my-profile', 'edit']);
      }, true));
    }
    if (contact.add) {
      actions.push(new HeadingAction('add_circle_outline', this.i18n('Add {{name}} to my contacts', {
        name: this.shortName
      }), () => {
        this.addContact();
      }));
    }
    if (contact.remove) {
      actions.push(new HeadingAction('remove_circle_outline', this.i18n('Remove {{name}} from my contacts', {
        name: this.shortName
      }), () => {
        this.removeContact();
      }));
    }
    if (payment.userToUser) {
      actions.push(new HeadingAction('payment', this.i18n('Make payment to {{name}}', {
        name: this.shortName
      }), () => {
        this.router.navigate(['/banking', 'payment', this.key]);
      }));
    }
    if (marketplace.viewAdvertisements || marketplace.viewWebshop) {
      actions.push(new HeadingAction('shopping_basket', this.i18n('View advertisements of {{name}}', {
        name: this.shortName
      }), () => {
        this.router.navigate(['/marketplace', 'user', this.key]);
      }));
    }
    this.headingActions = actions;
  }

  private addContact(): any {
    this.contactsService.createContact({
      user: ApiHelper.SELF,
      contact: {
        contact: this.user.id
      }
    }).subscribe(() => {
      this.notification.snackBar(this.i18n('{{user}} was added to your contact list', {
        user: this.shortName
      }));
      this.reload();
    });
  }

  private removeContact(): any {
    this.contactsService.deleteContact(this.user.contact.id).subscribe(() => {
      this.notification.snackBar(this.i18n('{{user}} was removed to your contact list', {
        user: this.shortName
      }));
      this.reload();
    });
  }

  get myProfile(): boolean {
    return !!this.user && (this.login.user || {}).id === this.user.id;
  }

  get title(): string {
    return this.myProfile ? this.i18n('My profile') : this.shortName;
  }

  fitAddressesBounds() {
    this.addressMapFitBounds$.next(fitBounds(this.locatedAddresses));
  }

}
