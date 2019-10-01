import {
  AdDataForEdit, AdKind, AdDataForNew, Image, AdStatusEnum, Currency,
  AdBasicData, AdCategoryWithChildren, AdEdit
} from 'app/api/models';
import { OnInit, ChangeDetectionStrategy, Component, Injector, ChangeDetectorRef } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { MarketplaceService, ImagesService } from 'app/api/services';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { FormGroup, Validators } from '@angular/forms';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { take } from 'rxjs/operators';
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

  static BASED_ON_ID: string;

  id: string;
  basedOnId: string;
  owner: string;
  self: boolean;
  create: boolean;
  kind: AdKind;
  uploadedImages: Image[];
  categories: HierarchyItem[] = [];

  images$ = new BehaviorSubject<Image[]>([]);
  currency$ = new BehaviorSubject<Currency>(null);

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

  get canUploadImages(): boolean {
    const max = this.data.maxImages;
    const current = this.images.length;
    return current < max;
  }

  ngOnInit() {
    super.ngOnInit();

    this.basedOnId = EditAdComponent.BASED_ON_ID;
    EditAdComponent.BASED_ON_ID = null;

    this.id = this.route.snapshot.params.id;
    this.kind = this.marketplaceHelper.resolveKind(this.route.snapshot.paramMap.get('kind'));
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
          this.data = data;
        }));
      } else {
        this.data = data;
      }
    }));
  }

  onDataInitialized(data: AdDataForNew | AdDataForEdit) {

    this.owner = this.authHelper.isSelf(data.owner)
      ? this.ApiHelper.SELF
      : data.owner.id;

    this.populateCategories(data.categories, 0);

    const adManage = data.advertisement;
    const adEdit = adManage as AdEdit;
    const categories = adManage.categories && data.maxCategoriesPerAd === 1 ?
      adManage.categories[0] :
      adManage.categories;
    this.form = this.formBuilder.group({
      name: [adManage.name, Validators.required],
      categories: [categories, Validators.required],
      currency: [!empty(data.currencies) ? this.ApiHelper.internalNameOrId(data.currencies[0]) : null, Validators.required],
      price: [adManage.price, Validators.required],
      publicationBeginDate: [adManage.publicationPeriod.begin, Validators.required],
      publicationEndDate: [adManage.publicationPeriod.end, Validators.required],
      promotionalBeginDate: adManage.promotionalPeriod ? adManage.promotionalPeriod.begin : null,
      promotionalEndDate: adManage.promotionalPeriod ? adManage.promotionalPeriod.end : null,
      promotionalPrice: adManage.promotionalPrice,
      description: [adManage.description, Validators.required],
      addresses: adManage.addresses,
      version: adEdit.version,
      id: this.id
    });
    this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields, {
      currentValues: adManage.customValues
    }));
    this.addSub(this.form.get('currency').valueChanges.subscribe(id => this.updateCurrency(id, data)));
    // Preselect the first currency when creating a new ad
    // or use the single returned currency when editing
    if (!empty(data.currencies)) {
      this.currency = data.currencies[0];
    }
    this.uploadedImages = [];
  }

  resolveMenu() {
    return Menu.SEARCH_USER_ADS;
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

  /**
   * Changes the current currency updating other referenced fields like price and promotional price
   */
  protected updateCurrency(id: string, data: AdBasicData) {
    this.currency = data.currencies.find(c => c.id === id || c.internalName === id);
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
  resolveStatusLabel() {
    switch ((this.data as AdDataForEdit).status) {
      case AdStatusEnum.ACTIVE:
        return this.i18n.ad.status.active;
      case AdStatusEnum.DISABLED:
        return this.i18n.ad.status.disabled;
      case AdStatusEnum.DRAFT:
        return this.i18n.ad.status.draft;
      case AdStatusEnum.EXPIRED:
        return this.i18n.ad.status.expired;
      case AdStatusEnum.HIDDEN:
        return this.i18n.ad.status.hidden;
      case AdStatusEnum.PENDING:
        return this.i18n.ad.status.pending;
      case AdStatusEnum.SCHEDULED:
        return this.i18n.ad.status.scheduled;
    }
  }

  save(insertNew?: boolean) {

    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }

    const value = this.form.value;

    value.publicationPeriod = this.ApiHelper.dateRange(value.publicationBeginDate, value.publicationEndDate);
    delete value['publicationBeginDate'];
    delete value['publicationEndDate'];

    value.promotionalPeriod = this.ApiHelper.dateRange(value.promotionalBeginDate, value.promotionalEndDate);
    delete value['promotionalBeginDate'];
    delete value['promotionalEndDate'];


    let request: any;
    if (this.create) {
      // Temp images
      value.images = this.uploadedImages.map(i => i.id);

      request = this.marketplaceService.createAd({
        user: this.owner,
        body: value
      });
    } else {
      request = this.marketplaceService.updateAd({
        ad: this.id,
        body: value
      });
    }
    request.subscribe((id: string) => {
      this.notification.snackBar(this.i18n.ad.adSaved);
      if (insertNew) {
        EditAdComponent.BASED_ON_ID = id || this.id;
        if (this.create) {
          this.reload();
        } else {
          this.router.navigate(['/marketplace', this.owner, this.data.kind, 'new'], { replaceUrl: true });
        }
      } else if (this.basedOnId) {
        this.router.navigate(['/marketplace', 'edit', id], { replaceUrl: true });
      } else {
        history.back();
      }
    });
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
    this.addSub(component.result.pipe(take(1)).subscribe(result => {
      const hasRemovedImages = !empty(result.removedImages);
      if (hasRemovedImages) {
        for (const removed of result.removedImages) {
          this.imagesService.deleteImage({ idOrKey: removed }).subscribe();
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
          this.imagesService.reorderAdImages({ ids: result.order, ad: this.id }).subscribe();
        }
      }
      if (this.create && (hasRemovedImages || hasOrderChanged)) {
        this.notification.snackBar(this.i18n.ad.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
      }
      ref.hide();
    }));
  }

  onUploadDone(images: Image[]) {
    this.images = ([...this.images, ...images]);
    if (this.create) {
      this.notification.snackBar(this.i18n.ad.imagesChanged, { timeout: IMAGE_MANAGED_TIMEOUT });
    }
    this.uploadedImages = [...(this.uploadedImages || []), ...images];
    this.changeDetector.detectChanges();
  }
}
