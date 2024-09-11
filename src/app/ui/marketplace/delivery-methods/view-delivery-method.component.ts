import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DeliveryMethodChargeTypeEnum, DeliveryMethodTypeEnum, DeliveryMethodView } from 'app/api/models';
import { DeliveryMethodsService } from 'app/api/services/delivery-methods.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Displays the information about a delivery method
 */
@Component({
  selector: 'view-delivery-method',
  templateUrl: 'view-delivery-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewDeliveryMethodComponent extends BaseViewPageComponent<DeliveryMethodView> implements OnInit {
  constructor(injector: Injector, private deliveryMethodService: DeliveryMethodsService) {
    super(injector);
  }

  id: string;
  self: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(
      this.deliveryMethodService.viewDeliveryMethod({ id: this.id }).subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: DeliveryMethodView) {
    this.self = this.authHelper.isSelfOrOwner(data.user);

    const actions = [];
    if (data.canEdit) {
      actions.push(
        new HeadingAction(
          SvgIcon.Pencil,
          this.i18n.general.edit,
          () => this.router.navigate(['/marketplace', 'delivery-methods', 'edit', this.id]),
          true
        )
      );
    }
    this.headingActions = actions;
  }

  /**
   * Resolves the label for fixed or negotiated delivery method
   */
  resolveChargeTypeLabel(): string {
    switch (this.data.chargeType) {
      case DeliveryMethodChargeTypeEnum.FIXED:
        return this.i18n.ad.fixed;
      case DeliveryMethodChargeTypeEnum.NEGOTIATED:
        return this.i18n.ad.negotiated;
    }
    return '';
  }

  /**
   * Resolves the label for deliver or pickup delivery method type
   */
  resolveDeliveryTypeLabel(): string {
    switch (this.data.deliveryType) {
      case DeliveryMethodTypeEnum.DELIVER:
        return this.i18n.ad.deliver;
      case DeliveryMethodTypeEnum.PICKUP:
        return this.i18n.ad.pickup;
    }
    return '';
  }

  resolveMenu(data: DeliveryMethodView) {
    return this.menu.userMenu(data.user, Menu.DELIVERY_METHODS);
  }
}
