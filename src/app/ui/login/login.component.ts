import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { FormGroup, ValidationErrors } from '@angular/forms';
import { DataForLogin, DataForUi, IdentityProvider, IdentityProviderCallbackStatusEnum } from 'app/api/models';
import { NextRequestState } from 'app/core/next-request-state';
import { empty, setRootSpinnerVisible } from 'app/shared/helper';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { LoginReason, LoginState } from 'app/ui/core/login-state';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { first } from 'rxjs/operators';

/**
 * Component used to show a login form.
 * Also has a link to the forgot password functionality.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'login',
  templateUrl: 'login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent
  extends BasePageComponent<DataForLogin>
  implements OnInit {

  form: FormGroup;

  private identityProviderRequestId: string;

  @ViewChild('principal') principalRef: ElementRef;
  @ViewChild('password') passwordInput: PasswordInputComponent;

  get forgotPasswordEnabled(): boolean {
    return !empty(this.data.forgotPasswordMediums);
  }

  get registrationEnabled(): boolean {
    const dataForUi = this.dataForFrontendHolder.dataForUi;
    return !empty(dataForUi.publicRegistrationGroups);
  }

  constructor(
    injector: Injector,
    private loginState: LoginState,
    private nextRequestState: NextRequestState,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      principal: '',
      password: '',
    });
    if (this.dataForFrontendHolder.user) {
      // Already logged in
      this.addSub(this.dataForFrontendHolder.reload().subscribe(() =>
        this.router.navigateByUrl(this.loginState.redirectUrl || ''),
      ));
      return;
    } else {
      const externalLoginUrl = this.dataForFrontendHolder.dataForFrontend.externalLoginUrl;
      if (externalLoginUrl) {
        // Redirect to the external URL
        this.login.goToLoginPage(this.loginState.redirectUrl);
        return;
      }
    }

    // After closing the error notification, clear and focus the password field
    this.addSub(this.notification.onClosed.subscribe(() => {
      this.form.patchValue({ password: '' });
      this.passwordInput.focus();
    }));

    const dataForUi = this.dataForFrontendHolder.dataForUi;
    if (dataForUi == null || dataForUi.dataForLogin == null) {
      // Either the dataForFrontend is not loaded (?) or still points to a user. Reload first
      this.addSub(this.dataForFrontendHolder.reload().subscribe(data => this.initialize(data.dataForUi)));
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
  doLogin(event: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const value = this.form.value;
    const required: ValidationErrors = { required: true };
    this.form.controls.principal.setErrors(empty(value.principal) ? required : null);
    this.form.controls.principal.markAsTouched();
    this.form.controls.password.setErrors(empty(value.password) ? required : null);
    this.form.controls.password.markAsTouched();
    if (!this.form.valid) {
      return;
    }
    this.login.login(value.principal, value.password, this.identityProviderRequestId).subscribe(this.afterLogin);
  }

  get loggedOut(): boolean {
    return this.loginState.reason === LoginReason.LOGGED_OUT;
  }

  resolveMenu() {
    return Menu.LOGIN;
  }

  loginWith(idp: IdentityProvider) {
    this.authHelper.identityProviderPopup(idp, 'login', null, null, this.login.getUserAgentId()).pipe(first()).subscribe(callback => {
      switch (callback.status) {
        case IdentityProviderCallbackStatusEnum.LOGIN_LINK:
        case IdentityProviderCallbackStatusEnum.LOGIN_EMAIL:
          // Successful login
          this.nextRequestState.replaceSession(callback.sessionToken).pipe(first()).subscribe(() => {
            setRootSpinnerVisible(true);
            this.dataForFrontendHolder.initialize().pipe(first()).subscribe(() => this.afterLogin());
          });
          break;
        case IdentityProviderCallbackStatusEnum.LOGIN_NO_MATCH:
          this.identityProviderRequestId = callback.requestId;
          this.notification.info(this.i18n.identityProvider.loginNoMatch({
            app: this.dataForFrontendHolder.dataForFrontend.title,
            email: callback.email,
            provider: idp.name,
          }));
          break;
        case IdentityProviderCallbackStatusEnum.LOGIN_NO_EMAIL:
          this.identityProviderRequestId = callback.requestId;
          this.notification.info(this.i18n.identityProvider.loginNoEmail({
            app: this.dataForFrontendHolder.dataForFrontend.title,
            provider: idp.name,
          }));
          break;
        default:
          this.notification.error(callback.errorMessage || this.i18n.error.general);
          break;
      }
    });
  }

  private get afterLogin(): () => any {
    return () => {
      setRootSpinnerVisible(false);
      // Redirect to the correct URL if login confirmation isn't required
      if (!this.dataForFrontendHolder.dataForUi?.auth?.loginConfirmation) {
        this.router.navigateByUrl(this.loginState.redirectUrl || '');
      }
    };
  }
}
