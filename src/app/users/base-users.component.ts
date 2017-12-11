import { Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { UsersMessages } from 'app/messages/users-messages';

/**
 * Base class for components in the users module
 */
export abstract class BaseUsersComponent extends BaseComponent {

  public usersMessages: UsersMessages;

  constructor(injector: Injector) {
    super(injector);
    this.usersMessages = injector.get(UsersMessages);
  }

}
