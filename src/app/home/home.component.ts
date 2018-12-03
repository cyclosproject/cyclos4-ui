import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { environment } from 'environments/environment';

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePageComponent<void> implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.layout.ltmd$.subscribe(() => this.goToLoginIfNeeded()));
    this.goToLoginIfNeeded();
  }

  private goToLoginIfNeeded() {
    if (this.login.user == null && this.layout.ltmd) {
      // Guests on mobile don't have a home page - go to login directly
      this.router.navigate(['/login']);
    }
  }

  defaultFullWidthLayout(): boolean {
    if (this.login.user == null && this.layout.gtsm) {
      // Home content page may be full width
      return environment.homeContent.layout === 'full';
    }
    return false;
  }

}
