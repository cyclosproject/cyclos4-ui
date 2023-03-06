import { ChangeDetectionStrategy, Component, Host, Injector, Input, OnInit, Optional, SkipSelf, ViewChild } from '@angular/core';
import { ControlContainer, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DataForSendingOtp, SendMediumEnum, SendOtp } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';

/**
 * Field to select the OTP destination
 */
@Component({
  selector: 'send-otp-field',
  templateUrl: 'send-otp-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: SendOtpFieldComponent, multi: true },
  ],
})
export class SendOtpFieldComponent
  extends BaseFormFieldComponent<SendOtp>
  implements OnInit {

  @Input() data: DataForSendingOtp;

  @ViewChild('radio') radio: RadioGroupFieldComponent;

  radioControl = new FormControl();

  fieldOptions: FieldOption[];

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  ngOnInit(): void {
    if (!this.data) {
      throw new Error('Missing data');
    }
    super.ngOnInit();
    this.fieldOptions = [];
    var initialValue: string;
    if (this.data.mediums?.includes(SendMediumEnum.EMAIL)) {
      const value = this.toStringValue({ medium: SendMediumEnum.EMAIL });
      initialValue = value;
      this.fieldOptions.push({
        value,
        text: this.i18n.password.otp.sendToEmail(this.data.email)
      });
    }
    if (this.data.mediums?.includes(SendMediumEnum.SMS)) {
      this.data.phones?.forEach(phone => {
        const value = this.toStringValue({ medium: SendMediumEnum.SMS, mobilePhone: phone.id });
        initialValue = initialValue || value;
        this.fieldOptions.push({
          value,
          text: this.i18n.password.otp.sendToPhone(phone.number)
        });
      });
    }
    this.addSub(this.radioControl.valueChanges.subscribe(value => {
      this.formControl.setValue(this.fromStringValue(value));
    }));
    this.radioControl.setValue(initialValue);
  }

  private toStringValue(value: SendOtp): string {
    if (value?.medium) {
      if (value.medium === SendMediumEnum.EMAIL) {
        return SendMediumEnum.EMAIL;
      } else if (value.medium === SendMediumEnum.SMS && value.mobilePhone) {
        return `${SendMediumEnum.SMS}#${value.mobilePhone}`;
      }
    }
    return null;
  }

  private fromStringValue(value: string): SendOtp {
    if (!empty(value)) {
      const parts = value.split('#');
      return {
        medium: parts[0] as SendMediumEnum,
        mobilePhone: parts[1]
      };
    }
  }

  protected getFocusableControl() {
    return this.radio;
  }

  protected getDisabledValue(): string {
    switch (this.value?.medium) {
      case SendMediumEnum.EMAIL:
        return this.data.email;
      case SendMediumEnum.SMS:
        return this.data.phones?.find(p => p.id === this.value.mobilePhone)?.number;
    }
  }
}
