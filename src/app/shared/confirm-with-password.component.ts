import { Component, Input, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Messages } from 'app/messages/messages';
import { PasswordInput } from 'app/api/models';
import { FormBuilder, FormControl, Validators } from '@angular/forms';

export interface ConfirmWithPasswordData {
  message: string;
  passwordInput: PasswordInput;
  confirmationMessage?: string;
}

/**
 * Component used to show a message with a confirmation password
 */
@Component({
  selector: 'confirm-with-password',
  templateUrl: 'confirm-with-password.component.html',
  styleUrls: ['confirm-with-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmWithPasswordComponent {

  control: FormControl;

  @Input() passwordInput: PasswordInput;

  constructor(
    public messages: Messages,
    public dialogRef: MatDialogRef<ConfirmWithPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmWithPasswordData,
    formBuilder: FormBuilder
  ) {
    this.control = formBuilder.control(null, Validators.required);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  confirm() {
    if (this.control.valid) {
      this.dialogRef.close(this.control.value);
    }
  }
}
