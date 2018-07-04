import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { UsersService } from 'app/api/services';
import { UserView, Country, Address } from 'app/api/models';
import { CountriesResolve } from 'app/countries.resolve';
import { ErrorStatus } from 'app/core/error-status';
import { HttpErrorResponse } from '@angular/common/http';
import { Action } from 'app/shared/action';
import { MapsService } from 'app/core/maps.service';
import { LatLngBounds } from '@agm/core';
import { fitBounds } from 'app/shared/helper';

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
    private countriesResolve: CountriesResolve,
    public maps: MapsService) {
    super(injector);
  }

  loaded = new BehaviorSubject(false);
  user: UserView;
  countries: BehaviorSubject<Country[]>;
  titleActions = new BehaviorSubject<Action[]>(null);
  addressMapFitBounds = new BehaviorSubject<LatLngBounds>(null);
  locatedAddresses: Address[];

  ngOnInit() {
    super.ngOnInit();
    let key = this.route.snapshot.paramMap.get('key');
    if (key == null && this.login.user != null) {
      key = this.login.user.id;
    }
    if (key == null) {
      this.notification.error(this.messages.userProfilePermissionError());
      this.loaded.next(true);
      return;
    } else {
      this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
        this.usersService.viewUser({ user: key })
          .subscribe(user => {
            this.user = user;

            if ((this.login.user || {}).id === user.id && user.permissions.profile.editProfile) {
              // Can edit the profile
              this.titleActions.next([
                new Action('mode_edit', this.messages.edit(), () => {
                  this.router.navigate(['users', 'my-profile', 'edit']);
                })
              ]);
            }

            // Get the located addresses
            if (this.maps.enabled) {
              this.locatedAddresses = user.addresses.filter(addr => addr.location);
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

  get myProfile(): boolean {
    return (this.login.user || {}).id === this.user.id;
  }

  get title(): string {
    return this.myProfile ? this.messages.menuPersonalProfile() : (this.user || {}).display;
  }

  fitAddressesBounds() {
    this.addressMapFitBounds.next(fitBounds(this.locatedAddresses));
  }

}
