import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import {
  AdInterestBasicData,
  AdInterestDataForEdit,
  AdInterestDataForNew,
  AdInterestEdit,
  Currency
} from 'app/api/models';
import { AdInterestsService } from 'app/api/services/ad-interests.service';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { HierarchyItem } from 'app/ui/marketplace/hierarchy-item.component';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Edit an advertisement interest
 */
@Component({
  selector: 'edit-ad-interest',
  templateUrl: 'edit-ad-interest.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditAdInterestComponent
  extends BasePageComponent<AdInterestDataForNew | AdInterestDataForEdit>
  implements OnInit
{
  id: string;
  user: string;
  create: boolean;
  self: boolean;
  form: FormGroup;
  categories: HierarchyItem[] = [];

  currency$ = new BehaviorSubject<Currency>(null);

  constructor(
    injector: Injector,
    private adInterestService: AdInterestsService,
    private marketplaceHelper: MarketplaceHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.id = this.route.snapshot.params.id;
    this.create = this.id == null;

    const request: Observable<AdInterestDataForNew | AdInterestDataForEdit> = this.create
      ? this.adInterestService.getAdInterestDataForNew({
          user: this.user
        })
      : this.adInterestService.getAdInterestDataForEdit({ id: this.id });
    this.addSub(
      request.subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: AdInterestDataForNew | AdInterestDataForEdit) {
    this.self = this.authHelper.isSelfOrOwner(data.user);

    const ai = data.adInterest;
    const currency = ai.currency
      ? ai.currency
      : !empty(data.currencies)
      ? this.ApiHelper.internalNameOrId(data.currencies[0])
      : null;

    this.marketplaceHelper.populateCategories(this.categories, data.categories, 0);

    this.form = this.formBuilder.group({
      name: [ai.name, Validators.required],
      keywords: [ai.keywords, null],
      kind: ai.kind,
      category: ai.category,
      user: ai.user,
      minPrice: ai.minPrice,
      maxPrice: ai.maxPrice,
      currency,
      version: (ai as AdInterestEdit).version
    });
    this.updateCurrency(data);
    this.addSub(this.form.controls.currency.valueChanges.subscribe(() => this.updateCurrency(data)));
  }

  protected updateCurrency(data: AdInterestBasicData) {
    const id = this.form.controls.currency.value;
    this.currency = data.currencies.find(c => c.id === id || c.internalName === id) || data.currencies[0];
  }

  /**
   * Saves or edits the current ad interest
   */
  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value;
    const request: Observable<string | void> = this.create
      ? this.adInterestService.createAdInterest({ body: value, user: this.user })
      : this.adInterestService.updateAdInterest({ id: this.id, body: value });
    this.addSub(
      request.subscribe(() => {
        this.notification.snackBar(this.create ? this.i18n.ad.adInterestCreated : this.i18n.ad.adInterestSaved);
        history.back();
      })
    );
  }

  resolveMenu(data: AdInterestDataForNew | AdInterestDataForEdit) {
    return this.menu.userMenu(data.user, Menu.AD_INTERESTS);
  }

  get currency(): Currency {
    return this.currency$.value;
  }

  set currency(currency: Currency) {
    this.currency$.next(currency);
  }
}
