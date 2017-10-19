import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, OnDestroy, Injector } from '@angular/core';
import { GeneralMessages } from "app/messages/general-messages";
import { LoginService } from "app/core/login.service";
import { Router, ActivatedRoute } from "@angular/router";
import { LayoutService } from "app/core/layout.service";
import { LoginData } from "app/login/login-data";
import { LoginFormComponent } from "app/login/login-form.component";
import { DataForLogin, GroupForRegistration } from "app/api/models";
import { BaseComponent } from "app/shared/base.component";
import { Menu } from 'app/shared/menu';

/**
 * Component used to show a login form.
 * Also has a link to public registration.
 */
@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent extends BaseComponent {

  @ViewChild("loginForm")
  public loginForm: LoginFormComponent;

  public dataForLogin: DataForLogin;
  public registrationGroups: GroupForRegistration[];

  public get canRegister(): boolean {
    return this.registrationGroups != null && this.registrationGroups.length > 0;
  }

  constructor(
    injector: Injector,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.route.data.subscribe((data: {
      dataForLogin: DataForLogin,
      registrationGroups: GroupForRegistration[]
    }) => {
      this.dataForLogin = data.dataForLogin;
      this.registrationGroups = data.registrationGroups;
    });
    this.layout.menu.next(Menu.LOGIN);
  }

  /**
   * Performs the login
   */
  doLogin(data: LoginData): void {
    // When using the external login button there's no data, so we assume it comes from the login form
    data = data || this.loginForm.data;
    if (!data.valid) return;
    
    this.loginService.login(data.principal, data.password)
      .then(u => {
        // Redirect to the correct URL
        this.router.navigateByUrl(this.loginService.redirectUrl || '');
      });
  }

  register(): void {
    alert("Not implemented yet");
  }
}
