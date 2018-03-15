import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseComponent } from 'app/shared/base.component';
import { UsersService } from 'app/api/services';
import { UserView, Country } from 'app/api/models';
import { CountriesResolve } from 'app/countries.resolve';
import { ErrorStatus } from 'app/core/error-status';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Displays an user profile
 */
@Component({
  selector: 'user-profile',
  templateUrl: 'user-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent extends BaseComponent {

  constructor(
    injector: Injector,
    private usersService: UsersService,
    private countriesResolve: CountriesResolve) {
    super(injector);
  }

  loaded = new BehaviorSubject(false);
  user: UserView;
  countries: BehaviorSubject<Country[]>;

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

}
