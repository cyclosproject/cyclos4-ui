import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsentFormComponent } from 'app/consent/consent-form.component';
import { NotFoundComponent } from 'app/shared/not-found.component';

const rootRoutes: Routes = [
  {
    path: ':id',
    component: ConsentFormComponent
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(rootRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class ConsentRoutingModule { }
