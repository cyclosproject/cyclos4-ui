import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Address, AdResult, DeliveryMethod, OrderDataForEdit, OrderDataForNew, OrderDeliveryMethod, OrderItem } from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { SearchProductsComponent } from 'app/ui/marketplace/search/search-products.component';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { empty } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Create or edit a sale (initiated by seller) for an specific user and currency
 */
@Component({
  selector: 'sale-form',
  templateUrl: 'sale-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleFormComponent
  extends BasePageComponent<OrderDataForNew | OrderDataForEdit>
  implements OnInit {

  id: string;
  user: string;
  create: boolean;

  form: FormGroup;
  deliveryForm: FormGroup;
  addressForm: FormGroup;

  products$ = new BehaviorSubject<OrderItem[]>(null);
  deliveryMethod$ = new BehaviorSubject<OrderDeliveryMethod>(null);
  address$ = new BehaviorSubject<Address>(null);

  constructor(
    injector: Injector,
    private orderService: OrdersService,
    private marketplaceHelper: MarketplaceHelperService,
    private addressHelper: AddressHelperService,
    private modal: BsModalService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const buyer = this.route.snapshot.queryParams.buyer;
    const currency = this.route.snapshot.queryParams.currency;
    this.id = this.route.snapshot.params.id;
    this.user = this.route.snapshot.params.user;
    this.create = this.id == null;

    const request: Observable<OrderDataForNew | OrderDataForEdit> = this.create
      ? this.orderService.getOrderDataForNew({
        buyer,
        user: this.user,
        currency,
      })
      : this.orderService.getOrderDataForEdit({
        order: this.id,
      });

    this.addSub(request.subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: OrderDataForNew | OrderDataForEdit) {

    // Remarks
    this.form = this.formBuilder.group({
      remarks: data.order.remarks,
    });

    // Delivery methods
    if (this.create && !empty(data.deliveryMethods) && data.deliveryMethods.length === 1) {
      // Preselect first delivery method in case there is a single
      // one and the order is being created
      data.order.deliveryMethod = data.deliveryMethods[0];
    }

    this.deliveryForm = this.formBuilder.group({
      name: [null, Validators.required],
      price: [null, Validators.required],
      minTime: null,
      maxTime: [null, Validators.required],
    });
    this.addSub(this.deliveryForm.valueChanges.subscribe(value => this.deliveryMethod = value));
    this.deliveryForm.patchValue(data.order.deliveryMethod);

    const deliveryField = this.formBuilder.control(data.deliveryMethods);
    this.form.addControl('deliveryMethod', deliveryField);
    if (data.order.deliveryMethod) {
      deliveryField.setValue(data.order.deliveryMethod.name);
    }
    this.addSub(deliveryField.valueChanges.subscribe(a => this.updateDelivery(a, data)));

    // Addresses
    if (this.create && !empty(data.addresses) && data.addresses.length === 1) {
      // Preselect first address in case there is a single
      // one and the order is being created
      data.order.deliveryAddress = data.addresses[0];
    }

    this.addressForm = this.addressHelper.addressFormGroup(data.addressConfiguration);
    this.addressForm.patchValue(data.order.deliveryAddress);

    const addressField = this.formBuilder.control(data.addresses);
    this.form.addControl('address', addressField);
    this.address = data.order.deliveryAddress;
    const currentAddressId = this.resolveAddressId(this.address);
    // Match current address by fields
    addressField.setValue(
      data.addresses.find(a => currentAddressId === this.resolveAddressId(a)) ?
        currentAddressId : null,
    );
    this.addSub(addressField.valueChanges.subscribe(a => this.updateAddress(a, data)));

    // Products
    const ads = (data as OrderDataForEdit).items || [];
    const orderItems = [];
    ads.forEach(product => {
      const orderItem = data.order.items.filter(item => item.product === product.id)[0];
      orderItems.push({
        price: orderItem.price,
        totalPrice: +orderItem.price * +orderItem.quantity,
        quantity: orderItem.quantity,
        product,
      });
    });
    this.products = orderItems;
  }

  /**
   * Change the address and updates the fields section
   */
  protected updateAddress(id: string, data: OrderDataForNew | OrderDataForEdit) {
    if (id == null) {
      this.addressForm.reset();
      this.address = null;
    } else {
      this.address = data.addresses.find(a => id === this.resolveAddressId(a));
      this.addressForm.patchValue(this.address);
    }
  }

  /**
   * Add webshop products to the order with the actual currency
   */
  addProducts() {
    const ref = this.modal.show(SearchProductsComponent, {
      class: 'modal-form modal-form-medium', initialState: {
        currency: this.currency,
      },
    });
    const component = ref.content as SearchProductsComponent;
    this.addSub(component.select.subscribe((ad: AdResult) => {
      this.addProduct(ad);
    }));
  }

  /**
   * Adds a product to the order (or increment quantity) with the given ad
   */
  protected addProduct(ad: AdResult) {
    // Check if it was already added and increment quantity
    const result = this.products || [];
    let product = result.find(p => p.product.id === ad.id);
    if (product != null) {
      product.quantity = (+product.quantity + 1).toString();
    } else {
      // Add new product
      ad.price = ad.promotionalPrice || ad.price;
      product = {
        price: ad.price,
        totalPrice: ad.price,
        quantity: '1',
        product: ad,
      };
      result.push(product);
    }
    // Trigger behavior change
    this.products = result;
  }

  /**
   * Resolves an address id by concatenating it's fields
   */
  resolveAddressId(address: Address) {
    if (address == null) {
      return null;
    }
    return [
      address.addressLine1,
      address.addressLine2,
      address.buildingNumber,
      address.city,
      address.complement,
      address.country,
      address.neighborhood,
      address.poBox,
      address.region,
      address.street,
      address.zip].join('');
  }

  /**
   * Changes the delivery method and updates the fields section
   */
  protected updateDelivery(name: string, data: OrderDataForNew | OrderDataForEdit) {
    if (name == null) {
      this.deliveryForm.reset();
    } else {
      const deliveryMethod = data.deliveryMethods.find(a => name === a.name);
      this.deliveryForm.patchValue(this.deliveryMethod ? {
        name: deliveryMethod.name,
        price: deliveryMethod.chargeAmount || null,
        minTime: deliveryMethod.minDeliveryTime,
        maxTime: deliveryMethod.maxDeliveryTime,
      } : null);
    }
  }

  get address(): Address {
    return this.address$.value;
  }
  set address(address: Address) {
    this.address$.next(address);
  }

  get products(): OrderItem[] {
    return this.products$.value;
  }
  set products(value: OrderItem[]) {
    this.products$.next(value);
  }

  get deliveryMethod(): DeliveryMethod {
    return this.deliveryMethod$.value;
  }
  set deliveryMethod(deliveryMethod: DeliveryMethod) {
    this.deliveryMethod$.next(deliveryMethod);
  }

  get currency() {
    return this.create ? (this.data as OrderDataForNew).currencies[0] :
      (this.data as OrderDataForEdit).currency;
  }

  /**
   * Submits the order to buyer or saves it as draft based on the given flag
   */
  save(asDraft?: boolean) {
    const order = this.data.order;

    // Initialize order items (as this.products already has the updated information)
    order.items = [];

    this.products.forEach(item => {
      order.items.push({
        price: item.price,
        product: item.product.id,
        quantity: item.quantity,
      });
    });
    order.deliveryMethod = this.deliveryForm.value;
    order.deliveryAddress = this.addressForm.value;
    order.remarks = this.form.controls.remarks.value;
    order.draft = asDraft || false;

    const onFinish = () => {
      this.notification.snackBar(asDraft ? this.i18n.ad.orderSavedAsDraft : this.i18n.ad.orderSubmittedToBuyer);
      history.back();
    };

    const request = () => {
      this.addSub(this.create ?
        this.orderService.createOrder({ user: this.user, body: order }).subscribe(onFinish) :
        this.orderService.updateOrder({ order: this.id, body: order }).subscribe(onFinish));
    };
    if (!asDraft) {
      this.notification.confirm({
        message: this.i18n.ad.submitToBuyerConfirmation,
        callback: request
      });
    } else {
      request();
    }
  }

  resolveStatusLabel() {
    return this.marketplaceHelper.resolveOrderStatusLabel((this.data as OrderDataForEdit).status);
  }

  resolveMenu() {
    return Menu.SALES;
  }

  get number() {
    return (this.data as OrderDataForEdit).number;
  }

  get creationDate() {
    return (this.data as OrderDataForEdit).creationDate;
  }
}
