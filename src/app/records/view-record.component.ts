import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { RecordView, CustomFieldValue, RecordSection } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { HeadingAction } from 'app/shared/action';
import { empty as isEmpty } from 'app/shared/helper';

@Component({
  selector: 'view-record',
  templateUrl: 'view-record.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewRecordComponent extends BaseViewPageComponent<RecordView> implements OnInit {

  title: String;
  columnsLayout: boolean;
  valuesWithoutSection: Array<CustomFieldValue>;
  valuesWithSection = new Map<RecordSection, CustomFieldValue[]>();

  constructor(
    injector: Injector,
    private recordService: RecordsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.recordService.viewRecord({ id: id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(record: RecordView) {
    this.headingActions = [];
    this.title = isEmpty(record.display) ? record.type.name : record.display;
    this.columnsLayout = record.type.fieldColumns > 1 && this.layout.gtxs;
    this.valuesWithoutSection = record.customValues.filter(value => value.field.section == null) || [];
    (record.type.sections || []).forEach(s => {
      const values = record.customValues.filter(value => value.field.section != null && value.field.section.id === s.id);
      if (values) {
        this.valuesWithSection.set(s, values);
      }
    });
    if (record.edit) {
      this.headingActions.push(
        new HeadingAction('edit', this.i18n.general.edit, () => {
          this.router.navigate(['/records', 'edit', record.id]);
        }, true)
      );
    }
  }

  get columnClass() {
    return this.columnsLayout ? 'columns-' + this.data.type.fieldColumns : '';
  }

  get labelPosition() {
    return this.columnsLayout ? 'above' : '';
  }

  get hasPreviousFields() {
    return this.data.createdBy ||
      this.data.lastModifiedBy;
  }
}
