import { NgModule } from '@angular/core';
import { AnswerFormComponent } from 'app/ui/marketplace/answer-form.component';
import { CartCheckoutComponent } from 'app/ui/marketplace/checkout/cart-checkout.component';
import { ListShoppingCartComponent } from 'app/ui/marketplace/checkout/list-shopping-cart.component';
import { ShoppingCartItemsComponent } from 'app/ui/marketplace/checkout/shopping-cart-items.component';
import { ViewCartComponent } from 'app/ui/marketplace/checkout/view-cart.component';
import { EditDeliveryMethodComponent } from 'app/ui/marketplace/delivery-methods/edit-delivery-method.component';
import { ListDeliveryMethodsComponent } from 'app/ui/marketplace/delivery-methods/list-delivery-methods.component';
import { SetDeliveryMethodComponent } from 'app/ui/marketplace/delivery-methods/set-delivery-method.component';
import { ViewDeliveryMethodComponent } from 'app/ui/marketplace/delivery-methods/view-delivery-method.component';
import { EditAdComponent } from 'app/ui/marketplace/edit-ad.component';
import { EditAdInterestComponent } from 'app/ui/marketplace/interests/edit-ad-interest.component';
import { ListAdInterestsComponent } from 'app/ui/marketplace/interests/list-ad-interests.component';
import { ViewAdInterestComponent } from 'app/ui/marketplace/interests/view-ad-interest.component';
import { MarketplaceRoutingModule } from 'app/ui/marketplace/marketplace-routing.module';
import { OrderProductsComponent } from 'app/ui/marketplace/order-products.component';
import { SaleFormComponent } from 'app/ui/marketplace/sale-form.component';
import { AdsResultsComponent } from 'app/ui/marketplace/search/ads-results.component';
import { SearchAdsComponent } from 'app/ui/marketplace/search/search-ads.component';
import { SearchOrdersComponent } from 'app/ui/marketplace/search/search-orders.component';
import { SearchProductsComponent } from 'app/ui/marketplace/search/search-products.component';
import { SearchUnansweredQuestionsComponent } from 'app/ui/marketplace/search/search-unanswered-questions.component';
import { ShowSubCategoriesComponent } from 'app/ui/marketplace/search/show-sub-categories.component';
import { UserAdsComponent } from 'app/ui/marketplace/search/user-ads.component';
import { EditWebshopSettingsComponent } from 'app/ui/marketplace/settings/edit-webshop-settings.component';
import { ViewWebshopSettingsComponent } from 'app/ui/marketplace/settings/view-webshop-settings.component';
import { ViewAdComponent } from 'app/ui/marketplace/view/view-ad.component';
import { ViewOrderHistoryComponent } from 'app/ui/marketplace/view/view-order-history.component';
import { ViewOrderComponent } from 'app/ui/marketplace/view/view-order.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Marketplace module
 */
@NgModule({
  imports: [
    MarketplaceRoutingModule,
    UiSharedModule
  ],
  exports: [],
  declarations: [
    SearchAdsComponent,
    UserAdsComponent,
    SearchOrdersComponent,
    AdsResultsComponent,
    EditAdComponent,
    ViewAdComponent,
    ViewOrderComponent,
    ViewOrderHistoryComponent,
    SaleFormComponent,
    ShowSubCategoriesComponent,
    SetDeliveryMethodComponent,
    ShoppingCartItemsComponent,
    ListShoppingCartComponent,
    ListDeliveryMethodsComponent,
    ListAdInterestsComponent,
    EditDeliveryMethodComponent,
    EditAdInterestComponent,
    ViewDeliveryMethodComponent,
    ViewAdInterestComponent,
    EditWebshopSettingsComponent,
    ViewWebshopSettingsComponent,
    SearchUnansweredQuestionsComponent,
    AnswerFormComponent,
    ViewCartComponent,
    CartCheckoutComponent,
    SearchProductsComponent,
    OrderProductsComponent,
  ],
  entryComponents: [
    ShowSubCategoriesComponent,
    SetDeliveryMethodComponent,
    SearchProductsComponent,
    OrderProductsComponent,
  ]
})
export class MarketplaceModule {
}
