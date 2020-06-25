import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserProductAssignmentData, ProductAssignmentActionEnum } from 'app/api/models';
import { ProductAssignmentService } from 'app/api/services';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

@Component({
  selector: 'view-product-assignment-history',
  templateUrl: 'view-product-assignment-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewProductAssignmentHistoryComponent extends BaseViewPageComponent<UserProductAssignmentData> implements OnInit {

  ProductAssignmentActionEnum = ProductAssignmentActionEnum;

  constructor(
    injector: Injector,
    private productAssignmentSerivce: ProductAssignmentService) {
    super(injector);
  }

  user: string;

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.productAssignmentSerivce.getUserProductsData({ user: this.user, fields: ['user', 'history'] })
      .subscribe(data => this.data = data));
  }

  get onClick() {
    // No op condition to disable built-in click (mobile layout)
    return (row: any) => row != null;
  }

  resolveMenu(data: UserProductAssignmentData) {
    return this.authHelper.searchUsersMenu(data.user);
  }
}
