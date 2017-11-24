import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { DataForLogin } from "app/api/models";
import { AuthService } from "app/api/services";
import { Observable } from 'rxjs/Observable';

/**
 * Loads login data before presenting the login form
 */
@Injectable()
export class DataForLoginResolve implements Resolve<DataForLogin> {
  constructor(
    private authService: AuthService
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DataForLogin> {
    return this.authService.getDataForLogin();
  }
}