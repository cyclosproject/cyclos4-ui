import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Image } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { galleryImage, truthyAttr } from 'app/shared/helper';
import { INgxGalleryImage, NgxGalleryComponent, NgxGalleryOptions } from 'ngx-gallery-9';

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
  huge: 128
};

/**
 * Renders an avatar (image within a circle) which when clicked opens a lightbox with images.
 * If there is no image, an icon is shown instead
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'avatar-lightbox',
  templateUrl: 'avatar-lightbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarLightboxComponent implements OnChanges {
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

  @Input() size: AvatarSize | number | string;

  @Input() iconSize: string;

  /**
   * The image to show
   */
  @Input() image: Image;

  /**
   * Other images in the collection
   */
  @Input() additionalImages: Image[];

  @Input() imageSize: number = null;

  url: string;
  visible = false;
  @ViewChild(NgxGalleryComponent) gallery: NgxGalleryComponent;

  allImages: Image[];

  galleryOptions: NgxGalleryOptions[];

  galleryImages: INgxGalleryImage[];

  ngOnInit() {
    this.update();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.image || changes.additionalImages || changes.size) {
      this.update();
    }
  }

  showLightbox(index?: number) {
    if (this.image) {
      const images = this.galleryImages || [];
      const toShow = index == null ? images.findIndex(li => li.big === this.image.url) : index;
      this.gallery.openPreview(toShow);
    }
  }

  private update() {
    if (this.image) {
      const additional = this.additionalImages || [];
      this.allImages = [...additional];
      if (this.allImages.findIndex(i => i.url === this.image.url) < 0) {
        this.allImages.unshift(this.image);
      }
      this.galleryImages = this.allImages.map(galleryImage);
      this.galleryOptions = [
        {
          width: '0',
          height: '0',
          image: false,
          thumbnails: false,
          previewKeyboardNavigation: true,
          previewCloseOnClick: true,
          previewCloseOnEsc: true,
          previewArrows: additional.length > 0
        }
      ];
      if (this.gallery) {
        this.gallery.images = this.galleryImages;
        this.gallery.options = this.galleryOptions;
      }
    } else {
      this.allImages = [];
      this.galleryImages = null;
    }
  }
}
