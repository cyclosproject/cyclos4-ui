import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { AdBasicData, AdDataForEdit, AdDataForNew, AdEdit, AdKind, AdManage, Currency, DeliveryMethod, Image } from 'app/api/models';
import { ImagesService, MarketplaceService } from 'app/api/services';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { HierarchyItem } from 'app/marketplace/hierarchy-item.component';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { Menu } from 'app/shared/menu';
import { cloneDeep } from 'lodash';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';

export type StockType = 'available' | 'notAvailable' | 'quantity';

/**
 * Edits an advertisement or webshop
 */
@Component({
  selector: 'edit-ad',
  templateUrl: 'edit-ad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAdComponent
  extends BasePageComponent<AdDataForNew | AdDataForEdit>
  implements OnInit {

  id: string;
  basedOnId: string;
  owner: string;
  mask: string;
  self: boolean;
  create: boolean;
  webshop: boolean;
  requiredProductNumber: boolean;
  hasRemovedImages: boolean;
  kind: AdKind;
  uploadedImages: Image[];
  mainImage: string;
  categories: HierarchyItem[] = [];

  images$ = new BehaviorSubject<Image[]>([]);
  currency$ = new BehaviorSubject<Currency>(null);
  deliveryMethods$ = new BehaviorSubject<DeliveryMethod[]>(null);

  form: FormGroup;

  constructor(
    injector: Injector,
    private imagesService: ImagesService,
    private modal: BsModalService,
    private changeDetector: ChangeDetectorRef,
    private marketplaceHelper: MarketplaceHelperService,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.basedOnId = this.route.snapshot.queryParams.basedOnId;
    this.id = this.route.snapshot.params.id;
    this.kind = this.route.snapshot.paramMap.get('kind') as AdKind;
    this.create = this.id == null;
    const request: Observable<AdDataForNew | AdDataForEdit> = this.create
      ? this.marketplaceService.getAdDataForNew({
        basedOnId: this.basedOnId,
        user: this.route.snapshot.params.user,
        kind: this.kind,
      })
      : this.marketplaceService.getAdDataForEdit({ ad: this.id });
    this.addSub(request.subscribe(data => {
      if (!this.create && data.maxImages > 0) {
        this.addSub(this.imagesService.listAdImages({ ad: this.id }).subscribe(currentImages => {
          this.images = currentImages;
          this.mainImage = this.images.length > 0 ? this.ApiHelper.internalNameOrId(this.images[0]) : null;
          this.data = data;
        }));
      } else {
        this.data = data;
      }
    }));
  }

  onDataInitialized(data: AdDataForNew | AdDataForEdit) {

    this.kind = data.kind;
    this.webshop = this.kind === AdKind.WEBSHOP;

    this.self = this.authHelper.isSelfOrOwner(data.user);

    this.owner = this.self
      ? this.ApiHelper.SELF
      : data.user.id;

    this.marketplaceHelper.populateCategories(this.categories, data.categories, 0);

    const adManage = data.advertisement;
    const adEdit = adManage as AdEdit;
    const categories = adManage.categories && data.maxCategoriesPerAd === 1 ?
      adManage.categories[0] :
      adManage.categories;
    const settings = (data.webshopSettings || {});
    this.requiredProductNumber = this.webshop && !settings.productNumberGenerated;

    this.mask = !settings.productNumberGenerated ? settings.productNumberMask : '';
    const firstCurrency = !empty(data.currencies) ? data.currencies[0] : null;

    this.form = this.formBuilder.group({
      name: [adManage.name, Validators.required],
      categories: [categories, Validators.required],
      currency: [firstCurrency ? this.ApiHelper.internalNameOrId(firstCurrency) : null, Validators.required],
      price: [adManage.price, this.webshop ? Validators.required : null],
      publicationBeginDate: [adManage.publicationPeriod.begin, Validators.required],
      publicationEndDate: [adManage.publicationPeriod.end, Validators.required],
      setPromotionalPeriod: adManage.promotionalPeriod != null,
      promotionalBeginDate: adManage.promotionalPeriod ? adManage.promotionalPeriod.begin : null,
      promotionalEndDate: adManage.promotionalPeriod ? adManage.promotionalPeriod.end : null,
      promotionalPrice: adManage.promotionalPrice,
      description: [adManage.description, Validators.required],
      maxAllowedInCart: adManage.maxAllowedInCart,
      minAllowedInCart: adManage.minAllowedInCart,
      allowDecimalQuantity: adManage.allowDecimalQuantity,
      unlimitedStock: this.create ? true : adManage.unlimitedStock,
      stockQuantity: adManage.stockQuantity,
      minStockQuantityToNotify: adManage.minStockQuantityToNotify,
      productNumber: [adManage.productNumber, this.requiredProductNumber ? Validators.required : null],
      version: adEdit.version,
      stockType: this.webshop ? this.resolveStockType(adManage) : null,
      id: this.id,
      kind: this.kind,
    });
    this.form.addControl('addresses', this.formBuilder.control(adManage.addresses));
    this.form.addControl('deliveryMethods', this.formBuilder.control(adManage.deliveryMethods));
    this.form.addControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields, {
      currentValues: adManage.customValues,
    }));
    this.addSub(this.form.get('currency').valueChanges.subscribe(id => {
      this.updateCurrency(id, data);
      this.updateDeliveryMethods(data);
    }));
    // Preselect the first currency when creating a new ad
    // or use the single returned currency when editing
    this.currency = firstCurrency;

    this.addSub(this.form.controls.stockType.valueChanges.subscribe(() => this.updateStockControls()));

    this.uploadedImages = [];
    this.updateDeliveryMethods(data);
    this.updateStockControls();

  }

  resolveMenu(data: AdBasicData) {
    if (this.self) {
      if (data.kind === AdKind.SIMPLE) {
        return Menu.SEARCH_USER_ADS;
      } else {
        return Menu.SEARCH_USER_WEBSHOP;
      }
    }
    return this.authHelper.userMenu(data.user, Menu.SEARCH_ADS);
  }

  /**
   * Display stock controls based on stock type
   */
  protected updateStockControls() {
    if (this.webshop) {
      const value = this.form.controls.stockType.value;
      if (value === 'available' || value === 'notAvailable') {
        this.form.controls.stockQuantity.clearValidators();
      } else {
        this.form.controls.stockQuantity.setValidators(Validators.required);
      }
      this.form.controls.stockQuantity.updateValueAndValidity();
    }
  }

  /**
   * Changes the current currency updating other referenced fields like price and promotional price
   */
  protected updateCurrency(id: string, data: AdBasicData) {
    this.currency = data.currencies.find(c => c.id === id || c.internalName === id);
  }

  /**
   * Filters delivery methods which has the same currency as the webshop or negotiated ones
   */
  protected updateDeliveryMethods(data: AdBasicData) {
    this.deliveryMethods$.next(
      data.deliveryMethods.filter(dm => dm.chargeCurrency == null || dm.chargeCurrency.id === (this.currency || {}).id),
    );
  }

  /**
   * Resolves the current stock type based on webshop status
   */
  protected resolveStockType(ad: AdManage): StockType {
    if (this.create || ad.unlimitedStock) {
      return 'available';
    } else if (ad.stockQuantity) {
      return 'quantity';
    }
    return 'notAvailable';
  }

  /**
   * Resolves the current ad status label
   */
  get status(): string {
    return this.marketplaceHelper.resolveStatusLabel((this.data as AdDataForEdit).status);
  }

  /**
   * Creates or updates the current ad and allows to create
   * a new ad based on the current one
   */
  save(insertNew?: boolean) {

    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    const value = cloneDeep(this.form.value);

    value.publicationPeriod = this.ApiHelper.datePeriod(value.publicationBeginDate, value.publicationEndDate);
    delete value.publicationBeginDate;
    delete value.publicationEndDate;

    value.promotionalPeriod = value.setPromotionalPeriod ?
      this.ApiHelper.datePeriod(value.promotionalBeginDate, value.promotionalEndDate) :
      null;
    delete value.setPromotionalPeriod;
    delete value.promotionalBeginDate;
    delete value.promotionalEndDate;
    if (value.promotionalPeriod == null) {
      delete value.promotionalPrice;
    }

    if (this.webshop) {
      value.unlimitedStock = value.stockType === 'available';
      if (value.stockType !== 'quantity') {
        value.stockQuantity = null;
      }
      delete value.stockType;
    }

    const onFinish: any = (id: string) => {
      this.notification.snackBar(this.i18n.ad.adSaved);
      if (insertNew) {
        this.router.navigate(['/marketplace', this.owner, this.data.kind, 'new'], {
          replaceUrl: true,
          queryParams: { basedOnId: id || this.id },
        });
      } else if (this.basedOnId) {
        this.router.navigate(['/marketplace', 'edit', id], { replaceUrl: true });
      } else {
        history.back();
      }
    };

    if (this.data.requiresAuthorization && this.self) {
      value.submitForAuthorization = false;
    }

    if (this.create) {

      value.images = this.uploadedImages.map(i => i.id);

      this.addSub(this.marketplaceService.createAd({
        user: this.owner,
        body: value,
      }).subscribe(onFinish));

    } else {

      const updateAdReq = this.marketplaceService.updateAd({
        ad: this.id,
        body: value,
      });

      // If the main image has changed reload the ad version
      if (this.mainImageChanged()) {
        this.addSub(this.marketplaceService.getAdDataForEdit({ ad: this.id, fields: ['advertisement.version'] })
          .subscribe(data => {
            value.version = data.advertisement.version;
            this.addSub(updateAdReq.subscribe(onFinish));
          }));
      } else {
        this.addSub(updateAdReq.subscribe(onFinish));
      }
    }
  }

  /**
   * Returns if the main ad image has changed
   */
  protected mainImageChanged(): boolean {
    const currentImage = this.images.length > 0 ? this.ApiHelper.internalNameOrId(this.images[0]) : null;
    // Check any change in the main image, either added and removed, or changed
    return this.mainImage == null && currentImage == null && this.hasRemovedImages ||
      this.mainImage !== currentImage;
  }

  /**
   * Reorder or remove images
   */
  manageImages() {
    const ref = this.modal.show(ManageImagesComponent, {
      class: 'modal-form',
      initialState: {
        images: this.images,
        manageAfterConfirm: this.create,
      },
    });
    const component = ref.content as ManageImagesComponent;
    component.result.pipe(first()).subscribe(result => {
      this.hasRemovedImages = !empty(result.removedImages);
      if (this.hasRemovedImages) {
        for (const removed of result.removedImages) {
          this.addSub(this.imagesService.deleteImage({ idOrKey: removed }).subscribe());
        }
        // Update the images and uploaded images lists
        this.images = this.images.filter(i => !result.removedImages.includes(i.id));
        this.uploadedImages = this.uploadedImages.filter(i => !result.removedImages.includes(i.id));
      }
      const hasOrderChanged = !empty(result.order);
      if (hasOrderChanged) {
        // The order has changed
        this.images = result.order.map(id => {
          return this.images.find(i => i.id === id);
        });
        if (!this.create) {
          this.addSub(this.imagesService.reorderAdImages({ ids: result.order, ad: this.id }).subscribe());
        }
      }
      ref.hide();
    });
  }

  /**
   * Updates images
   */
  onUploadDone(images: Image[]) {
    this.images = ([...this.images, ...images]);
    this.uploadedImages = [...(this.uploadedImages || []), ...images];
    this.changeDetector.detectChanges();
  }

  get canUploadImages(): boolean {
    const max = this.data.maxImages;
    const current = this.images.length;
    return current < max;
  }

  get currency(): Currency {
    return this.currency$.value;
  }
  set currency(currency: Currency) {
    this.currency$.next(currency);
  }

  get images(): Image[] {
    return this.images$.value;
  }
  set images(images: Image[]) {
    this.images$.next(images);
  }

  get creationDate() {
    return (this.data as AdDataForEdit).creationDate;
  }

  get binaryValues() {
    return (this.data as AdDataForEdit).binaryValues;
  }

  get decimalQuantity(): number {
    return this.form.controls.allowDecimalQuantity.value ? 2 : 0;
  }
}
