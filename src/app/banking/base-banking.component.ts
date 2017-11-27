import { Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { BankingMessages } from 'app/messages/banking-messages';

/**
 * Base class for components in the banking module
 */
export abstract class BaseBankingComponent extends BaseComponent {

  public bankingMessages: BankingMessages;

  constructor(injector: Injector) {
    super(injector);
    this.bankingMessages = injector.get(BankingMessages);
  }

}
