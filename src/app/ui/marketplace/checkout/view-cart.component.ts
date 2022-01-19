import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  CustomFieldTypeEnum, ShoppingCartItemAvailabilityEnum, ShoppingCartItemDetailed,
  ShoppingCartItemQuantityAdjustmentEnum, ShoppingCartView
} from 'app/api/models';
import { ShoppingCartsService } from 'app/api/services/shopping-carts.service';
import { ErrorStatus } from 'app/core/error-status';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

/**
 * Edits a shopping cart by changing quantity or removing items
 */
@Component({
  selector: 'view-cart',
  templateUrl: 'view-cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewCartComponent
  extends BasePageComponent<ShoppingCartView>
  implements OnInit {

  private static details = false;

  id: string;
  unavailable: boolean;
  outOfStock: boolean;
  emptyCart$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    private shoppingCartService: ShoppingCartsService,
    private marketplaceHelper: MarketplaceHelperService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.id = this.route.snapshot.params.id;

    this.errorHandler.requestWithCustomErrorHandler(defaultHandling => {
      const req = ViewCartComponent.details ?
        this.shoppingCartService.getShoppingCartDetails({ id: this.id }) :
        this.shoppingCartService.adjustAndGetShoppingCartDetails({ id: this.id });

      ViewCartComponent.details = false;

      this.addSub(req
        .subscribe(data => {
          this.data = data;
        }, (err: HttpErrorResponse) => {
          if (err.status === ErrorStatus.NOT_FOUND ||
            err.status === ErrorStatus.FORBIDDEN) {
            this.emptyCart$.next(true);
          } else {
            defaultHandling(err);
          }
        }));
    });
  }

  onDataInitialized(data: ShoppingCartView) {
    this.headingActions = [
      new HeadingAction(SvgIcon.Bag2, this.i18n.ad.checkout, () => this.checkout(), true),
    ];

    this.checkMessages(data);
  }

  /**
   * Checks for messages about the cart like unavailable / out of stock / adjusted items, low balance, etc
   */
  protected checkMessages(data: ShoppingCartView) {
    const adjustments = new Set();
    data.items.forEach(item => {
      if (item.availability === ShoppingCartItemAvailabilityEnum.UNAVAILABLE) {
        this.unavailable = true;
      } else if (item.availability === ShoppingCartItemAvailabilityEnum.OUT_OF_STOCK) {
        this.outOfStock = true;
      } else if (item.quantityAdjustment != null) {
        adjustments.add(item.quantityAdjustment);
      }
    });

    let message = '';
    if (this.unavailable) {
      message += this.i18n.ad.itemsNoLongerAvailable;
    }
    if (this.outOfStock) {
      message += this.i18n.ad.itemsOutOfStock;
    }
    adjustments.forEach(adjustment => {
      switch (adjustment) {
        case ShoppingCartItemQuantityAdjustmentEnum.MAX:
          message += this.i18n.ad.adjustedQuantity.max;
          break;
        case ShoppingCartItemQuantityAdjustmentEnum.MIN:
          message += this.i18n.ad.adjustedQuantity.min;
          break;
        case ShoppingCartItemQuantityAdjustmentEnum.STOCK:
          message += this.i18n.ad.adjustedQuantity.stock;
          break;
      }
    });
    if (data.insufficientBalance) {
      message += this.i18n.ad.lowBalance(data.currency.name);
    }
    if (message !== '') {
      this.notification.warning(this.i18n.ad.articlesNotice(message), true, false);
    }
  }

  /**
   * Validates and navigates to the checkout page
   */
  protected checkout() {
    if (this.unavailable || this.outOfStock || this.data.insufficientBalance) {
      this.notification.error(this.i18n.ad.error.cannotProceedToCheckout);
      return;
    }
    this.router.navigate(['/marketplace', 'checkout', this.id]);
  }

  /**
   * Returns if the given item is available for buy (not out of stock or unavailable)
   */
  isAvailable(item: ShoppingCartItemDetailed) {
    return item.availability === ShoppingCartItemAvailabilityEnum.AVAILABLE;
  }

  /**
   * Removes the item from the cart and reloads the page
   */
  remove(item: ShoppingCartItemDetailed) {
    this.addSub(this.shoppingCartService.removeItemFromShoppingCart({ ad: item.product.id })
      .subscribe(items => {
        this.notification.snackBar(this.i18n.general.removeItemDone);
        this.reload();
        this.marketplaceHelper.cartItems = items;
      }));
  }

  /**
   * Changes the item quantity and reloads the page
   */
  changeQuantity(item: [string, ShoppingCartItemDetailed, boolean]) {

    const req: any = (quantity: string) => {
      if (+quantity === 0) {
        // Avoid deleting cart items by mistake,
        // user should remove items with the remove button
        return;
      }
      this.addSub(this.shoppingCartService.modifyItemQuantityOnShoppingCart({
        ad: item[1].product.id,
        quantity: +quantity,
      }).subscribe(items => {
        ViewCartComponent.details = true;
        this.reload();
        this.marketplaceHelper.cartItems = items;
      }));
    };

    if (item[2]) {
      // Edit quantity directly from table
      req(item[0]);
    } else {
      // Display a popup with a decimal field to edit quantity
      this.confirmation.confirm({
        title: this.i18n.ad.changeQuantity,
        labelPosition: 'above',
        customFields: [{
          internalName: 'quantity',
          name: this.i18n.ad.quantity,
          type: item[1].product.allowDecimalQuantity ? CustomFieldTypeEnum.DECIMAL : CustomFieldTypeEnum.INTEGER,
          defaultValue: this.marketplaceHelper.getFormattedQuantity(item[1]),
        }],
        callback: res => req(+res.customValues.quantity),
      });
    }
  }

  /**
   * Resolves the label for available/unavailable/out of stock item
   */
  resolveQuantityLabel(item: ShoppingCartItemDetailed): string {
    switch (item.availability) {
      case ShoppingCartItemAvailabilityEnum.AVAILABLE:
        return this.marketplaceHelper.getFormattedQuantity(item);
      case ShoppingCartItemAvailabilityEnum.OUT_OF_STOCK:
        return this.i18n.ad.outOfStock;
      case ShoppingCartItemAvailabilityEnum.UNAVAILABLE:
        return this.i18n.ad.itemNotAvailable;
    }
    return '';
  }

  resolveMenu() {
    return Menu.SHOPPING_CART;
  }
}
