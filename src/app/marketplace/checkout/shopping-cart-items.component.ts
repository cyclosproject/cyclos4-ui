import { ChangeDetectionStrategy, Component, OnInit, Input, Injector, Output, EventEmitter } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { ShoppingCartItemDetailed, Currency, ShoppingCartItemAvailabilityEnum } from 'app/api/models';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';

/**
 * Displays a list of shopping cart items optionally with detailed information and actions
 */
@Component({
  selector: 'shopping-cart-items',
  templateUrl: 'shopping-cart-items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingCartItemsComponent extends BaseComponent implements OnInit {

  @Input() detailed: boolean;
  @Input() items: ShoppingCartItemDetailed[];
  @Input() currency: Currency;

  @Output() changeQuantity = new EventEmitter<ShoppingCartItemDetailed>();
  @Output() remove = new EventEmitter<ShoppingCartItemDetailed>();


  constructor(
    injector: Injector,
    private marketplaceHelper: MarketplaceHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  /**
   * Returns if the given item is available for buy (not out of stock or unavailable)
   */
  isAvailable(item: ShoppingCartItemDetailed) {
    return item.availability === ShoppingCartItemAvailabilityEnum.AVAILABLE;
  }

  path(row: ShoppingCartItemDetailed): string[] {
    return ['/marketplace', 'view', row.product.id];
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
}
