import { Injector } from "@angular/core";
import { BaseComponent } from "app/shared/base.component";
import { AccountMessages } from "app/messages/account-messages";

/**
 * Base class for components in the accounts module
 */
export abstract class BaseAccountsComponent extends BaseComponent {

  public accountMessages: AccountMessages;

  constructor(injector: Injector) {
    super(injector);
    this.accountMessages = injector.get(AccountMessages);
  }

}