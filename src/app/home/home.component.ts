import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
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
export class HomeComponent extends BasePageComponent<void> {

  homePage = environment.homePage;

  constructor(injector: Injector) {
    super(injector);
  }

  defaultFullWidthLayout(): boolean {
    if (this.login.user == null) {
      // Home content page may be full width
      return this.homePage.layout === 'full';
    }
    return false;
  }

}
