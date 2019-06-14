import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ChangePassword, PasswordType, User } from 'app/api/models';
import { PasswordsService } from 'app/api/services';
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
export class ChangePasswordDialogComponent extends BaseComponent implements OnInit {

  @Input() param: string;
  @Input() user: User;
  @Input() type: PasswordType;
  @Input() requireOld: boolean;
  @Output() done = new EventEmitter<void>();

  self: boolean;
  form: FormGroup;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private passwordsService: PasswordsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.self = this.authHelper.isSelf(this.user);

    this.form = this.formBuilder.group({
      newPassword: [null, Validators.required],
      newPasswordConfirmation: [null, Validators.compose([Validators.required, PASSWORDS_MATCH_VAL])],
    });

    if (this.requireOld) {
      this.form.setControl('oldPassword', this.formBuilder.control(null, Validators.required));
    }
  }

  submit() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const params: ChangePassword = cloneDeep(this.form.value);
    params.checkConfirmation = true;
    this.addSub(this.passwordsService.changePassword({
      user: this.param,
      type: this.type.id,
      body: params
    }).subscribe(() => {
      this.done.emit();
      this.modalRef.hide();
    }));
  }
}
