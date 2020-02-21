import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Address, DeliveryMethod, OrderDataForEdit, OrderDataForNew, OrderItemManage, AdResult } from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { AddressHelperService } from 'app/core/address-helper.service';
import { ErrorStatus } from 'app/core/error-status';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchProductsComponent } from 'app/marketplace/search/search-products.component';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Create or edit a sale (initiated by seller) for an specific user and currency
 */
@Component({
  selector: 'sale-form',
  templateUrl: 'sale-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaleFormComponent
  extends BasePageComponent<OrderDataForNew | OrderDataForEdit>
  implements OnInit {

  create: boolean;
  items: OrderItemManage[] = [];

  form: FormGroup;
  deliveryForm: FormGroup;
  addressForm: FormGroup;

  deliveryMethod$ = new BehaviorSubject<DeliveryMethod>(null);
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
    const id = this.route.snapshot.params.id;
    const user = this.route.snapshot.params.user;
    this.create = id == null;

    const request: Observable<OrderDataForNew | OrderDataForEdit> = this.create
      ? this.orderService.getOrderDataForNew({
        buyer: buyer,
        user: user,
        currency: currency
      })
      : this.orderService.getOrderDataForEdit({
        order: id
      });

    this.addSub(request.subscribe(data => {
      this.data = data;
    }, (resp: HttpErrorResponse) => {
      if (this.create && ErrorStatus.UNPROCESSABLE_ENTITY === resp.status) {
        // Go back to sales list if there is an error when starting the sale
        history.back();
      } else {
        this.errorHandler.handleHttpError(resp);
      }
    }));
  }

  onDataInitialized(data: OrderDataForNew | OrderDataForEdit) {

    this.form = this.formBuilder.group({
      remarks: data.order.remarks
    });

    this.deliveryForm = this.formBuilder.group({
      name: [null, Validators.required],
      price: [null, Validators.required],
      minTime: null,
      maxTime: [null, Validators.required],
    });
    this.deliveryForm.patchValue(data.order.deliveryMethod);

    const deliveryField = this.formBuilder.control(data.deliveryMethods);
    this.form.addControl('deliveryMethod', deliveryField);
    if (data.order.deliveryMethod) {
      deliveryField.setValue(data.order.deliveryMethod.name);
      this.deliveryMethod = data.order.deliveryMethod;
    }
    this.addSub(deliveryField.valueChanges.subscribe(a => this.updateDelivery(a, data)));

    this.addressForm = this.addressHelper.addressFormGroup(data.addressConfiguration);
    this.addressForm.patchValue(data.order.deliveryAddress);

    const addressField = this.formBuilder.control(data.addresses);
    this.form.addControl('address', addressField);
    this.address = data.order.deliveryAddress;
    const currentAddressId = this.resolveAddressId(this.address);
    // Match current address by fields
    addressField.setValue(
      data.addresses.find(a => currentAddressId === this.resolveAddressId(a)) ?
        currentAddressId : null
    );
    this.addSub(addressField.valueChanges.subscribe(a => this.updateAddress(a, data)));
  }

  /**
   * Changes the address and updates the fields section
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
      class: 'modal-form', initialState: {
        currency: this.currency.id
      }
    });
    const component = ref.content as SearchProductsComponent;
    this.addSub(component.select.subscribe((ad: AdResult) => {
      if (ad) {
        // TODO add product to table
      }
    }));
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
      this.deliveryMethod = null;
    } else {
      this.deliveryMethod = data.deliveryMethods.find(a => name === a.name);
      this.deliveryForm.patchValue(this.deliveryMethod ? {
        name: this.deliveryMethod.name,
        price: this.deliveryMethod.chargeAmount || null,
        minTime: this.deliveryMethod.minDeliveryTime,
        maxTime: this.deliveryMethod.maxDeliveryTime,
      } : null);
    }
  }

  get address(): Address {
    return this.address$.value;
  }
  set address(address: Address) {
    this.address$.next(address);
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

  submit() {
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
