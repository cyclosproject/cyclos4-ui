import { Component, OnInit, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';
import { LayoutService } from 'app/core/layout.service';
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
  static MAX_PROFILE_SIZE_SMALL = 100;

  private _image: Image;
  private _ratio: number;

  constructor(
    injector: Injector,
    private svgIconRegistry: SvgIconRegistry) {
    super(injector);
  }

  /**
   * The image to show
   */
  @Input()
  set image(image: Image) {
    this._image = image;
    if (image) {
      this._ratio = image.width / image.height;
    }
  }
  get image(): Image {
    return this._image;
  }

  get url(): string {
    if (this._image == null) {
      return null;
    }
    // The smallest dimension is used to determine the requested size...
    const param = this._ratio < 1 ? 'width' : 'height';
    // ... which should be doubled prevent pixelation on high density devices.
    let size: number;
    if (this.size === 'profile') {
      size = this.maxSize * 2;
    } else {
      size = SIZES[this.size] * 2;
    }
    return `${this._image.url}?${param}=${size}`;
  }

  /**
   * The icon show when no image is available
   */
  @Input()
  icon = 'account_circle';

  /**
   * If the icon name represents an SVG icon, it will be replaced by this one
   */
  svgIcon: string;

  /**
   * The size of images and icons
   */
  @Input()
  size: AvatarSize = 'medium';

  get maxSize(): number {
    if (this.size === 'profile') {
      return this.layout.ltmd ? AvatarComponent.MAX_PROFILE_SIZE_SMALL : AvatarComponent.MAX_PROFILE_SIZE;
    } else {
      return SIZES[this.size];
    }
  }

  private get _imageWidth(): number {
    if (this.size === 'profile') {
      if (this._ratio > 1) {
        // Height determines the width by ratio
        return this._imageHeight * this._ratio;
      }
      const width = this.image.width *= this._ratio;
      const maxSize = this.maxSize;
      return width > maxSize ? maxSize : width;
    }
    if (this._ratio < 1) {
      return SIZES[this.size];
    }
    return (SIZES[this.size] * this._ratio);
  }

  get imageWidth(): string {
    return this._imageWidth + 'px';
  }

  private get _imageHeight(): number {
    if (this.size === 'profile') {
      if (this._ratio < 1) {
        // Width determines the height by ratio
        return this._imageWidth / this._ratio;
      }
      const height = this.image.height *= this._ratio;
      const maxSize = this.maxSize;
      return height > maxSize ? maxSize : height;
    }

    if (this._ratio > 1) {
      return SIZES[this.size];
    }
    return (SIZES[this.size] / this._ratio);
  }

  get imageHeight(): string {
    return this._imageHeight + 'px';
  }

  get imageLeft(): string {
    const offset = this._imageWidth - this.maxSize;
    if (offset > 0) {
      return -(offset / 2) + 'px';
    }
    return '0';
  }

  get imageTop(): string {
    const offset = this._imageHeight - this.maxSize;
    if (offset > 0) {
      return -(offset / 2) + 'px';
    }
    return '0';
  }

  get iconClass(): string {
    return 'mat-' + ICON_SIZES[this.size];
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
  }
}
