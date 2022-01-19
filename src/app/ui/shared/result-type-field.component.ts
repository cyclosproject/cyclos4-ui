import { ChangeDetectionStrategy, Component, EventEmitter, Host, Injector, Input, OnInit, Optional, Output, SkipSelf } from '@angular/core';
import { ControlContainer, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MapsService } from 'app/ui/core/maps.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { focus } from 'app/shared/helper';
import { LayoutService } from 'app/core/layout.service';
import { ResultType } from 'app/ui/shared/result-type';
import { ArrowLeft, ArrowsHorizontal } from 'app/core/shortcut.service';
import { Subscription } from 'rxjs';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Renders a widget for a result type field
 */
@Component({
  selector: 'result-type-field',
  templateUrl: 'result-type-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ResultTypeFieldComponent, multi: true },
  ],
})
export class ResultTypeFieldComponent
  extends BaseControlComponent<ResultType>
  implements OnInit {

  @Input() name: string;
  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() focused: boolean;
  @Input() privacyControl: FormControl;

  @Input() allowedResultTypes: ResultType[];

  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  private resultTypeSubs = new Map<ResultType, Subscription>();

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService,
    private maps: MapsService,
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();

    const mapIndex = this.allowedResultTypes.indexOf(ResultType.MAP);
    if (!this.maps.enabled && mapIndex !== -1) {
      // If maps would be allowed but is not enabled by configuration, remove it
      this.allowedResultTypes.splice(mapIndex, 1);
    }
  }

  icon(resultType: ResultType): SvgIcon {
    switch (resultType) {
      case ResultType.CATEGORIES:
        return SvgIcon.LayoutThreeColumns;
      case ResultType.TILES:
        return SvgIcon.Grid;
      case ResultType.LIST:
        return SvgIcon.GridList;
      case ResultType.MAP:
        return SvgIcon.GeoAlt;
    }
  }

  tooltip(resultType: ResultType): String {
    switch (resultType) {
      case ResultType.CATEGORIES:
        return this.i18n.general.categoriesView;
      case ResultType.TILES:
        return this.i18n.general.tiledView;
      case ResultType.LIST:
        return this.i18n.general.listView;
      case ResultType.MAP:
        return this.i18n.general.map;
    }
  }

  addShortcuts(resultType: ResultType) {
    const element = this.element;
    const currentEl = element.getElementsByClassName(`resultType-${resultType}`).item(0);
    if (document.activeElement !== currentEl) {
      return;
    }
    const sub = this.shortcut.subscribe(ArrowsHorizontal, event => {
      let index = this.allowedResultTypes.indexOf(resultType)
        + (event.key === ArrowLeft ? -1 : 1);
      index = Math.min(Math.max(0, index), this.allowedResultTypes.length - 1);
      const newResultType = this.allowedResultTypes[index];
      const toFocus = element.getElementsByClassName(`resultType-${newResultType}`);
      if (toFocus.length > 0) {
        focus(toFocus.item(0), true);
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
