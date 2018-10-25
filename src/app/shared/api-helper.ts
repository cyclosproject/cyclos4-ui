import {
  Entity, CustomFieldDetailed, PasswordInput, PasswordModeEnum, Transfer,
  Transaction, AccountHistoryResult, Address, AddressConfiguration, Account,
  TransactionView, ScheduledPaymentStatusEnum,
  RecurringPaymentStatusEnum, PaymentRequestStatusEnum, TicketStatusEnum,
  ExternalPaymentStatusEnum,
  CustomFieldTypeEnum,
  LinkedEntityTypeEnum,
  BaseTransferDataForSearch,
  TransactionDataForSearch,
  PreselectedPeriod,
  TransactionResult,
  TransactionAuthorizationStatusEnum,
  CustomFieldSizeEnum
} from 'app/api/models';
import { environment } from 'environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AsyncValidatorFn } from '@angular/forms/src/directives/validators';
import { AddressFieldEnum } from 'app/api/models/address-field-enum';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { NextRequestState } from 'app/core/next-request-state';
import { FieldOption } from 'app/shared/field-option';
import { FormatService } from 'app/core/format.service';
import { empty } from 'app/shared/helper';

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

  /** The number of results to fetch on autocomplete queries */
  static AUTOCOMPLETE_SIZE = 10;

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
  static excludedAuthFields(prefix: string): string[] {
    const actualPrefix = prefix == null ? '' : prefix + '.';
    return [
      `-${actualPrefix}permissions.records`,
      `-${actualPrefix}permissions.systemRecords`,
      `-${actualPrefix}permissions.userRecords`,
      `-${actualPrefix}permissions.operations`,
      `-${actualPrefix}permissions.accounts`,
    ];
  }

  /**
   * Returns a display label for the given account
   * @param account The account
   */
  static accountDisplay(account: Account) {
    if (account.number) {
      return `${account.type.name} - ${account.number}`;
    } else {
      return account.type.name;
    }
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
   * @param options A bag of options with the following:
   *
   * - `currentValues`: If provided will contain the field values by internal name. If not, use the default value
   * - `disabledProvider`: If provided will be called for each custom field to determine whether the field should be disabled
   * - `asyncValProvider`: If provided will be called for each custom field to provide an additional, asynchronous validation
   * @returns The FormGroup
   */
  static customValuesFormGroup(formBuilder: FormBuilder, customFields: CustomFieldDetailed[],
    options?: {
      currentValues?: any,
      disabledProvider?: (CustomFieldDetailed) => boolean,
      asyncValProvider?: (CustomFieldDetailed) => AsyncValidatorFn
    }): FormGroup {
    options = options || {};
    const currentValues = options.currentValues || {};
    const disabledProvider = options.disabledProvider || (() => false);
    const asyncValProvider = options.asyncValProvider;
    const customValues = {};
    for (const cf of customFields) {
      customValues[cf.internalName] = [
        {
          value: currentValues.hasOwnProperty(cf.internalName) ? currentValues[cf.internalName] : cf.defaultValue,
          disabled: disabledProvider(cf)
        },
        cf.required ? Validators.required : null,
        asyncValProvider ? asyncValProvider(cf) : null
      ];
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
   * Builds a `FormGroup` containing controls for all enabled fields, plus id, version and name
   */
  static addressFormGroup(config: AddressConfiguration, formBuilder: FormBuilder): FormGroup {
    const form = formBuilder.group({
      id: null,
      version: null,
      hidden: null,
      name: [null, Validators.required],
      location: formBuilder.group({
        latitude: null,
        longitude: null
      })
    });
    for (const field of config.enabledFields) {
      const val = config.requiredFields.includes(field) ? Validators.required : null;
      form.setControl(field, formBuilder.control(null, val));
    }
    return form;
  }

  /**
   * Returns the label of an address field
   * @param field The address field
   * @param i18n The internationalization service
   */
  static addressFieldLabel(field: AddressFieldEnum, i18n: I18n): string {
    switch (field) {
      case AddressFieldEnum.ADDRESS_LINE_1:
        return i18n('Address line 1');
      case AddressFieldEnum.ADDRESS_LINE_2:
        return i18n('Address line 2');
      case AddressFieldEnum.BUILDING_NUMBER:
        return i18n('Building number');
      case AddressFieldEnum.CITY:
        return i18n('City');
      case AddressFieldEnum.COMPLEMENT:
        return i18n('Complement');
      case AddressFieldEnum.COUNTRY:
        return i18n('Country');
      case AddressFieldEnum.NEIGHBORHOOD:
        return i18n('Neighborhood');
      case AddressFieldEnum.PO_BOX:
        return i18n('Post-office box');
      case AddressFieldEnum.REGION:
        return i18n('Region / state');
      case AddressFieldEnum.STREET:
        return i18n('Street');
      case AddressFieldEnum.ZIP:
        return i18n('Zip code');
    }
    return null;
  }

  /**
   * Returns street, buildingNumber, complement if the given address has an address, otherwise, null
   * @param address Tha address
   */
  static addressStreet(address: Address): string {
    if (address == null || address.street == null) {
      return null;
    }
    let result = address.street;
    if (address.buildingNumber) {
      result += ', ' + address.buildingNumber;
    }
    if (address.complement) {
      result += ', ' + address.complement;
    }
    return result;
  }

  /**
   * Appends the session token to the given URL
   * @param url The base URL
   * @param nextRequestState The next request state
   */
  static appendAuth(url: string, nextRequestState: NextRequestState): string {
    const sessionToken = nextRequestState.sessionToken;
    if (sessionToken == null || sessionToken === '') {
      return url;
    }
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'Session-Token=' + sessionToken;
  }

  /**
   * Returns the `FieldOption` which represent the available options of the given custom field
   * @param field The custom field
   * @param format The shared format service
   */
  static fieldOptions(field: CustomFieldDetailed, format: FormatService): FieldOption[] {
    if (!field.hasValuesList) {
      return null;
    }
    switch (field.type) {
      case CustomFieldTypeEnum.STRING:
      case CustomFieldTypeEnum.TEXT:
      case CustomFieldTypeEnum.RICH_TEXT:
      case CustomFieldTypeEnum.URL:
        return (field.stringValues || []).map(v => ({ value: v, text: v }));
      case CustomFieldTypeEnum.DATE:
        return (field.dateValues || []).map(v => ({ value: v, text: format.formatAsDate(v) }));
      case CustomFieldTypeEnum.DECIMAL:
        return (field.decimalValues || []).map(v => ({ value: v, text: format.formatAsNumber(v, field.decimalDigits) }));
      case CustomFieldTypeEnum.INTEGER:
        return (field.integerValues || []).map(v => ({ value: String(v), text: format.formatAsNumber(v, 0) }));
      case CustomFieldTypeEnum.DYNAMIC_SELECTION:
        return (field.dynamicValues || []).map(v => ({ value: v.value, text: v.label }));
      case CustomFieldTypeEnum.SINGLE_SELECTION:
      case CustomFieldTypeEnum.MULTI_SELECTION:
        return (field.possibleValues || []).map(v => ({
          value: ApiHelper.internalNameOrId(v), id: v.id, internalName: v.internalName,
          text: v.value, category: v.category == null ? null : v.category.name
        }));
      case CustomFieldTypeEnum.LINKED_ENTITY:
        switch (field.linkedEntityType) {
          case LinkedEntityTypeEnum.ADVERTISEMENT:
            return (field.adValues || []).map(v => ({ value: v.id, text: v.name }));
          case LinkedEntityTypeEnum.RECORD:
            return (field.recordValues || []).map(v => ({ value: v.id, text: v.display }));
          case LinkedEntityTypeEnum.TRANSACTION:
            return (field.transactionValues || []).map(v => ({ value: v.id, internalName: v.transactionNumber, text: v.display }));
          case LinkedEntityTypeEnum.TRANSFER:
            return (field.transferValues || []).map(v => ({ value: v.id, internalName: v.transactionNumber, text: v.display }));
          case LinkedEntityTypeEnum.USER:
            return (field.userValues || []).map(v => ({ value: v.id, text: v.display }));
        }
    }
    return [];
  }

  /**
   * Returns a suitable representation for using custom field values in searches
   * @param customValues The custom values map
   */
  static toCustomValuesFilter(customValues: { [key: string]: string }): string[] {
    const result: string[] = [];
    for (const key in customValues || {}) {
      if (customValues.hasOwnProperty(key)) {
        const value = customValues[key];
        if (!empty(value)) {
          result.push(key + ':' + customValues[key]);
        }
      }
    }
    return result;
  }

  /**
   * This method does 2 things:
   * - Makes sure that the data has at least one preselected period
   * - Patches the form value with the default preselected period (doesn't emit the event)
   * @param data The data
   * @param form The filters form
   */
  static preProcessPreselectedPeriods(data: BaseTransferDataForSearch | TransactionDataForSearch, form: FormGroup): void {
    // Select the default preselected period
    if ((data.preselectedPeriods || []).length === 0) {
      // No preselected periods? Create one, so we don't break the logic
      data.preselectedPeriods = [
        { defaultOption: true }
      ];
    }
    const preselectedPeriod = data.preselectedPeriods.find(p => p.defaultOption);
    form.patchValue({ preselectedPeriod: preselectedPeriod }, { emitEvent: false });
  }

  /**
   * Returns the date period value for transfers / transactions query.
   * Assumes the filters value has a `preselectedPeriod`, as well as separated `periodBegin` and `periodEnd` fields.
   * @param filters The form filters value
   */
  static resolveDatePeriod(filters: any): string[] {
    const preselectedPeriod = filters.preselectedPeriod as PreselectedPeriod;
    let beginDate: string = null;
    let endDate: string = null;
    if (preselectedPeriod && preselectedPeriod.begin && preselectedPeriod.end) {
      beginDate = preselectedPeriod.begin;
      endDate = preselectedPeriod.end;
    } else {
      beginDate = filters.periodBegin;
      endDate = filters.periodEnd;
    }
    return ApiHelper.rangeFilter(beginDate, endDate);
  }

  /**
   * Returns the given min / max value as a range, suitable for query filters on the API
   */
  static rangeFilter(min: string, max: string): string[] {
    const hasMin = !empty(min);
    const hasMax = !empty(max);
    if (hasMin && hasMax) {
      return [min, max];
    } else if (hasMin) {
      return [min, ''];
    } else if (hasMax) {
      return ['', max];
    } else {
      return [];
    }
  }

  /**
   * Returns the actual displayed field size.
   * Some types, such as date and decimal are always shown as small, except if they have a values list.
   */
  static fieldSize(field: CustomFieldDetailed): CustomFieldSizeEnum {
    if (field.hasValuesList) {
      return CustomFieldSizeEnum.FULL;
    }
    if (field.type === CustomFieldTypeEnum.DATE) {
      return CustomFieldSizeEnum.MEDIUM;
    } else if ([CustomFieldTypeEnum.INTEGER, CustomFieldTypeEnum.DECIMAL].includes(field.type)) {
      return CustomFieldSizeEnum.SMALL;
    } else {
      return field.size;
    }
  }

}
