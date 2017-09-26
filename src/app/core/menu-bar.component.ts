import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';

/**
 * A bar displayed below the top bar, with menu items
 */
@Component({
  selector: 'menu-bar',
  templateUrl: 'menu-bar.component.html',
  styleUrls: ['menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
    this.login.subscribeForAuth(() => this.detectChanges());
  }
}