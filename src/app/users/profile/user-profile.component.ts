import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder } from '@angular/forms';
import { tap } from 'rxjs/operators/tap';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { UsersService } from 'app/api/services';
import { UserDataForSearch, UserView, Country } from 'app/api/models';
import { UserResult } from '../../api/models/user-result';
import { CountriesResolve } from '../../countries.resolve';

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
    const key = this.route.snapshot.paramMap.get('key');
    this.usersService.viewUser({ user: key })
      .subscribe(user => {
        this.user = user;
        this.loaded.next(true);
      });
    this.countries = this.countriesResolve.data;
  }

}
