import { Component, ChangeDetectionStrategy, Injector, Inject, ViewChild, ElementRef } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { PhonesService } from 'app/api/services';
import { PhoneDataForEdit, PhoneDataForNew, PhoneKind, PhoneResult, CodeVerificationStatusEnum } from 'app/api/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { copyProperties } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Form used to verify a phone
 */
@Component({
  selector: 'verify-phone',
  templateUrl: 'verify-phone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyPhoneComponent extends BaseComponent {

  code: FormControl;
  id: string;
  title: string;
  managePrivacy = false;

  @ViewChild('codeControl') codeControl: ElementRef;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<VerifyPhoneComponent>,
    @Inject(MAT_DIALOG_DATA) public phone: PhoneResult,
    private phonesService: PhonesService) {
    super(injector);

    this.code = formBuilder.control(null, Validators.required);
  }

  /** Sends the verification code */
  sendCode() {
    this.phonesService.sendPhoneVerificationCode(this.phone.id).subscribe(number => {
      this.notification.snackBar(this.messages.phoneVerificationCodeSent(number));
      this.codeControl.nativeElement.focus();
      this.code.setValue(null);
    });
  }

  /**
   * Performs the phone verification
   */
  verify() {
    if (!this.code.valid) {
      return;
    }
    this.phonesService.verifyPhone({
      id: this.phone.id,
      code: this.code.value
    }).subscribe(status => {
      switch (status) {
        case CodeVerificationStatusEnum.CODE_NOT_SENT:
        case CodeVerificationStatusEnum.EXPIRED:
          this.notification.error(this.messages.phoneVerifyErrorMissingCode());
          break;
        case CodeVerificationStatusEnum.FAILED:
          this.notification.error(this.messages.phoneVerifyErrorInvalidCode());
          break;
        case CodeVerificationStatusEnum.MAX_ATTEMPTS_REACHED:
          this.notification.error(this.messages.phoneVerifyErrorMaxAttemptsReached());
          break;
        case CodeVerificationStatusEnum.SUCCESS:
          this.dialogRef.close(true);
          this.notification.snackBar(this.messages.phoneVerified());
          break;
      }
    });
  }
}
