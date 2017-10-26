import { Entity, AccountWithOwner, TransferType, AccountKind, TransactionView, User, CustomFieldDetailed, PasswordInput, PasswordModeEnum } from "app/api/models";
import { environment } from "environments/environment"
import { GeneralMessages } from "app/messages/general-messages";
import { FormBuilder, FormGroup, ValidatorFn, Validators } from "@angular/forms";

/**
 * Helper methods for working with API model
 */
export class ApiHelper {

  /** Represents the own user */
  static SELF = 'self';

  /** Represents the system account owner */
  static SYSTEM = 'system';

  /** The default page size */
  static DEFAULT_PAGE_SIZE = 40;

  /** The available options of page sizes in the paginator */
  static PAGE_SIZES = [40, 100, 200];
  
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
      "-permissions.records",
      "-permissions.systemRecords",
      "-permissions.userRecords",
      "-permissions.operations",
      "-permissions.accounts",
    ]
  }
  
  /**
   * Returns the entity internal name, if any, otherwise the id.
   * If the input entity is null, returns null.
   */
  static accountName(generalMessages: GeneralMessages, from: boolean, accountOrTransaction: AccountWithOwner | TransactionView, transferType: TransferType = null): string {
    if (accountOrTransaction == null) {
      return null;
    }
    // Get the payment transfer type if none is given
    if (transferType == null && (accountOrTransaction as TransactionView).type) {
      transferType = (accountOrTransaction as TransactionView).type;
    }

    // Resolve the account kind
    let kind: AccountKind;
    if ((accountOrTransaction as AccountWithOwner).kind) {
      kind = (accountOrTransaction as AccountWithOwner).kind;
    } else {
      let transaction = accountOrTransaction as TransactionView;
      kind = from ? transaction.fromKind : transaction.toKind;
    }

    if (kind == AccountKind.SYSTEM) {
      // The kind is system: show the system account name from the transfer type
      let accountType = (from ? transferType.from : transferType.to) || {};
      // Cyclos < 4.9 doesn't send from / to in transfer type. Show 'System' in this case.
      return name || generalMessages.system();
    }

    // The account belongs to a user
    let user: User;
    if ((accountOrTransaction as AccountWithOwner).user) {
      user = (accountOrTransaction as AccountWithOwner).user;
    } else {
      let transaction = accountOrTransaction as TransactionView;
      user = from ? transaction.fromUser : transaction.toUser;
    }
    return (user || {}).display || generalMessages.user();
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
    if (passwordInput.mode == PasswordModeEnum.OTP) {
      return (passwordInput.otpSendMediums || []).length > 0;
    }
    return false;
  }

  /**
   * Returns a FormGroup which contains a form control for each of the given custom fields
   * @param formBuilder The form builder
   * @param customFields The custom fields
   * @returns The FormGroup
   */
  static customValuesFormGroup(formBuilder: FormBuilder, customFields: CustomFieldDetailed[]): FormGroup {
    let customValues = {};
    for (let cf of customFields) {
      let val: ValidatorFn[] = [];
      if (cf.required) {
        val.push(Validators.required);
      }
      customValues[cf.internalName] = [null, val];
    }
    return formBuilder.group(customValues);
  }
}