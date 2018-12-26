import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { LayoutService } from 'app/shared/layout.service';
import { Menu } from 'app/shared/menu';
import { StateManager } from 'app/core/state-manager';

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
    public menu: MenuService,
    public router: Router,
    private stateManager: StateManager) {
  }

  @Input() user: User;
  @Input() principal: string;

  @Output() toggleSidenav = new EventEmitter<void>();

  ngOnInit(): void {
  }

  goToProfile(event: MouseEvent) {
    this.menu.setActiveMenu(Menu.MY_PROFILE);
    this.router.navigateByUrl('/users/my-profile');
    this.breadcrumb.clear();
    this.stateManager.clear();
    event.stopPropagation();
    event.preventDefault();
  }

  goToLogin(event: MouseEvent) {
    this.menu.setActiveMenu(Menu.LOGIN);
    this.router.navigateByUrl('/login');
    event.stopPropagation();
    event.preventDefault();
  }

  logout(event: MouseEvent) {
    this.login.logout();
    event.stopPropagation();
    event.preventDefault();
  }
}
