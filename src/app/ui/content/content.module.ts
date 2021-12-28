import { NgModule } from '@angular/core';
import { ContentPageComponent } from 'app/ui/content/content-page.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module comprising the content functionality
 */
@NgModule({
  declarations: [
    ContentPageComponent,
  ],
  imports: [
    UiSharedModule,
  ],
})
export class ContentModule { }
