import { Component, OnInit, Input, EventEmitter, Output, Inject } from '@angular/core';
import { MenuComponent } from "app/core/menu.component";
import { LayoutService } from "app/core/layout.service";

/**
 * Renders a menu item
 */
@Component({
  selector: 'menu-item',
  templateUrl: 'menu-item.component.html',
  styleUrls: ['menu-item.component.scss']
})
export class MenuItemComponent implements OnInit {
  // constructor(
  //   @Inject(MenuComponent) private menu: MenuComponent,
  //   public layout: LayoutService
  // ) {
  // }

  @Input()
  icon: string;

  @Input()
  label: string;

  @Input()
  url: string;

  ngOnInit() {}

  // anchorClick(event: MouseEvent): void {
  //   if (this.menu.sidenav && this.layout.ltmd) {
  //     this.menu.sidenav.close();
  //   }
  // }
}