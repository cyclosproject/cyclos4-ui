import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  DeviceConfirmationTypeEnum,
  RecordCustomField, RecordCustomFieldDetailed, RecordDataForEdit, RecordDataForNew,
  RecordEdit,
  RecordLayoutEnum, RecordManage, RecordSection,
} from 'app/api/models';
import { RecordsService } from 'app/api/services/records.service';
import { RecordHelperService } from 'app/ui/core/records-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { cloneDeep } from 'lodash-es';
import { Observable } from 'rxjs';

@Component({
  selector: 'record-form',
  templateUrl: 'record-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    public recordsService: RecordsService,
    public recordsHelper: RecordHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.owner;
    this.type = this.route.snapshot.params.type;
    this.create = this.param != null;
    this.id = this.route.snapshot.paramMap.get('id');

    const request: Observable<RecordDataForEdit | RecordDataForNew> = this.create
      ? this.recordsService.getRecordDataForNew({ owner: this.param, type: this.type })
      : this.recordsService.getRecordDataForEdit({ id: this.id });
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));

  }

  onDataInitialized(data: RecordDataForEdit | RecordDataForNew) {
    this.columnLayout = this.recordsHelper.isColumnLayout(data.type);
    this.fieldsWithoutSection = data.fields.filter(field => field.section == null) || [];
    (data.type.sections || []).forEach(s => {
      const filter = data.fields.filter(field => field.section != null && field.section.id === s.id);
      if (!empty(filter)) {
        this.fieldsWithSection.set(s, filter);
      }
    });
    this.form = this.formBuilder.group({});
    // Set the custom fields control
    this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.fields, {
      currentValues: data.record.customValues,
      disabledProvider: cf => !this.create && ((data as RecordDataForEdit).editableFields || []).indexOf(cf.internalName) === -1,
    }));
  }

  resolveColumnClass(field: RecordCustomField): string {
    return this.recordsHelper.resolveColumnClass(field, this.data.type);
  }

  get binaryValues() {
    return (this.data as RecordDataForEdit).binaryValues;
  }

  get labelPosition() {
    return this.columnLayout ? 'above' : 'auto';
  }

  resolveMenu(data: RecordDataForNew | RecordDataForEdit) {
    return this.menu.menuForRecordType(data.user, data.type);
  }

  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    const record = cloneDeep(this.data.record);
    record.customValues = this.form.value.customValues;

    if (this.data.confirmationPasswordInput) {
      this.confirmation.confirm({
        passwordInput: this.data.confirmationPasswordInput,
        createDeviceConfirmation: () => ({
          type: DeviceConfirmationTypeEnum.MANAGE_RECORD,
          recordType: this.data.type.id
        }),
        callback: result => this.doSave(record, result.confirmationPassword)
      });
    } else {
      this.doSave(record);
    }
  }

  private doSave(record: RecordManage | RecordEdit, confirmationPassword?: string) {
    const request: Observable<string | void> = this.create
      ? this.recordsService.createRecord({ owner: this.param, type: this.type, confirmationPassword, body: record })
      : this.recordsService.updateRecord({ id: this.id, confirmationPassword, body: record });
    this.addSub(request.subscribe(id => {
      this.notification.snackBar(this.create
        ? this.i18n.record.created(this.data.type.name)
        : this.i18n.record.saved(this.data.type.name));
      // Replace URL instead of navigate to avoid entering a new form when going back
      const firstTime = this.id == null;
      // Update single form id when saving it for first time
      if (firstTime && this.data.type.layout === RecordLayoutEnum.SINGLE) {
        for (const permission of this.recordsHelper.recordPermissions(this.data.user == null)) {
          if (permission.type.id === this.data.type.id) {
            permission.singleRecordId = id as string;
          }
        }
      }
      this.router.navigate(['/records', 'view', id || this.id], { replaceUrl: firstTime });
    }));
  }
}
