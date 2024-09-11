import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Currency, ShoppingCartItemAvailabilityEnum, ShoppingCartItemDetailed } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { debounceTime } from 'rxjs/operators';

/**
 * Displays a list of shopping cart items optionally with detailed information and actions
 */
@Component({
  selector: 'shopping-cart-items',
  templateUrl: 'shopping-cart-items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingCartItemsComponent extends BaseComponent implements OnInit {
  form: FormGroup;

  @Input() detailed: boolean;
  @Input() items: ShoppingCartItemDetailed[];
  @Input() currency: Currency;

  @Output() changeQuantity = new EventEmitter<[string, ShoppingCartItemDetailed, boolean]>();
  @Output() remove = new EventEmitter<ShoppingCartItemDetailed>();

  constructor(injector: Injector, private marketplaceHelper: MarketplaceHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.detailed) {
      this.form = this.formBuilder.group({});
      this.items.forEach(item => {
        const control = this.formBuilder.control(item.quantity, { updateOn: 'blur' });
        this.form.addControl(item.id, control);
        // Only after finishing initialization add a listener to form values to update the results. This avoids lifecycle loop.
        setTimeout(() => {
          this.addSub(
            control.valueChanges.pipe(debounceTime(this.ApiHelper.DEBOUNCE_TIME)).subscribe(value => {
              this.changeQuantity.emit([value, item, true]);
            }),
            true
          );
        }, 1);
      });
    }
  }

  /**
   * Returns if the quantity can be changed directly from the table
   */
  useForm(smLayout: boolean): boolean {
    return this.detailed && smLayout;
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

  get toLink() {
    return (row: ShoppingCartItemDetailed) => this.path(row);
  }

  navigate(item: ShoppingCartItemDetailed) {
    if (this.detailed) {
      this.router.navigate(this.path(item));
    }
  }

  /**
   * Returns the minimum allowed to buy (or 1 as default)
   * Range is not used for decimal quantities
   */
  minItemsRange(row: ShoppingCartItemDetailed): number {
    if (row.product.allowDecimalQuantity) {
      return null;
    }
    return row.product.minAllowedInCart ? +row.product.minAllowedInCart : 1;
  }

  /**
   * Returns the maximum predefined range or maximum allowed to buy
   * Range is not used for decimal quantities
   */
  maxItemsRange(row: ShoppingCartItemDetailed): number {
    if (row.product.allowDecimalQuantity) {
      return null;
    }
    if (row.product.maxAllowedInCart) {
      return +row.product.maxAllowedInCart;
    }
    if (row.product.minAllowedInCart) {
      return +row.product.minAllowedInCart + 10;
    }
    return 10;
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
