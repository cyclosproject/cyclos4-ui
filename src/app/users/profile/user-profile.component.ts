import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder } from '@angular/forms';
import { tap } from 'rxjs/operators/tap';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { UsersService } from 'app/api/services';
import { UserDataForSearch, UserView, Country, ErrorKind } from 'app/api/models';
import { UserResult } from '../../api/models/user-result';
import { CountriesResolve } from '../../countries.resolve';
import { ErrorHandlerService, ErrorStatus } from '../../core/error-handler.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Displays an user profile
 */
@Component({
  selector: 'user-profile',
  templateUrl: 'user-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent extends BaseUsersComponent {

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
      this.notification.error(this.usersMessages.profilePermissionError());
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
              this.notification.error(this.usersMessages.profilePermissionError());
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
