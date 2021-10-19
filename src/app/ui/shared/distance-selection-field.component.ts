import { ChangeDetectionStrategy, Component, Host, Injector, Input, OnInit, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DistanceUnitEnum, SearchByDistanceData } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { DistanceSelectionComponent } from 'app/ui/shared/distance-selection.component';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * A componenet to select the max distance data from a modal dialog
 */
@Component({
  selector: 'distance-selection-field',
  templateUrl: 'distance-selection-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: DistanceSelectionFieldComponent, multi: true },
  ],
})
export class DistanceSelectionFieldComponent extends BaseFormFieldComponent<MaxDistance> implements OnInit {

  @Input() data: SearchByDistanceData;

  distance$ = new BehaviorSubject('');

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private modal: BsModalService,
  ) {
    super(injector, controlContainer);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.updateDistanceLabel();
  }

  showDistanceSelection() {
    const ref = this.modal.show(DistanceSelectionComponent, {
      class: 'modal-form',
      initialState: {
        data: this.data,
        defaultValue: this.value
      }
    });
    const component = ref.content as DistanceSelectionComponent;
    this.addSub(component.done.subscribe(maxDistance => {
      this.value = maxDistance;
      this.updateDistanceLabel();
    }));
  }

  updateDistanceLabel() {
    let labelValue;
    if (this.value) {
      const data = this.data || {};
      const unit = data.distanceUnit || DistanceUnitEnum.KILOMETER;
      const from = unit === DistanceUnitEnum.KILOMETER
        ? this.i18n.general.geolocation.kilometersFrom
        : this.i18n.general.geolocation.milesFrom;
      const address = data.addresses.find(a => a.id === this.value.id);
      const location = address ? address.name : this.i18n.general.geolocation.current;
      labelValue = [this.value.maxDistance, from, location].join(' ');
    } else {
      labelValue = this.i18n.general.notApplied;
    }
    this.distance$.next(labelValue);
  }

  protected getFocusableControl() {
    return this;
  }

  protected getDisabledValue(): string {
    const value = this.value;
    if (!value) {
      return this.i18n.general.notApplied;
    }

    const data = this.data || {};
    const unit = data.distanceUnit || DistanceUnitEnum.KILOMETER;
    const from = unit === DistanceUnitEnum.KILOMETER
      ? this.i18n.general.geolocation.kilometersFrom
      : this.i18n.general.geolocation.milesFrom;
    const address = data.addresses.find(a => a.id === value.id);
    const location = address ? address.name : this.i18n.general.geolocation.current;
    return [value.maxDistance, from, location].join(' ');
  }
}
