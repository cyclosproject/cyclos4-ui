import { Component, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UsersService, ContactsService } from 'app/api/services';
import { UserView, Country, Address, PhoneView, PhoneKind } from 'app/api/models';
import { CountriesResolve } from 'app/countries.resolve';
import { ErrorStatus } from 'app/core/error-status';
import { HttpErrorResponse } from '@angular/common/http';
import { Action } from 'app/shared/action';
import { MapsService } from 'app/core/maps.service';
import { LatLngBounds } from '@agm/core';
import { fitBounds, labelAddresses } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';

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
  locatedAddresses: Address[];
  actions: Action[];
  mobilePhone: PhoneView;
  landLinePhone: PhoneView;
  mobilePhones: PhoneView[];
  landLinePhones: PhoneView[];

  titleActions$ = new BehaviorSubject<Action[]>(null);
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
    if ((this.login.user || {}).id === user.id && user.permissions.profile.editProfile) {
      // Can edit the profile
      this.titleActions$.next([
        new Action('mode_edit', this.i18n('Edit'), () => {
          this.router.navigate(['users', 'my-profile', 'edit']);
        })
      ]);
    }

    // Get the located addresses
    if (this.maps.enabled) {
      this.locatedAddresses = labelAddresses(user.addresses, this.i18n);
    }

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
    this.actions = [];
    const permissions = user.permissions || {};
    const contact = permissions.contact || {};
    const payment = permissions.payment || {};
    if (contact.add) {
      this.actions.push(new Action('perm_contact_calendar', this.i18n('Add to contacts'), () => {
        this.addContact();
      }));
    }
    if (contact.remove) {
      this.actions.push(new Action('remove_circle_outline', this.i18n('Remove from contacts'), () => {
        this.removeContact();
      }));
    }
    if (payment.userToUser) {
      this.actions.push(new Action('payment', this.i18n('Perform payment'), () => {
        this.router.navigate(['/banking', 'payment', this.key]);
      }));
    }
  }

  private addContact(): any {
    this.contactsService.createContact({
      user: ApiHelper.SELF,
      contact: {
        contact: this.user.id
      }
    }).subscribe(() => {
      this.notification.snackBar(this.i18n('{{user}} was added to your contact list', {
        user: this.user.display
      }));
      this.reload();
    });
  }

  private removeContact(): any {
    this.contactsService.deleteContact(this.user.contact.id).subscribe(() => {
      this.notification.snackBar(this.i18n('{{user}} was removed to your contact list', {
        user: this.user.display
      }));
      this.reload();
    });
  }

  get myProfile(): boolean {
    return !!this.user && (this.login.user || {}).id === this.user.id;
  }

  get title(): string {
    return this.myProfile ? this.i18n('My profile') : (this.user || {}).display;
  }

  fitAddressesBounds() {
    this.addressMapFitBounds$.next(fitBounds(this.locatedAddresses));
  }

}
