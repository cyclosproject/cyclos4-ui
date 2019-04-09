import { ChangeDetectionStrategy, Component, Host, HostBinding, Optional, SkipSelf, ViewChild, Input, OnInit } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR, FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { MaxDistance } from 'app/shared/max-distance';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { SearchByDistanceData, DistanceUnitEnum } from 'app/api/models';
import { Messages } from 'app/messages/messages';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { distinctUntilChanged } from 'rxjs/operators';
import { NotificationService } from 'app/core/notification.service';

const MaxDistanceOptions = [1, 5, 10, 15, 25, 50, 75, 100];

/**
 * Displays the selection from a distance filter
 */
@Component({
  selector: 'max-distance-field',
  templateUrl: 'max-distance-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: MaxDistanceFieldComponent, multi: true }
  ]
})
export class MaxDistanceFieldComponent
  extends BaseFormFieldComponent<MaxDistance>
  implements OnInit {

  DistanceUnitEnum = DistanceUnitEnum;

  @HostBinding('class') clazz = 'd-block';

  @Input() data: SearchByDistanceData;

  @ViewChild('address') address: SingleSelectionFieldComponent;

  form: FormGroup;
  enabledControl: FormControl;
  maxDistanceOptions: FieldOption[];

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public messages: Messages,
    private notification: NotificationService,
    private formBuilder: FormBuilder
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.enabledControl = new FormControl(false);
    const data = (this.data || {});
    const firstAddress = empty(data.addresses) ? null : data.addresses[0];
    this.form = this.formBuilder.group({
      maxDistance: '10',
      latitude: null,
      longitude: null,
      address: (firstAddress || {}).id
    });
    this.addSub(this.enabledControl.valueChanges.pipe(distinctUntilChanged()).subscribe(enabled => {
      this.updateValue();
      if (enabled) {
        this.updateCurrentLocation();
      }
    }));
    this.addSub(this.form.valueChanges.pipe(distinctUntilChanged()).subscribe(value => {
      this.updateValue(value);
    }));
    this.maxDistanceOptions = MaxDistanceOptions.map(d => ({ value: String(d), text: String(d) }));
  }

  preprocessValue(value: MaxDistance) {
    const valid = value && value.maxDistance != null && value.latitude != null && value.longitude != null;
    this.enabledControl.setValue(valid);
    return value;
  }

  private updateValue(value?: any) {
    if (!this.enabledControl.value) {
      this.value = null;
    } else {
      if (!value) {
        value = this.form.value;
      }
      const address = value.address ? this.data.addresses.find(a => a.id === value.address) : null;
      const maxDistance: MaxDistance = {
        name: address
          ? this.data.addresses.length > 1 ? address.name : this.messages.general.geolocation.myAddress
          : this.messages.general.geolocation.current,
        maxDistance: value.maxDistance,
        latitude: address ? address.location.latitude : value.latitude,
        longitude: address ? address.location.longitude : value.longitude
      };
      this.value = maxDistance.maxDistance != null && maxDistance.latitude != null && maxDistance.latitude != null ? maxDistance : null;
    }
  }

  private updateCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        this.form.patchValue({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      }, error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.notification.error(this.messages.general.geolocation.errorDenied);
            break;
          case error.POSITION_UNAVAILABLE:
          case error.TIMEOUT:
            this.notification.warning(this.messages.general.geolocation.errorUnavailable);
            break;
          default:
            this.notification.error(this.messages.general.geolocation.errorGeneral);
        }
      });
    } else {
      // Not supported by the browser
      this.notification.warning(this.messages.general.geolocation.errorUnavailable);
    }
  }

  protected getFocusableControl() {
    return this.address;
  }

  protected getDisabledValue(): string {
    const value = this.form.value;
    const data = this.data || {};
    const unit = data.distanceUnit || DistanceUnitEnum.KILOMETER;
    const from = unit === DistanceUnitEnum.KILOMETER
      ? this.messages.general.geolocation.kilometersFrom
      : this.messages.general.geolocation.milesFrom;
    const address = data.addresses.find(a => a.id === value.address);
    const location = address ? address.name : this.messages.general.geolocation.current;
    return [value.maxDistance, from, location].join(' ');
  }

}
