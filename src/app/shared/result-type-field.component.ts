import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, SkipSelf, Host, Optional, OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, FormControl, ControlContainer } from '@angular/forms';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { ResultType } from 'app/shared/result-type';
import { MapsService } from 'app/core/maps.service';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Renders a widget for a result type field
 */
@Component({
  selector: 'result-type-field',
  templateUrl: 'result-type-field.component.html',
  styleUrls: ['result-type-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ResultTypeFieldComponent, multi: true }
  ]
})
export class ResultTypeFieldComponent extends BaseControlComponent<ResultType> implements OnInit {
  @Input() name: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() focused: boolean;
  @Input() privacyControl: FormControl;

  @Input() allowedResultTypes = [ResultType.TILES, ResultType.LIST];

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public format: FormatService,
    public layout: LayoutService,
    private maps: MapsService
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();

    if (!this.maps.enabled) {
      // If maps would be allowed but is not enabled by configuration, remove it
      const mapIndex = this.allowedResultTypes.indexOf(ResultType.MAP);
      this.allowedResultTypes.splice(mapIndex, 1);
    }
  }

  icon(resultType: ResultType): string {
    switch (resultType) {
      case ResultType.CATEGORIES:
        return 'view_column';
      case ResultType.TILES:
        return 'view_module';
      case ResultType.LIST:
        return 'view_list';
      case ResultType.MAP:
        return 'place';
    }
  }
}
