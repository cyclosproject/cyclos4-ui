import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RecordCustomFieldValue, RecordSection, RecordView } from 'app/api/models';
import { RecordsService } from 'app/api/services/records.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { empty as isEmpty } from 'app/shared/helper';
import { RecordHelperService } from 'app/ui/core/records-helper.service';
import { RunOperationHelperService } from 'app/ui/core/run-operation-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';

@Component({
  selector: 'view-record',
  templateUrl: 'view-record.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewRecordComponent extends BaseViewPageComponent<RecordView> implements OnInit {

  title: string;
  columnLayout: boolean;
  valuesWithoutSection: Array<RecordCustomFieldValue>;
  valuesWithSection = new Map<RecordSection, RecordCustomFieldValue[]>();

  constructor(
    injector: Injector,
    private recordsService: RecordsService,
    private recordsHelper: RecordHelperService,
    private runOperationHelper: RunOperationHelperService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.recordsService.viewRecord({ id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(record: RecordView) {
    this.headingActions = [];
    this.title = isEmpty(record.display) ? record.type.name : record.display;
    this.columnLayout = this.recordsHelper.isColumnLayout(record.type);
    const customValues = record.customValues || [];
    this.valuesWithoutSection = customValues.filter(value => value.field.section == null) || [];
    (record.type.sections || []).forEach(s => {
      const filter = customValues.filter(
        value => value.field.section != null && value.field.section.id === s.id && (record.canEdit || this.fieldHelper.getValue(value)));
      if (filter.length > 0) {
        this.valuesWithSection.set(s, filter);
      }
    });
    if (record.canEdit) {
      this.headingActions.push(
        new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => {
          this.router.navigate(['/records', 'edit', record.id]);
        }, true),
      );
    }
    for (const operation of record.operations || []) {
      this.headingActions.push(this.runOperationHelper.headingAction(operation, record.id));
    }
  }

  resolveColumnClass(value: RecordCustomFieldValue = null): string {
    return this.recordsHelper.resolveColumnClass(value == null ? null : value.field, this.data.type);
  }

  get labelPosition() {
    return this.columnLayout ? 'above' : 'auto';
  }

  get hasPreviousFields() {
    return this.data.createdBy ||
      this.data.lastModifiedBy;
  }

  isOwner(): boolean {
    return this.authHelper.isSelf(this.data.user);
  }

  resolveMenu(data: RecordView) {
    return this.menu.menuForRecordType(data.user, data.type);
  }

}
