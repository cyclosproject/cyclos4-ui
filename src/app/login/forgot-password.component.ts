import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { DataForLogin, PrincipalTypeInput, ForgottenPasswordRequest } from 'app/api/models';
import { AuthService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { cloneDeep } from 'lodash';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { AuthHelperService } from 'app/core/auth-helper.service';

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
    i18n: I18n,
    private authHelper: AuthHelperService,
    private authService: AuthService
  ) {
    super(injector, i18n);
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
    const params: ForgottenPasswordRequest = cloneDeep(this.form.value);
    params.user = ApiHelper.escapeNumeric(params.user);
    this.authService.forgottenPasswordRequest(params)
      .subscribe(() => {
        this.notification.info(this.i18n(`You will receive shortly an e-mail with your user identification
          and instructions on how to reset your password`));
        this.cancel();
      });
  }

  cancel() {
    this.router.navigateByUrl('/login');
  }
}
