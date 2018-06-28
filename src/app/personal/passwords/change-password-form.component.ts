import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BaseComponent } from 'app/shared/base.component';
import { PasswordsService } from 'app/api/services';
import { ChangePassword, PasswordType } from 'app/api/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { ApiHelper } from 'app/shared/api-helper';
import { copyProperties } from 'app/shared/helper';

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
 * Changes a manual password
 */
@Component({
  selector: 'change-password-form',
  templateUrl: 'change-password-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordFormComponent extends BaseComponent {

  form: FormGroup;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<ChangePasswordFormComponent>,
    @Inject(MAT_DIALOG_DATA) public type: PasswordType,
    private passwordsService: PasswordsService) {
    super(injector);

    this.form = formBuilder.group({
      oldPassword: [null, Validators.required],
      newPassword: [null, Validators.required],
      newPasswordConfirmation: [null, Validators.compose([Validators.required, PASSWORDS_MATCH_VAL])],
    });
  }

  submit() {
    if (!this.form.valid) {
      return;
    }
    const params: ChangePassword = {
      checkConfirmation: true
    };
    copyProperties(this.form.value, params);
    this.passwordsService.changePassword({
      user: ApiHelper.SELF,
      type: this.type.id,
      params: params
    }).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}
