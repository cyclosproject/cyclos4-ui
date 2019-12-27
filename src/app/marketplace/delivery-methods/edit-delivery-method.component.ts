import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DeliveryMethodDataForEdit, DeliveryMethodDataForNew } from 'app/api/models';
import { DeliveryMethodsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FormGroup } from '@angular/forms';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Observable } from 'rxjs';
import { Menu } from 'app/shared/menu';

/**
 * Assigns a broker to an user
 */
@Component({
  selector: 'edit-delivery-method',
  templateUrl: 'edit-delivery-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditDeliveryMethodComponent
  extends BasePageComponent<DeliveryMethodDataForNew | DeliveryMethodDataForEdit>
  implements OnInit {

  id: string;
  user: string;
  create: boolean;
  self: boolean;
  form: FormGroup;
  userQuery: any;

  constructor(
    injector: Injector,
    private deliveryMethodService: DeliveryMethodsService) {
    super(injector);
    this.form = this.formBuilder.group({});
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.id = this.route.snapshot.params.id;
    this.create = this.id == null;

    const request: Observable<DeliveryMethodDataForNew | DeliveryMethodDataForEdit> = this.create
      ? this.deliveryMethodService.getDeliveryMethodDataForNew({
        user: this.user
      })
      : this.deliveryMethodService.getDeliveryMethodDataForEdit({ id: this.id });
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));
  }


  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;
    const request: Observable<String | void> = this.create ?
      this.deliveryMethodService.createDeliveryMethod({ body: value, user: this.user }) :
      this.deliveryMethodService.updateDeliveryMethod({ id: this.id, body: value });
    this.addSub(request.subscribe(() => {
      /*this.notification.snackBar(this.i18n.brokers.brokerAdded);
      this.router.navigate(['/users', this.user, 'brokers']);*/
    }));
  }

  resolveMenu(data: DeliveryMethodDataForNew | DeliveryMethodDataForEdit) {
    return this.authHelper.userMenu(data.user, Menu.DELIVERY_METHODS);
  }
}
