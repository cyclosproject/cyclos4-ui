import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ChangePassword, PasswordType } from 'app/api/models';
import { PasswordsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash';
import { BsModalRef } from 'ngx-bootstrap/modal';


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
    if (!validateBeforeSubmit(this.form)) {
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
