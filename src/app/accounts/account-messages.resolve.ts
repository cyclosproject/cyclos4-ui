import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { DataForLogin } from "app/api/models";
import { AuthService } from "app/api/services";
import { TranslationLoaderService } from "app/core/translation-loader.service";
import { AccountMessages } from "app/messages/account-messages";

/**
 * Loads the account messages before showing the accounts module
 */
@Injectable()
export class AccountMessagesResolve implements Resolve<any> {
  constructor(
    private translationLoaderService: TranslationLoaderService,
    private accountMessages: AccountMessages
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    return this.translationLoaderService.load('account')
      .then(translations => {
        this.accountMessages.initialize(translations);
        return translations;
      });
  }
}