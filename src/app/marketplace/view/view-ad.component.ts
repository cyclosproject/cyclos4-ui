import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdCategoryWithParent, AdKind, AdQuestionView, AdView,
  DeliveryMethod, DeliveryMethodChargeTypeEnum, RoleEnum,
} from 'app/api/models';
import { AdQuestionsService, MarketplaceService, ShoppingCartsService } from 'app/api/services';
import { LoginService } from 'app/core/login.service';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { empty, words } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { TextDialogComponent } from 'app/shared/text-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';

/**
 * Displays an advertisement details
 */
@Component({
  selector: 'view-ad',
  templateUrl: 'view-ad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAdComponent extends BaseViewPageComponent<AdView> implements OnInit {

  title: string;
  id: string;
  webshop: boolean;
  guest: boolean;
  hasStatus: boolean;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private operationHelper: OperationHelperService,
    private loginService: LoginService,
    private adQuestionService: AdQuestionsService,
    private marketplaceHelper: MarketplaceHelperService,
    private marketplaceService: MarketplaceService,
    private shoppingCartService: ShoppingCartsService) {
    super(injector);
  }

  get ad(): AdView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.guest = this.loginService.user == null;
    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.marketplaceService.viewAd({ ad: this.id })
      .subscribe(ad => {
        this.data = ad;
      }));
  }

  /**
   * Removes this advertisement and goes back to the list page
   */
  protected doRemove() {
    this.addSub(this.marketplaceService.deleteAd({ ad: this.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(this.ad.name));
      history.back();
    }));
  }

  /**
   * Executes the given request, displays the given message and reloads page after finish
   */
  protected updateStatus(request: Observable<any>, message: string, checkRole?: boolean) {
    this.addSub(request.subscribe(() => {
      this.notification.snackBar(message);
      if (checkRole &&
        (this.dataForUiHolder.role === RoleEnum.BROKER &&
          !this.authHelper.isSelfOrOwner(this.data.user)) ||
        this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR) {
        // A broker or admin cannot view the ad after perform
        // some actions (e.g set it to draft, reject), so go
        // back to the ad list
        history.back();
      } else {
        this.reload();
      }
      this.reload();
    }));
  }

  /**
   * Adds the current ad to cart, displays a message and updates the top bar
   */
  protected addToCart() {
    this.addSub(this.shoppingCartService.addItemToShoppingCart({ ad: this.ad.id }).subscribe(items => {
      // Assume if the amount of items has not changed is
      // because this product was already in cart
      this.notification.snackBar(
        items === this.marketplaceHelper.cartItems ?
          this.i18n.ad.addedProductAlreadyInCart :
          this.i18n.ad.addedProduct);
      this.marketplaceHelper.cartItems = items;
    }));
  }

  onDataInitialized(ad: AdView) {
    this.webshop = ad.kind === AdKind.WEBSHOP;
    this.hasStatus = !this.guest && (this.authHelper.isSelfOrOwner(ad.user) ||
      (this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR ||
        this.dataForUiHolder.role === RoleEnum.BROKER));

    const headingActions: HeadingAction[] = [];
    if (ad.canEdit) {
      const edit = new HeadingAction('edit', this.i18n.general.edit, () => {
        this.router.navigate(['/marketplace', 'edit', this.id]);
      }, true);
      headingActions.push(edit);
    }
    if (ad.canBuy) {
      headingActions.push(
        new HeadingAction('add_shopping_cart', this.i18n.ad.addToCart, () => this.addToCart()));
    }
    if (ad.canAsk) {
      headingActions.push(
        new HeadingAction('chat', this.i18n.ad.askQuestion, () => this.ask()));
    }
    if (ad.canHide) {
      headingActions.push(
        new HeadingAction('lock', this.i18n.ad.hide, () => this.updateStatus(
          this.marketplaceService.hideAd({ ad: this.id }),
          this.i18n.ad.adHidden,
        )));
    }
    if (ad.canUnhide) {
      headingActions.push(
        new HeadingAction('public', this.i18n.ad.unhide, () => this.updateStatus(
          this.marketplaceService.unhideAd({ ad: this.id }),
          this.i18n.ad.adUnhidden,
        )));
    }
    if (ad.canRequestAuthorization) {
      headingActions.push(
        new HeadingAction('gavel', this.i18n.ad.submitForAuthorization, () => this.updateStatus(
          this.marketplaceService.submitAdForAuthorization({ ad: this.id }),
          this.i18n.ad.pendingForAuth,
        )));
    }
    if (ad.canSetAsDraft) {
      headingActions.push(
        new HeadingAction('edit', this.i18n.ad.setAsDraft, () => this.updateStatus(
          this.marketplaceService.setAdAsDraft({ ad: this.id }),
          this.i18n.ad.backToDraft,
          true,
        )));
    }
    if (ad.canApprove) {
      headingActions.push(
        new HeadingAction('thumb_up_alt', this.i18n.ad.authorize, () => this.updateStatus(
          this.marketplaceService.approveAd({ ad: this.id }),
          this.i18n.ad.authorized,
        )));
    }
    if (ad.canReject) {
      headingActions.push(
        new HeadingAction('thumb_down_alt', this.i18n.ad.reject, () => this.reject()));
    }
    if (ad.canRemove) {
      headingActions.push(
        new HeadingAction('clear', this.i18n.general.remove, () => {
          this.notification.confirm({
            message: this.i18n.general.removeConfirm(this.ad.name),
            callback: () => this.doRemove(),
          });
        }));
    }
    this.exportHelper.headingActions(ad.exportFormats, f => this.marketplaceService.exportAd$Response({
      format: f.internalName,
      ad: ad.id
    })).forEach(a => headingActions.push(a));
    for (const operation of ad.operations || []) {
      headingActions.push(this.operationHelper.headingAction(operation, ad.id));
    }
    this.headingActions = headingActions;
    this.title = words(ad.name, 60);
  }

  /**
   * Displays a comment text area in a popup and rejects the authorization
   */
  protected reject() {
    const ref = this.modal.show(TextDialogComponent, {
      class: 'modal-form', initialState: {
        title: this.i18n.ad.reject,
      },
    });
    const component = ref.content as TextDialogComponent;
    this.addSub(component.done.subscribe((comments: string) => {
      this.updateStatus(
        this.marketplaceService.rejectAd({ ad: this.id, body: comments }),
        this.i18n.ad.rejected,
        true,
      );
    }));
  }

  get categoryLabel(): string {
    return (this.ad.categories || []).length === 1 ?
      this.i18n.ad.category : this.i18n.ad.categories;
  }

  /**
   * Resolves the current ad status label
   */
  get status(): string {
    return this.ad.status ? this.marketplaceHelper.resolveStatusLabel(this.ad.status) : null;
  }

  /**
   * Resolves the stock quantity label
   */
  get stock(): string {
    if (!this.data.unlimitedStock) {
      const quantity = +this.data.stockQuantity || 0;
      return quantity === 0 ? this.i18n.ad.outOfStock : this.formatStock(this.data.stockQuantity);
    }
    return '';
  }

  /**
   * Returns if questions should be displayed if
   * there are questions or the user can ask
   */
  get questionsEnabled(): boolean {
    return !this.guest && this.data.questionsEnabled && this.data.questions.length > 0;
  }

  /**
   * Returns if the given question can be removed.
   * An admin can always remove if the ad is editable.
   * A broker, ad owner and question owner can remove
   * if the ad is editable and the answer is empty.
   * Operators cannot remove owner's questions.
   */
  canRemoveQuestion(question: AdQuestionView) {
    if (this.guest) {
      return false;
    } else if (this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR) {
      return this.data.canEdit;
    } else if (this.dataForUiHolder.role === RoleEnum.BROKER ||
      this.authHelper.isSelfOrOwner(this.data.user) ||
      (this.authHelper.isSelfOrOwner(question.user) && this.dataForUiHolder.role !== RoleEnum.OPERATOR)) {
      return this.data.canEdit && empty(question.answer);
    }
    return false;
  }

  /**
   * Returns if the delivery method has a fixed price
   */
  hasFixedDeliveryPrice(dm: DeliveryMethod) {
    return dm.chargeType === DeliveryMethodChargeTypeEnum.FIXED;
  }

  /**
   * Formats the given quantity if allow decimals
   */
  formatStock(quantity: string): string {
    const stock = this.format.numberToFixed(quantity, this.data.allowDecimal ? 2 : 0);
    return stock || '';
  }

  categoryLevels(category: AdCategoryWithParent) {
    const categories: AdCategoryWithParent[] = [];
    while (category != null) {
      categories.unshift(category);
      category = category.parent;
    }
    return categories;
  }

  /**
   * Ask a question for the current ad and reloads the page
   */
  ask() {
    const ref = this.modal.show(TextDialogComponent, {
      class: 'modal-form', initialState: {
        title: this.i18n.ad.askQuestion,
      },
    });
    const component = ref.content as TextDialogComponent;
    this.addSub(component.done.subscribe((question: string) => {
      if (!empty(question)) {
        this.addSub(this.adQuestionService.createAdQuestion({
          ad: this.id,
          body: question,
        }).subscribe(() => {
          this.notification.snackBar(this.i18n.ad.questionAsked);
          this.reload();
        }));
      }
    },
    ));
  }

  resolveMenu() {
    return Menu.SEARCH_ADS;
  }

  /**
   * Removes a question with the given id
   */
  removeQuestion(id: string) {
    this.addSub(this.adQuestionService.deleteAdQuestion({ id }).subscribe(() => {
      this.notification.snackBar(this.i18n.ad.questionRemoved);
      this.reload();
    }));
  }
}
