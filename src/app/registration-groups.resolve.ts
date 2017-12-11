import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { GroupForRegistration } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';

/**
 * Loads the possible groups for registration
 */
@Injectable()
export class RegistrationGroupsResolve implements Resolve<GroupForRegistration[]> {
  constructor(
    private usersService: UsersService
  ) { }

  private groups: GroupForRegistration[];

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<GroupForRegistration[]> {
    if (this.groups != null) {
      return Observable.of(this.groups);
    } else {
      return this.usersService.getGroupsForUserRegistration({}).pipe(
        tap(gs => this.groups = gs)
      );
    }
  }
}
