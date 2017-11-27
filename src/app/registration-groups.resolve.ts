import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { GroupForRegistration } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { Observable } from 'rxjs/Observable';

/**
 * Loads the possible groups for registration
 */
@Injectable()
export class RegistrationGroupsResolve implements Resolve<GroupForRegistration[]> {
  constructor(
    private usersService: UsersService
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<GroupForRegistration[]> {
    return this.usersService.getGroupsForUserRegistration({});
  }
}
