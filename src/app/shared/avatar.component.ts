import {
  AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { Image } from 'app/api/models';
import { truthyAttr, empty } from 'app/shared/helper';
import { Lightbox } from 'ngx-lightbox';

const MAX_THUMB_WIDTH = 160;
const MAX_THUMB_HEIGHT = 100;

/** Maximum number of additional images to show */
const MAX_ADDITIONAL = 5;

/**
 * The size for rendered avatars.
 * Profile is a special value that adapts to the max image width / height and layout size
 */
export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge' | 'huge' | 'full';
export const SIZES: { [key: string]: number } = {
  'small': 24,
  'medium': 36,
  'large': 64,
  'xlarge': 96,
  'huge': 128
};

export class LightboxImage {
  src: string;
  thumb: string;
  caption: string;

  constructor(image: Image) {
    this.src = image.url;
    this.thumb = `${image.url}?width=${MAX_THUMB_WIDTH}&height=${MAX_THUMB_HEIGHT}`;
    this.caption = image.name;
  }
}

/**
 * Renders an avatar (image within a circle).
 * If there is no image, an icon is shown instead
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'avatar',
  templateUrl: 'avatar.component.html',
  styleUrls: ['avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent implements OnInit, AfterContentChecked {

  /**
   * The icon show when no image is available
   */
  @Input() icon = 'account_circle';

  @Input() iconColor: string;

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
    this.initLightboxImages();
  }

  private lightboxImages: LightboxImage[];

  fullSize = false;
  private _size: number = SIZES['medium'];
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
      this.iconSize = `${size}px`;
    } else {
      const pixelSize = parseInt(size, 10);
      if (isNaN(pixelSize)) {
        size = SIZES[size];
      }
      if (size == null) {
        throw new Error(`Invalid avatar size: ${originalSize}`);
      }
      this._size = Number(size);
      this.iconSize = `${this._size}px`;
    }
    this.init();
  }

  @Input() iconSize: string;

  private _image: Image;
  /**
   * The image to show
   */
  @Input() get image(): Image {
    return this._image;
  }
  set image(image: Image) {
    this._image = image;
    this.init();
    this.initLightboxImages();
  }

  @Input() imageSize: number = null;

  additionalImagesToShow: Image[];

  private _additionalImages: Image[];
  @Input() get additionalImages(): Image[] {
    return this._additionalImages;
  }
  set additionalImages(images: Image[]) {
    this._additionalImages = images;
    this.additionalImagesToShow = (images || []).slice(0, Math.min(images.length, MAX_ADDITIONAL)).reverse();
    this.initLightboxImages();
  }

  private _additionalImagesHidden = false;
  @Input() get additionalImagesHidden(): boolean | string {
    return this._additionalImagesHidden;
  }
  set additionalImagesHidden(hidden: boolean | string) {
    this._additionalImagesHidden = truthyAttr(hidden);
  }

  get allImages(): Image[] {
    const images: Image[] = [];
    if (this.image) {
      images.push(this.image);
    }
    if (!empty(this.additionalImages)) {
      Array.prototype.push.apply(images, this.additionalImages);
    }
    return images;
  }

  url: string;
  visible = false;

  constructor(
    private element: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private lightbox: Lightbox) {
  }

  ngOnInit() {
    this.init();
  }

  private init() {
    if (this.image != null) {
      this.initImage();
    } else {
      this.initIcon();
    }
  }

  private initLightboxImages() {
    if (this.useLightbox) {
      this.lightboxImages = [];
      if (this._image) {
        this.lightboxImages.push(new LightboxImage(this._image));
      }
      if (this._additionalImages) {
        this._additionalImages.map(img => new LightboxImage(img)).forEach(img => {
          if (this.lightboxImages.findIndex(li => li.src === img.src) < 0) {
            this.lightboxImages.push(img);
          }
        });
      }
    } else {
      this.lightboxImages = null;
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
      const toShow = index === undefined ? this.lightboxImages.findIndex(li => li.src === this.image.url) : index;
      this.lightbox.open(this.lightboxImages, toShow);
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
