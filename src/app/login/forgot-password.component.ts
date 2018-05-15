import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { DataForLogin, PrincipalTypeInput } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Component used to show the forgot password page.
 */
@Component({
  selector: 'forgot-password',
  templateUrl: 'forgot-password.component.html',
  // Actually uses the same styles as the login component
  styleUrls: ['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent extends BaseComponent {

  form: FormGroup;
  loaded = new BehaviorSubject(false);
  dataForLogin: DataForLogin;

  constructor(
    injector: Injector,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    super(injector);
    this.form = formBuilder.group({
      user: ['', Validators.required]
    });
  }

  get text(): string {
    const principalTypes: PrincipalTypeInput[] =
      (this.dataForLogin.extraForgotPasswordPrincipalTypes || []).concat(
        this.dataForLogin.principalTypes || []
      );
    return this.messages.forgotPasswordText(principalTypes.map(pt => pt.name).join(', '));
  }

  ngOnInit() {
    super.ngOnInit();
    const dataForUi = this.dataForUiHolder.dataForUi;
    if (dataForUi.auth != null) {
      this.router.navigateByUrl(this.login.redirectUrl || '');
    } else {
      this.dataForLogin = dataForUi.dataForLogin;
      // Captcha
      if (this.dataForLogin.forgotPasswordCaptchaProvider != null) {
        this.form.setControl('captcha',
          ApiHelper.captchaFormGroup(this.formBuilder));
      }
      this.loaded.next(true);
    }
  }

  submit() {
    this.authService.forgottenPasswordRequest(this.form.value)
      .subscribe(() => {
        this.notification.info(this.messages.forgotPasswordSent());
        this.cancel();
      });
  }

  cancel() {
    this.router.navigateByUrl('/login');
  }
}
