import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  DeliveryMethod,
  DeliveryMethodChargeTypeEnum,
  DeliveryMethodTypeEnum,
  UserDeliveryMethodsListData
} from 'app/api/models';
import { DeliveryMethodsService } from 'app/api/services/delivery-methods.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * List of delivery methods available for webshop products
 */
@Component({
  selector: 'list-delivery-methods',
  templateUrl: 'list-delivery-methods.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListDeliveryMethodsComponent extends BasePageComponent<UserDeliveryMethodsListData> implements OnInit {
  self: boolean;
  param: string;

  constructor(injector: Injector, private deliveryMethodService: DeliveryMethodsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || this.ApiHelper.SELF;

    this.addSub(
      this.deliveryMethodService.getUserDeliveryMethodsListData({ user: this.param }).subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: UserDeliveryMethodsListData) {
    this.self = this.authHelper.isSelfOrOwner(data.user);

    if (data.canCreate) {
      this.headingActions = [
        new HeadingAction(
          SvgIcon.PlusCircle,
          this.i18n.general.addNew,
          () => {
            this.router.navigate(['/marketplace', this.param, 'delivery-methods', 'new']);
          },
          true
        )
      ];
    }
  }

  viewPath(deliveryMethod: DeliveryMethod) {
    return ['/marketplace', 'delivery-methods', 'view', deliveryMethod.id];
  }

  get toLink() {
    return (deliveryMethod: DeliveryMethod) => this.viewPath(deliveryMethod);
  }

  remove(deliveryMethod: DeliveryMethod) {
    this.confirmation.confirm({
      message: this.i18n.general.removeConfirm(deliveryMethod.name),
      callback: () => this.doRemove(deliveryMethod)
    });
  }

  private doRemove(deliveryMethod: DeliveryMethod) {
    this.addSub(
      this.deliveryMethodService.deleteDeliveryMethod({ id: deliveryMethod.id }).subscribe(() => {
        this.notification.snackBar(this.i18n.general.removeDone(deliveryMethod.name));
        this.reload();
      })
    );
  }

  /**
   * Resolves the label for fixed or negotiated delivery method
   */
  resolveChargeTypeLabel(type: DeliveryMethodChargeTypeEnum): string {
    switch (type) {
      case DeliveryMethodChargeTypeEnum.FIXED:
        return this.i18n.ad.fixed;
      case DeliveryMethodChargeTypeEnum.NEGOTIATED:
        return this.i18n.ad.negotiated;
    }
    return '';
  }

  /**
   * Resolves the label for deliver or pickup delivery method
   */
  resolveDeliveryTypeLabel(type: DeliveryMethodTypeEnum): string {
    switch (type) {
      case DeliveryMethodTypeEnum.DELIVER:
        return this.i18n.ad.deliver;
      case DeliveryMethodTypeEnum.PICKUP:
        return this.i18n.ad.pickup;
    }
    return '';
  }

  resolveMenu(data: UserDeliveryMethodsListData) {
    return this.menu.userMenu(data.user, Menu.DELIVERY_METHODS);
  }
}
