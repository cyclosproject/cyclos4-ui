import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import {
  Currency, DeliveryMethodBasicData,
  DeliveryMethodChargeTypeEnum, DeliveryMethodDataForEdit, DeliveryMethodDataForNew, DeliveryMethodEdit,
} from 'app/api/models';
import { DeliveryMethodsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Edit a delivery method for webshop ads
 */
@Component({
  selector: 'edit-delivery-method',
  templateUrl: 'edit-delivery-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDeliveryMethodComponent
  extends BasePageComponent<DeliveryMethodDataForNew | DeliveryMethodDataForEdit>
  implements OnInit {

  DeliveryMethodChargeTypeEnum = DeliveryMethodChargeTypeEnum;

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
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.id = this.route.snapshot.params.id;
    this.create = this.id == null;

    const request: Observable<DeliveryMethodDataForNew | DeliveryMethodDataForEdit> = this.create
      ? this.deliveryMethodService.getDeliveryMethodDataForNew({
        user: this.user,
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
      enabled: dm.enabled,
      minDeliveryTime: dm.minDeliveryTime,
      maxDeliveryTime: [dm.maxDeliveryTime, Validators.required],
      description: [dm.description, Validators.required],
      version: (dm as DeliveryMethodEdit).version,
    });
    this.updateCurrency(data);

    this.addSub(this.form.controls.chargeType.valueChanges.subscribe(() => this.updateCurrency(data)));
    this.addSub(this.form.controls.chargeCurrency.valueChanges.subscribe(() => this.updateCurrency(data)));
  }

  /**
   * When charge type is fixed preselects the first currency if no one was specified,
   * otherwise clears the currency and hides related fields
   */
  protected updateCurrency(data: DeliveryMethodBasicData) {
    if (!empty(data.currencies) &&
      this.form.controls.chargeType.value === DeliveryMethodChargeTypeEnum.FIXED) {
      const id = this.form.controls.chargeCurrency.value;
      this.currency = data.currencies.find(c => c.id === id || c.internalName === id)
        || data.currencies[0];
      this.form.patchValue({ chargeCurrency: this.currency.id }, { emitEvent: false });
      this.form.controls.chargeCurrency.setValidators(Validators.required);
      this.form.controls.chargeAmount.setValidators(Validators.required);
    } else {
      this.currency = null;
      this.form.patchValue({ chargeCurrency: null, chargeAmount: null }, { emitEvent: false });
      this.form.controls.chargeCurrency.clearValidators();
      this.form.controls.chargeAmount.clearValidators();
    }
  }

  /**
   * Saves or edits the current delivery method
   */
  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value;
    const request: Observable<string | void> = this.create ?
      this.deliveryMethodService.createDeliveryMethod({ body: value, user: this.user }) :
      this.deliveryMethodService.updateDeliveryMethod({ id: this.id, body: value });
    this.addSub(request.subscribe(() => {
      this.notification.snackBar(this.create
        ? this.i18n.ad.deliveryMethodCreated
        : this.i18n.ad.deliveryMethodSaved);
      history.back();
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
