import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomFieldDetailed, PasswordInput } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ConfirmCallbackParams } from 'app/core/notification.service';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';
import { blank, empty, validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { Messages } from 'app/messages/messages';

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
  requesting$: Observable<boolean>;
  canConfirm: boolean;

  constructor(
    public messages: Messages,
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
      this.cancelLabel = this.messages.general.cancel;
    }
    if (blank(this.confirmLabel)) {
      this.confirmLabel = this.messages.general.confirm;
    }
  }

  confirm() {
    let value: ConfirmCallbackParams;
    if (this.hasForm) {
      if (!validateBeforeSubmit(this.form)) {
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
