import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { UsersService, ContactsService } from 'app/api/services';
import { UserView, Country, Address, ContactNew } from 'app/api/models';
import { CountriesResolve } from 'app/countries.resolve';
import { ErrorStatus } from 'app/core/error-status';
import { HttpErrorResponse } from '@angular/common/http';
import { Action } from 'app/shared/action';
import { MapsService } from 'app/core/maps.service';
import { LatLngBounds } from '@agm/core';
import { fitBounds } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Displays an user profile
 */
@Component({
  selector: 'view-user-profile',
  templateUrl: 'view-user-profile.component.html',
  styleUrls: ['view-user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUserProfileComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private usersService: UsersService,
    private contactsService: ContactsService,
    private countriesResolve: CountriesResolve,
    public maps: MapsService) {
    super(injector);
  }

  loaded = new BehaviorSubject(false);
  key: string;
  user: UserView;
  countries: BehaviorSubject<Country[]>;
  titleActions = new BehaviorSubject<Action[]>(null);
  addressMapFitBounds = new BehaviorSubject<LatLngBounds>(null);
  locatedAddresses: Address[];
  actions: Action[];

  ngOnInit() {
    super.ngOnInit();
    this.key = this.route.snapshot.paramMap.get('key');
    if (this.key == null && this.login.user != null) {
      this.key = this.login.user.id;
    }
    if (this.key == null) {
      this.notification.error(this.messages.userProfilePermissionError());
      this.loaded.next(true);
      return;
    } else {
      this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
        this.usersService.viewUser({ user: this.key })
          .subscribe(user => {
            this.user = user;
            this.initialize();
            this.loaded.next(true);
          }, (resp: HttpErrorResponse) => {
            if ([ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
              this.notification.error(this.messages.userProfilePermissionError());
              this.loaded.next(true);
            } else {
              defaultHandling(resp);
            }
          });
      });
      this.countries = this.countriesResolve.data;
    }
  }

  private initialize() {
    if ((this.login.user || {}).id === this.user.id && this.user.permissions.profile.editProfile) {
      // Can edit the profile
      this.titleActions.next([
        new Action('mode_edit', this.messages.edit(), () => {
          this.router.navigate(['users', 'my-profile', 'edit']);
        })
      ]);
    }

    // Get the located addresses
    if (this.maps.enabled) {
      this.locatedAddresses = this.user.addresses.filter(addr => addr.location);
      if (this.locatedAddresses.length > 1) {
        // Label each address
        let label = 'A';
        for (const addr of this.locatedAddresses) {
          addr['label'] = label;
          addr['fullName'] = this.messages.addressFullName(label, addr.name);
          label = label === 'Z' ? 'A' : String.fromCharCode(label.charCodeAt(0) + 1);
        }
      }
    }

    // Get the actions
    this.actions = [];
    const permissions = this.user.permissions || {};
    const contact = permissions.contact || {};
    const payment = permissions.payment || {};
    if (contact.add) {
      this.actions.push(new Action('perm_contact_calendar', this.messages.userProfileActionAddContact(), () => {
        this.addContact();
      }));
    }
    if (contact.remove) {
      this.actions.push(new Action('remove_circle_outline', this.messages.userProfileActionRemoveContact(), () => {
        this.removeContact();
      }));
    }
    if (payment.userToUser) {
      this.actions.push(new Action('payment', this.messages.userProfileActionPerformPayment(), () => {
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
      this.notification.snackBar(this.messages.userProfileActionAddContactDone(this.user.display));
      this.reload();
    });
  }

  private removeContact(): any {
    this.contactsService.deleteContact(this.user.contact.id).subscribe(() => {
      this.notification.snackBar(this.messages.userProfileActionRemoveContactDone(this.user.display));
      this.reload();
    });
  }

  get myProfile(): boolean {
    return (this.login.user || {}).id === this.user.id;
  }

  get title(): string {
    return this.myProfile ? this.messages.menuPersonalProfile() : (this.user || {}).display;
  }

  fitAddressesBounds() {
    this.addressMapFitBounds.next(fitBounds(this.locatedAddresses));
  }

  private reload() {
    this.loaded.next(false);
    this.ngOnInit();
  }

}
