import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Currency, OrderDeliveryMethod, OrderItem } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
          const discount = this.formBuilder.control(this.calculateDiscount(row, +row.price));
          this.form.addControl(this.discount(row), discount);

          const price = this.formBuilder.control(row.price);
          this.form.addControl(this.price(row), price);

          this.addSub(discount.valueChanges
            .pipe(distinctUntilChanged(), debounceTime(550))
            .subscribe(val => this.applyDiscount(row, val)));
          this.addSub(price.valueChanges
            .pipe(distinctUntilChanged(), debounceTime(550))
            .subscribe(val => this.applyPrice(row, val)));

          this.form.addControl(this.quantity(row),
            this.formBuilder.control(row.quantity));
        });
      }
      this.data = data;
    });
  }

  protected applyDiscount(row: OrderItem, val: number) {
    let price: number;
    if (val < 0) {
      price = +row.product.price;
    } else if (val > 100) {
      price = 0;
    } else {
      price = +row.product.price - (+row.product.price * (val / 100));
    }
    this.form.controls[this.price(row)].setValue(price, { emitEvent: false });
  }

  protected applyPrice(row: OrderItem, val: number) {
    const discount = this.calculateDiscount(row, val);
    if (val > +row.price) {
      this.form.controls[this.price(row)].setValue(+row.price, { emitEvent: false, onlySelf: true });
    }
    this.form.controls[this.discount(row)].setValue(discount, { emitEvent: false });
  }

  calculateDiscount(row: OrderItem, price: number): number {
    const divide = (1 - (price / +row.product.price)) * 100;
    if (divide < 0) {
      return 0;
    } else if (divide > 100) {
      return 100;
    }
    return divide;
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
