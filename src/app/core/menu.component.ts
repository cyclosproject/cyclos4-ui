import { Component, OnInit, Input } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { LayoutService } from "app/core/layout.service";
import { LoginService } from "app/core/login.service";
import { MenuItemComponent } from "app/core/menu-item.component";
import { Subscription } from "rxjs/Subscription";
import { MdSidenav } from "@angular/material";

@Component({
  selector: 'menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss']
})
export class MenuComponent implements OnInit {
  constructor(
    public layout: LayoutService,
    public format: FormatService,
    public login: LoginService
  ) { }

  @Input()
  sidenav: MdSidenav;

  ngOnInit() { }
}