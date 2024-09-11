import {
  ChangeDetectionStrategy,
  Component,
  Host,
  Injector,
  Input,
  Optional,
  SkipSelf,
  ViewChild
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BasicProfileFieldEnum, BasicProfileFieldInput } from 'app/api/models';
import { FieldHelperService } from 'app/core/field-helper.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { truthyAttr } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';

/**
 * Component which uses an user profile field, either basic or custom, as a search filter
 */
@Component({
  selector: 'basic-profile-field-filter',
  templateUrl: 'basic-profile-field-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: BasicProfileFieldFilterComponent, multi: true }]
})
export class BasicProfileFieldFilterComponent extends BaseFormFieldComponent<string> {
  private _field: BasicProfileFieldInput;
  @Input() get field(): BasicProfileFieldInput {
    return this._field;
  }
  set field(field: BasicProfileFieldInput) {
    this._field = field;
    this.updateLabel();
  }

  @Input() focused: boolean | string;

  _hideLabel: boolean | string = false;
  @Input() get hideLabel(): boolean | string {
    return this._hideLabel;
  }
  set hideLabel(hideLabel: boolean | string) {
    this._hideLabel = truthyAttr(hideLabel);
    this.updateLabel();
  }

  @ViewChild('input') input: InputFieldComponent;
  @ViewChild('image') image: SingleSelectionFieldComponent;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private fieldHelper: FieldHelperService
  ) {
    super(injector, controlContainer);
  }

  protected getFocusableControl() {
    return this.isImage() ? this.image : this.input;
  }

  isImage(): boolean {
    return this.field.field === BasicProfileFieldEnum.IMAGE;
  }

  protected getDisabledValue(): string {
    // It is not practical to disable a search field. Still...
    return this.value;
  }

  private updateLabel() {
    if (this._hideLabel || !this.field) {
      this.label = null;
    } else {
      this.label = this.fieldHelper.fieldDisplay(this.field.field);
    }
  }
}
