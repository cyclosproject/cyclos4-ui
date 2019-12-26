import { ChangeDetectionStrategy, OnInit, Component, Injector } from '@angular/core';
import { ShoppingCartDataForCheckout, DeliveryMethod, Address, DeviceConfirmationTypeEnum, ShoppingCartCheckout } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { ShoppingCartsService } from 'app/api/services';
import { BehaviorSubject } from 'rxjs';
import { FormGroup, FormControl } from '@angular/forms';
import { FormatService } from 'app/core/format.service';
import { empty } from 'app/shared/helper';
import { AddressHelperService } from 'app/core/address-helper.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';

export type CheckoutStep = 'delivery' | 'address' | 'payment' | 'confirm';

/**
 * Component used to perform a checkout process (in multiple steps) after shopping cart.
 */
@Component({
  selector: 'cart-checkout',
  templateUrl: 'cart-checkout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartCheckoutComponent extends BasePageComponent<ShoppingCartDataForCheckout>
  implements OnInit {

  ConfirmationMode = ConfirmationMode;

  step$ = new BehaviorSubject<CheckoutStep>(null);
  deliveryMethod$ = new BehaviorSubject<DeliveryMethod>(null);
  address$ = new BehaviorSubject<Address>(null);
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);

  form: FormGroup;
  addressForm: FormGroup;
  confirmationPassword: FormControl;

  constructor(
    injector: Injector,
    public formatService: FormatService,
    private shoppingCartService: ShoppingCartsService,
    private addressHelper: AddressHelperService,
    private marketplaceHelper: MarketplaceHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const id = this.route.snapshot.params.id;

    this.addSub(this.shoppingCartService.getShoppingCartDataForCheckout({ id: id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: ShoppingCartDataForCheckout) {
    const hasDeliveryMethods = !empty(data.deliveryMethods);
    this.form = this.formBuilder.group({ remarks: null });
    this.step = data.deliveryMethods.length > 1 ? 'delivery' : 'address';

    // The confirmation password is hold in a separated control
    this.confirmationPassword = this.formBuilder.control(null);
    this.form.setControl('confirmationPassword', this.confirmationPassword);

    // Delivery methods
    if (hasDeliveryMethods) {
      const deliveryField = this.formBuilder.control(data.deliveryMethods);
      this.form.addControl('deliveryMethod', deliveryField);
      this.addSub(deliveryField.valueChanges.subscribe(dm => this.updateDeliveryMethod(dm, data)));
      deliveryField.setValue(data.deliveryMethods[0].id, { emitEvent: true });
    }

    // Addresses
    const customAddress: Address = {
      id: 'customAddress',
      name: this.i18n.ad.customAddress
    };
    data.addresses.push(customAddress);
    const addressField = this.formBuilder.control(data.addresses);
    this.form.addControl('address', addressField);
    this.addSub(addressField.valueChanges.subscribe(a => this.updateAddress(a, data)));
    this.addressForm = this.addressHelper.addressFormGroup(data.addressConfiguration);
    addressField.setValue(data.addresses[0].id, { emitEvent: true });

    // Payment types
    if (!empty(data.paymentTypes)) {
      const paymentField = this.formBuilder.control(data.paymentTypes);
      this.form.addControl('paymentType', paymentField);
      paymentField.setValue(data.paymentTypes[0].id, { emitEvent: true });
    }
  }

  /**
   * Changes the delivery method and updates the delivery information section
   */
  protected updateDeliveryMethod(id: string, data: ShoppingCartDataForCheckout) {
    this.deliveryMethod = data.deliveryMethods.find(dm => dm.id === id);
  }

  /**
   * Changes the address and updates the address fields section
   */
  protected updateAddress(id: string, data: ShoppingCartDataForCheckout) {
    this.address = data.addresses.find(a => a.id === id);
    if (this.address.id === 'customAddress') {
      this.addressForm.reset();
    } else {
      this.addressForm.patchValue(this.address);
    }
  }

  resolveMenu() {
    return Menu.SHOPPING_CART;
  }

  /**
   * Goes forward in the checkout process until confirmation
   */
  next() {
    switch (this.step) {
      case 'delivery':
        this.step = 'address';
        break;
      case 'address':
        this.step = this.data.paymentTypes.length > 1 ? 'payment' : 'confirm';
        break;
      case 'payment':
        this.step = 'confirm';
        break;
      case 'confirm':
        this.submit();
        break;
    }
  }

  /**
   * Goes backward in the checkout process until the initial page (delivery or address)
   */
  back() {
    switch (this.step) {
      case 'confirm':
        this.step = this.data.paymentTypes.length > 1 ? 'payment' : 'address';
        break;
      case 'payment':
        this.step = 'address';
        break;
      case 'address':
        if (this.data.deliveryMethods.length > 1) {
          this.step = 'delivery';
        }
        break;
    }
  }

  /**
   * Finish the checkout process by submitting the order
   */
  protected submit(password?: string) {
    if (password) {
      this.confirmationPassword.setValue(password);
    }
    if (!validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }

    const checkout: ShoppingCartCheckout = this.form.value;
    delete checkout['address'];
    checkout.deliveryAddress = this.addressForm.value;

    this.addSub(this.shoppingCartService.checkoutShoppingCart({
      id: this.data.cart.id,
      body: checkout,
      confirmationPassword: this.confirmationPassword.value
    }).subscribe(items => {
      this.marketplaceHelper.cartItems = items;
      this.notification.snackBar(this.i18n.ad.orderWaitingForSellersApproval);
      this.router.navigate(['marketplace', 'self', 'purchases']);
    }));
  }

  get step(): CheckoutStep {
    return this.step$.value;
  }
  set step(step: CheckoutStep) {
    this.step$.next(step);
  }

  get deliveryMethod(): DeliveryMethod {
    return this.deliveryMethod$.value;
  }
  set deliveryMethod(deliveryMethod: DeliveryMethod) {
    this.deliveryMethod$.next(deliveryMethod);
  }

  get address(): Address {
    return this.address$.value;
  }
  set address(address: Address) {
    this.address$.next(address);
  }

  get totalPrice(): number {
    const price = +this.data.cart.totalPrice;

    if (this.negotiated) {
      return price;
    }
    return +this.deliveryMethod.chargeAmount + price;
  }

  get negotiated(): boolean {
    return this.deliveryMethod == null || this.deliveryMethod.chargeAmount == null;
  }

  get createDeviceConfirmation() {
    return () => {
      return {
        type: DeviceConfirmationTypeEnum.SHOPPING_CART_CHECKOUT,
        seller: this.ApiHelper.accountOwner(this.data.cart.seller),
        amount: this.totalPrice,
        paymentType: this.form.value.paymentType,
      };
    };
  }
}
