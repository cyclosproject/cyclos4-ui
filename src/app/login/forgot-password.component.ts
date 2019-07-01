import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { DataForLogin, ForgottenPasswordRequest, PrincipalTypeInput } from 'app/api/models';
import { AuthService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * Component used to show the forgot password page.
 */
@Component({
  selector: 'forgot-password',
  templateUrl: 'forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent extends BasePageComponent<DataForLogin> implements OnInit {

  form: FormGroup;

  constructor(
    injector: Injector,
    private authService: AuthService
  ) {
    super(injector);
    this.form = this.formBuilder.group({
      user: ['', Validators.required]
    });
  }

  get principalTypes(): PrincipalTypeInput[] {
    return (this.data.extraForgotPasswordPrincipalTypes || [])
      .concat(this.data.principalTypes || []);
  }

  ngOnInit() {
    super.ngOnInit();
    const dataForUi = this.dataForUiHolder.dataForUi;
    if (dataForUi.auth.user != null) {
      this.router.navigateByUrl('');
    } else {
      this.data = dataForUi.dataForLogin;
      // Captcha
      if (this.data.forgotPasswordCaptchaProvider != null) {
        this.form.setControl('captcha', this.authHelper.captchaFormGroup());
      }
    }
  }

  submit() {
    if (!this.form.valid) {
      return;
    }
    const params: ForgottenPasswordRequest = this.form.value;
    params.user = ApiHelper.escapeNumeric(params.user);
    this.addSub(this.authService.forgottenPasswordRequest({ body: params })
      .subscribe(() => {
        this.notification.info(this.i18n.password.forgotten.email);
        this.cancel();
      }));
  }

  cancel() {
    this.login.goToLoginPage('');
  }
}
