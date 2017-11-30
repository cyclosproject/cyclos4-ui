import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { TranslationLoaderService } from 'app/core/translation-loader.service';
import { BankingMessages } from 'app/messages/banking-messages';

/**
 * Loads the banking messages before showing the banking module
 */
@Injectable()
export class BankingMessagesResolve implements Resolve<any> {
  constructor(
    private translationLoaderService: TranslationLoaderService,
    private bankingMessages: BankingMessages
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    return this.translationLoaderService.load('banking')
      .then(translations => {
        this.bankingMessages.initialize(translations);
        return translations;
      });
  }
}
