import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { GroupForRegistration } from "app/api/models";
import { UsersService } from "app/api/services";

/**
 * Loads the possible groups for registration
 */
@Injectable()
export class RegistrationGroupsResolve implements Resolve<GroupForRegistration[]> {
  constructor(
    private usersService: UsersService
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<GroupForRegistration[]> {
    return this.usersService.getGroupsForUserRegistration({})
      .then(response => response.data);
  }
}