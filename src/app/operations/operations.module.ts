import { NgModule } from '@angular/core';
import { RunOperationComponent } from 'app/operations/run-operation.component';
import { SharedModule } from 'app/shared/shared.module';
import { OperationsRoutingModule } from 'app/operations/operations-routing.module';

/**
 * Module for running custom operations
 */
@NgModule({
  declarations: [
    RunOperationComponent
  ],
  imports: [
    OperationsRoutingModule,
    SharedModule
  ]
})
export class OperationsModule { }
