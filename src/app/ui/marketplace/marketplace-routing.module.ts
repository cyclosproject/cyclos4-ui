import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnswerFormComponent } from 'app/ui/marketplace/answer-form.component';
import { CartCheckoutComponent } from 'app/ui/marketplace/checkout/cart-checkout.component';
import { ListShoppingCartComponent } from 'app/ui/marketplace/checkout/list-shopping-cart.component';
import { ViewCartComponent } from 'app/ui/marketplace/checkout/view-cart.component';
import { EditDeliveryMethodComponent } from 'app/ui/marketplace/delivery-methods/edit-delivery-method.component';
import { ListDeliveryMethodsComponent } from 'app/ui/marketplace/delivery-methods/list-delivery-methods.component';
import { ViewDeliveryMethodComponent } from 'app/ui/marketplace/delivery-methods/view-delivery-method.component';
import { EditAdComponent } from 'app/ui/marketplace/edit-ad.component';
import { EditAdInterestComponent } from 'app/ui/marketplace/interests/edit-ad-interest.component';
import { ListAdInterestsComponent } from 'app/ui/marketplace/interests/list-ad-interests.component';
import { ViewAdInterestComponent } from 'app/ui/marketplace/interests/view-ad-interest.component';
import { SaleFormComponent } from 'app/ui/marketplace/sale-form.component';
import { SearchAdsComponent } from 'app/ui/marketplace/search/search-ads.component';
import { SearchOrdersComponent } from 'app/ui/marketplace/search/search-orders.component';
import { SearchUnansweredQuestionsComponent } from 'app/ui/marketplace/search/search-unanswered-questions.component';
import { UserAdsComponent } from 'app/ui/marketplace/search/user-ads.component';
import { EditWebshopSettingsComponent } from 'app/ui/marketplace/settings/edit-webshop-settings.component';
import { ViewWebshopSettingsComponent } from 'app/ui/marketplace/settings/view-webshop-settings.component';
import { ViewAdComponent } from 'app/ui/marketplace/view/view-ad.component';
import { ViewOrderHistoryComponent } from 'app/ui/marketplace/view/view-order-history.component';
import { ViewOrderComponent } from 'app/ui/marketplace/view/view-order.component';

const marketplaceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchAdsComponent,
      },
      {
        path: ':user/:kind/list',
        component: UserAdsComponent,
      },
      {
        path: ':user/purchases',
        component: SearchOrdersComponent,
      },
      {
        path: ':user/sales',
        component: SearchOrdersComponent,
      },
      {
        path: 'sale/:id',
        component: SaleFormComponent,
      },
      {
        path: ':user/sale/new',
        component: SaleFormComponent,
      },
      {
        path: ':user/:kind/ad/new',
        component: EditAdComponent,
      },
      {
        path: 'view/:id',
        component: ViewAdComponent,
      },
      {
        path: 'edit/:id',
        component: EditAdComponent,
      },
      {
        path: 'order/:id',
        component: ViewOrderComponent,
      },
      {
        path: 'order/:id/history',
        component: ViewOrderHistoryComponent,
      },
      {
        path: 'shopping-cart',
        component: ListShoppingCartComponent,
      },
      {
        path: 'cart/:id',
        component: ViewCartComponent,
      },
      {
        path: 'checkout/:id',
        component: CartCheckoutComponent,
      },
      {
        path: ':user/delivery-methods',
        component: ListDeliveryMethodsComponent,
      },
      {
        path: ':user/ad-interests',
        component: ListAdInterestsComponent,
      },
      {
        path: 'delivery-methods/view/:id',
        component: ViewDeliveryMethodComponent,
      },
      {
        path: 'ad-interests/view/:id',
        component: ViewAdInterestComponent,
      },
      {
        path: 'delivery-methods/edit/:id',
        component: EditDeliveryMethodComponent,
      },
      {
        path: ':user/delivery-methods/new',
        component: EditDeliveryMethodComponent,
      },
      {
        path: ':user/ad-interests/new',
        component: EditAdInterestComponent,
      },
      {
        path: 'ad-interests/edit/:id',
        component: EditAdInterestComponent,
      },
      {
        path: ':user/webshop-settings/view',
        component: ViewWebshopSettingsComponent,
      },
      {
        path: ':user/webshop-settings/edit',
        component: EditWebshopSettingsComponent,
      },
      {
        path: 'unanswered-questions',
        component: SearchUnansweredQuestionsComponent,
      },
      {
        path: 'unanswered-questions/view/:id',
        component: AnswerFormComponent,
      },
    ],
  },
];

/**
 * * Routes for the marketplace module
 */
@NgModule({
  imports: [
    RouterModule.forChild(marketplaceRoutes),
  ],
  exports: [
    RouterModule,
  ],
})
export class MarketplaceRoutingModule {
}
