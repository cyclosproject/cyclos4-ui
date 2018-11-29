import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';

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

  constructor(injector: Injector) {
    super(injector);
  }

}
