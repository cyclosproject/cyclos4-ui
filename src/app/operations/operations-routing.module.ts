import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { RunOperationComponent } from 'app/operations/run-operation.component';
import { ApiHelper } from 'app/shared/api-helper';
import { ConditionalMenu, Menu } from 'app/shared/menu';
import { trim } from 'lodash';
import { OperationRunScope } from 'app/operations/operation-run-scope';
import { OperationCallbackComponent } from 'app/operations/operation-callback.component';

/**
 * A conditional menu resolver for content, which finds the content page by slug to resolve the correct menu
 */
const OperationMenu: ConditionalMenu = injector => {
  // The scope depends on the URL
  const url = injector.get(Router).url;
  // The first part is always the kind, and the last path part is always the operation key
  const parts = trim(url, '/').split('/');
  if (parts.length === 1) {
    // Invalid URL
    return null;
  }
  const kind = parts[1];
  const key = parts[parts.length - 1];

  switch (kind) {
    case 'system':
    case 'self':
      // This is an owner operation
      const operation = injector.get(OperationHelperService).get(key);
      return operation ? ApiHelper.menuForOwnerOperation(operation) : null;
    case 'action':
      // An action
      return Menu.RUN_ACTION_OPERATION;
    case 'user':
      // An operation over a user
      return Menu.RUN_USER_OPERATION;
    case 'marketplace':
      // An operation over an advertisement
      return Menu.RUN_MARKETPLACE_OPERATION;
    case 'transfer':
      // An operation over a transfer
      return Menu.RUN_TRANSFER_OPERATION;
  }
  // Invalid URL
  return null;
};

const operationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'system/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: OperationMenu,
          runScope: OperationRunScope.Standalone
        }
      },
      {
        path: 'self/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: OperationMenu,
          runScope: OperationRunScope.User
        }
      },
      {
        path: 'action/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_PROFILE,
          runScope: OperationRunScope.Standalone
        }
      },
      {
        path: 'user/:user/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.RUN_USER_OPERATION,
          runScope: OperationRunScope.User
        }
      },
      {
        path: 'marketplace/:ad/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.RUN_MARKETPLACE_OPERATION,
          runScope: OperationRunScope.Ad
        }
      },
      {
        path: 'transfer/:transfer/:operation',
        component: RunOperationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.RUN_TRANSFER_OPERATION,
          runScope: OperationRunScope.Transfer
        }
      },
      {
        path: 'callback/:id/:token',
        component: OperationCallbackComponent,
        data: {
          menu: Menu.RUN_OPERATION_BANKING
        }
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
