import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RunOperationResult, NotificationLevelEnum } from 'app/api/models';
import { OperationsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { first } from 'rxjs/operators';

/**
 * Callback invoked after running an external redirect custom operation
 */
@Component({
  selector: 'operation-callback',
  templateUrl: 'operation-callback.component.html',
  styleUrls: ['operation-callback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
        parameters: route.queryParams
      }
    }).pipe(first()).subscribe(result => {
      if (result.notificationLevel === NotificationLevelEnum.WARNING) {
        this.alertType = 'warning';
      } else if (result.notificationLevel === NotificationLevelEnum.ERROR) {
        this.alertType = 'danger';
      }
      this.data = result;
    }));
  }
}

