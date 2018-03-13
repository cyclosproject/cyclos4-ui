import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';

/**
 * The size for rendered avatars
 */
export type AvatarSize = 'small' | 'medium' | 'large' | 'huge';
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
export class AvatarComponent implements OnInit {

  private _image: Image;
  private _ratio: number;

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
    const param = this._ratio > 0 ? 'width' : 'height';
    // Use twice the size to prevent pixelation on high density devices
    const size = SIZES[this.size] * 2;
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

  private get _imageWidth(): number {
    if (this._ratio < 1) {
      return SIZES[this.size];
    }
    return (SIZES[this.size] * this._ratio);
  }

  get imageWidth(): string {
    return this._imageWidth + 'px';
  }

  private get _imageHeight(): number {
    if (this._ratio > 1) {
      return SIZES[this.size];
    }
    return (SIZES[this.size] / this._ratio);
  }

  get imageHeight(): string {
    return this._imageHeight + 'px';
  }

  get imageLeft(): string {
    const offset = this._imageWidth - SIZES[this.size];
    if (offset > 0) {
      return -(offset / 2) + 'px';
    }
    return '0';
  }

  get imageTop(): string {
    const offset = this._imageHeight - SIZES[this.size];
    if (offset > 0) {
      return -(offset / 2) + 'px';
    }
    return '0';
  }

  get iconClass(): string {
    return 'mat-' + ICON_SIZES[this.size];
  }

  constructor(private svgIconRegistry: SvgIconRegistry) {
  }

  ngOnInit() {
    if (this.svgIconRegistry.isSvgIcon(this.icon)) {
      // This is a SVG icon
      this.svgIcon = this.icon;
      this.icon = null;
    }
  }
}
