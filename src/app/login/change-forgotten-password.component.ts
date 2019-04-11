import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { DataForChangeForgottenPassword } from 'app/api/models';
import { AuthService } from 'app/api/services';
import { LoginState } from 'app/core/login-state';
import { BasePageComponent } from 'app/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';

/** Validator function that ensures password and confirmation match */
const PASSWORDS_MATCH_VAL: ValidatorFn = control => {
  const currVal = control.value;
  if (control.touched && currVal != null && currVal !== '') {
    const parent = control.parent;
    const origVal = parent.get('newPassword') == null ? '' : parent.get('newPassword').value;
    if (origVal !== currVal) {
      return {
        passwordsMatch: true
      };
    }
  }
  return null;
};

/**
 * Component shown after the user clicks the received link to change a forgotten password
 */
@Component({
  selector: 'change-forgotten-password',
  templateUrl: 'change-forgotten-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeForgottenPasswordComponent
  extends BasePageComponent<DataForChangeForgottenPassword>
  implements OnInit {

  form: FormGroup;

  constructor(
    injector: Injector,
    private authService: AuthService,
    private loginState: LoginState
  ) {
    super(injector);
    this.form = this.formBuilder.group({
      key: ['', Validators.required]
    });
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.login.user != null) {
      // If there is currently a logged user, logout and return to this URL
      this.login.logout(this.router.url);
      return;
    }
    const key = this.route.snapshot.params.key;
    this.form.patchValue({ key: key });
    this.authService.getDataForChangeForgottenPassword({ key: key }).subscribe(data => {
      this.data = data;
      if (data.securityQuestion) {
        this.form.setControl('securityAnswer', this.formBuilder.control('', Validators.required));
      }
      if (!data.generated) {
        this.form.setControl('checkConfirmation', this.formBuilder.control(true));
        this.form.setControl('newPassword', this.formBuilder.control('', Validators.required));
        this.form.setControl('newPasswordConfirmation', this.formBuilder.control('',
          Validators.compose([Validators.required, PASSWORDS_MATCH_VAL])));
      }
    });
  }

  submit() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    this.authService.changeForgottenPassword(this.form.value)
      .subscribe(() => {
        const generated = this.data.generated;
        let message: string;
        if (generated) {
          message = this.i18n.auth.password.forgotten.generatedDone;
        } else {
          message = this.i18n.auth.password.forgotten.manualDone;
        }
        this.notification.info(message);
        // Mark the login page as affected by the forgotten password change and go to login
        this.loginState.forgottenPasswordChanged(generated);
        this.login.goToLoginPage('');
      });
  }

  cancel() {
    // Go back to the login page
    this.login.goToLoginPage('');
  }
}
