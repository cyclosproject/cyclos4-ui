import {
  ChangeDetectionStrategy, Component, Host, HostBinding,
  Injector, Input, OnInit, Optional, SkipSelf, ViewChild
} from '@angular/core';
import { ControlContainer, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DistanceUnitEnum, SearchByDistanceData } from 'app/api/models';
import { NotificationService } from 'app/core/notification.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { LayoutService } from 'app/core/layout.service';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { distinctUntilChanged } from 'rxjs/operators';

const MaxDistanceOptions = [1, 5, 10, 15, 25, 50, 75, 100];

/**
 * Displays the selection from a distance filter
 */
@Component({
  selector: 'max-distance-field',
  templateUrl: 'max-distance-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: MaxDistanceFieldComponent, multi: true },
  ],
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
  lastPositionError: PositionError;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public layout: LayoutService,
    private notification: NotificationService,
    private formBuilder: FormBuilder,
  ) {
    super(injector, controlContainer);
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
      address: (firstAddress || {}).id,
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
          ? this.data.addresses.length > 1 ? address.name : this.i18n.general.geolocation.myAddress
          : this.i18n.general.geolocation.current,
        maxDistance: value.maxDistance,
        latitude: address ? address.location.latitude : value.latitude,
        longitude: address ? address.location.longitude : value.longitude,
      };
      if (maxDistance.maxDistance != null) {
        if (maxDistance.latitude == null || maxDistance.latitude == null) {
          if (this.lastPositionError == null) {
            this.notification.error(this.i18n.error.geolocation.general);
          } else {
            switch (this.lastPositionError.code) {
              case this.lastPositionError.PERMISSION_DENIED:
                this.notification.error(this.i18n.error.geolocation.denied);
                break;
              case this.lastPositionError.POSITION_UNAVAILABLE:
              case this.lastPositionError.TIMEOUT:
                this.notification.error(this.i18n.error.geolocation.unavailable);
                break;
              default:
                this.notification.error(this.i18n.error.geolocation.general);
            }
          }
        } else {
          this.value = maxDistance;
        }
      }
    }
  }

  private updateCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        this.lastPositionError = null;
        this.form.patchValue({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      }, error => {
        this.lastPositionError = error;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.notification.snackBar(this.i18n.error.geolocation.denied);
            if (empty(this.data.addresses)) {
              // No address and no permission: disable the field
              this.enabledControl.setValue(false);
            } else {
              // Select the first address
              this.address.value = this.data.addresses[0].id;
            }
            break;
          case error.POSITION_UNAVAILABLE:
          case error.TIMEOUT:
            this.notification.snackBar(this.i18n.error.geolocation.unavailable);
            break;
          default:
            this.notification.snackBar(this.i18n.error.geolocation.general);
        }
      });
    } else {
      // Not supported by the browser
      this.notification.warning(this.i18n.error.geolocation.unavailable);
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
      ? this.i18n.general.geolocation.kilometersFrom
      : this.i18n.general.geolocation.milesFrom;
    const address = data.addresses.find(a => a.id === value.address);
    const location = address ? address.name : this.i18n.general.geolocation.current;
    return [value.maxDistance, from, location].join(' ');
  }

}
