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
import { MapsService } from 'app/core/maps.service';

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
  styleUrls: ['result-type-field.component.scss'],
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

  @Input() allowedResultTypes = [ResultType.TILES, ResultType.LIST];

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  @ViewChild(MatButtonToggleGroup) group: MatButtonToggleGroup;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public formatService: FormatService,
    public layout: LayoutService,
    private maps: MapsService
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    if (!this.maps.enabled) {
      // If maps would be allowed but is not enabled by configuration, remove it
      const mapIndex = this.allowedResultTypes.indexOf(ResultType.MAP);
      this.allowedResultTypes.splice(mapIndex, 1);
    }
  }

  onDisabledChange(isDisabled: boolean) {
    this.group.disabled = isDisabled;
  }

  icon(resultType: ResultType): string {
    switch (resultType) {
      case ResultType.TILES:
        return 'view_module';
      case ResultType.LIST:
        return 'view_list';
      case ResultType.MAP:
        return 'place';
    }
  }
}
