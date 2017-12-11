import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { TranslationLoaderService } from 'app/core/translation-loader.service';
import { UsersMessages } from 'app/messages/users-messages';

/**
 * Loads the users messages before showing the users module
 */
@Injectable()
export class UsersMessagesResolve implements Resolve<any> {
  constructor(
    private translationLoaderService: TranslationLoaderService,
    private usersMessages: UsersMessages
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    return this.translationLoaderService.load('users')
      .then(translations => {
        this.usersMessages.initialize(translations);
        return translations;
      });
  }
}
