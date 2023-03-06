import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdCategoryWithParent, AdKind, AdQuestionView, AdView,
  DeliveryMethod, DeliveryMethodChargeTypeEnum, RoleEnum
} from 'app/api/models';
import { AdQuestionsService } from 'app/api/services/ad-questions.service';
import { MarketplaceService } from 'app/api/services/marketplace.service';
import { ShoppingCartsService } from 'app/api/services/shopping-carts.service';
import { ErrorStatus } from 'app/core/error-status';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { empty, words } from 'app/shared/helper';
import { TextDialogComponent } from 'app/shared/text-dialog.component';
import { LoginService } from 'app/ui/core/login.service';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { RunOperationHelperService } from 'app/ui/core/run-operation-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';
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
    private runOperationHelper: RunOperationHelperService,
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
    this.errorHandler.requestWithCustomErrorHandler(handle => {
      this.addSub(this.marketplaceService.viewAd({ ad: this.id })
        .subscribe(ad => {
          this.data = ad;
        }, (err: HttpErrorResponse) => {
          // When not logged in and got a not found, redirect to login
          if (err.status === ErrorStatus.NOT_FOUND && this.dataForFrontendHolder.user == null) {
            this.login.goToLoginPage(this.router.url);
          } else {
            handle(err);
          }
        }));
    });
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
        (this.dataForFrontendHolder.role === RoleEnum.BROKER &&
          !this.authHelper.isSelfOrOwner(this.data.user)) ||
        this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR) {
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
      (this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR ||
        this.dataForFrontendHolder.role === RoleEnum.BROKER));

    const headingActions: HeadingAction[] = [];
    if (ad.canSetAsFavorite) {
      const conf = this.getFavoriteConfiguration(ad);
      headingActions.push(new HeadingAction(conf.icon, conf.label, () => this.markAsFavorite()));
    }
    if (ad.canBuy) {
      headingActions.push(
        new HeadingAction(SvgIcon.CartPlus, this.i18n.ad.addToCart, () => this.addToCart()));
    }
    if (ad.canAsk) {
      headingActions.push(
        new HeadingAction(SvgIcon.ChatLeft, this.i18n.ad.askQuestion, () => this.ask()));
    }
    if (ad.canHide) {
      headingActions.push(
        new HeadingAction(SvgIcon.EyeSlash, this.i18n.ad.hide, () => this.updateStatus(
          this.marketplaceService.hideAd({ ad: this.id }),
          this.i18n.ad.adHidden,
        )));
    }
    if (ad.canUnhide) {
      headingActions.push(
        new HeadingAction(SvgIcon.Eye, this.i18n.ad.unhide, () => this.updateStatus(
          this.marketplaceService.unhideAd({ ad: this.id }),
          this.i18n.ad.adUnhidden,
        )));
    }
    if (ad.canRequestAuthorization) {
      headingActions.push(
        new HeadingAction(SvgIcon.FileEarmarkCheck, this.i18n.ad.submitForAuthorization, () => this.updateStatus(
          this.marketplaceService.submitAdForAuthorization({ ad: this.id }),
          this.i18n.ad.pendingForAuth,
        )));
    }
    if (ad.canSetAsDraft) {
      headingActions.push(
        new HeadingAction(SvgIcon.Pencil, this.i18n.ad.setAsDraft, () => this.updateStatus(
          this.marketplaceService.setAdAsDraft({ ad: this.id }),
          this.i18n.ad.backToDraft,
          true,
        )));
    }
    if (ad.canApprove) {
      headingActions.push(
        new HeadingAction(SvgIcon.HandThumbsUp, this.i18n.ad.authorize, () => this.updateStatus(
          this.marketplaceService.approveAd({ ad: this.id }),
          this.i18n.ad.authorized,
        )));
    }
    if (ad.canReject) {
      headingActions.push(
        new HeadingAction(SvgIcon.HandThumbsDown, this.i18n.ad.reject, () => this.reject()));
    }
    if (ad.canEdit) {
      const edit = new HeadingAction(SvgIcon.Pencil, this.i18n.general.edit, () => {
        this.router.navigate(['/marketplace', 'edit', this.id]);
      });
      headingActions.push(edit);
    }
    if (ad.canRemove) {
      headingActions.push(
        new HeadingAction(SvgIcon.Trash, this.i18n.general.remove, () => {
          this.confirmation.confirm({
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
      headingActions.push(this.runOperationHelper.headingAction(operation, ad.id));
    }
    this.headingActions = headingActions;
    this.title = words(ad.name, 60);
  }

  protected getFavoriteConfiguration(ad: AdView) {
    const obj = {
      icon: ad.favorite ? SvgIcon.HeartFill : SvgIcon.Heart,
      label: ad.favorite ? this.i18n.ad.removeFromFavorites : this.i18n.ad.addToFavorites
    };
    return obj;
  }

  protected markAsFavorite() {
    if (this.ad.favorite) {
      this.addSub(this.marketplaceService.unmarkAsFavorite({ ad: this.ad.id }).subscribe(() => {
        this.notification.snackBar(this.i18n.ad.removedFromFavorites);
        this.reload();
      }));
    } else {
      this.addSub(this.marketplaceService.markAsFavorite({ ad: this.ad.id }).subscribe(() => {
        this.notification.snackBar(this.i18n.ad.addedToFavorites);
        this.reload();
      }));
    }
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
      this.i18n.general.category : this.i18n.ad.categories;
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
    } else if (this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR) {
      return this.data.canEdit;
    } else if (this.dataForFrontendHolder.role === RoleEnum.BROKER ||
      this.authHelper.isSelfOrOwner(this.data.user) ||
      (this.authHelper.isSelfOrOwner(question.user) && this.dataForFrontendHolder.role !== RoleEnum.OPERATOR)) {
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
