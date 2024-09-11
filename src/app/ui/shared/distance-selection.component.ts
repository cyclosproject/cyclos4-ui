import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Address, DistanceUnitEnum, SearchByDistanceData } from 'app/api/models';
import { LayoutService } from 'app/core/layout.service';
import { NextRequestState } from 'app/core/next-request-state';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

const MaxDistanceOptions = [1, 5, 10, 15, 25, 50, 75, 100];

/**
 * A component to select the max distance data
 */
@Component({
  selector: 'distance-selection',
  templateUrl: 'distance-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DistanceSelectionComponent extends BaseComponent implements OnInit {
  DistanceUnitEnum = DistanceUnitEnum;

  @Input() data: SearchByDistanceData;
  @Input() defaultValue: MaxDistance;

  @Output() done = new EventEmitter<MaxDistance>();

  @ViewChild('address') address: SingleSelectionFieldComponent;

  form: FormGroup;
  maxDistanceOptions: FieldOption[];
  lastPositionError: GeolocationPositionError;

  requesting$: Observable<boolean>;

  value: MaxDistance;

  constructor(injector: Injector, public layout: LayoutService, public modalRef: BsModalRef) {
    super(injector);
    this.requesting$ = injector.get(NextRequestState).requesting$;
  }

  ngOnInit(): void {
    super.ngOnInit();
    const firstAddress = this.resolveFirstGeolocatedAddress();
    this.form = this.formBuilder.group({
      maxDistance: this.defaultValue ? this.defaultValue.maxDistance : '10',
      latitude: this.defaultValue ? this.defaultValue.latitude : null,
      longitude: this.defaultValue ? this.defaultValue.longitude : null,
      addressName: this.defaultValue ? this.defaultValue.name : (firstAddress || {}).name,
      addressId: this.defaultValue ? this.defaultValue.id : (firstAddress || {}).id
    });

    this.addSub(this.form.valueChanges.pipe(distinctUntilChanged()).subscribe(value => this.updateValue(value)));

    this.maxDistanceOptions = MaxDistanceOptions.map(d => ({ value: String(d), text: String(d) }));

    // Initialize value
    if (firstAddress) {
      this.updateValue();
    } else {
      this.updateCurrentLocation();
    }
  }

  private updateValue(value?: any, afterGeolocate?: boolean) {
    if (!value) {
      value = this.form.value;
    }
    const address = value.addressId ? this.data.addresses.find(a => a.id === value.addressId) : null;
    const maxDistance: MaxDistance = {
      name: address
        ? this.data.addresses.length > 1
          ? address.name
          : this.i18n.general.geolocation.myAddress
        : this.i18n.general.geolocation.current,
      maxDistance: value.maxDistance,
      latitude: address ? address.location?.latitude : afterGeolocate ? value.latitude : null,
      longitude: address ? address.location?.longitude : afterGeolocate ? value.longitude : null,
      id: address ? address.id : null
    };
    if (!afterGeolocate && !address) {
      this.updateCurrentLocation();
      return;
    }
    if (maxDistance.maxDistance != null) {
      if (maxDistance.latitude == null || maxDistance.latitude == null) {
        let error;
        if (address) {
          error = this.i18n.field.distanceSelection.errorAddressNotLocated(address.name);
          this.address.value = this.resolveFirstGeolocatedAddress()?.id;
        } else if (this.lastPositionError == null) {
          error = this.i18n.error.geolocation.general;
        } else {
          switch (this.lastPositionError.code) {
            case this.lastPositionError.PERMISSION_DENIED:
              error = this.i18n.error.geolocation.denied;
              break;
            case this.lastPositionError.POSITION_UNAVAILABLE:
            case this.lastPositionError.TIMEOUT:
              error = this.i18n.error.geolocation.unavailable;
              break;
            default:
              error = this.i18n.error.geolocation.general;
          }
        }
        this.notification.error(error);
      } else {
        this.value = maxDistance;
      }
    }
  }

  private updateCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.lastPositionError = null;
          this.form.patchValue(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            { emitEvent: false }
          );
          this.updateValue(null, true);
        },
        error => {
          this.lastPositionError = error;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              if (!empty(this.data.addresses)) {
                this.notification.error(this.i18n.error.geolocation.denied);
                // Select the first address
                this.address.value = this.resolveFirstGeolocatedAddress().id;
              } else {
                this.submit(true);
                this.notification.error(this.i18n.error.geolocation.deniedNoAddressAvailable);
              }
              break;
            case error.POSITION_UNAVAILABLE:
            case error.TIMEOUT:
              this.notification.error(this.i18n.error.geolocation.unavailable);
              break;
            default:
              this.notification.error(this.i18n.error.geolocation.general);
          }
          this.updateValue(null, true);
        }
      );
    } else {
      // Not supported by the browser
      this.notification.warning(this.i18n.error.geolocation.unavailable);
      if (!empty(this.data.addresses)) {
        // Select the first address
        this.address.value = this.resolveFirstGeolocatedAddress().id;
      } else {
        this.submit(true);
      }
    }
  }

  resolveFirstGeolocatedAddress(): Address {
    return empty(this.data.addresses)
      ? null
      : this.data.addresses.find(a => a.location?.latitude && a.location?.longitude);
  }

  protected getFocusableControl() {
    return this.address;
  }

  submit(clear: boolean) {
    if (!clear && !this.value) {
      return;
    }
    this.done.emit(clear ? null : this.value);
    this.modalRef.hide();
  }
}
