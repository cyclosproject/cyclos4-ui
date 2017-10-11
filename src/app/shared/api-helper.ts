import { Entity, AccountWithOwner, TransferType, AccountKind, TransactionView, User } from "app/api/models";
import { environment } from "environments/environment"
import { GeneralMessages } from "app/messages/general-messages";

/**
 * Helper methods for working with API model
 */
export class ApiHelper {

  /** Represents the own user */
  static SELF = 'self';

  /** Represents the system account owner */
  static SYSTEM = 'system';
  
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
}