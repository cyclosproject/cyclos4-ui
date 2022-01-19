import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import {
  CreateDeviceConfirmation, DeviceConfirmationTypeEnum, RecurringPaymentActionEnum,
  RecurringPaymentDataForEdit, RecurringPaymentEdit, Transaction
} from 'app/api/models';
import { RecurringPaymentsService } from 'app/api/services/recurring-payments.service';

/** Validates that occurrences count is required and > 2 when payment is recurring and not until manually cancel */
const OCCURRENCES_COUNT_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const repeatUntilCanceled = parent.get('repeatUntilCanceled').value;
    if (!repeatUntilCanceled) {
      const value = parseInt(control.value, 10);
      if (isNaN(value)) {
        // The occurrences count is required
        return {
          required: true,
        };
      } else {
        // Needs at least 2 occurrences
        return Validators.min(2)(control);
      }
    }
  }
  return null;
};

/** Validates that the first occurrence date is required when rec to a future date */
const FIRST_OCCURRENCE_DATE_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const firstOccurrenceIsNow = parent.get('firstOccurrenceIsNow').value;
    if (empty(control.value) && !firstOccurrenceIsNow) {
      return {
        required: true,
      };
    }
  }
  return null;
};

/**
 * Edit a recurring payment
 */
@Component({
  selector: 'edit-recurring-payment',
  templateUrl: 'edit-recurring-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRecurringPaymentComponent
  extends BasePageComponent<RecurringPaymentDataForEdit>
  implements OnInit {

  id: string;
  form: FormGroup;

  constructor(
    injector: Injector,
    private recurringPaymentService: RecurringPaymentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.recurringPaymentService.getRecurringPaymentDataForEdit({ key: this.id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: RecurringPaymentDataForEdit) {
    this.form = this.formBuilder.group({
      occurrencesCount: [data.recurringPayment.occurrencesCount, OCCURRENCES_COUNT_VAL],
      firstOccurrenceIsNow: data.recurringPayment.firstOccurrenceDate === null,
      firstOccurrenceDate: [data.recurringPayment.firstOccurrenceDate, FIRST_OCCURRENCE_DATE_VAL],
      repeatUntilCanceled: data.recurringPayment.occurrencesCount === null,
      occurrenceInterval: [data.recurringPayment.occurrenceInterval, Validators.required],
      version: data.recurringPayment.version
    });
  }

  /**
   * Edit the current recurring payment
   */
  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value: RecurringPaymentEdit = this.form.value;
    if (this.form.controls.firstOccurrenceIsNow.value) {
      value.firstOccurrenceDate = null;
    }
    if (this.form.controls.repeatUntilCanceled.value) {
      value.occurrencesCount = null;
    }
    this.confirmation.confirm({
      title: this.i18n.general.confirm,
      createDeviceConfirmation: this.recurringDeviceConfirmation(RecurringPaymentActionEnum.MODIFY),
      passwordInput: this.data.confirmationPasswordInput,
      callback: res => {
        this.addSub(this.recurringPaymentService.modifyRecurringPayment({
          key: this.id,
          confirmationPassword: res.confirmationPassword,
          body: value
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.transaction.editRecurringDone);
          history.back();
        })
        );
      }
    });
  }

  private recurringDeviceConfirmation(action: RecurringPaymentActionEnum): () => CreateDeviceConfirmation {
    return () => ({
      type: DeviceConfirmationTypeEnum.MANAGE_RECURRING_PAYMENT,
      transaction: this.id,
      recurringPaymentAction: action,
    });
  }

  get transaction(): Transaction {
    return this.data.originalRecurringPayment;
  }

  resolveMenu(data: RecurringPaymentDataForEdit) {
    return this.menu.accountMenu(data.originalRecurringPayment.from, data.originalRecurringPayment.to);
  }

}
