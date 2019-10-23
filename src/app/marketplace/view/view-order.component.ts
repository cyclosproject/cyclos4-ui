import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  OrderView, TimeInterval, OrderItem, CreateDeviceConfirmation,
  DeviceConfirmationTypeEnum, OrderStatusEnum, CustomFieldDetailed,
  CustomFieldTypeEnum, OrderDataForAcceptByBuyer, CustomFieldControlEnum, DeliveryMethod
} from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { Menu } from 'app/shared/menu';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { empty } from 'app/shared/helper';
import { FormatService } from 'app/core/format.service';
import { AddressHelperService } from 'app/core/address-helper.service';
import { SetDeliveryMethodComponent } from 'app/marketplace/set-delivery-method.component';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Displays an order with it's possible actions
 */
@Component({
  selector: 'view-order',
  templateUrl: 'view-order.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewOrderComponent extends BaseViewPageComponent<OrderView> implements OnInit {

  id: string;
  seller: boolean;
  buyer: boolean;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private marketplaceHelper: MarketplaceHelperService,
    private addressHelper: AddressHelperService,
    private formatService: FormatService,
    private orderService: OrdersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.orderService.viewOrder({ order: this.id })
      .subscribe(order => this.data = order));
  }

  onDataInitialized(data: OrderView) {

    this.seller = this.authHelper.isSelfOrOwner(data.seller);
    this.buyer = !this.seller && this.authHelper.isSelfOrOwner(data.buyer);

    const headingActions: HeadingAction[] = [];

    // TODO missing history in OrderView
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
    return empty(this.data.deliveryMethodName) ? this.i18n.ad.toBeConfirmedBySeller : this.data.deliveryMethodName;
  }

  /**
   * Formats the given time as time interval
   */
  formatTimeInterval(timeInterval: TimeInterval): string {
    return this.formatService.formatTimeInterval(timeInterval);
  }

  resolveMenu() {
    if (this.buyer) {
      return Menu.PURCHASES;
    } else if (this.seller) {
      return Menu.SALES;
    }
    return this.authHelper.searchUsersMenu();
  }

  private orderDeviceConfirmation(type: DeviceConfirmationTypeEnum): () => CreateDeviceConfirmation {
    return () => ({
      type: type,
      order: this.id
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
            value: type.name
          };
        }),
        required: true
      });
    }
    fields.push({
      internalName: 'remarks',
      name: this.i18n.ad.remarks,
      type: CustomFieldTypeEnum.TEXT
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
                paymentType: res.customValues.paymentType,
              }
            }).subscribe(() => {
              this.notification.snackBar(this.i18n.ad.orderAccepted);
              this.reload();
            }));
          }
        });
      }
    ));
  }

  /**
   * Accepts the order when is pending seller and
   * allows to enter remarks
   */
  protected acceptBySeller() {
    this.notification.confirm({
      title: this.i18n.ad.acceptOrder,
      labelPosition: 'above',
      customFields: this.orderFields(),
      callback: res => {
        this.addSub(this.orderService.acceptOrderBySeller({
          order: this.id,
          body: {
            remarks: res.customValues.remarks
          }
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.orderAccepted);
          this.reload();
        }));
      }
    });
  }

  /**
   * Submits the order to pending buyer status and allows
   * to enter charge amount, name, remarks and time for a delivery method
   */
  protected setDeliveryMethod() {
    const ref = this.modal.show(SetDeliveryMethodComponent, {
      class: 'modal-form', initialState: {
        title: this.i18n.ad.deliveryMethod,
        name: this.data.deliveryMethodName,
        chargeAmount: this.data.deliveryPrice,
        time: this.data.deliveryTime,
        currency: this.data.currency
      }
    });
    const component = ref.content as SetDeliveryMethodComponent;
    this.addSub(component.done.subscribe((deliveryMethod: DeliveryMethod) => {
      this.orderService.setDeliveryMethod({
        order: this.id,
        body: deliveryMethod
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
      if (this.canSetDeliveryMethod) {
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
            remarks: res.customValues.remarks
          }
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.orderRejected);
          this.reload();
        }));
      }
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
    return this.data.remarks ? this.data.remarks : this.i18n.ad.noRemarksGiven;
  }

  get canAccept(): boolean {
    // TODO add can accept flag to data
    return (this.data.status === OrderStatusEnum.PENDING_BUYER) && this.buyer ||
      (this.data.status === OrderStatusEnum.PENDING_SELLER && this.seller);
  }

  get canReject(): boolean {
    // TODO add can reject flag to data
    return (this.data.status === OrderStatusEnum.PENDING_BUYER ||
      this.data.status === OrderStatusEnum.PENDING_SELLER) && (this.buyer || this.seller);
  }

  get canSetDeliveryMethod(): boolean {
    // TODO add can set delivery method flag to data
    return this.data.deliveryPrice == null && this.seller;
  }

}
