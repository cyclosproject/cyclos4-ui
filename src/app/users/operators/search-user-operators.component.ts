import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { CustomFieldDetailed, UserOperatorsDataForSearch } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { OperatorsService } from 'app/api/services/operators.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';


/**
 * Searches for operators of a given user
 */
@Component({
  selector: 'search-user-operators',
  templateUrl: 'search-user-operators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUserOperatorsComponent
  extends BaseSearchPageComponent<UserOperatorsDataForSearch, UserResult> implements OnInit {

  // Export enum to the template
  ResultType = ResultType;
  empty = empty;

  key: string;
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
    const route = this.route.snapshot;
    this.key = route.params.key || ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.key);

    this.addSub(this.operatorsService.getUserOperatorsDataForSearch({ user: this.key }).subscribe(data => {
      this.form.patchValue(data.query, { emitEvent: false });
      this.data = data;
    }));
  }

  doSearch(query: any) {
    const value = cloneDeep(query);
    value.user = this.key;
    value.profileFields = this.fieldHelper.toCustomValuesFilter(query.customValues);
    delete value.customValues;
    return this.operatorsService.searchUserOperators$Response(value);
  }
}
