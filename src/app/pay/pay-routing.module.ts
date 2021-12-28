import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';
import { ContentPageGuard } from 'app/ui/content-page-guard';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';

const rootRoutes: Routes = [
  {
    path: '**',
    component: NotFoundComponent,
  },
];

/**
 * Module that defines the application routing
 */
@NgModule({
  imports: [
    RouterModule.forRoot(rootRoutes, {
      onSameUrlNavigation: 'reload',
      preloadingStrategy: PreloadAllModules,
    }),
    SharedModule,
  ],
  exports: [
    RouterModule,
  ],
  providers: [
    LoggedUserGuard,
    ContentPageGuard,
  ],
})
export class PayRoutingModule { }
