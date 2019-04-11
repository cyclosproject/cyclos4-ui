import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomFieldDetailed, PasswordInput, CreateDeviceConfirmation } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ConfirmCallbackParams } from 'app/core/notification.service';
import { I18n } from 'app/i18n/i18n';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { blank, empty, validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable } from 'rxjs';

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

  ConfirmationMode = ConfirmationMode;

  @Input() title: string;
  @Input() message: string;
  @Input() cancelLabel: string;
  @Input() confirmLabel: string;
  @Input() customFields: CustomFieldDetailed[];
  @Input() labelPosition: FieldLabelPosition;
  @Input() createDeviceConfirmation: () => CreateDeviceConfirmation;
  @Input() callback: (params: ConfirmCallbackParams) => void;
  @Input() passwordInput: PasswordInput;

  form: FormGroup;
  hasFields = false;
  hasForm = false;
  requesting$: Observable<boolean>;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);
  canConfirm: boolean;

  constructor(
    public i18n: I18n,
    public modalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private fieldHelper: FieldHelperService,
    private authHelper: AuthHelperService,
    nextRequestState: NextRequestState
  ) {
    this.requesting$ = nextRequestState.requesting$;
  }

  ngOnInit() {
    this.form = this.formBuilder.group({});
    if (this.passwordInput) {
      this.form.setControl('confirmationPassword', this.formBuilder.control(null, Validators.required));
      this.hasForm = true;
    }
    this.canConfirm = this.authHelper.canConfirm(this.passwordInput);
    this.hasFields = !empty(this.customFields);
    if (this.hasFields) {
      this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(this.customFields));
      this.hasForm = true;
    }
    if (blank(this.cancelLabel)) {
      this.cancelLabel = this.i18n.general.cancel;
    }
    if (blank(this.confirmLabel)) {
      this.confirmLabel = this.i18n.general.confirm;
    }
  }

  confirm(confirmationPassword?: string) {
    let value: ConfirmCallbackParams;
    if (this.hasForm) {
      if (confirmationPassword) {
        this.form.patchValue({ confirmationPassword: confirmationPassword });
      }
      if (!validateBeforeSubmit(this.form)) {
        return;
      }
      value = this.form.value;
    } else {
      // There's no input
      value = {};
    }
    if (confirmationPassword) {
      // When we got a confirmation password, set it
      value.confirmationPassword = confirmationPassword;
    }
    this.callback(value);
    this.modalRef.hide();
  }
}
