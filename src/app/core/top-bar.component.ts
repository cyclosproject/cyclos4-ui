import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { LayoutService } from 'app/shared/layout.service';
import { Menu } from 'app/shared/menu';

/**
 * The top bar, which is always visible
 */
@Component({
  selector: 'top-bar',
  templateUrl: 'top-bar.component.html',
  styleUrls: ['top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {
  constructor(
    public breadcrumb: BreadcrumbService,
    public format: FormatService,
    public login: LoginService,
    public layout: LayoutService,
    public menu: MenuService) {
  }

  @Input() user: User;
  @Input() principal: string;

  @Output() toggleSidenav = new EventEmitter<void>();

  ngOnInit(): void {
  }

  goToProfile(event: MouseEvent) {
    this.navigate(Menu.MY_PROFILE, event);
  }

  goToLogin(event: MouseEvent) {
    this.navigate(Menu.LOGIN, event);
  }

  logout(event: MouseEvent) {
    this.navigate(Menu.LOGOUT, event);
  }

  private navigate(menu: Menu, event: MouseEvent) {
    const entry = this.menu.menuEntry(menu);
    if (entry) {
      this.menu.navigate(entry, event);
    }
  }
}
