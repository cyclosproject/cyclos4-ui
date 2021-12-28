import { NgModule } from '@angular/core';
import { OperationCallbackComponent } from 'app/ui/operations/operation-callback.component';
import { OperationsRoutingModule } from 'app/ui/operations/operations-routing.module';
import { RunOperationComponent } from 'app/ui/operations/run-operation.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module for running custom operations
 */
@NgModule({
  declarations: [
    RunOperationComponent,
    OperationCallbackComponent,
  ],
  imports: [
    OperationsRoutingModule,
    UiSharedModule,
  ],
})
export class OperationsModule { }
