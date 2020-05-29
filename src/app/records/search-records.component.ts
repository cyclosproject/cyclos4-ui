import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  BaseRecordDataForSearch, CustomFieldDetailed, GeneralRecordsDataForSearch,
  GeneralRecordsQueryFilters, Group, RecordDataForSearch, RecordLayoutEnum,
  RecordQueryFilters, RecordResult, RecordWithOwnerResult
} from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { RecordHelperService } from 'app/core/records-helper.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Observable } from 'rxjs';

type RecordSearchParams = RecordQueryFilters & {
  owner: string,
  type: string,
};

@Component({
  selector: 'search-records',
  templateUrl: 'search-records.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchRecordsComponent
  extends BaseSearchPageComponent<GeneralRecordsDataForSearch | RecordDataForSearch, RecordSearchParams, RecordResult>
  implements OnInit {

  type: string;
  param: string;
  fieldsInSearch: Array<CustomFieldDetailed>;
  fieldsInList: Array<CustomFieldDetailed>;
  groups: Array<Group>;

  constructor(
    injector: Injector,
    private recordsService: RecordsService,
    private recordsHelper: RecordHelperService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.owner;
    this.type = this.route.snapshot.params.type;

    // Get search data
    if (this.generalSearch) {
      this.addSub(this.recordsService.getRecordDataForGeneralSearch({ type: this.type })
        .subscribe(data => this.data = data));
    } else {
      this.addSub(
        this.recordsService.getRecordDataForOwnerSearch({ owner: this.param, type: this.type })
          .subscribe(data => this.data = data));
    }
  }

  onDataInitialized(data: GeneralRecordsDataForSearch | RecordDataForSearch) {
    if (!this.generalSearch && data.type.layout !== RecordLayoutEnum.LIST) {
      throw new Error(`Invalid record layout: ${data.type.layout}`);
    }
    this.fieldsInSearch = data.customFields.filter(cf => data.fieldsInSearch.includes(cf.internalName));
    this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
    this.form.setControl('customValues', this.fieldHelper.customFieldsForSearchFormGroup(this.fieldsInSearch));
    this.form.setControl('profileFields',
      this.fieldHelper.profileFieldsForSearchFormGroup(data.basicProfileFields, data.customProfileFields));
    this.form.patchValue(data.query);

    const headingActions: HeadingAction[] = [];
    if (!this.generalSearch && data.create) {
      headingActions.push(new HeadingAction('add', this.i18n.general.addNew, () =>
        this.router.navigate(['/records', this.param, this.type, 'new']), true));
    }
    this.exportHelper.headingActions(data.exportFormats,
      f => {
        const params = {
          format: f.internalName,
          ...this.toSearchParams(this.form.value)
        };
        if (this.generalSearch) {
          return this.recordsService.exportGeneralRecords$Response(params);
        } else {
          return this.recordsService.exportOwnerRecords$Response(params);
        }
      });
    this.headingActions = headingActions;
    this.groups = (data as GeneralRecordsDataForSearch).groups || [];
    super.onDataInitialized(data);
  }

  protected doSearch(value: RecordSearchParams): Observable<HttpResponse<RecordResult[]>> {
    return this.generalSearch ?
      this.recordsService.searchGeneralRecords$Response(value) :
      this.recordsService.searchOwnerRecords$Response(value);
  }

  remove(record: RecordResult) {
    this.notification.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => this.doRemove(record),
    });
  }

  private doRemove(record: RecordResult) {
    this.addSub(this.recordsService.deleteRecord({ id: record.id })
      .subscribe(() => {
        this.notification.snackBar(this.i18n.general.removeItemDone);
        this.update();
      }));
  }

  /**
   * Returns the record owner (display) for the given record result. Useful in general search
   */
  recordOwner(row: RecordResult) {
    return this.generalSearch ? (row as RecordWithOwnerResult).user.display : '';
  }

  fieldName(field: string): string {
    return this.fieldHelper.fieldDisplay(field, this.data.customFields);
  }

  viewPath(record: RecordResult) {
    return ['/records', 'view', record.id];
  }

  editPath(record: RecordResult) {
    return ['/records', 'edit', record.id];
  }

  get toLink() {
    return (record: RecordResult) => this.viewPath(record);
  }

  protected toSearchParams(value: any): RecordSearchParams {
    const params: RecordSearchParams = { ...value };
    params.customFields = this.fieldHelper.toCustomValuesFilter(value.customValues);
    params.profileFields = this.fieldHelper.toProfileFieldsFilter(value.profileFields);
    params.creationPeriod = ApiHelper.dateRangeFilter(value.beginDate, value.endDate);
    if (this.generalSearch) {
      const generalParams = params as GeneralRecordsQueryFilters;
      generalParams.brokers = value.broker ? [value.broker] : [];
      delete generalParams['broker'];
    } else {
      params.owner = this.param;
    }
    params.type = this.type;
    return params;
  }

  protected getFormControlNames(): string[] {
    return ['keywords', 'customValues', 'createdBy', 'beginDate', 'endDate', 'broker', 'groups', 'user', 'profileFields'];
  }

  resolveMenu(data: BaseRecordDataForSearch) {
    const user = this.generalSearch ? null : (data as RecordDataForSearch).user;
    return this.recordsHelper.menuForRecordType(user, data.type);
  }

  get generalSearch() {
    return this.param === RecordHelperService.GENERAL_SEARCH;
  }
}
