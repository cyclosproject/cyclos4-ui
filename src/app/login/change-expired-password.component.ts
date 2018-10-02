import { Component, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';
import { DataForChangeForgottenPassword, PasswordStatusAndActions, PasswordModeEnum } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AuthService, PasswordsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { LoginState } from 'app/core/login-state';
import { validateBeforeSubmit, getAllErrors } from 'app/shared/helper';
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
 * Component shown after the user logs-in with an expired password
 */
@Component({
  selector: 'change-expired-password',
  templateUrl: 'change-expired-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeExpiredPasswordComponent
  extends BasePageComponent<PasswordStatusAndActions>
  implements OnInit {

  form: FormGroup;
  typeId: string;
  generated = false;

  getAllErrors = getAllErrors;
  generatedValue$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private passwordsService: PasswordsService,
    private loginState: LoginState
  ) {
    super(injector);
    this.form = this.formBuilder.group({
    });
  }

  ngOnInit() {
    super.ngOnInit();
    const auth = this.dataForUiHolder.dataForUi.auth;
    if (!auth.expiredPassword) {
      // The password is not actually expired
      this.router.navigateByUrl(this.loginState.redirectUrl || '');
      return;
    }
    this.typeId = auth.passwordType.id;

    this.passwordsService.getUserPasswordsData({
      user: ApiHelper.SELF,
      type: this.typeId,
      fields: ['status', 'permissions']
    }).subscribe(data => {
      this.data = data;
      this.generated = data.type.mode === PasswordModeEnum.GENERATED;
      if (!this.generated) {
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
    const type = this.data.type;
    if (this.generated) {
      this.passwordsService.generatePassword(this.typeId).subscribe(newValue => {
        this.generatedValue$.next(newValue);
      });
    } else {
      this.passwordsService.changePassword({
        user: ApiHelper.SELF,
        type: this.typeId,
        params: this.form.value
      }).subscribe(() => {
        this.notification.snackBar(this.i18n('Your {{name}} was changed', {
          name: type.name
        }));
        this.reload();
      });
    }
  }

  reload() {
    this.dataForUiHolder.reload().subscribe(() =>
      this.router.navigateByUrl(this.loginState.redirectUrl || ''));
  }

  cancel() {
    // Logout and return to the login page
    this.login.logout();
  }
}
