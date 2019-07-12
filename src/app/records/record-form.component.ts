import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { RecordDataForEdit, RecordDataForNew, RecordCustomField, RecordCustomFieldDetailed, RecordSection } from 'app/api/models';
import { RecordsService } from 'app/api/services';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { RecordHelperService } from 'app/core/records-helper.service';
import { validateBeforeSubmit } from 'app/shared/helper';

@Component({
  selector: 'record-form',
  templateUrl: 'record-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordFormComponent extends BasePageComponent<RecordDataForEdit | RecordDataForNew> implements OnInit {

  type: string;
  param: string;
  id: string;
  create: boolean;
  columnLayout: boolean;
  form: FormGroup;
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
    this.id = this.route.snapshot.paramMap.get('id');

    const request: Observable<RecordDataForEdit | RecordDataForNew> = this.create
      ? this.recordService.getRecordDataForNew({ owner: this.param, type: this.type })
      : this.recordService.getRecordDataForEdit({ id: this.id });
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
    this.form = this.formBuilder.group({});
    // Set the custom fields control
    this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.fields, {
      currentValues: data.record.customValues,
      disabledProvider: cf => !this.create && ((data as RecordDataForEdit).editableFields || []).indexOf(cf.internalName) === -1
    }));
  }

  resolveColumnClass(field: RecordCustomField): String {
    return this.recordHelper.resolveColumnClass(field, this.data.type);
  }



  get binaryValues() {
    return (this.data as RecordDataForEdit).binaryValues;
  }

  get labelPosition() {
    return this.columnLayout ? 'above' : '';
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;
    const request: Observable<string | void> = this.create
      ? this.recordService.createRecord({ owner: this.param, type: this.type, body: value })
      : this.recordService.updateRecord({ id: this.id, body: value });
    this.addSub(request.subscribe(id => {
      this.notification.snackBar(this.create
        ? this.i18n.record.created(this.data.type.name)
        : this.i18n.record.saved(this.data.type.name));
      this.router.navigate(['/records', 'view', id || this.id]);
    }));
  }
}
