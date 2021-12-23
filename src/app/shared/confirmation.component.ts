import { ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateDeviceConfirmation, CustomFieldDetailed, PasswordInput } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ShortcutService } from 'app/core/shortcut.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { blank, empty, validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

/**
 * The confirm calls its callback using this parameter
 */
export interface ConfirmCallbackParams {
  confirmationPassword?: string;
  customValues?: { [key: string]: string; };
}

/**
 * Component shown in a dialog, to present a confirmation message, optionally with a confirmation password
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'confirmation',
  templateUrl: 'confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationComponent implements OnInit, OnDestroy {

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
  sub: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(I18nInjectionToken) public i18n: I18n,
    public modalRef: BsModalRef,
    private fieldHelper: FieldHelperService,
    private authHelper: AuthHelperService,
    private shortcut: ShortcutService,
    nextRequestState: NextRequestState,
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
    if (!this.hasFields) {
      this.sub = this.shortcut.subscribe('Enter', () => this.confirm());
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  confirm(confirmationPassword?: string) {
    let value: ConfirmCallbackParams;
    if (this.hasForm) {
      if (confirmationPassword) {
        this.form.patchValue({ confirmationPassword });
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
    if (this.passwordInput == null) {
      // If it's not a confirmation with password just hide it,
      // otherwise hiding is handled by the api interceptor
      // which verifies if the password is invalid and then hides
      // popup
      this.modalRef.hide();
    }
  }

  hide() {
    this.modalRef.hide();
  }
}
