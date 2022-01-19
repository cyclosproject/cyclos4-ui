import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActionButtonComponent } from 'app/shared/action-button.component';
import { ActionsComponent } from 'app/shared/actions.component';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';
import { FloatLabelsComponent } from 'app/shared/float-labels.component';
import { FocusedDirective } from 'app/shared/focused.directive';
import { IconComponent } from 'app/shared/icon.component';
import { InformationTextComponent } from 'app/shared/information-text.component';
import { LabelValueComponent } from 'app/shared/label-value.component';
import { MaybeLinkComponent } from 'app/shared/maybe-link.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { NotificationComponent } from 'app/shared/notification.component';
import { SnackBarComponent } from 'app/shared/snack-bar.component';
import { SpinnerComponent } from 'app/shared/spinner.component';
import { TrustPipe } from 'app/shared/trust.pipe';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipConfig, TooltipModule } from 'ngx-bootstrap/tooltip';

export function initTooltipConfig(): TooltipConfig {
  const config = new TooltipConfig();
  config.placement = 'bottom';
  config.container = 'body';
  return config;
}

/**
 * Module that configures UI basic elements, used by other apps
 */
@NgModule({
  declarations: [
    FocusedDirective,

    NotFoundComponent,
    NotificationComponent,
    SnackBarComponent,
    IconComponent,
    MaybeLinkComponent,
    SpinnerComponent,
    ActionsComponent,
    LabelValueComponent,
    InformationTextComponent,
    FloatLabelsComponent,
    ExtraCellDirective,
    ActionButtonComponent,

    TrustPipe,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AlertModule.forRoot(),
    ModalModule.forRoot(),
    ButtonsModule.forRoot(),
    TooltipModule.forRoot(),

    LayoutModule,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AlertModule,
    ModalModule,
    ButtonsModule,
    TooltipModule,

    LayoutModule,

    NotFoundComponent,
    NotificationComponent,
    SnackBarComponent,
    IconComponent,
    MaybeLinkComponent,
    SpinnerComponent,
    ActionsComponent,
    LabelValueComponent,
    InformationTextComponent,
    FloatLabelsComponent,
    ExtraCellDirective,
    ActionButtonComponent,

    FocusedDirective,

    TrustPipe,
  ],
  providers: [
    { provide: TooltipConfig, useFactory: initTooltipConfig },
  ],
  entryComponents: [
    NotificationComponent,
  ],
})
export class SharedBasicModule {
}
