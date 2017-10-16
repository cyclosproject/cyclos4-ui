import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { BaseComponent } from 'app/shared/base.component';
import { RootMenuEntry, MenuType } from 'app/shared/menu';

@Component({
  selector: 'sidenav-menu',
  templateUrl: 'sidenav-menu.component.html',
  styleUrls: ['sidenav-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavMenuComponent extends BaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  sidenav: MatSidenav;

  ngOnInit() {
    super.ngOnInit();
    this.update();
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  menu: RootMenuEntry[];

  private update() {
    this.menu = this.login.menu(MenuType.SIDENAV);
  }
}