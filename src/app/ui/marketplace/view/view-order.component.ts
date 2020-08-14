import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CreateDeviceConfirmation, CustomFieldControlEnum, CustomFieldDetailed,
  CustomFieldTypeEnum, DeviceConfirmationTypeEnum, OrderDataForAcceptByBuyer,
  OrderItem, OrderStatusEnum, OrderView, SetDeliveryMethod,
} from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { SetDeliveryMethodComponent } from 'app/ui/marketplace/delivery-methods/set-delivery-method.component';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { empty } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Displays an order with it's possible actions
 */
@Component({
  selector: 'view-order',
  templateUrl: 'view-order.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewOrderComponent extends BaseViewPageComponent<OrderView> implements OnInit {

  OrderStatusEnum = OrderStatusEnum;

  id: string;
  seller: boolean;
  buyer: boolean;
  form: FormGroup;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private marketplaceHelper: MarketplaceHelperService,
    private addressHelper: AddressHelperService,
    private orderService: OrdersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.orderService.viewOrder({ order: this.id, fields: ['-history'] })
      .subscribe(order => this.data = order));
  }

  onDataInitialized(data: OrderView) {

    this.seller = this.authHelper.isSelfOrOwner(data.seller);
    this.buyer = !this.seller && this.authHelper.isSelfOrOwner(data.buyer);
    this.form = this.formBuilder.group({ remarks: null });
    const headingActions: HeadingAction[] = [];

    if (data.canAccept || data.canSetDeliveryInformation) {
      headingActions.push(new HeadingAction('done',
        data.canSetDeliveryInformation ?
          this.i18n.ad.setDeliveryMethod : this.i18n.ad.accept, () =>
        this.accept()));
    }

    if (data.canReject) {
      headingActions.push(new HeadingAction('clear',
        this.i18n.ad.reject, () =>
        this.reject()));
    }

    if (data.history) {
      headingActions.push(new HeadingAction('history', this.i18n.general.viewHistory, () =>
        this.router.navigate(['/marketplace', 'order', this.id, 'history'])));
    }

    this.exportHelper.headingActions(data.exportFormats, f => this.orderService.exportOrder$Response({
      format: f.internalName,
      order: data.id
    })).forEach(a => headingActions.push(a));

    this.headingActions = headingActions;
  }

  path(row: OrderItem): string[] {
    return ['/marketplace', 'view', row.product.id];
  }

  /**
   * Returns the according label for the current order status
   */
  resolveStatusLabel(): string {
    return this.marketplaceHelper.resolveOrderStatusLabel(this.data.status);
  }

  /**
   * Returns a label for the current delivery method if any
   */
  resolveDeliveryLabel(): string {
    const name = (this.data.deliveryMethod || {}).name;
    return empty(name) ? this.i18n.ad.toBeConfirmedBySeller : name;
  }

  resolveMenu() {
    if (this.buyer) {
      return Menu.PURCHASES;
    } else if (this.seller) {
      return Menu.SALES;
    }
    return this.menu.searchUsersMenu();
  }

  private orderDeviceConfirmation(type: DeviceConfirmationTypeEnum): () => CreateDeviceConfirmation {
    return () => ({
      type,
      order: this.id,
    });
  }

  /**
   * Creates a mock of custom fields for accept/reject an order
   */
  orderFields(data?: OrderDataForAcceptByBuyer): CustomFieldDetailed[] {
    const fields = [];
    if (data && !empty(data.paymentTypes) && data.paymentTypes.length > 1) {
      fields.push({
        internalName: 'paymentType',
        name: this.i18n.transaction.type,
        type: CustomFieldTypeEnum.SINGLE_SELECTION,
        control: CustomFieldControlEnum.RADIO,
        hasValuesList: true,
        defaultValue: data.paymentTypes[0].id,
        possibleValues: data.paymentTypes.map(type => {
          return {
            id: type.id,
            value: type.name,
          };
        }),
        required: true,
      });
    }
    fields.push({
      internalName: 'remarks',
      name: this.i18n.ad.remarks,
      type: CustomFieldTypeEnum.TEXT,
    });
    return fields;
  }

  /**
   * Accepts the order when is pending buyer and
   * allows to enter transfer type, remarks and confirmation
   */
  protected acceptByBuyer() {
    this.addSub(this.orderService.getOrderDataForAcceptByBuyer({ order: this.id }).subscribe(
      data => {
        this.notification.confirm({
          title: this.i18n.ad.acceptOrder,
          labelPosition: 'above',
          customFields: this.orderFields(data),
          passwordInput: data.confirmationPasswordInput,
          createDeviceConfirmation: this.orderDeviceConfirmation(DeviceConfirmationTypeEnum.ACCEPT_ORDER),
          callback: res => {
            this.addSub(this.orderService.acceptOrderByBuyer({
              order: this.id,
              confirmationPassword: res.confirmationPassword,
              body: {
                remarks: res.customValues.remarks,
                paymentType: res.customValues.paymentType ||
                  (!empty(data.paymentTypes) ? data.paymentTypes[0].id : null),
              },
            }).subscribe(() => {
              this.notification.snackBar(this.i18n.ad.orderAccepted);
              this.reload();
            }));
          },
        });
      },
    ));
  }

  /**
   * Accepts the order when is pending seller and
   * allows to enter remarks
   */
  protected acceptBySeller() {
    this.addSub(this.orderService.acceptOrderBySeller({
      order: this.id,
      body: this.form.value,
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.ad.orderAccepted);
      this.reload();
    }));
  }

  /**
   * Submits the order to pending buyer status and allows
   * to enter charge amount, name, remarks and time for a delivery method
   */
  protected setDeliveryMethod() {
    const dm = this.data.deliveryMethod || {};
    const ref = this.modal.show(SetDeliveryMethodComponent, {
      class: 'modal-form', initialState: {
        title: this.i18n.ad.deliveryMethod,
        name: dm.name,
        chargeAmount: dm.price,
        minTime: dm.minTime,
        maxTime: dm.maxTime,
        currency: this.data.currency,
      },
    });
    const component = ref.content as SetDeliveryMethodComponent;
    this.addSub(component.done.subscribe((deliveryMethod: SetDeliveryMethod) => {
      this.orderService.setDeliveryMethod({
        order: this.id,
        body: deliveryMethod,
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.ad.orderAccepted);
        this.reload();
      });
    }));
  }

  /**
   * Accepts the order and allows to enter payment type,
   * remarks, confirmation password and delivery method
   * based on order status
   */
  accept() {
    if (this.data.status === OrderStatusEnum.PENDING_BUYER) {
      this.acceptByBuyer();
    } else if (this.data.status === OrderStatusEnum.PENDING_SELLER) {
      if (this.data.canSetDeliveryInformation) {
        this.setDeliveryMethod();
      } else {
        this.acceptBySeller();
      }
    }
  }

  /**
   * Rejects the order and allows to enter remarks
   */
  reject() {
    this.notification.confirm({
      title: this.i18n.ad.rejectOrder,
      labelPosition: 'above',
      customFields: this.orderFields(),
      callback: res => {
        this.addSub(this.orderService.rejectOrder({
          order: this.id,
          body: {
            remarks: res.customValues.remarks,
          },
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.orderRejected);
          this.reload();
        }));
      },
    });
  }

  /**
   * Returns if the current delivery address has one specified value at least
   */
  get hasAddressFields(): boolean {
    return this.addressHelper.hasFields(this.data.deliveryAddress);
  }

  /**
   * Returns the sum of each item total price (price per quantity)
   */
  get subtotal(): number {
    let result = 0;
    this.data.items.forEach(item => result += +item.totalPrice);
    return result;
  }

  /**
   * Returns the remarks for the given order or a generic label if not set
   */
  get remarks(): string {
    return this.data.remarks ? this.data.remarks : null;
  }

  /**
   * Returns if there is a seller and can set remarks directly in the form
   */
  get canSetRemarks(): boolean {
    return this.data.status === OrderStatusEnum.PENDING_SELLER && this.seller && this.data.canAccept;
  }

}
