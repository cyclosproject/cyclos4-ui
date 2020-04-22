import { NgModule } from '@angular/core';
import { ContentPageComponent } from 'app/content/content-page.component';
import { SharedModule } from 'app/shared/shared.module';

/**
 * Module comprising the content functionality
 */
@NgModule({
  declarations: [
    ContentPageComponent,
  ],
  imports: [
    SharedModule,
  ],
})
export class ContentModule { }
