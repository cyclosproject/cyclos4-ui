import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Router } from "@angular/router";
import { LoginService } from "app/core/login.service";
import { BaseComponent } from 'app/shared/base.component';
import { Menu } from 'app/shared/menu';

/**
 * Displays the home page
 */
@Component({
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  menu = Menu.HOME;

  ngOnInit() { }
}