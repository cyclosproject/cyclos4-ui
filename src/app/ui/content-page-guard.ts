import { Injectable, Injector } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { ContentService } from 'app/ui/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LoginService } from 'app/ui/core/login.service';

/**
 * Guard that checks a content page whether it's allowed only for logged users
 */
@Injectable({
  providedIn: 'root',
})
export class ContentPageGuard implements CanActivate {
  constructor(
    private content: ContentService,
    private injector: Injector,
    private login: LoginService,
    private dataForUiHolder: DataForUiHolder,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const slug = route.params.slug;
    const page = this.content.contentPage(slug);
    const visible = page != null && page.isVisible(this.dataForUiHolder.auth, this.injector);
    if (!visible && this.login.user == null) {
      // Login and try again
      this.login.goToLoginPage(state.url);
    }
    return visible;
  }
}
