import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RecordDataForSearch, RecordQueryFilters, RecordResult, CustomFieldDetailed, RecordLayoutEnum } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';

type RecordSearchParams = RecordQueryFilters & { owner: string, type: string, keywords: string };

@Component({
  selector: 'search-records',
  templateUrl: 'search-records.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchRecordsComponent
  extends BaseSearchPageComponent<RecordDataForSearch, RecordSearchParams, RecordResult>
  implements OnInit {

  hasEditAction: boolean;
  type: string;
  param: string;
  fieldsInSearch: Array<CustomFieldDetailed>;
  fieldsInList: Array<CustomFieldDetailed>;

  constructor(
    injector: Injector,
    private recordsService: RecordsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.owner;
    this.type = this.route.snapshot.params.type;

    // Get search data
    this.addSub(this.recordsService.getRecordDataForOwnerSearch({ owner: this.param, type: this.type }).subscribe(data => {
      if (data.type.layout !== RecordLayoutEnum.LIST) {
        throw new Error(`Invalid record layout: ${data.type.layout}`);
      }

      // TODO handle profileFields
      this.fieldsInSearch = data.customFields.filter(cf => data.fieldsInSearch.includes(cf.internalName));
      this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
      this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(this.fieldsInSearch, {
        useDefaults: false
      }));
      // Patch value to avoid the form reload twice
      this.form.patchValue(data.query, { emitEvent: false });
      this.data = data;
    }));
  }

  onDataInitialized(data: RecordDataForSearch) {
    this.hasEditAction = data.edit && data.type.useViewPage;
    this.headingActions = [];
    if (data.create) {
      this.headingActions.push(new HeadingAction('add_circle_outline', this.i18n.general.addNew, () =>
        this.router.navigate(['/records', this.param, this.type, 'new']), true));
    }
    super.onDataInitialized(data);
  }

  protected doSearch(value: RecordSearchParams): Observable<HttpResponse<RecordResult[]>> {
    return this.recordsService.searchOwnerRecords$Response(value);
  }

  remove(record: RecordResult) {
    this.notification.confirm({
      message: this.i18n.record.removeConfirm,
      callback: () => this.doRemove(record)
    });
  }

  private doRemove(record: RecordResult) {
    this.addSub(this.recordsService.deleteRecord({ id: record.id })
      .subscribe(() => {
        this.notification.snackBar(this.i18n.record.removeDone);
        this.update();
      }));
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
    return (record: RecordResult) => {
      if (this.data.type.useViewPage || !this.data.edit) {
        return this.viewPath(record);
      } else if (this.data.edit) {
        return this.editPath(record);
      }
      return ['#'];
    };
  }

  navigate(record: RecordResult) {
    this.router.navigate(this.toLink(record));
  }

  protected toSearchParams(params: any): RecordSearchParams {
    params.customFields = this.fieldHelper.toCustomValuesFilter(params.customValues);
    params.creationPeriod = ApiHelper.rangeFilter(params.beginDate, params.endDate);
    params.owner = this.param;
    params.type = this.type;
    delete params['customValues'];
    return params;
  }

  protected getFormControlNames(): string[] {
    return ['keywords', 'customValues', 'user', 'beginDate', 'endDate'];
  }
}
