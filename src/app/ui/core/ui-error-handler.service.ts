import { Injectable } from '@angular/core';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { InputError, InputErrorCode, NestedError } from 'app/api/models';
import { NotificationService } from 'app/core/notification.service';
import { empty, focusFirstInvalid } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { LoginService } from 'app/ui/core/login.service';
import { Router } from '@angular/router';
import { FormControlLocator } from 'app/shared/form-control-locator';

@Injectable({
  providedIn: 'root'
})
export class UiErrorHandlerService {

  constructor(
    private errorHandler: ErrorHandlerService,
    private layout: UiLayoutService,
    private notification: NotificationService,
    private login: LoginService,
    private router: Router) {
  }

  initialize(): void {
    this.errorHandler.validationErrorHandler = e => this.handleValidationError(e);
    this.errorHandler.nestedErrorHandler = e => this.handleNestedError(e);
    this.errorHandler.goToLoginPageHandler = () => this.login.goToLoginPage(this.router.url);
  }

  private handleNestedError(error: NestedError) {
    const message = this.errorHandler.nestedErrorMessage(error);
    const page = this.layout.currentPage;
    const control = page ? page.locateControl({ nestedProperty: error.property, nestedIndex: error.index }) : null;

    if (control) {
      // A formControl is found - set its error
      control.setErrors({
        message,
      });
    } else {
      // No form control -> show as general errors
      this.notification.error(message);
    }

  }

  private handleValidationError(error: InputError) {
    // Will resort on page mapping to FormControls. Unmapped errors will be shown as general.
    const page = this.layout.currentPage;
    const generalErrors: string[] = [];
    this.collectInputErrors(page, generalErrors, error);

    // Show in a notification the general errors
    if (!empty(generalErrors)) {
      const sub = this.notification.error(this.errorHandler.validationErrorMessage(generalErrors)).onClosed.subscribe(() => {
        focusFirstInvalid();
        sub.unsubscribe();
      });
    } else {
      focusFirstInvalid();
    }
  }


  private collectInputErrors(
    page: BasePageComponent<any>, generalErrors: string[],
    error: InputError, nestedProperty?: string, nestedIndex?: number) {
    if (error == null || error.code == null) {
      return;
    }
    if (error.code === InputErrorCode.VALIDATION) {
      // Validation errors
      if (!empty(error.generalErrors)) {
        generalErrors.push.apply(generalErrors, error.generalErrors);
      }

      // Property errors
      for (const key of error.properties || []) {
        const errors = error.propertyErrors[key];
        this.applyInputErrors(generalErrors, errors, page,
          { property: key, nestedProperty, nestedIndex });
      }

      // Custom field errors
      for (const key of error.customFields || []) {
        const errors = error.customFieldErrors[key];
        this.applyInputErrors(generalErrors, errors, page,
          { customField: key, nestedProperty, nestedIndex });
      }
    } else if (error.code === InputErrorCode.AGGREGATED) {
      // Aggregated errors
      for (const key of Object.keys(error.errors || {})) {
        const inputError = error.errors[key];
        this.collectInputErrors(page, generalErrors, inputError, key);
      }
      // Aggregated errors with index
      for (const key of Object.keys(error.indexedErrors || {})) {
        const indexedErrors = error.indexedErrors[key];
        for (let i = 0; i < indexedErrors.length; i++) {
          const inputError = indexedErrors[i];
          this.collectInputErrors(page, generalErrors, inputError, key, i);
        }
      }
    } else {
      // Handle other input errors as general errors
      generalErrors.push(this.errorHandler.inputErrorMessage(error));
    }
  }

  private applyInputErrors(generalErrors: string[], errors: string[], page: BasePageComponent<any>, locator: FormControlLocator) {
    if (!empty(errors)) {
      const control = page ? page.locateControl(locator) : null;
      if (control) {
        // A formControl is found - set its error
        control.setErrors({
          message: errors[0],
        });
      } else {
        // No form control -> show as general errors
        generalErrors.push.apply(generalErrors, errors);
      }
    }

  }

  public getAllErrors(error: InputError): string[] {
    if (error.code === InputErrorCode.VALIDATION) {
      const errors: string[] = [];
      if (!empty(error.generalErrors)) {
        errors.push.apply(errors, error.generalErrors);
      }
      for (const key of error.properties || []) {
        errors.push.apply(errors, error.propertyErrors[key]);
      }
      for (const key of error.customFields || []) {
        errors.push.apply(errors, error.customFieldErrors[key]);
      }
      return errors;
    } else {
      return [this.errorHandler.inputErrorMessage(error)];
    }
  }

}
