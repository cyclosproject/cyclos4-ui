import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { DataForLogin, GroupForRegistration } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { Menu } from 'app/shared/menu';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ApiInterceptor } from 'app/core/api.interceptor';

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

  loginForm: FormGroup;

  dataForLogin = new BehaviorSubject<DataForLogin>(null);
  registrationGroups: GroupForRegistration[];

  get canRegister(): boolean {
    return this.registrationGroups != null && this.registrationGroups.length > 0;
  }

  constructor(
    injector: Injector,
    private interceptor: ApiInterceptor,
    formBuilder: FormBuilder
  ) {
    super(injector);
    this.loginForm = formBuilder.group({
      principal: '',
      password: ''
    });
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.interceptor.sessionToken != null) {
      this.router.navigateByUrl(this.login.redirectUrl || '');
    } else {
      this.subscriptions.push(this.route.data.subscribe((data: {
        dataForLogin: DataForLogin,
        registrationGroups: GroupForRegistration[]
      }) => {
        this.dataForLogin.next(data.dataForLogin);
        this.registrationGroups = data.registrationGroups;
      }));
      this.layout.menu.next(Menu.LOGIN);
    }
  }

  /**
   * Performs the login
   */
  doLogin(): void {
    // When using the external login button there's no data, so we assume it comes from the login form
    if (!this.loginForm.valid) {
      return;
    }

    const value = this.loginForm.value;
    this.login.login(value.principal, value.password)
      .subscribe(u => {
        // Redirect to the correct URL
        this.router.navigateByUrl(this.login.redirectUrl || '');
      });
  }

  register(): void {
    alert('Not implemented yet');
  }
}
