import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ProductKind, ProductWithUserAccount, UserProductAssignmentData } from 'app/api/models';
import { ProductAssignmentService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty } from 'app/shared/helper';
import { BsModalService } from 'ngx-bootstrap/modal';

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
    private modal: BsModalService,
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
      headingActions.push(new HeadingAction('add', this.i18n.product.assignIndividualProduct, () => this.assign()));
    }

    if (data.history) {
      headingActions.push(new HeadingAction('history', this.i18n.general.viewHistory, () =>
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
    return this.authHelper.searchUsersMenu();
  }

  /**
    * Assign a product to the user
    */
  assign() {
    this.notification.confirm({
      title: this.i18n.product.assignIndividualProduct,
      labelPosition: 'above',
      customFields: [
        {
          internalName: 'products',
          name: this.i18n.product.product,
          type: CustomFieldTypeEnum.SINGLE_SELECTION,
          control: CustomFieldControlEnum.RADIO,
          hasValuesList: true,
          defaultValue: data.paymentTypes[0].id,
          possibleValues: data.paymentTypes.map(type => {
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
          order: this.id,
          body: {
            remarks: res.customValues.remarks,
          },
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.orderRejected);
          this.reload();
        }));
      },
    });
  }

  canRemove(product: ProductWithUserAccount) {
    // TODO
    return product !== null;
  }

  remove(product: ProductWithUserAccount) {
    // TODO
    if (product != null) {

    }
  }

}
