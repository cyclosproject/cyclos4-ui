import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { DataForLogin } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { LoginPageState } from '../core/login.service';

/**
 * Component used to show a login form.
 * Also has a link to the forgot password functionality.
 */
@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent extends BaseComponent {

  form: FormGroup;
  loaded = new BehaviorSubject(false);
  dataForLogin: DataForLogin;

  get forgotPasswordEnabled(): boolean {
    return (this.dataForLogin.forgotPasswordMediums || []).length > 0;
  }

  constructor(
    injector: Injector,
    formBuilder: FormBuilder
  ) {
    super(injector);
    this.form = formBuilder.group({
      principal: '',
      password: ''
    });
  }

  ngOnInit() {
    super.ngOnInit();
    const dataForUi = this.dataForUiHolder.dataForUi;
    if (dataForUi.auth != null) {
      this.router.navigateByUrl(this.login.redirectUrl || '');
    } else {
      this.dataForLogin = dataForUi.dataForLogin;
      setTimeout(() => this.loaded.next(true), 50);
    }
  }

  /**
   * Performs the login
   */
  doLogin(): void {
    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;
    this.login.login(value.principal, value.password);
  }

  get text(): string {
    if (this.login.loginPageState === LoginPageState.LOGGED_OUT) {
      return this.messages.loginMessageDisconnected();
    } else {
      return this.messages.loginMessage();
    }
  }
}
