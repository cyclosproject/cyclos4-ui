import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { PasswordModeEnum, PasswordStatusAndActions } from 'app/api/models';
import { PasswordsService } from 'app/api/services';
import { LoginState } from 'app/core/login-state';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

/** Validator function that ensures password and confirmation match */
const PASSWORDS_MATCH_VAL: ValidatorFn = control => {
  const currVal = control.value;
  if (control.touched && currVal != null && currVal !== '') {
    const parent = control.parent;
    const origVal = parent.get('newPassword') == null ? '' : parent.get('newPassword').value;
    if (origVal !== currVal) {
      return {
        passwordsMatch: true,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeExpiredPasswordComponent
  extends BasePageComponent<PasswordStatusAndActions>
  implements OnInit {

  form: FormGroup;
  typeId: string;
  typeName: string;
  generated = false;

  generatedValue$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private passwordsService: PasswordsService,
    private loginState: LoginState,
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

    this.addSub(this.passwordsService.getUserPasswordsData({
      user: ApiHelper.SELF,
      type: this.typeId,
      fields: ['status', 'permissions'],
    }).subscribe(data => {
      this.data = data;
      this.typeName = data.type.name;
      this.generated = data.type.mode === PasswordModeEnum.GENERATED;
      if (!this.generated) {
        this.form.setControl('checkConfirmation', this.formBuilder.control(true));
        this.form.setControl('newPassword', this.formBuilder.control('', Validators.required));
        this.form.setControl('newPasswordConfirmation', this.formBuilder.control('',
          Validators.compose([Validators.required, PASSWORDS_MATCH_VAL])));
      }
    }));
  }

  submit() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const type = this.data.type;
    if (this.generated) {
      this.addSub(this.passwordsService.generatePassword({ type: this.typeId }).subscribe(newValue => {
        this.generatedValue$.next(newValue);
      }));
    } else {
      this.addSub(this.passwordsService.changePassword({
        user: ApiHelper.SELF,
        type: this.typeId,
        body: this.form.value,
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.password.expired.changed(type.name));
        this.reload();
      }));
    }
  }

  reload() {
    this.addSub(this.dataForUiHolder.reload().subscribe(() =>
      this.router.navigateByUrl(this.loginState.redirectUrl || '')));
  }

  cancel() {
    // Logout and return to the login page
    this.login.logout();
  }

  resolveMenu() {
    return Menu.DASHBOARD;
  }
}
