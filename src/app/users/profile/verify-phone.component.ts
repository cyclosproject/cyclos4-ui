import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CodeVerificationStatusEnum, PhoneEditWithId } from 'app/api/models';
import { PhonesService } from 'app/api/services';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';


/**
 * Form used to verify a phone
 */
@Component({
  selector: 'verify-phone',
  templateUrl: 'verify-phone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyPhoneComponent extends BaseComponent implements OnInit {

  @Input() phone: PhoneEditWithId;
  @Output() verified = new EventEmitter<boolean>();

  code: FormControl;
  message$ = new BehaviorSubject('');
  disabled = false;

  @ViewChild('codeField') codeField: InputFieldComponent;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private phonesService: PhonesService) {
    super(injector);

    this.code = this.formBuilder.control(null, Validators.required);
  }

  ngOnInit() {
    super.ngOnInit();
    this.message = this.i18n.phone.verify.message;
  }

  /** Sends the verification code */
  sendCode() {
    this.phonesService.sendPhoneVerificationCode({ id: this.phone.id }).subscribe(number => {
      this.message = this.i18n.phone.verify.done(number);
      this.code.setValue(null);
      this.codeField.focus();
    });
  }

  private set message(message: string) {
    this.message$.next(message);
  }

  /**
   * Performs the phone verification
   */
  verify() {
    if (!validateBeforeSubmit(this.code)) {
      return;
    }
    this.phonesService.verifyPhone({
      id: this.phone.id,
      code: this.code.value
    }).subscribe(status => {
      switch (status) {
        case CodeVerificationStatusEnum.CODE_NOT_SENT:
        case CodeVerificationStatusEnum.EXPIRED:
          this.notification.error(this.i18n.phone.verify.errorExpired);
          break;
        case CodeVerificationStatusEnum.FAILED:
          this.notification.error(this.i18n.phone.verify.errorInvalid);
          break;
        case CodeVerificationStatusEnum.MAX_ATTEMPTS_REACHED:
          this.notification.error(this.i18n.phone.verify.errorMaxAttempts);
          break;
        case CodeVerificationStatusEnum.SUCCESS:
          this.disabled = true;
          this.verified.emit(true);
          break;
      }
    });
  }
}
