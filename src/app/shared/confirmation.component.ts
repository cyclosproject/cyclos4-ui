import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { PasswordInput, AvailabilityEnum, CustomFieldDetailed } from 'app/api/models';
import { blank, empty } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ConfirmCallbackParams } from 'app/core/notification.service';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';

/**
 * Component shown in a dialog, to present a confirmation message, optionally with a confirmation password
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'confirmation',
  templateUrl: 'confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationComponent implements OnInit {
  @Input() title: string;
  @Input() message: string;
  @Input() cancelLabel: string;
  @Input() confirmLabel: string;
  @Input() customFields: CustomFieldDetailed[];
  @Input() labelPosition: FieldLabelPosition;
  @Input() callback: (params: ConfirmCallbackParams) => void;
  @Input() passwordInput: PasswordInput;

  form: FormGroup;
  hasFields = false;
  hasForm = false;

  constructor(
    private i18n: I18n,
    public modalRef: BsModalRef,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({});
    if (this.passwordInput) {
      this.form.setControl('confirmationPassword', this.formBuilder.control(null, Validators.required));
      this.hasForm = true;
    }
    this.hasFields = !empty(this.customFields);
    if (this.hasFields) {
      this.form.setControl('customValues', ApiHelper.customValuesFormGroup(this.formBuilder, this.customFields));
      this.hasForm = true;
    }
    if (blank(this.cancelLabel)) {
      this.cancelLabel = this.i18n('Cancel');
    }
    if (blank(this.confirmLabel)) {
      this.confirmLabel = this.i18n('Confirm');
    }
  }

  confirm() {
    let value: ConfirmCallbackParams;
    if (this.hasForm) {
      if (!this.form.valid) {
        return;
      }
      value = this.form.value;
    } else {
      // There's no input
      value = {};
    }
    this.callback(value);
    this.modalRef.hide();
  }
}
