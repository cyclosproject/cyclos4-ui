import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { OperationCallbackComponent } from 'app/operations/operation-callback.component';
import { OperationRunScope } from 'app/operations/operation-run-scope';
import { RunOperationComponent } from 'app/operations/run-operation.component';

const operationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'system/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Standalone
        }
      },
      {
        path: 'self/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.User
        }
      },
      {
        path: 'action/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Standalone
        }
      },
      {
        path: 'user/:user/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.User
        }
      },
      {
        path: 'marketplace/:ad/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Ad
        }
      },
      {
        path: 'record/:record/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Record
        }
      },
      {
        path: 'transfer/:transfer/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          runScope: OperationRunScope.Transfer
        }
      },
      {
        path: 'callback/:id/:token',
        component: OperationCallbackComponent
      }
    ]
  }
];

/**
 * * Routes for the personal module
 */
@NgModule({
  imports: [
    RouterModule.forChild(operationRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class OperationsRoutingModule {
}
