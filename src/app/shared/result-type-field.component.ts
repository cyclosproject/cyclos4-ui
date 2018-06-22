import {
  Component, Input, Output, ViewChild, EventEmitter, forwardRef,
  Provider, ChangeDetectionStrategy, SkipSelf, Host, Optional
} from '@angular/core';
import { NG_VALUE_ACCESSOR, FormControl, ControlContainer } from '@angular/forms';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/core/layout.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { ResultType } from 'app/shared/result-type';
import { MatButtonToggleGroup } from '@angular/material';
import { environment } from 'environments/environment';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const RESULT_TYPE_FIELD_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ResultTypeFieldComponent),
  multi: true
};

/**
 * Renders a widget for a result type field
 */
@Component({
  selector: 'result-type-field',
  templateUrl: 'result-type-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RESULT_TYPE_FIELD_VALUE_ACCESSOR
  ]
})
export class ResultTypeFieldComponent extends BaseControlComponent<ResultType> {
  @Input() name: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() focused: boolean;
  @Input() privacyControl: FormControl;

  @Input() allowMap = false;

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  @ViewChild(MatButtonToggleGroup) group: MatButtonToggleGroup;

  // Alias for using in the template
  ResultType = ResultType;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public formatService: FormatService,
    public layout: LayoutService
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    this.allowMap = this.allowMap && environment.googleMapsApiKey != null;
  }

  onDisabledChange(isDisabled: boolean) {
    this.group.disabled = isDisabled;
  }
}
