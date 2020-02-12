import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { RecordDataForSearch, RecordResult, RecordQueryFilters, CustomFieldDetailed, RecordLayoutEnum } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { BasePageComponent } from 'app/shared/base-page.component';
import { HeadingAction } from 'app/shared/action';
import { RecordHelperService } from 'app/core/records-helper.service';

type RecordSearchParams = RecordQueryFilters & { owner: string, type: string };

@Component({
  selector: 'tiled-records',
  templateUrl: 'tiled-records.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TiledRecordsComponent
  extends BasePageComponent<RecordDataForSearch>
  implements OnInit {

  type: string;
  param: string;
  fieldsInList: Array<CustomFieldDetailed>;
  results$ = new BehaviorSubject<RecordResult[]>(null);

  constructor(
    injector: Injector,
    private recordsService: RecordsService,
    private recordsHelper: RecordHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.owner;
    this.type = this.route.snapshot.params.type;

    this.addSub(this.recordsService.getRecordDataForOwnerSearch({ owner: this.param, type: this.type }).subscribe(data => {
      if (data.type.layout !== RecordLayoutEnum.TILED) {
        throw new Error(`Invalid record layout: ${data.type.layout}`);
      }

      this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
      this.data = data;
    }));

  }

  onDataInitialized(data: RecordDataForSearch) {
    const headingActions: HeadingAction[] = [];
    if (data.create) {
      headingActions.push(new HeadingAction('add', this.i18n.general.addNew, () =>
        this.router.navigate(['/records', this.param, this.type, 'new']), true));
    }
    this.headingActions = headingActions;
    this.addSub(this.doSearch(this.toSearchParams()).subscribe(result => {
      this.results$.next(result.body);
    }));
  }

  editPath(record: RecordResult) {
    return ['/records', 'edit', record.id];
  }

  viewPath(record: RecordResult) {
    return ['/records', 'view', record.id];
  }

  remove(record: RecordResult) {
    this.notification.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => this.doRemove(record)
    });
  }

  private doRemove(record: RecordResult) {
    this.addSub(this.recordsService.deleteRecord({ id: record.id })
      .subscribe(() => {
        this.notification.snackBar(this.i18n.general.removeItemDone);
        this.reload();
      }));
  }
  protected toSearchParams(): RecordSearchParams {
    return {
      // "Unlimited page size" using Java Max Integer Value, otherwise a DataConversionException is thrown by Cyclos
      pageSize: 2147483647,
      owner: this.param,
      type: this.type
    };
  }

  protected doSearch(value: RecordSearchParams): Observable<HttpResponse<RecordResult[]>> {
    return this.recordsService.searchOwnerRecords$Response(value);
  }

  protected getFormControlNames(): string[] {
    return [];
  }

  resolveMenu(data: RecordDataForSearch) {
    return this.recordsHelper.menuForRecordType(data.user, data.type);
  }

}
