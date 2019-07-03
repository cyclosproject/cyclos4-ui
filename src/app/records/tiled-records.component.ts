import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { RecordDataForSearch, RecordResult, RecordQueryFilters, CustomFieldDetailed } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { BasePageComponent } from 'app/shared/base-page.component';
import { HeadingAction } from 'app/shared/action';

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
    private recordsService: RecordsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.owner;
    this.type = this.route.snapshot.params.type;

    this.addSub(this.recordsService.getRecordDataForOwnerSearch({ owner: this.param, type: this.type }).subscribe(data => {
      this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
      this.data = data;
    }));

  }

  onDataInitialized(data: RecordDataForSearch) {
    this.headingActions = [];
    if (data.create) {
      this.headingActions.push(new HeadingAction('add_circle_outline', this.i18n.general.addNew, () =>
        this.router.navigate(['/records', this.param, this.type, 'new']), true));
    }
    super.onDataInitialized(data);
    this.addSub(this.doSearch(this.toSearchParams()).subscribe(result => {
      this.results$.next(result.body);
    }));
  }

  protected toSearchParams(): RecordSearchParams {
    return {
      pageSize: Number.MAX_SAFE_INTEGER,
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

}
