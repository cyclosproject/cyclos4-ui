import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { RecordDataForEdit, RecordDataForNew, RecordCustomField, RecordCustomFieldDetailed, RecordSection } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { Observable } from 'rxjs';
import { FormGroup, FormControl } from '@angular/forms';
import { RecordHelperService } from 'app/core/records-helper.service';

@Component({
  selector: 'record-form',
  templateUrl: 'record-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordFormComponent extends BasePageComponent<RecordDataForEdit | RecordDataForNew> implements OnInit {

  type: string;
  param: string;
  create: boolean;
  columnLayout: boolean;
  form: FormGroup;
  customFieldControlsMap: Map<string, FormControl>;
  fieldsWithoutSection: Array<RecordCustomFieldDetailed>;
  fieldsWithSection = new Map<RecordSection, RecordCustomFieldDetailed[]>();


  constructor(
    injector: Injector,
    public recordService: RecordsService,
    public recordHelper: RecordHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.owner;
    this.type = this.route.snapshot.params.type;
    this.create = this.param != null;
    const id = this.route.snapshot.paramMap.get('id');

    const request: Observable<RecordDataForEdit | RecordDataForNew> = this.create
      ? this.recordService.getRecordDataForNew({ owner: this.param, type: this.type })
      : this.recordService.getRecordDataForEdit({ id: id });
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));

  }

  onDataInitialized(data: RecordDataForEdit | RecordDataForNew) {
    this.columnLayout = this.recordHelper.isColumnLayout(data.type);
    this.fieldsWithoutSection = data.fields.filter(field => field.section == null) || [];
    (data.type.sections || []).forEach(s => {
      const filter = data.fields.filter(field => field.section != null && field.section.id === s.id);
      if (filter) {
        this.fieldsWithSection.set(s, filter);
      }
    });
    this.customFieldControlsMap = this.fieldHelper.customValuesFormControlMap(data.fields);
    this.form = this.formBuilder.group({});
    if (this.customFieldControlsMap.size > 0) {
      const fieldValues = new FormGroup({});
      for (const c of this.customFieldControlsMap) {
        fieldValues.addControl(c[0], c[1]);
      }
      this.form.setControl('customValues', fieldValues);
    }
  }

  resolveColumnClass(field: RecordCustomField): String {
    return this.recordHelper.resolveColumnClass(field, this.data.type);
  }

  get labelPosition() {
    return this.columnLayout ? 'above' : '';
  }

  save() {

  }
}
