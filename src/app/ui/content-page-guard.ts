import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { LoginService } from 'app/ui/core/login.service';

/**
 * Guard that checks a content page whether it's allowed only for logged users
 */
@Injectable({
  providedIn: 'root',
})
export class ContentPageGuard implements CanActivate {
  constructor(
    private login: LoginService,
    private dataForFrontendHolder: DataForFrontendHolder,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const slug = route.params.slug;
    const page = this.dataForFrontendHolder.page(slug);
    if (!page && this.login.user == null) {
      // Login and try again
      this.login.goToLoginPage(state.url);
    }
    return !!page;
  }
}
