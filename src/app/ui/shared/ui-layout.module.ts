import { NgModule } from '@angular/core';
import { HeadingActionButtonComponent } from 'app/shared/heading-action-button.component';
import { IconWithCounterComponent } from 'app/shared/icon-with-counter.component';
import { SharedModule } from 'app/shared/shared.module';
import { ActionsToolbarComponent } from 'app/ui/shared/actions-toolbar.component';
import { BannerComponent } from 'app/ui/shared/banner.component';
import { HeadingActionsComponent } from 'app/ui/shared/heading-actions.component';
import { HeadingSubActionsComponent } from 'app/ui/shared/heading-sub-actions.component';
import { PageContentComponent } from 'app/ui/shared/page-content.component';
import { PageLayoutComponent } from 'app/ui/shared/page-layout.component';
import { SideMenuComponent } from 'app/ui/shared/side-menu.component';

/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    BannerComponent,
    SideMenuComponent,
    PageLayoutComponent,
    PageContentComponent,
    HeadingActionsComponent,
    HeadingActionButtonComponent,
    HeadingSubActionsComponent,
    IconWithCounterComponent,
    ActionsToolbarComponent,
  ],
  imports: [
    SharedModule,
  ],
  exports: [
    SharedModule,

    BannerComponent,
    SideMenuComponent,
    PageLayoutComponent,
    PageContentComponent,
    HeadingActionsComponent,
    HeadingActionButtonComponent,
    HeadingSubActionsComponent,
    IconWithCounterComponent,
    ActionsToolbarComponent,
  ]
})
export class UiLayoutModule {
}
