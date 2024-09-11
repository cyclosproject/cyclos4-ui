import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AccountWithStatus, EntityReference, QueryFilters } from 'app/api/models';
import { OwnerAccountsListData } from 'app/api/models/owner-accounts-list-data';
import { AccountsService } from 'app/api/services/accounts.service';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty, unaccent } from 'app/shared/helper';
import { PagedResults } from 'app/shared/paged-results';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable, of } from 'rxjs';

export const MIN_ACCOUNTS_FILTERS = 11;

export interface AccountQuery extends QueryFilters {
  currency: string;
  keywords: string;
  nonZeroBalance: boolean;
}

/**
 * List accounts
 */
@Component({
  selector: 'list-accounts',
  templateUrl: 'list-accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListAccountsComponent
  extends BaseSearchPageComponent<OwnerAccountsListData, AccountQuery, AccountWithStatus>
  implements OnInit
{
  self: boolean;
  showFilters: boolean;
  owner: string;
  currencyOptions: FieldOption[];
  anyHasBalance: boolean;

  constructor(injector: Injector, private accountsService: AccountsService) {
    super(injector);
  }

  protected getFormControlNames(): string[] {
    return ['keywords', 'currency', 'nonZeroBalance'];
  }

  protected doSearch(filter: AccountQuery): Observable<HttpResponse<AccountWithStatus[]>> {
    var accounts = this.data.accounts.filter(a => {
      const keywords = unaccent(filter.keywords)?.trim()?.toLowerCase();
      if (!empty(keywords)) {
        const words = [a.currency.name, a.currency.symbol, a.type.name];
        if (!words.find(w => unaccent(w)?.toLowerCase().includes(keywords))) {
          return false;
        }
      }
      if (filter.currency && a.currency.id !== filter.currency) {
        return false;
      }
      if (filter.nonZeroBalance && (!a.status?.balance || this.format.isZero(a.status.balance))) {
        return false;
      }
      return true;
    });
    return of(new PagedResults(accounts).toHttpResponse());
  }

  protected toSearchParams(value: any): AccountQuery {
    return value as AccountQuery;
  }

  ngOnInit() {
    super.ngOnInit();
    this.owner = this.route.snapshot.params.owner;
    this.addSub(
      this.accountsService.getOwnerAccountsListData({ owner: this.owner }).subscribe(data => (this.data = data))
    );
  }

  onDataInitialized(data: OwnerAccountsListData) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelfOrOwner(data.user);
    this.showFilters = data.accounts?.length >= MIN_ACCOUNTS_FILTERS;
    const currencies = [];
    const currencyIds = new Set<string>();
    data.accounts?.forEach(a => {
      if (!currencyIds.has(a.currency.id)) {
        currencies.push(a.currency);
      }
    });
    currencies.sort((c1, c2) => c1.name.localeCompare(c2.name));
    this.currencyOptions = currencies.map(c => ({
      value: c.id,
      id: c.id,
      internalName: c.internalName,
      text: c.name
    }));

    this.anyHasBalance = !!data.accounts?.find(a => a.status?.balance != null);
  }

  path(accountType: EntityReference) {
    return ['/banking', this.owner, 'account', accountType.id];
  }

  get toLink() {
    return (row: AccountWithStatus) => this.path(row.type);
  }

  resolveMenu() {
    return ApiHelper.SYSTEM === this.owner || ApiHelper.SELF === this.owner
      ? Menu.ACCOUNTS_SUMMARY
      : this.menu.searchUsersMenu();
  }
}
