import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';
import {
  ChangeForgottenPassword, DataForChangeForgottenPassword, DataForLogin,
  ForgottenPasswordRequest, PasswordModeEnum, SendMediumEnum,
} from 'app/api/models';
import { AuthService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { locateControl, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type ForgotPasswordStep = 'request' | 'code' | 'change';

/**
 * Component used to show the forgot user identification / password page.
 */
@Component({
  selector: 'forgot-password',
  templateUrl: 'forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent extends BasePageComponent<DataForLogin> implements OnInit {

  step$ = new BehaviorSubject<ForgotPasswordStep>('request');
  get step(): ForgotPasswordStep {
    return this.step$.value;
  }
  set step(step: ForgotPasswordStep) {
    this.step$.next(step);
  }

  requestForm: FormGroup;
  codeForm: FormGroup;
  sendMedium: SendMediumEnum;
  changeData: DataForChangeForgottenPassword;
  changeForm: FormGroup;

  constructor(
    injector: Injector,
    private authService: AuthService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const dataForUi = this.dataForUiHolder.dataForUi;
    if (dataForUi.auth.user != null) {
      this.router.navigateByUrl('');
    } else {
      this.data = dataForUi.dataForLogin;
    }
  }

  onDataInitialized(data: DataForLogin) {
    this.requestForm = this.formBuilder.group({
      user: [null, Validators.required],
      sendMedium: data.forgotPasswordMediums[0],
    });
    if (data.forgotPasswordCaptchaProvider) {
      this.requestForm.addControl('captcha', this.authHelper.captchaFormGroup());
    }
  }

  toCode() {
    if (!validateBeforeSubmit(this.requestForm)) {
      return;
    }
    const params = this.requestForm.value as ForgottenPasswordRequest;
    params.user = ApiHelper.escapeNumeric(params.user);
    this.authService.forgottenPasswordRequest({ body: params }).subscribe(resp => {
      this.sendMedium = resp.sendMedium;
      this.notification.snackBar(this.i18n.password.forgotten.codeSent(resp.sentTo.join(', ')));
      this.codeForm = this.formBuilder.group({
        user: [this.requestForm.value.user, Validators.required],
        code: [null, Validators.required],
      });
      this.step = 'code';
    });
  }

  toChange() {
    if (!validateBeforeSubmit(this.codeForm)) {
      return;
    }
    const params = this.codeForm.value;
    params.user = ApiHelper.escapeNumeric(params.user);
    this.authService.getDataForChangeForgottenPassword(params).subscribe(changeData => {
      this.changeData = changeData;
      this.changeForm = this.formBuilder.group({
        user: [this.codeForm.value.user, Validators.required],
        code: [this.codeForm.value.code, Validators.required],
      });
      if (changeData.securityQuestion) {
        this.changeForm.addControl('securityAnswer', this.formBuilder.control(null, Validators.required));
      }
      if (changeData.passwordType.mode === PasswordModeEnum.MANUAL) {
        this.changeForm.addControl('checkConfirmation', this.formBuilder.control(true));
        this.changeForm.addControl('newPassword', this.formBuilder.control(null, Validators.required));
        this.changeForm.addControl('newPasswordConfirmation', this.formBuilder.control(null, Validators.required));
      } else {
        this.changeForm.addControl('sendMedium', this.formBuilder.control(this.requestForm.value.sendMedium));
      }
      this.step = 'change';
    });
  }

  change() {
    if (!validateBeforeSubmit(this.changeForm)) {
      return;
    }
    const params: ChangeForgottenPassword = this.changeForm.value;
    params.user = ApiHelper.escapeNumeric(params.user);
    this.addSub(this.authService.changeForgottenPassword({ body: params })
      .subscribe(() => {
        const msg = this.changeData.passwordType.mode === PasswordModeEnum.GENERATED
          ?
          this.sendMedium === SendMediumEnum.SMS
            ? this.i18n.password.forgotten.generatedDoneSms
            : this.i18n.password.forgotten.generatedDoneEmail
          : this.i18n.password.forgotten.manualDone;
        this.notification.info(msg);
        this.cancel();
      }));
  }

  locateControl(locator: FormControlLocator): AbstractControl {
    return locateControl(this.form, locator);
  }

  /**
   * Returns the current form
   */
  get form(): FormGroup {
    switch (this.step) {
      case 'request':
        return this.requestForm;
      case 'code':
        return this.codeForm;
      case 'change':
        return this.changeForm;
    }
  }

  cancel() {
    this.login.goToLoginPage('');
  }

  resolveMenu() {
    return Menu.LOGIN;
  }
}
