import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { CustomFieldDetailed, UserOperatorsDataForSearch, UserOperatorsQueryFilters } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { OperatorsService } from 'app/api/services/operators.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { HeadingAction } from 'app/shared/action';


type UserOperatorsSearchParams = UserOperatorsQueryFilters & { user: string };
/**
 * Searches for operators of a given user
 */
@Component({
  selector: 'search-user-operators',
  templateUrl: 'search-user-operators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUserOperatorsComponent
  extends BaseSearchPageComponent<UserOperatorsDataForSearch, UserOperatorsSearchParams, UserResult> implements OnInit {

  // Export enum to the template
  ResultType = ResultType;
  empty = empty;

  param: string;
  self: boolean;
  advancedFields$ = new BehaviorSubject<CustomFieldDetailed[]>([]);

  constructor(
    injector: Injector,
    private operatorsService: OperatorsService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['operatorGroups', 'customValues'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.param);

    this.addSub(this.operatorsService.getUserOperatorsDataForSearch({ user: this.param }).subscribe(data => {
      this.form.patchValue(data.query, { emitEvent: false });
      if (data.canCreateNew) {
        this.headingActions = [
          new HeadingAction('registration', this.i18n.general.addNew, () => {
            this.router.navigate(['/users', this.param, 'operators', 'registration']);
          }, true)
        ];
      }
      this.data = data;
    }));
  }

  protected toSearchParams(value: any): UserOperatorsSearchParams {
    const query = cloneDeep(value);
    query.user = this.param;
    query.profileFields = this.fieldHelper.toCustomValuesFilter(query.customValues);
    delete value.customValues;
    return query;
  }

  protected doSearch(query: UserOperatorsSearchParams) {
    return this.operatorsService.searchUserOperators$Response(query);
  }
}
