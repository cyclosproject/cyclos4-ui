import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnswerFormComponent } from 'app/marketplace/answer-form.component';
import { CartCheckoutComponent } from 'app/marketplace/checkout/cart-checkout.component';
import { ListShoppingCartComponent } from 'app/marketplace/checkout/list-shopping-cart.component';
import { ViewCartComponent } from 'app/marketplace/checkout/view-cart.component';
import { EditDeliveryMethodComponent } from 'app/marketplace/delivery-methods/edit-delivery-method.component';
import { ListDeliveryMethodsComponent } from 'app/marketplace/delivery-methods/list-delivery-methods.component';
import { ViewDeliveryMethodComponent } from 'app/marketplace/delivery-methods/view-delivery-method.component';
import { EditAdComponent } from 'app/marketplace/edit-ad.component';
import { EditAdInterestComponent } from 'app/marketplace/interests/edit-ad-interest.component';
import { ListAdInterestsComponent } from 'app/marketplace/interests/list-ad-interests.component';
import { ViewAdInterestComponent } from 'app/marketplace/interests/view-ad-interest.component';
import { SaleFormComponent } from 'app/marketplace/sale-form.component';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { SearchOrdersComponent } from 'app/marketplace/search/search-orders.component';
import { SearchUnansweredQuestionsComponent } from 'app/marketplace/search/search-unanswered-questions.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { EditWebshopSettingsComponent } from 'app/marketplace/settings/edit-webshop-settings.component';
import { ViewWebshopSettingsComponent } from 'app/marketplace/settings/view-webshop-settings.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { ViewOrderHistoryComponent } from 'app/marketplace/view/view-order-history.component';
import { ViewOrderComponent } from 'app/marketplace/view/view-order.component';

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
