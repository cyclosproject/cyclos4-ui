import { Component, OnInit, Input, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { Image } from "app/api/models";

/**
 * The size for rendered avatars
 */
export type AvatarSize = "small" | "medium" | "large" | "huge";
export const SIZES: {[key: string]: number} = {
  "small": 24,
  "medium": 36,
  "large": 48,
  "huge": 96
};

/**
 * Renders an avatar (image within a circle).
 * If there is no image, an icon is shown instead
 */
@Component({
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
    if (this._image == null) return null;
    let param = this._ratio > 0 ? 'width' : 'height';
    // Use twice the size to prevent pixelation on high density devices
    let size = SIZES[this.size] * 2;
    return `${this._image.url}?${param}=${size}`;
  }

  /**
   * The icon show when no image is available
   */
  @Input()
  icon: string = "account_circle";

  /**
   * The size of images and icons
   */
  @Input()
  size: AvatarSize = "medium";

  @ViewChild("outer")
  container: ElementRef;

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
    let offset = this._imageWidth - SIZES[this.size];
    if (offset > 0) {
      return -(offset / 2) + 'px';
    }
    return '0';
  }

  get imageTop(): string {
    let offset = this._imageHeight - SIZES[this.size];
    if (offset > 0) {
      return -(offset / 2) + 'px';
    }
    return '0';
  }

  get iconClass(): string {
    return 'md-' + SIZES[this.size];
  }

  constructor() { }

  ngOnInit() { }
}