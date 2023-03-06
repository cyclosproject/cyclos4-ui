import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserOperatorsDataForSearch, UserOperatorsQueryFilters } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { OperatorsService } from 'app/api/services/operators.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';

type UserOperatorsSearchParams = UserOperatorsQueryFilters & { user: string; };
/**
 * Searches for operators of a given user
 */
@Component({
  selector: 'search-user-operators',
  templateUrl: 'search-user-operators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchUserOperatorsComponent
  extends BaseSearchPageComponent<UserOperatorsDataForSearch, UserOperatorsSearchParams, UserResult> implements OnInit {

  param: string;
  self: boolean;

  statusOptions: FieldOption[];

  constructor(
    injector: Injector,
    private operatorsService: OperatorsService,
    private userHelper: UserHelperService,
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['operatorGroups', 'statuses', 'creationBegin', 'creationEnd'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.param);
    this.statusOptions = this.userHelper.statusOptions();

    this.addSub(this.operatorsService.getUserOperatorsDataForSearch({ user: this.param }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserOperatorsDataForSearch) {
    super.onDataInitialized(data);
    if (empty(data.fieldsInList)) {
      // When there are no fields in list, set the display
      data.fieldsInList = ['display'];
    }
    if (!this.self && data.canCreateNew) {
      this.headingActions = [new HeadingAction(SvgIcon.PersonPlus, this.i18n.general.addNew,
        () => this.router.navigate(['/users', this.param, 'operators', 'registration']), true)];
    }
  }

  protected toSearchParams(value: any): UserOperatorsSearchParams {
    const query: UserOperatorsSearchParams = value;
    query.user = this.param;
    query.creationPeriod = ApiHelper.rangeFilter(value.creationBegin, value.creationEnd);
    delete value.customValues;
    return query;
  }

  protected doSearch(query: UserOperatorsSearchParams) {
    return this.operatorsService.searchUserOperators$Response(query);
  }

  resolveMenu(data: UserOperatorsDataForSearch) {
    return this.menu.userMenu(data.user, Menu.MY_OPERATORS);
  }
}
