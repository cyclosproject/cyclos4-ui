import {
  AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { truthyAttr } from 'app/shared/helper';

/**
 * The size for rendered avatars.
 * Profile is a special value that adapts to the max image width / height and layout size
 */
export type AvatarSize = 'small' | 'small-medium' | 'medium' | 'medium-large' | 'large' | 'xlarge' | 'huge' | 'full';
export const SIZES: { [key: string]: number; } = {
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

  @Input() imageSize: number = null;

  url: string;
  visible = false;

  constructor(
    private element: ElementRef,
    private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.update();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.image || changes.additionalImages || changes.size) {
      this.update();
    }
  }

  private update() {
    if (this.image) {
      this.initImage();
    } else {
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
