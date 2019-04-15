import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  Host, Injector, Input, OnInit, Optional, Output, SkipSelf
} from '@angular/core';
import { ControlContainer, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MapsService } from 'app/core/maps.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { LayoutService } from 'app/shared/layout.service';
import { ResultType } from 'app/shared/result-type';
import { Subscription } from 'rxjs';

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
export class ResultTypeFieldComponent
  extends BaseControlComponent<ResultType>
  implements OnInit {

  @Input() name: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() focused: boolean;
  @Input() privacyControl: FormControl;

  @Input() allowedResultTypes = [ResultType.TILES, ResultType.LIST];

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  private resultTypeSubs = new Map<ResultType, Subscription>();

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService,
    private maps: MapsService,
    private elementRef: ElementRef
  ) {
    super(injector, controlContainer);
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

  addShortcuts(resultType: ResultType) {
    const element = this.elementRef.nativeElement as HTMLElement;
    const currentEl = element.getElementsByClassName(`resultType-${resultType}`).item(0);
    if (document.activeElement !== currentEl) {
      return;
    }
    const keys = ['ArrowLeft', 'ArrowRight', ' ', 'Enter'];
    const sub = this.shortcut.subscribe(keys, event => {
      let index = this.allowedResultTypes.indexOf(resultType);
      let alsoClick = false;
      switch (event.key) {
        case 'ArrowLeft':
          index--;
          break;
        case 'ArrowRight':
          index++;
          break;
        case ' ':
        case 'Enter':
          alsoClick = true;
          break;
      }
      index = Math.min(Math.max(0, index), this.allowedResultTypes.length - 1);
      const newResultType = this.allowedResultTypes[index];
      const toFocus = element.getElementsByClassName(`resultType-${newResultType}`);
      if (toFocus.length > 0) {
        const focusEl = toFocus.item(0) as HTMLElement;
        focusEl.focus();
        if (alsoClick) {
          focusEl.click();
        }
      }
    });
    this.resultTypeSubs.set(resultType, sub);
  }

  removeShortcuts(resultType: ResultType) {
    const sub = this.resultTypeSubs.get(resultType);
    if (sub) {
      sub.unsubscribe();
      this.resultTypeSubs.delete(resultType);
    }
  }
}
