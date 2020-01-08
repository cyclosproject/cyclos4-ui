import { ChangeDetectionStrategy, Component, OnInit, Input, Injector, Output, EventEmitter } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { ShoppingCartItemDetailed, Currency, ShoppingCartItemAvailabilityEnum } from 'app/api/models';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { FormGroup } from '@angular/forms';
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

  @Output() changeQuantity = new EventEmitter<[string, ShoppingCartItemDetailed]>();
  @Output() remove = new EventEmitter<ShoppingCartItemDetailed>();


  constructor(
    injector: Injector,
    private marketplaceHelper: MarketplaceHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.useForm) {
      this.form = this.formBuilder.group({});
      this.items.forEach(item => {
        const control = this.formBuilder.control(item.quantity, { updateOn: 'blur' });
        this.form.addControl(item.id, control);
        // Only after finishing initialization add a listener to form values to update the results. This avoids lifecycle loop.
        setTimeout(() => {
          this.addSub(control.valueChanges.pipe(debounceTime(this.ApiHelper.DEBOUNCE_TIME)).subscribe(value => {
            this.changeQuantity.emit([value, item]);
          }), true);
        }, 1);
      });
    }
  }

  /**
   * Returns if the quantity can be changed directly from the table
   */
  get useForm(): boolean {
    return this.detailed && this.layout.gtxs;
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
