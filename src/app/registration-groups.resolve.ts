import { Injectable } from '@angular/core';
import { GroupForRegistration } from 'app/api/models';
import { UsersService } from 'app/api/services';
import { Observable } from 'rxjs/Observable';
import { SingletonResolve } from 'app/singleton.resolve';
import { NextRequestState } from './core/next-request-state';

/**
 * Loads the possible groups for registration
 */
@Injectable()
export class RegistrationGroupsResolve extends SingletonResolve<GroupForRegistration[]> {
  constructor(
    private usersService: UsersService,
    private nextRequestState: NextRequestState) {
    super();
  }

  fetch(): Observable<GroupForRegistration[]> {
    // The registration groups are only returned as guest, otherwise it would be groups for a member to register other members
    this.nextRequestState.nextAsGuest();
    return this.usersService.getGroupsForUserRegistration({});
  }
}
