import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Route, RouterStateSnapshot } from '@angular/router';
import { LoginService } from 'app/core/login.service';

/**
 * Guard that ensures there is a logged user to allow activation
 */
@Injectable({
  providedIn: 'root',
})
export class LoggedUserGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private login: LoginService,
  ) { }

  canLoad(_route: Route): boolean {
    return this.checkLoggedIn(null);
  }

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkLoggedIn(state.url);
  }

  canActivateChild(_childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
    return this.checkLoggedIn(state.url);
  }

  private checkLoggedIn(url: string): boolean {
    const loggedIn = this.login.user != null;
    if (!loggedIn) {
      // Store the redirect URL
      this.login.goToLoginPage(url);
    }
    return loggedIn;
  }
}
