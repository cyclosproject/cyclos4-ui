import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanLoad, Route } from '@angular/router';
import { LoginService } from 'app/core/login.service';
import { LoginState } from 'app/core/login-state';

/**
 * Guard that ensures there is a logged user to allow activation
 */
@Injectable({
  providedIn: 'root'
})
export class LoggedUserGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private loginService: LoginService,
    private loginState: LoginState,
    private router: Router
  ) { }

  canLoad(route: Route): boolean {
    return this.checkLoggedIn(null);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.checkLoggedIn(state.url);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
    return this.checkLoggedIn(state.url);
  }

  private checkLoggedIn(url: string): boolean {
    const loggedIn = this.loginService.user != null;
    if (!loggedIn) {
      // Store the redirect URL
      this.loginState.redirectUrl = url;
      this.router.navigateByUrl('/login');
    }
    return loggedIn;
  }
}
