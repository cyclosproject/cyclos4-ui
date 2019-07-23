import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { RecordView, RecordSection, RecordCustomFieldValue } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { HeadingAction } from 'app/shared/action';
import { empty as isEmpty } from 'app/shared/helper';
import { RecordHelperService } from 'app/core/records-helper.service';
import { OperationHelperService } from 'app/core/operation-helper.service';

@Component({
  selector: 'view-record',
  templateUrl: 'view-record.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewRecordComponent extends BaseViewPageComponent<RecordView> implements OnInit {

  title: String;
  columnLayout: boolean;
  valuesWithoutSection: Array<RecordCustomFieldValue>;
  valuesWithSection = new Map<RecordSection, RecordCustomFieldValue[]>();

  constructor(
    injector: Injector,
    private recordsService: RecordsService,
    private recordsHelper: RecordHelperService,
    private operationHelper: OperationHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.recordsService.viewRecord({ id: id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(record: RecordView) {
    this.headingActions = [];
    this.title = isEmpty(record.display) ? record.type.name : record.display;
    this.columnLayout = this.recordsHelper.isColumnLayout(record.type);
    this.valuesWithoutSection = record.customValues.filter(value => value.field.section == null) || [];
    (record.type.sections || []).forEach(s => {
      const filter = record.customValues.filter(value => value.field.section != null && value.field.section.id === s.id);
      if (filter) {
        this.valuesWithSection.set(s, filter);
      }
    });
    if (record.edit) {
      this.headingActions.push(
        new HeadingAction('edit', this.i18n.general.edit, () => {
          this.router.navigate(['/records', 'edit', record.id]);
        }, true)
      );
    }
    for (const operation of record.operations || []) {
      this.headingActions.push(this.operationHelper.headingAction(operation, record.id));
    }
  }

  resolveColumnClass(value: RecordCustomFieldValue): String {
    return this.recordsHelper.resolveColumnClass(value == null ? null : value.field, this.data.type);
  }

  get labelPosition() {
    return this.columnLayout ? 'above' : '';
  }

  get hasPreviousFields() {
    return this.data.createdBy ||
      this.data.lastModifiedBy;
  }

  resolveMenu(data: RecordView) {
    return this.recordsHelper.menuForRecordType(data.user, data.type);
  }

}
