import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdCategoryWithParent, Address, AdView, AdKind, RoleEnum, TimeInterval,
  DeliveryMethod, DeliveryMethodChargeTypeEnum
} from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { words } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { Observable } from 'rxjs';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { AskQuestionDialogComponent } from 'app/marketplace/questions/ask-question-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
/**
 * Displays an advertisement details
 */
@Component({
  selector: 'view-ad',
  templateUrl: 'view-ad.component.html',
  styleUrls: ['../../users/profile/view-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAdComponent extends BaseViewPageComponent<AdView> implements OnInit {

  title: string;
  id: string;
  addresses: Address[];
  webshop: boolean;
  guest: boolean;
  hasStatus: boolean;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private formatService: FormatService,
    private operationHelper: OperationHelperService,
    private loginService: LoginService,
    private marketplaceHelper: MarketplaceHelperService,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  get ad(): AdView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.guest = this.loginService.user == null;
    this.headingActions = [this.printAction];
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
  protected updateStatus(request: Observable<any>, message: string) {
    request.subscribe(() => {
      this.notification.snackBar(message);
      this.reload();
    });
  }

  onDataInitialized(ad: AdView) {
    this.webshop = ad.kind === AdKind.WEBSHOP;
    this.hasStatus = !this.guest && (this.authHelper.isSelfOrOwner(ad.owner) ||
      (this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR ||
        this.dataForUiHolder.role === RoleEnum.BROKER));
    const headingActions: HeadingAction[] = [];
    if (ad.canHide) {
      headingActions.push(
        new HeadingAction('lock', this.i18n.ad.hide, () => this.updateStatus(
          this.marketplaceService.hideAd({ ad: this.id }),
          this.i18n.ad.adHidden
        )));
    }
    if (ad.canUnhide) {
      headingActions.push(
        new HeadingAction('public', this.i18n.ad.unhide, () => this.updateStatus(
          this.marketplaceService.unhideAd({ ad: this.id }),
          this.i18n.ad.adUnhidden
        )));
    }
    if (ad.canRequestAuthorization) {
      headingActions.push(
        new HeadingAction('gavel', this.i18n.ad.submitForAuthorization, () => this.updateStatus(
          this.marketplaceService.submitAdForAuthorization({ ad: this.id }),
          this.i18n.ad.pendingForAuth
        )));
    }
    if (ad.canSetAsDraft) {
      headingActions.push(
        new HeadingAction('edit', this.i18n.ad.setAsDraft, () => this.updateStatus(
          this.marketplaceService.setAdAsDraft({ ad: this.id }),
          this.i18n.ad.backToDraft
        )));
    }
    if (ad.canAuthorize) {
      headingActions.push(
        new HeadingAction('thumb_up_alt', this.i18n.ad.authorize, () => this.updateStatus(
          this.marketplaceService.setAdAsDraft({ ad: this.id }),
          this.i18n.ad.authorized
        )));
    }
    if (ad.canReject) {
      headingActions.push(
        new HeadingAction('thumb_down_alt', this.i18n.ad.reject, () => this.updateStatus(
          this.marketplaceService.setAdAsDraft({ ad: this.id }),
          this.i18n.ad.rejected
        )));
    }
    if (ad.canEdit) {
      headingActions.push(
        new HeadingAction('edit', this.i18n.general.edit, () => {
          this.router.navigate(['/marketplace', 'edit', this.id]);
        }));
    }
    if (ad.canRemove) {
      headingActions.push(
        new HeadingAction('clear', this.i18n.general.remove, () => {
          this.notification.confirm({
            message: this.i18n.general.removeConfirm(this.ad.name),
            callback: () => this.doRemove()
          });
        }));
    }
    headingActions.push(this.printAction);
    for (const operation of ad.operations || []) {
      headingActions.push(this.operationHelper.headingAction(operation, ad.id));
    }
    this.headingActions = headingActions;
    this.title = words(ad.name, 60);
    this.addresses = [...ad.adAddresses, ...ad.userAddresses];
  }

  get categoryLabel(): string {
    return (this.ad.categories || []).length === 1 ?
      this.i18n.ad.category : this.i18n.ad.categories;
  }

  /**
   * Resolves the current ad status label
   */
  get status(): string {
    return this.marketplaceHelper.resolveStatusLabel(this.ad.status);
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
   * Returns if the delivery method has a fixed price
   */
  hasFixedDeliveryPrice(dm: DeliveryMethod) {
    return dm.chargeType === DeliveryMethodChargeTypeEnum.FIXED;
  }

  /**
   * Formats the given time as time interval
   */
  formatTimeInterval(timeInterval: TimeInterval): string {
    return this.formatService.formatTimeInterval(timeInterval);
  }

  /**
   * Formats the given quantity if allow decimals
   */
  formatStock(quantity: string): string {
    const stock = this.formatService.numberToFixed(quantity, this.data.allowDecimal ? 2 : 0);
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
    const ref = this.modal.show(AskQuestionDialogComponent, {
      class: 'modal-form', initialState: {
        id: this.id
      }
    });
    const component = ref.content as AskQuestionDialogComponent;
    this.addSub(component.done.subscribe(() => {
      this.notification.snackBar(this.i18n.ad.questionAsked);
      this.reload();
    }));
  }

  resolveMenu() {
    return Menu.SEARCH_ADS;
  }
}
