import { Component, ChangeDetectionStrategy, Injector, Inject, Input, Output, EventEmitter } from '@angular/core';

import { BaseComponent } from 'app/shared/base.component';
import { PasswordsService } from 'app/api/services';
import { ChangePassword, PasswordType } from 'app/api/models';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { ApiHelper } from 'app/shared/api-helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { cloneDeep } from 'lodash';

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
 * Changes a manual password in a dialog
 */
@Component({
  selector: 'change-password-dialog',
  templateUrl: 'change-password-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordDialogComponent extends BaseComponent {

  @Input() type: PasswordType;
  @Output() done = new EventEmitter<void>();

  form: FormGroup;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public modalRef: BsModalRef,
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
    const params: ChangePassword = cloneDeep(this.form.value);
    params.checkConfirmation = true;
    this.passwordsService.changePassword({
      user: ApiHelper.SELF,
      type: this.type.id,
      params: params
    }).subscribe(() => {
      this.modalRef.hide();
      this.done.emit();
    });
  }
}
