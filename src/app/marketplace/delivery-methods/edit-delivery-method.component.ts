import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DeliveryMethodDataForEdit, DeliveryMethodDataForNew, DeliveryMethodChargeTypeEnum, Currency, DeliveryMethodBasicData, DeliveryMethod } from 'app/api/models';
import { DeliveryMethodsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FormGroup, Validators } from '@angular/forms';
import { validateBeforeSubmit, empty } from 'app/shared/helper';
import { Observable, BehaviorSubject } from 'rxjs';
import { Menu } from 'app/shared/menu';

/**
 * Edit a delivery method for webshop ads
 */
@Component({
  selector: 'edit-delivery-method',
  templateUrl: 'edit-delivery-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditDeliveryMethodComponent
  extends BasePageComponent<DeliveryMethodDataForNew | DeliveryMethodDataForEdit>
  implements OnInit {

  id: string;
  user: string;
  create: boolean;
  self: boolean;
  form: FormGroup;

  currency$ = new BehaviorSubject<Currency>(null);

  constructor(
    injector: Injector,
    private deliveryMethodService: DeliveryMethodsService) {
    super(injector);
    this.form = this.formBuilder.group({});
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.id = this.route.snapshot.params.id;
    this.create = this.id == null;

    const request: Observable<DeliveryMethodDataForNew | DeliveryMethodDataForEdit> = this.create
      ? this.deliveryMethodService.getDeliveryMethodDataForNew({
        user: this.user
      })
      : this.deliveryMethodService.getDeliveryMethodDataForEdit({ id: this.id });
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: DeliveryMethodDataForNew | DeliveryMethodDataForEdit) {

    this.self = this.authHelper.isSelfOrOwner(data.user);

    const dm = data.deliveryMethod;

    this.form = this.formBuilder.group({
      name: [dm.name, Validators.required],
      chargeType: dm.chargeType,
      chargeCurrency: dm.chargeCurrency,
      chargeAmount: dm.chargeAmount,
      minTime: dm.minDeliveryTime,
      maxTime: [dm.maxDeliveryTime, Validators.required],
      description: dm.description
    });

    this.addSub(this.form.controls.chargeType.valueChanges.subscribe(() => {
      this.updateRequiredControls();
      this.preselectFirstCurrency(data);
    }));
    this.addSub(this.form.controls.chargeCurrency.valueChanges.subscribe(id => {
      this.updateCurrency(id, data);
    }));
    this.preselectFirstCurrency(data);
    this.updateRequiredControls();
  }

  /**
   * Update required controls like charge currency and amount based on the charge type
   */
  protected updateRequiredControls() {
    const controls = [this.form.controls.chargeAmount, this.form.controls.chargeCurrency];
    if (this.form.controls.chargeType.value === DeliveryMethodChargeTypeEnum.NEGOTIATED) {
      controls.forEach(c => c.clearValidators());
    } else {
      controls.forEach(c => c.setValidators(Validators.required));
    }
    controls.forEach(c => c.updateValueAndValidity());
  }

  /**
   * Preselects the first currency when there is any available currency and method is
   * fixed, otherwise sets it to null (to hide currency and price fields)
   */
  protected preselectFirstCurrency(data: DeliveryMethodBasicData) {
    if (this.form.controls.chargeType.value === DeliveryMethodChargeTypeEnum.FIXED && !empty(data.currencies)) {
      this.currency = data.currencies[0];
      this.form.controls.chargeCurrency.setValue(this.currency.id);
    } else {
      this.currency = null;
    }
  }

  /**
   * Changes the current currency updating other referenced fields like price
   */
  protected updateCurrency(id: string, data: DeliveryMethodBasicData) {
    this.currency = data.currencies.find(c => c.id === id || c.internalName === id);
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;
    const request: Observable<String | void> = this.create ?
      this.deliveryMethodService.createDeliveryMethod({ body: value, user: this.user }) :
      this.deliveryMethodService.updateDeliveryMethod({ id: this.id, body: value });
    this.addSub(request.subscribe(() => {
    }));
  }

  resolveMenu(data: DeliveryMethodDataForNew | DeliveryMethodDataForEdit) {
    return this.authHelper.userMenu(data.user, Menu.DELIVERY_METHODS);
  }

  get currency(): Currency {
    return this.currency$.value;
  }

  set currency(currency: Currency) {
    this.currency$.next(currency);
  }
}
