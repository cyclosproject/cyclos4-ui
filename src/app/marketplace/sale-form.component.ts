import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { OrderDataForEdit, OrderDataForNew } from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorStatus } from 'app/core/error-status';

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

  constructor(
    injector: Injector,
    private orderService: OrdersService,
    private marketplaceHelper: MarketplaceHelperService) {
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
