import { NgModule } from '@angular/core';
import { AnswerFormComponent } from 'app/marketplace/answer-form.component';
import { CartCheckoutComponent } from 'app/marketplace/checkout/cart-checkout.component';
import { ListShoppingCartComponent } from 'app/marketplace/checkout/list-shopping-cart.component';
import { ShoppingCartItemsComponent } from 'app/marketplace/checkout/shopping-cart-items.component';
import { ViewCartComponent } from 'app/marketplace/checkout/view-cart.component';
import { EditDeliveryMethodComponent } from 'app/marketplace/delivery-methods/edit-delivery-method.component';
import { ListDeliveryMethodsComponent } from 'app/marketplace/delivery-methods/list-delivery-methods.component';
import { SetDeliveryMethodComponent } from 'app/marketplace/delivery-methods/set-delivery-method.component';
import { ViewDeliveryMethodComponent } from 'app/marketplace/delivery-methods/view-delivery-method.component';
import { EditAdComponent } from 'app/marketplace/edit-ad.component';
import { EditAdInterestComponent } from 'app/marketplace/interests/edit-ad-interest.component';
import { ListAdInterestsComponent } from 'app/marketplace/interests/list-ad-interests.component';
import { ViewAdInterestComponent } from 'app/marketplace/interests/view-ad-interest.component';
import { MarketplaceRoutingModule } from 'app/marketplace/marketplace-routing.module';
import { OrderProductsComponent } from 'app/marketplace/order-products.component';
import { SaleFormComponent } from 'app/marketplace/sale-form.component';
import { AdsResultsComponent } from 'app/marketplace/search/ads-results.component';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { SearchOrdersComponent } from 'app/marketplace/search/search-orders.component';
import { SearchProductsComponent } from 'app/marketplace/search/search-products.component';
import { SearchUnansweredQuestionsComponent } from 'app/marketplace/search/search-unanswered-questions.component';
import { ShowSubCategoriesComponent } from 'app/marketplace/search/show-sub-categories.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { EditWebshopSettingsComponent } from 'app/marketplace/settings/edit-webshop-settings.component';
import { ViewWebshopSettingsComponent } from 'app/marketplace/settings/view-webshop-settings.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { ViewOrderHistoryComponent } from 'app/marketplace/view/view-order-history.component';
import { ViewOrderComponent } from 'app/marketplace/view/view-order.component';
import { SharedModule } from 'app/shared/shared.module';

/**
 * Marketplace module
 */
@NgModule({
  imports: [
    MarketplaceRoutingModule,
    SharedModule,
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
  ],
})
export class MarketplaceModule {
}
