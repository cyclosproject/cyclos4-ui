import { Injectable, Injector } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { ContentService } from 'app/core/content.service';
import { LoginState } from 'app/core/login-state';
import { LoginService } from 'app/core/login.service';

/**
 * Guard that checks a content page whether it's allowed only for logged users
 */
@Injectable({
  providedIn: 'root'
})
export class ContentPageGuard implements CanActivate {
  constructor(
    private content: ContentService,
    private router: Router,
    private injector: Injector,
    private login: LoginService,
    private loginState: LoginState
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const slug = route.params.slug;
    const page = this.content.contentPage(slug);
    const visible = page != null && page.isVisible(this.injector);
    if (!visible && this.login.user == null) {
      // Login and try again
      this.loginState.redirectUrl = state.url;
      this.router.navigateByUrl('/login');
    }
    return visible;
  }
}
