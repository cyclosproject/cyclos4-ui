import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { NotificationLevelEnum, RunOperationResult } from 'app/api/models';
import { OperationsService } from 'app/api/services/operations.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Callback invoked after running an external redirect custom operation
 */
@Component({
  selector: 'operation-callback',
  templateUrl: 'operation-callback.component.html',
  styleUrls: ['operation-callback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationCallbackComponent
  extends BasePageComponent<RunOperationResult>
  implements OnInit {

  alertType = 'success';

  constructor(
    injector: Injector,
    private operationsService: OperationsService) {
    super(injector);
  }

  ngOnInit() {
    const route = this.route.snapshot;
    super.ngOnInit();
    this.addSub(this.operationsService.runCustomOperationCallback({
      id: route.params.id,
      token: route.params.token,
      body: {
        method: 'GET',
        parameters: route.queryParams,
      },
    }).subscribe(result => {
      if (result.notificationLevel === NotificationLevelEnum.WARNING) {
        this.alertType = 'warning';
      } else if (result.notificationLevel === NotificationLevelEnum.ERROR) {
        this.alertType = 'danger';
      }
      this.data = result;
    }));
  }

  resolveMenu() {
    return this.login.user ? Menu.DASHBOARD : Menu.HOME;
  }
}
