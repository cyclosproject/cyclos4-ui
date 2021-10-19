import {
  AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges, ViewChild,
} from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { galleryImage, truthyAttr } from 'app/shared/helper';
import { NgxGalleryComponent, INgxGalleryImage, NgxGalleryOptions } from 'ngx-gallery-9';

/**
 * The size for rendered avatars.
 * Profile is a special value that adapts to the max image width / height and layout size
 */
export type AvatarSize = 'small' | 'small-medium' | 'medium' | 'medium-large' | 'large' | 'xlarge' | 'huge' | 'full';
export const SIZES: { [key: string]: number } = {
  small: 24,
  'small-medium': 30,
  medium: 36,
  'medium-large': 50,
  large: 64,
  xlarge: 96,
  huge: 128,
};

/**
 * Renders an avatar (image within a circle).
 * If there is no image, an icon is shown instead
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'avatar',
  templateUrl: 'avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent implements OnInit, OnChanges, AfterContentChecked {

  /**
   * The icon show when no image is available
   */
  @Input() icon: SvgIcon | string = SvgIcon.Person;

  @Input() iconColor: string;

  @Input() zoom = true;

  @Output() click = new EventEmitter<MouseEvent>();

  private _roundBorders = true;
  @Input() get roundBorders(): boolean | string {
    return this._roundBorders;
  }
  set roundBorders(rb: boolean | string) {
    this._roundBorders = truthyAttr(rb);
  }

  private _useLightbox = false;
  @Input() get useLightbox(): boolean | string {
    return this._useLightbox;
  }
  set useLightbox(use: boolean | string) {
    this._useLightbox = truthyAttr(use);
  }

  fullSize = false;
  private _size: number = SIZES.medium;
  /**
   * The size of images and icons
   */
  @Input() get size(): AvatarSize | number | string {
    return this._size;
  }

  set size(originalSize: AvatarSize | number | string) {
    let size = originalSize;
    this.fullSize = size === 'full';
    if (this.fullSize) {
      this._size = null;
    } else if (typeof size === 'number') {
      this._size = size;
      this.iconSize = `${size * 0.9}px`;
    } else {
      const pixelSize = parseInt(size, 10);
      if (isNaN(pixelSize)) {
        size = SIZES[size];
      }
      if (size == null) {
        throw new Error(`Invalid avatar size: ${originalSize}`);
      }
      this._size = Number(size);
      this.iconSize = `${this._size * 0.9}px`;
    }
  }

  @Input() iconSize: string;

  /**
   * The image to show
   */
  @Input() image: Image;

  /**
   * Other images in the collection
   */
  @Input() additionalImages: Image[];

  allImages: Image[];

  galleryImages: INgxGalleryImage[];

  @Input() imageSize: number = null;

  url: string;
  visible = false;
  @ViewChild(NgxGalleryComponent) gallery: NgxGalleryComponent;

  galleryOptions: NgxGalleryOptions[];

  constructor(
    private element: ElementRef,
    private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.update();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.image || changes.additionalImages || changes.useLightbox || changes.size) {
      this.update();
    }
  }

  private update() {
    if (this.image) {
      this.initImage();
      const additional = (this.additionalImages || []);
      this.allImages = [...additional];
      if (this.allImages.findIndex(i => i.url === this.image.url) < 0) {
        this.allImages.unshift(this.image);
      }
      if (this.useLightbox) {
        this.galleryImages = this.allImages.map(galleryImage);
        this.galleryOptions = [{
          width: '0',
          height: '0',
          image: false,
          thumbnails: false,
          previewKeyboardNavigation: true,
          previewCloseOnClick: true,
          previewCloseOnEsc: true,
          previewArrows: additional.length > 0,
        }];
        if (this.gallery) {
          this.gallery.images = this.galleryImages;
          this.gallery.options = this.galleryOptions;
        }
      } else {
        this.galleryImages = null;
      }
    } else {
      this.allImages = [];
      this.galleryImages = null;
      this.initIcon();
    }
  }

  private initIcon() {
    const el = this.element.nativeElement as HTMLElement;
    if (el) {
      const size = `${this._size}px`;
      el.style.width = size;
      el.style.height = size;
    }
  }

  private initImage() {
    if (this.fullSize && (this.imageSize == null || this.iconSize == null)) {
      const el = this.element.nativeElement as HTMLElement;
      if (el.clientWidth <= 0) {
        return;
      }
      if (this.imageSize == null) {
        this.imageSize = el.clientWidth;
      }
      if (this.iconSize == null) {
        this.iconSize = `${el.clientWidth}px`;
      }
      // Re-enter
      this.initImage();
      return;
    }

    const maxSize = this._size;
    const imageSize = this.imageSize || maxSize;
    const image = this.image;
    if (image && image.url) {
      // Calculate the image attributes
      const ratio = image.width / image.height;

      // Define the URL
      if (image.url.startsWith('blob:')) {
        // When the URL is a BLOB, don't append the param, because it would render it invalid
        this.url = image.url;
      } else {
        // The smallest dimension is used to determine the requested size...
        const param = ratio < 1 ? 'width' : 'height';
        // ... which should be multiplied by the phisical pixel ratio to prevent pixelation on retina displays
        const urlSize = Math.round(imageSize * (window.devicePixelRatio || 1));
        this.url = `${image.url}?${param}=${urlSize}`;
      }
    }
  }

  showLightbox(index?: number) {
    if (this.image && this.useLightbox) {
      const images = this.galleryImages || [];
      const toShow = index == null ? images.findIndex(li => li.big === this.image.url) : index;
      this.gallery.openPreview(toShow);
    }
  }

  ngAfterContentChecked() {
    const el = this.element.nativeElement as HTMLElement;
    if (this.visible && el.offsetParent == null) {
      this.visible = false;
    } else if (!this.visible && el.offsetParent != null) {
      this.visible = true;
      this.initImage();
      this.changeDetector.detectChanges();
    }
  }
}
