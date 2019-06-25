import { ChangeDetectionStrategy, Component, Injector, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, ValidationErrors } from '@angular/forms';
import { DataForLogin, DataForUi } from 'app/api/models';
import { Configuration } from 'app/configuration';
import { LoginReason, LoginState } from 'app/core/login-state';
import { NextRequestState } from 'app/core/next-request-state';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty } from 'app/shared/helper';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Component used to show a login form.
 * Also has a link to the forgot password functionality.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent
  extends BasePageComponent<DataForLogin>
  implements OnInit {

  form: FormGroup;

  @ViewChild('principal', { static: false }) principalRef: ElementRef;
  @ViewChild('password', { static: false }) passwordInput: PasswordInputComponent;

  get forgotPasswordEnabled(): boolean {
    return !empty(this.data.forgotPasswordMediums);
  }

  get registrationEnabled(): boolean {
    const dataForUi = this.dataForUiHolder.dataForUi;
    return !empty(dataForUi.publicRegistrationGroups);
  }

  constructor(
    injector: Injector,
    private loginState: LoginState,
    private nextRequestState: NextRequestState
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      principal: '',
      password: ''
    });
    if (this.nextRequestState.hasSession) {
      // Already logged in
      this.addSub(this.dataForUiHolder.reload().subscribe(() =>
        this.router.navigateByUrl(this.loginState.redirectUrl || '')
      ));
      return;
    } else if (Configuration.externalLoginUrl) {
      // Redirect to the external URL
      this.login.goToLoginPage(this.loginState.redirectUrl);
      return;
    }

    // After closing the error notification, clear and focus the password field
    this.addSub(this.notification.onClosed.subscribe(() => {
      this.form.patchValue({ password: '' });
      this.passwordInput.focus();
    }));

    const dataForUi = this.dataForUiHolder.dataForUi;
    if (dataForUi == null || dataForUi.dataForLogin == null) {
      // Either the dataForUi is not loaded (?) or still points to a user. Reload first
      this.addSub(this.dataForUiHolder.reload().subscribe(d4ui => this.initialize(d4ui)));
    } else {
      // Can initialize directly
      this.initialize(dataForUi);
    }
  }

  private initialize(dataForUi: DataForUi) {
    this.data = dataForUi.dataForLogin;
  }

  /**
   * Performs the login
   */
  doLogin(): void {
    const value = this.form.value;
    const required: ValidationErrors = { required: true };
    this.form.controls.principal.setErrors(empty(value.principal) ? required : null);
    this.form.controls.principal.markAsTouched();
    this.form.controls.password.setErrors(empty(value.password) ? required : null);
    this.form.controls.password.markAsTouched();
    if (!this.form.valid) {
      return;
    }
    this.login.login(value.principal, value.password).subscribe(auth => {
      // Redirect to the correct URL
      if (!ApiHelper.isRestrictedAccess(auth)) {
        this.router.navigateByUrl(this.loginState.redirectUrl || '');
      }
    });
  }

  get loggedOut(): boolean {
    return this.loginState.reason === LoginReason.LOGGED_OUT;
  }
}
