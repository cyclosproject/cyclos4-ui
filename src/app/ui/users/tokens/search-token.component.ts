import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  PhysicalTokenTypeEnum,
  TokenDataForSearch,
  TokenQueryFilters,
  TokenResult,
  TokenStatusEnum
} from 'app/api/models';
import { TokensService } from 'app/api/services/tokens.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { CreateTokenComponent } from 'app/ui/users/tokens/create-token.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';

type TokenSearchParams = TokenQueryFilters & {
  type: string;
  fields?: Array<string>;
};

/**
 * General search for tokens
 */
@Component({
  selector: 'search-token',
  templateUrl: 'search-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchTokenComponent
  extends BaseSearchPageComponent<TokenDataForSearch, TokenQueryFilters, TokenResult>
  implements OnInit
{
  type: string;

  constructor(
    injector: Injector,
    private userHelper: UserHelperService,
    private modal: BsModalService,
    private tokenService: TokensService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return [
      'user',
      'statuses',
      'groups',
      'activationBeginDate',
      'activationEndDate',
      'expiryBeginDate',
      'expiryEndDate'
    ];
  }

  ngOnInit() {
    super.ngOnInit();
    this.type = this.route.snapshot.params.type;
    this.addSub(
      this.tokenService.getGeneralTokensDataForSearch({ type: this.type }).subscribe(data => (this.data = data))
    );
  }

  onDataInitialized(data: TokenDataForSearch) {
    super.onDataInitialized(data);
    if (data.type.physicalType !== PhysicalTokenTypeEnum.NFC_TAG) {
      this.headingActions = [
        new HeadingAction(
          SvgIcon.PlusCircle,
          this.i18n.general.add,
          () => {
            this.modal.show(CreateTokenComponent, {
              class: 'modal-form',
              initialState: { type: data.type, updateAction: () => this.reload() }
            });
          },
          true
        )
      ];
    }
  }

  protected doSearch(value: TokenSearchParams): Observable<HttpResponse<TokenResult[]>> {
    return this.tokenService.searchGeneralTokens$Response(value);
  }

  protected toSearchParams(value: any): TokenSearchParams {
    const params: TokenSearchParams = value;
    params.type = this.type;
    params.activationPeriod = ApiHelper.dateRangeFilter(value.activationBeginDate, value.activationEndDate);
    params.expiryPeriod = ApiHelper.dateRangeFilter(value.expiryBeginDate, value.expiryEndDate);
    return params;
  }

  get statusOptions(): FieldOption[] {
    return Object.values(TokenStatusEnum).map(st => ({ value: st, text: this.statusDisplay(st) }));
  }

  statusDisplay(status: TokenStatusEnum) {
    return this.userHelper.tokenStatus(status);
  }

  isNfc() {
    return this.data.type.physicalType === PhysicalTokenTypeEnum.NFC_TAG;
  }

  view(token: TokenResult) {
    return ['/users', 'tokens', 'view', token.id];
  }

  resolveMenu(dataForSearch: TokenDataForSearch) {
    return new ActiveMenu(Menu.USER_TOKENS, { tokenType: dataForSearch.type });
  }
}
