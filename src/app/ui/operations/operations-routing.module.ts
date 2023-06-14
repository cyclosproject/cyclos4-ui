import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { OperationCallbackComponent } from 'app/ui/operations/operation-callback.component';
import { OperationRunScope } from 'app/ui/operations/operation-run-scope';
import { RunOperationComponent } from 'app/ui/operations/run-operation.component';

const operationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'system/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Standalone,
        },
      },
      {
        path: 'self/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.User,
        },
      },
      {
        path: 'action/:operation',
        component: RunOperationComponent,
        data: {
          action: true,
          runScope: OperationRunScope.Standalone,
        },
      },
      {
        path: 'user/:user/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.User,
        },
      },
      {
        path: 'marketplace/:ad/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Ad,
        },
      },
      {
        path: 'record/:record/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Record,
        },
      },
      {
        path: 'transfer/:transfer/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Transfer,
        },
      },
      {
        path: 'menu/:menu/:operation',
        component: RunOperationComponent,
        data: {
          runScope: OperationRunScope.Menu,
        },
      },
      {
        path: 'callback/:id/:token',
        component: OperationCallbackComponent,
      },
    ],
  },
];

/**
 * * Routes for the wizards module
 */
@NgModule({
  imports: [
    RouterModule.forChild(operationRoutes),
  ],
  exports: [
    RouterModule,
  ],
})
export class OperationsRoutingModule {
}
