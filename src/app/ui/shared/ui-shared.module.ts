import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { HeadingActionButtonComponent } from 'app/ui/shared//heading-action-button.component';
import { HeadingActionsComponent } from 'app/ui/shared//heading-actions.component';
import { HeadingSubActionsComponent } from 'app/ui/shared//heading-sub-actions.component';
import { MapResultComponent } from 'app/ui/shared//map-result.component';
import { MaxDistanceFieldComponent } from 'app/ui/shared//max-distance-field.component';
import { MobileResultComponent } from 'app/ui/shared//mobile-result.component';
import { MobileResultDirective } from 'app/ui/shared//mobile-result.directive';
import { PageContentComponent } from 'app/ui/shared//page-content.component';
import { PaginatorComponent } from 'app/ui/shared//paginator.component';
import { ResultCategoryDirective } from 'app/ui/shared//result-category.directive';
import { ResultInfoWindowDirective } from 'app/ui/shared//result-info-window.directive';
import { ResultTableDirective } from 'app/ui/shared//result-table.directive';
import { ResultTileDirective } from 'app/ui/shared//result-tile.directive';
import { ResultTypeFieldComponent } from 'app/ui/shared//result-type-field.component';
import { ResultsLayoutComponent } from 'app/ui/shared//results-layout.component';
import { SideMenuComponent } from 'app/ui/shared//side-menu.component';
import { StaticMapComponent } from 'app/ui/shared//static-map.component';
import { TiledResultComponent } from 'app/ui/shared//tiled-result.component';
import { AcceptAgreementsComponent } from 'app/ui/shared/accept-agreements.component';
import { ActionsToolbarComponent } from 'app/ui/shared/actions-toolbar.component';
import { AddressDetailsComponent } from 'app/ui/shared/address-details.component';
import { AddressFormComponent } from 'app/ui/shared/address-form.component';
import { AgreementsContentDialogComponent } from 'app/ui/shared/agreement-content-dialog.component';
import { AgreementLinkComponent } from 'app/ui/shared/agreement-link.component';
import { BannerCardComponent } from 'app/ui/shared/banner-card.component';
import { FieldPrivacyComponent } from 'app/ui/shared/field-privacy.component';
import { PageLayoutComponent } from 'app/ui/shared/page-layout.component';
import { ProfileAddressesComponent } from 'app/ui/shared/profile-addresses.component';
import { ProfileImagesComponent } from 'app/ui/shared/profile-images.component';
import { RatingStatsComponent } from 'app/ui/shared/rating-stats.component';
import { ShowContentComponent } from 'app/ui/shared/show-content.component';
import { UserInfoComponent } from 'app/ui/shared/user-info.component';
import { UserLinkComponent } from 'app/ui/shared/user-link.component';
import { NotificationTypeSettingComponent } from 'app/ui/users/notification-settings/notification-type-setting.component';
import { TooltipConfig } from 'ngx-bootstrap/tooltip';



export function initTooltipConfig(): TooltipConfig {
  const config = new TooltipConfig();
  config.placement = 'bottom';
  config.container = 'body';
  return config;
}

/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    BannerCardComponent,
    ShowContentComponent,
    AddressDetailsComponent,
    AddressFormComponent,
    FieldPrivacyComponent,
    ProfileAddressesComponent,
    ProfileImagesComponent,
    UserLinkComponent,
    UserInfoComponent,
    RatingStatsComponent,
    AcceptAgreementsComponent,
    AgreementLinkComponent,
    AgreementsContentDialogComponent,
    ActionsToolbarComponent,
    StaticMapComponent,
    MapResultComponent,
    MobileResultComponent,
    SideMenuComponent,
    PageLayoutComponent,
    PageContentComponent,
    HeadingActionsComponent,
    HeadingActionButtonComponent,
    HeadingSubActionsComponent,
    ResultsLayoutComponent,
    TiledResultComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    MobileResultDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    PaginatorComponent,
    MaxDistanceFieldComponent,
    ResultTypeFieldComponent,
    NotificationTypeSettingComponent
  ],
  imports: [
    SharedModule,
  ],
  exports: [
    SharedModule,

    BannerCardComponent,
    ShowContentComponent,
    AddressDetailsComponent,
    AddressFormComponent,
    FieldPrivacyComponent,
    ProfileAddressesComponent,
    ProfileImagesComponent,
    UserLinkComponent,
    UserInfoComponent,
    RatingStatsComponent,
    AcceptAgreementsComponent,
    AgreementLinkComponent,
    AgreementsContentDialogComponent,
    ActionsToolbarComponent,
    StaticMapComponent,
    MapResultComponent,
    MobileResultComponent,
    SideMenuComponent,
    PageLayoutComponent,
    PageContentComponent,
    HeadingActionsComponent,
    HeadingActionButtonComponent,
    HeadingSubActionsComponent,
    ResultsLayoutComponent,
    TiledResultComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    MobileResultDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    PaginatorComponent,
    MaxDistanceFieldComponent,
    ResultTypeFieldComponent,
    NotificationTypeSettingComponent
  ],
  providers: [
    { provide: TooltipConfig, useFactory: initTooltipConfig },
  ],
  entryComponents: [
    AgreementsContentDialogComponent,
  ],
})
export class UiSharedModule {
}
