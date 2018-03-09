import {
  Entity, AccountWithOwner, TransferType, AccountKind, TransactionView, User,
  CustomFieldDetailed, PasswordInput, PasswordModeEnum, Transfer, Transaction, AccountHistoryResult, UserResult
} from 'app/api/models';
import { environment } from 'environments/environment';
import { GeneralMessages } from 'app/messages/general-messages';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AsyncValidatorFn } from '@angular/forms/src/directives/validators';
import { AddressFieldEnum } from 'app/api/models/address-field-enum';
import { UsersMessages } from 'app/messages/users-messages';

/**
 * Helper methods for working with API model
 */
export class ApiHelper {

  /** Value separator for custom fields */
  static VALUE_SEPARATOR = '|';

  /** Represents the own user */
  static SELF = 'self';

  /** Represents the system account owner */
  static SYSTEM = 'system';

  /** The default page size */
  static DEFAULT_PAGE_SIZE = 40;

  /** The available options of page sizes in the paginator */
  static PAGE_SIZES = [40, 100, 200];

  /** Time (in ms) to wait between keystrokes to make a request */
  static DEBOUNCE_TIME = 400;

  /** Value used to mark a date as invalid */
  static INVALID_DATE = ' ';

  /**
   * Returns the entity internal name, if any, otherwise the id.
   * If the input entity is null, returns null.
   * @param entity The entity
   */
  static internalNameOrId(entity: Entity): string {
    if (entity) {
      return entity['internalName'] || entity.id;
    }
    return null;
  }

  /**
   * Returns the fields that should be excluded when fetching the Auth model.
   * Contains both deprecated and unused fields.
   */
  static get excludedAuthFields(): string[] {
    return [
      '-permissions.records',
      '-permissions.systemRecords',
      '-permissions.userRecords',
      '-permissions.operations',
      '-permissions.accounts',
    ];
  }

  /**
   * Given an object representing a transfer / transaction, if it has a transaction number,
   * returns it, taking care of escaping the value if it is fully numeric.
   * Otherwise, returns the id.
   * @param trans Either the transfer or transaction
   */
  static transactionNumberOrId(trans: Transfer | Transaction | AccountHistoryResult): string {
    const number = trans.transactionNumber;
    if (number != null && number !== '') {
      if (/^\d+$/.test(number)) {
        // The transaction number is fully numeric. Escape it to avoid clashing with id
        return `'${number}`;
      } else {
        return number;
      }
    }
    return trans.id;
  }

  /**
   * Returns the available options for page sizes on searches
   */
  static get searchPageSizes(): number[] {
    return environment.searchPageSizes || [40, 100, 200];
  }

  /**
   * Returns the available options for page sizes on searches
   */
  static get defaultSearchPageSize(): number {
    return ApiHelper.searchPageSizes[0];
  }

  /**
   * Returns the number of results to be returned in a quick search
   */
  static get quickSearchPageSize(): number {
    return environment.quickSearchPageSize || 10;
  }

  /**
   * Returns whether the given password input is enabled for confirmation.
   * That means: if the password is an OTP, needs valid mediums to send.
   * Otherwise, there must have an active password.
   * If passwordInput is null it is assumed that no confirmation password is needed, hence, can confirm.
   */
  static canConfirm(passwordInput: PasswordInput): boolean {
    if (passwordInput == null || passwordInput.hasActivePassword) {
      return true;
    }
    if (passwordInput.mode === PasswordModeEnum.OTP) {
      return (passwordInput.otpSendMediums || []).length > 0;
    }
    return false;
  }

  /**
   * Returns a FormGroup which contains a form control for each of the given custom fields
   * @param formBuilder The form builder
   * @param customFields The custom fields
   * @param asyncValProvider If provided will be called for each custom field to provide an additional,
   *                         asynchronous validation
   * @returns The FormGroup
   */
  static customValuesFormGroup(formBuilder: FormBuilder, customFields: CustomFieldDetailed[],
    asyncValProvider?: (CustomFieldDetailed) => AsyncValidatorFn): FormGroup {
    const customValues = {};
    for (const cf of customFields) {
      const val: ValidatorFn[] = [];
      if (cf.required) {
        val.push(Validators.required);
      }
      const defVal: any = cf.defaultValue;
      customValues[cf.internalName] = [defVal, val, asyncValProvider ? asyncValProvider(cf) : null];
    }
    return formBuilder.group(customValues);
  }

  /**
   * Returns a form that has a captcha challenge and response
   * @param formBuilder The form builder
   */
  static captchaFormGroup(formBuilder: FormBuilder) {
    return formBuilder.group({
      challenge: ['', Validators.required],
      response: ['', Validators.required]
    });
  }

  /**
   * Returns the label of an address field
   * @param field The address field
   * @param usersMessages The message source
   */
  static addressFieldLabel(field: AddressFieldEnum, usersMessages: UsersMessages): string {
    switch (field) {
      case AddressFieldEnum.ADDRESS_LINE_1:
        return usersMessages.userAddressAddressLine1();
      case AddressFieldEnum.ADDRESS_LINE_2:
        return usersMessages.userAddressAddressLine2();
      case AddressFieldEnum.BUILDING_NUMBER:
        return usersMessages.userAddressBuildingNumber();
      case AddressFieldEnum.CITY:
        return usersMessages.userAddressCity();
      case AddressFieldEnum.COMPLEMENT:
        return usersMessages.userAddressComplement();
      case AddressFieldEnum.COUNTRY:
        return usersMessages.userAddressCountry();
      case AddressFieldEnum.NEIGHBORHOOD:
        return usersMessages.userAddressNeighborhood();
      case AddressFieldEnum.PO_BOX:
        return usersMessages.userAddressPoBox();
      case AddressFieldEnum.REGION:
        return usersMessages.userAddressRegion();
      case AddressFieldEnum.STREET:
        return usersMessages.userAddressStreet();
      case AddressFieldEnum.ZIP:
        return usersMessages.userAddressZip();
    }
    return null;
  }
}
