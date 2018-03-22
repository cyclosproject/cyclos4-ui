import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { DataForLogin, GroupForRegistration, PrincipalTypeInput, DataForChangeForgottenPassword } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NextRequestState } from 'app/core/next-request-state';
import { AuthService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';

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
  // Actually uses the same styles as the login component
  styleUrls: ['login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeForgottenPasswordComponent extends BaseComponent {

  form: FormGroup;
  loaded = new BehaviorSubject(false);
  data = new BehaviorSubject<DataForChangeForgottenPassword>(null);

  constructor(
    injector: Injector,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    super(injector);
    this.form = formBuilder.group({
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
      this.data.next(data);
      if (data.securityQuestion) {
        this.form.setControl('securityAnswer', this.formBuilder.control('', Validators.required));
      }
      if (!data.generated) {
        this.form.setControl('checkConfirmation', this.formBuilder.control(true));
        this.form.setControl('newPassword', this.formBuilder.control('', Validators.required));
        this.form.setControl('newPasswordConfirmation', this.formBuilder.control('',
          Validators.compose([Validators.required, PASSWORDS_MATCH_VAL])));
      }
      this.loaded.next(true);
    });
  }

  submit() {
    this.authService.changeForgottenPassword(this.form.value)
      .subscribe(() => {
        const generated = this.data.value.generated;
        this.notification.info(generated ? this.messages.forgotPasswordDoneGenerated() : this.messages.forgotPasswordDoneManual());
        // Mark the login page as affected by the forgotten password change and go to login
        this.login.forgottenPasswordChanged(generated);
        this.router.navigateByUrl('/login');
      });
  }

  cancel() {
    // Go back to the login page
    this.router.navigateByUrl('/login');
  }
}
