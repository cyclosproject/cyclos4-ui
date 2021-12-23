import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  CustomFieldControlEnum, CustomFieldTypeEnum, ProductKind,
  ProductWithUserAccount, UserProductAssignmentData
} from 'app/api/models';
import { ProductAssignmentService } from 'app/api/services/product-assignment.service';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { empty } from 'app/shared/helper';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Displays the products of an owner including self, group and group set assignments.
 */
@Component({
  selector: 'list-product-assignment',
  templateUrl: 'list-product-assignment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListProductAssignmentComponent extends BasePageComponent<UserProductAssignmentData> implements OnInit {

  empty = empty;
  private user: string;

  constructor(
    injector: Injector,
    private productAssignmentService: ProductAssignmentService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.productAssignmentService.getUserProductsData({ user: this.user }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserProductAssignmentData) {
    const headingActions: HeadingAction[] = [];

    if (data.assignable) {
      headingActions.push(new HeadingAction(SvgIcon.PlusCircle, this.i18n.product.assignIndividualProduct, () => this.assign()));
    }

    if (data.history) {
      headingActions.push(new HeadingAction(SvgIcon.Clock, this.i18n.general.viewHistory, () =>
        this.router.navigate(['/users', this.user, 'product-assignment', 'history'])));
    }

    this.headingActions = headingActions;
  }

  resolveKindLabel(kind: ProductKind) {
    switch (kind) {
      case ProductKind.ADMINISTRATOR:
        return this.i18n.product.kind.administrator;
      case ProductKind.BROKER:
        return this.i18n.product.kind.broker;
      case ProductKind.MEMBER:
        return this.i18n.product.kind.member;
    }
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }

  /**
   * Assign a product to the user
   */
  assign() {
    this.confirmation.confirm({
      title: this.i18n.product.assignIndividualProduct,
      labelPosition: 'above',
      customFields: [
        {
          internalName: 'products',
          name: this.i18n.product.product,
          type: CustomFieldTypeEnum.SINGLE_SELECTION,
          control: CustomFieldControlEnum.SINGLE_SELECTION,
          hasValuesList: true,
          defaultValue: this.data.assignable[0].id,
          possibleValues: this.data.assignable.map(type => {
            return {
              id: type.id,
              value: type.name,
            };
          }),
          required: true,
        }
      ],
      callback: res => {
        this.addSub(this.productAssignmentService.assignIndividualProduct({
          product: res.customValues.products,
          user: this.user
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.product.productAssigned);
          this.reload();
        }));
      },
    });
  }

  /**
   * Checks if the given product is unnasignable
   */
  canRemove(product: ProductWithUserAccount) {
    return this.data.unassignable.find(a => product.id === a || product.internalName === a);
  }

  /**
   * Removes the given product from the user's individuals products
   */
  remove(product: ProductWithUserAccount) {
    this.confirmation.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => {
        this.addSub(this.productAssignmentService.unassignIndividualProduct({ product: product.id, user: this.user })
          .subscribe(() => {
            this.notification.snackBar(this.i18n.general.removeItemDone);
            this.reload();
          }));
      },
    });
  }

}
