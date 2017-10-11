import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'app/shared/base.component';
import { RootMenuEntry, MenuType } from 'app/shared/menu';

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
  constructor(injector: Injector, private router: Router) {
    super(injector);
  }

  roots: RootMenuEntry[];

  ngOnInit() {
    super.ngOnInit();
    this.update();
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  private update() {
    this.roots = this.login.menu(MenuType.BAR);
  }

  onClick(root: RootMenuEntry) {
    let entry = root.entries[0];
    if (entry) {
      this.router.navigateByUrl(entry.url);
    }
  }

}