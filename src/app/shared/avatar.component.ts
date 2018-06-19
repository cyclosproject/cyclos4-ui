import { Component, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';
import { BaseComponent } from './base.component';

/**
 * The size for rendered avatars.
 * Profile is a special value that adapts to the max image width / height and layout size
 */
export type AvatarSize = 'small' | 'medium' | 'large' | 'huge' | 'profile';
export const SIZES: { [key: string]: number } = {
  'small': 24,
  'medium': 36,
  'large': 48,
  'huge': 96
};
export const ICON_SIZES: { [key: string]: number } = {
  'small': 24,
  'medium': 44,
  'large': 48,
  'huge': 96
};

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
export class AvatarComponent extends BaseComponent {

  static MAX_PROFILE_SIZE = 200;
  static MAX_PROFILE_SIZE_SMALL = 140;

  /**
   * The icon show when no image is available
   */
  @Input() icon = 'account_circle';

  /**
   * The size of images and icons
   */
  @Input() size: AvatarSize = 'medium';

  private _image: Image;
  /**
   * The image to show
   */
  @Input() get image(): Image {
    return this._image;
  }
  set image(image: Image) {
    this._image = image;
    this.initImage();
  }

  url: string;
  maxSize: number;
  ratio: number;
  imageWidth: number;
  imageHeight: number;
  imageLeft: number;
  imageTop: number;

  iconClass: string;
  svgIcon: string;

  constructor(
    injector: Injector,
    private svgIconRegistry: SvgIconRegistry) {
    super(injector);
  }

  ngOnInit() {
    if (this.size === 'profile' && this.image == null) {
      throw new Error('Profile avatar requires an image');
    }
    if (this.svgIconRegistry.isSvgIcon(this.icon)) {
      // This is a SVG icon
      this.svgIcon = this.icon;
      this.icon = null;
    }
    this.initImage();
  }

  private initImage() {
    // Initialize the maximum size
    let maxSize: number;
    if (this.size === 'profile') {
      maxSize = this.layout.ltmd ? AvatarComponent.MAX_PROFILE_SIZE_SMALL : AvatarComponent.MAX_PROFILE_SIZE;
    } else {
      maxSize = SIZES[this.size];
    }
    this.maxSize = maxSize;

    const image = this.image;
    if (image) {
      // Calculate the image attributes
      this.ratio = image.width / image.height;
      if (this.size === 'profile') {
        if (this.ratio > 1.0) {
          // Height determines width by ratio
          this.imageHeight = Math.min(image.height, maxSize);
          this.imageWidth = this.imageHeight * this.ratio;
        } else if (this.ratio < 1.0) {
          // Width determines height by ratio
          this.imageWidth = Math.min(image.width, maxSize);
          this.imageHeight = this.imageWidth / this.ratio;
        } else {
          // Perfect square
          this.imageWidth = this.imageHeight = Math.min(image.width, maxSize);
        }
      } else {
        if (this.ratio > 1.0) {
          // Height determines width by ratio
          this.imageHeight = SIZES[this.size];
          this.imageWidth = this.imageHeight * this.ratio;
        } else if (this.ratio < 1.0) {
          // Width determines height by ratio
          this.imageWidth = SIZES[this.size];
          this.imageHeight = this.imageWidth / this.ratio;
        } else {
          // Perfect square
          this.imageWidth = this.imageHeight = SIZES[this.size];
        }
      }
      const offsetLeft = this.imageWidth - maxSize;
      this.imageLeft = offsetLeft > 0 ? -offsetLeft / 2 : 0;
      const offsetTop = this.imageHeight - maxSize;
      this.imageTop = offsetTop > 0 ? -offsetTop / 2 : 0;

      // Define the URL
      // The smallest dimension is used to determine the requested size...
      const param = this.ratio < 1 ? 'width' : 'height';
      // ... which should be doubled prevent pixelation on high density devices.
      let size: number;
      if (this.size === 'profile') {
        size = this.maxSize * 2;
      } else {
        size = SIZES[this.size] * 2;
      }
      this.url = `${this.image.url}?${param}=${size}`;
    } else {
      // Calculate the icon attributes
      this.iconClass = 'mat-' + ICON_SIZES[this.size];
    }
  }
}
