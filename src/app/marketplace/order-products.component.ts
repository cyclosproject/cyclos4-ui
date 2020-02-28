import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Currency, OrderDeliveryMethod, OrderItem } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

/**
 * A component which display a list of order products and allows to apply a discount and change quantity
 */
@Component({
  selector: 'order-products',
  templateUrl: 'order-products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderProductsComponent extends BaseComponent implements OnInit {

  @Input() products$: BehaviorSubject<OrderItem[]>;
  @Input() deliveryMethod$: BehaviorSubject<OrderDeliveryMethod>;
  @Input() currency: Currency;

  data$ = new BehaviorSubject<OrderItem[]>(null);
  form: FormGroup;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.products$.subscribe(data => {
      // See https://github.com/angular/angular/issues/14057#issuecomment-308270313
      this.form = this.formBuilder.group({});
      if (!empty(data)) {
        data.forEach(row => {
          this.form.addControl(this.discount(row),
            this.formBuilder.control(this.calculateDiscount(row)));
          this.form.addControl(this.price(row),
            this.formBuilder.control(row.price));
          this.form.addControl(this.quantity(row),
            this.formBuilder.control(row.quantity));
        });
      }
      this.data = data;
    });
  }

  calculateDiscount(row: OrderItem): number {
    if (row) {

    }
    return 0;
  }

  discount(row: OrderItem) {
    return row.product.id + '_discount';
  }
  quantity(row: OrderItem) {
    return row.product.id + '_quantity';
  }
  price(row: OrderItem) {
    return row.product.id + '_price';
  }

  rowTotal(row: OrderItem): number {
    const quantity = this.form.value[this.quantity(row)];
    // Assume price is already synced with discount
    const price = this.form.value[this.price(row)];
    return quantity * price;
  }

  get subtotal(): number {
    let sub = 0;
    this.data$.value.forEach(row => sub += this.rowTotal(row));
    return sub;
  }

  get total(): number {
    const price = this.deliveryMethod ? this.deliveryMethod.price : '';
    return this.subtotal + (empty(price) ? 0 : +price);
  }

  get deliveryMethod(): OrderDeliveryMethod {
    return this.deliveryMethod$.value;
  }

  get data(): OrderItem[] {
    return this.data$.value;
  }
  set data(value: OrderItem[]) {
    this.data$.next(value);
  }

  navigate(row: OrderItem) {
    return this.router.navigate(['/marketplace', 'view', row.product.id]);
  }

  remove(row: OrderItem) {
    const products = this.products$.value.filter(p => p.product.id !== row.product.id);
    this.products$.next(products);
  }
}
