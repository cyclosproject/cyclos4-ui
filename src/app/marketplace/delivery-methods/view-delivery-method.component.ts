import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { DeliveryMethodView } from 'app/api/models';
import { DeliveryMethodsService } from 'app/api/services';
import { Menu } from 'app/shared/menu';

/**
 * Displays the information about delivery method
 */
@Component({
  selector: 'view-delivery-method',
  templateUrl: 'view-delivery-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewDeliveryMethodComponent extends BaseViewPageComponent<DeliveryMethodView> implements OnInit {
  constructor(
    injector: Injector,
    private deliveryMethodService: DeliveryMethodsService) {
    super(injector);
  }

  param: string;
  self: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.id;
    this.addSub(this.deliveryMethodService.viewDeliveryMethod({ id: this.param }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: DeliveryMethodView) {
    const actions = [];
    if (data.edit) {
      actions.push(new HeadingAction('history', this.i18n.general.viewHistory, () =>
        this.router.navigate(['users', this.param, 'group', 'history']), true));
    }
    this.headingActions = actions;
  }

  resolveMenu() {
    // TODO missing user
    return Menu.DELIVERY_METHODS;
  }

}
