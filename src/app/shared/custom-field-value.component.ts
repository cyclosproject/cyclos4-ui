import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { CustomField, CustomFieldValue } from 'app/api/models';
import { FieldHelperService } from 'app/core/field-helper.service';
import { LayoutService } from 'app/core/layout.service';
import { FieldLabelPosition } from 'app/shared/base-form-field.component';

/**
 * Component used to display a custom field value as a `<label-value>`
 */
@Component({
  selector: 'custom-field-value',
  templateUrl: 'custom-field-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomFieldValueComponent implements OnInit {

  @HostBinding('class.any-label-value') classAnyLabelValue = true;
  @HostBinding('class.view') classView = true;

  value: any;

  @Input() labelPosition: FieldLabelPosition;
  @Input() fieldValue: CustomFieldValue;

  ngOnInit() {
    this.value = this.fieldHelper.getValue(this.fieldValue);
  }

  constructor(
    public layout: LayoutService,
    protected fieldHelper: FieldHelperService) {
  }

  get field(): CustomField {
    return this.fieldValue ? this.fieldValue.field : null;
  }

}
