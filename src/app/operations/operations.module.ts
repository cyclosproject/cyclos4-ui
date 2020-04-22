import { NgModule } from '@angular/core';
import { OperationCallbackComponent } from 'app/operations/operation-callback.component';
import { OperationsRoutingModule } from 'app/operations/operations-routing.module';
import { RunOperationComponent } from 'app/operations/run-operation.component';
import { SharedModule } from 'app/shared/shared.module';

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
    SharedModule,
  ],
})
export class OperationsModule { }
