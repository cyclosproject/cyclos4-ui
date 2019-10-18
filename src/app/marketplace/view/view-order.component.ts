import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  OrderView, TimeInterval, OrderItem, CreateDeviceConfirmation,
  DeviceConfirmationTypeEnum, OrderStatusEnum, CustomFieldDetailed,
  CustomFieldTypeEnum, OrderDataForAcceptByBuyer, CustomFieldControlEnum
} from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { Menu } from 'app/shared/menu';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { empty } from 'app/shared/helper';
import { FormatService } from 'app/core/format.service';
import { AddressHelperService } from 'app/core/address-helper.service';

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
    protected marketplaceHelper: MarketplaceHelperService,
    protected addressHelper: AddressHelperService,
    protected formatService: FormatService,
    protected orderService: OrdersService) {
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
   * Accepts the order and allows to enter payment type,
   * remarks and confirmation password
   */
  accept() {

    if (this.data.status === OrderStatusEnum.PENDING_BUYER) {
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
    } else if (this.data.status === OrderStatusEnum.PENDING_SELLER) {
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

}
