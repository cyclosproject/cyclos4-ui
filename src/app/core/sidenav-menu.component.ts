import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { LayoutService } from "app/core/layout.service";
import { LoginService } from "app/core/login.service";
import { MenuItemComponent } from "app/core/menu-item.component";
import { Subscription } from "rxjs/Subscription";
import { MdSidenav } from "@angular/material";
import { ModelHelper } from "app/shared/model-helper";
import { GeneralMessages } from "app/messages/general-messages";

@Component({
  selector: 'sidenav-menu',
  templateUrl: 'sidenav-menu.component.html',
  styleUrls: ['sidenav-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavMenuComponent implements OnInit {
  constructor(
    public generalMessages: GeneralMessages,
    public layout: LayoutService,
    public format: FormatService,
    public login: LoginService,
    private changeDetector: ChangeDetectorRef
  ) { }

  @Input()
  sidenav: MdSidenav;

  accounts: boolean;
  singleAccount: string;
  payment: boolean;

  ngOnInit() {
    this.login.subscribeForAuth(() => this.update());
    this.update();
  }

  private update() {
    let auth = this.login.auth || {};
    let permissions = auth.permissions || {};

    // Accounts menu entries
    let accounts = permissions.accounts || [];
    this.accounts = accounts.length > 1;
    this.singleAccount = accounts.length == 1
      ? ModelHelper.internalNameOrId(accounts[0].account.type)
      : null;
    this.payment = false;
    for (let account of accounts) {
      if ((account.userPayments || []).length > 0
        || (account.selfPayments || []).length > 0
        || (account.systemPayments || []).length > 0) {
          this.payment = true;
          break;
        }
    }    
    this.changeDetector.markForCheck();
  }
}