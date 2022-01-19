import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Currency, QueryFilters, TransactionResult } from 'app/api/models';
import { AccountsService } from 'app/api/services/accounts.service';
import { PaymentFeedbacksService } from 'app/api/services/payment-feedbacks.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

type SearchPaymentAwaitingFeedbackParams = QueryFilters & {
  user: string
};

/**
 * Searches a list of payment which are pending to give feedback
 */
@Component({
  selector: 'search-payment-awaiting-feedback',
  templateUrl: 'search-payment-awaiting-feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPaymentAwaitingFeedbackComponent
  extends BaseSearchPageComponent<any, SearchPaymentAwaitingFeedbackParams, TransactionResult>
  implements OnInit {

  private currencies: Currency[];

  constructor(
    injector: Injector,
    private feedbacksService: PaymentFeedbacksService,
    private accountsApi: AccountsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    // Get the user accounts so we can display a correct formatted amount with currency
    this.addSub(this.accountsApi.listAccountsByOwner({ owner: this.ApiHelper.SELF }).subscribe(data => {
      this.currencies = [...new Set(data.map(a => a.currency))];
      this.data = {};
    }));
  }

  protected getFormControlNames(): string[] {
    return [];
  }

  protected toSearchParams(value: any): SearchPaymentAwaitingFeedbackParams {
    value.user = this.ApiHelper.SELF
    return value;
  }

  /**
  * Resolves the route to set payment feedback page
  */
  get toLink() {
    return (row: TransactionResult) => this.path(row);
  }

  path(row: TransactionResult): string[] {
    return ['/users', 'feedbacks', 'set', row.id];
  }

  /**
   * Finds a currency with the given id in the current user accounts
   */
  findCurrency(id: string): Currency {
    return this.currencies.find(c => c.id === id || c.internalName === id);
  }

  doSearch(filters: SearchPaymentAwaitingFeedbackParams): Observable<HttpResponse<TransactionResult[]>> {
    return this.feedbacksService.searchPaymentAwaitingFeedback$Response(filters);
  }

  resolveMenu() {
    return Menu.FEEDBACKS;
  }

}
