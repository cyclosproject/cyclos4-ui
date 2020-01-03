import {
  AdDataForEdit, AdKind, AdDataForNew, Image, Currency,
  AdBasicData, AdCategoryWithChildren, AdEdit, DeliveryMethod
} from 'app/api/models';
import { OnInit, ChangeDetectionStrategy, Component, Injector, ChangeDetectorRef } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { MarketplaceService, ImagesService } from 'app/api/services';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { FormGroup, Validators } from '@angular/forms';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { first } from 'rxjs/operators';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { BsModalService } from 'ngx-bootstrap/modal';

type HierarchyItem = AdCategoryWithChildren & {
  level: number,
  leaf: boolean
};

const IMAGE_MANAGED_TIMEOUT = 6_000;

/**
 * Edits an advertisement or webshop
 */
@Component({
  selector: 'edit-ad',
  templateUrl: 'edit-ad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
        kind: this.kind
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

    this.self = this.authHelper.isSelfOrOwner(data.owner);

    this.owner = this.self
      ? this.ApiHelper.SELF
      : data.owner.id;

    this.populateCategories(data.categories, 0);

    const adManage = data.advertisement;
    const adEdit = adManage as AdEdit;
    const categories = adManage.categories && data.maxCategoriesPerAd === 1 ?
      adManage.categories[0] :
      adManage.categories;
    const settings = (data.webshopSettings || {});
    const requiredProductNumber = this.webshop && !settings.productNumberGenerated;

    this.mask = !settings.productNumberGenerated ? settings.productNumberMask : '';

    this.form = this.formBuilder.group({
      name: [adManage.name, Validators.required],
      categories: [categories, Validators.required],
      currency: [!empty(data.currencies) ? this.ApiHelper.internalNameOrId(data.currencies[0]) : null, Validators.required],
      price: [adManage.price, this.webshop ? Validators.required : null],
      publicationBeginDate: [adManage.publicationPeriod.begin, Validators.required],
      publicationEndDate: [adManage.publicationPeriod.end, Validators.required],
      setPromotionalPeriod: adManage.promotionalPeriod != null,
      promotionalBeginDate: adManage.promotionalPeriod ? adManage.promotionalPeriod.begin : null,
      promotionalEndDate: adManage.promotionalPeriod ? adManage.promotionalPeriod.end : null,
      promotionalPrice: adManage.promotionalPrice,
      description: [adManage.description, Validators.required],
      addresses: adManage.addresses,
      maxAllowedInCart: adManage.maxAllowedInCart,
      minAllowedInCart: adManage.minAllowedInCart,
      allowDecimalQuantity: adManage.allowDecimalQuantity,
      unlimitedStock: adManage.unlimitedStock,
      stockQuantity: adManage.stockQuantity,
      minStockQuantityToNotify: adManage.minStockQuantityToNotify,
      productNumber: [adManage.productNumber, requiredProductNumber ? Validators.required : null],
      version: adEdit.version,
      id: this.id
    });
    this.form.addControl('deliveryMethods', this.formBuilder.control(adManage.deliveryMethods));
    this.form.addControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields, {
      currentValues: adManage.customValues
    }));
    this.addSub(this.form.get('currency').valueChanges.subscribe(id => {
      this.updateCurrency(id, data);
      this.updateDeliveryMethods(data);
    }));
    // Preselect the first currency when creating a new ad
    // or use the single returned currency when editing
    if (!empty(data.currencies)) {
      this.currency = data.currencies[0];
    }

    this.addSub(this.form.controls.unlimitedStock.valueChanges.subscribe(() => this.updateStockControls()));

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
    return this.authHelper.userMenu(data.owner, Menu.SEARCH_ADS);
  }

  /**
   * Display stock controls based on stock type
   */
  protected updateStockControls() {
    if (this.webshop) {
      if (this.form.controls.unlimitedStock.value) {
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
      data.deliveryMethods.filter(dm => dm.chargeCurrency == null || dm.chargeCurrency.id === (this.currency || {}).id)
    );
  }

  /**
   * Creates a list of categories with extra information (e.g level, leaf) used for rendering
   */
  protected populateCategories(items: AdCategoryWithChildren[], level: number) {
    for (const item of items) {
      const hasChildren = !empty(item.children);
      const hierarchy: HierarchyItem = item as any;
      hierarchy.level = level;
      hierarchy.leaf = !hasChildren;
      this.categories.push(hierarchy);
      if (hasChildren) {
        this.populateCategories(item.children, level + 1);
      }
    }
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

    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }

    const value = this.form.value;

    value.publicationPeriod = this.ApiHelper.datePeriod(value.publicationBeginDate, value.publicationEndDate);
    delete value['publicationBeginDate'];
    delete value['publicationEndDate'];

    value.promotionalPeriod = value.setPromotionalPeriod ?
      this.ApiHelper.datePeriod(value.promotionalBeginDate, value.promotionalEndDate) :
      null;
    delete value['setPromotionalPeriod'];
    delete value['promotionalBeginDate'];
    delete value['promotionalEndDate'];
    if (value.promotionalPeriod == null) {
      delete value['promotionalPrice'];
    }


    const onFinish: any = (id: string) => {
      this.notification.snackBar(this.i18n.ad.adSaved);
      if (insertNew) {
        this.router.navigate(['/marketplace', this.owner, this.data.kind, 'new'], {
          replaceUrl: true,
          queryParams: { basedOnId: id || this.id }
        });
      } else if (this.basedOnId) {
        this.router.navigate(['/marketplace', 'edit', id], { replaceUrl: true });
      } else {
        history.back();
      }
    };

    if (this.create) {

      value.images = this.uploadedImages.map(i => i.id);

      if (this.data.requiresAuthorization) {
        // When requires authorization submit as draft when saving for first time
        value.submitForAuthorization = false;
      }

      this.addSub(this.marketplaceService.createAd({
        user: this.owner,
        body: value
      }).subscribe(onFinish));

    } else {

      const updateAdReq = this.marketplaceService.updateAd({
        ad: this.id,
        body: value
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
        manageAfterConfirm: this.create
      }
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
      if (this.create && (this.hasRemovedImages || hasOrderChanged)) {
        this.notification.snackBar(this.i18n.ad.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
      }
      ref.hide();
    });
  }

  /**
   * Updates images and displays a notification after the image was uploaded
   */
  onUploadDone(images: Image[]) {
    this.images = ([...this.images, ...images]);
    if (this.create) {
      this.notification.snackBar(this.i18n.ad.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
    }
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
