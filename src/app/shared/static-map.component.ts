import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges
} from '@angular/core';
import { Address } from 'app/api/models';
import { AddressHelperService } from 'app/core/address-helper.service';
import { MapsService } from 'app/core/maps.service';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * Shows a static image for an address location
 */
@Component({
  selector: 'static-map',
  templateUrl: 'static-map.component.html',
  styleUrls: ['static-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaticMapComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

  @Input() address: Address;
  @Input() width: number | 'auto' = 'auto';
  @Input() height: number | 'auto' = 260;

  url$ = new BehaviorSubject<string>(null);
  externalUrl: string;
  title: string;
  imageWidth: number;
  imageHeight: number;
  anchorHeight: string;
  private sub: Subscription;

  constructor(
    private maps: MapsService,
    private el: ElementRef,
    private addressHelper: AddressHelperService) {
  }

  ngOnInit() {
    this.title = this.address.addressLine1 || this.addressHelper.addressStreet(this.address);
    this.externalUrl = this.maps.externalUrl(this.address);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.width || changes.height) {
      this.update();
    }
  }

  ngAfterViewInit() {
    this.update();
  }

  private update() {
    if (typeof this.height === 'number') {
      this.anchorHeight = `${this.height}px`;
    } else {
      this.anchorHeight = null;
    }
    this.updateDimensions();
  }

  private updateDimensions(timeout = 0) {
    if (typeof this.width === 'number') {
      this.imageWidth = this.width;
    }
    if (typeof this.height === 'number') {
      this.imageHeight = this.height;
    }
    if (this.width === 'auto' || this.height === 'auto') {
      // Need to figure out the actual dimensions
      setTimeout(() => {
        const element = this.element;
        if (element.offsetWidth === 0) {
          // Not displayed yet.
          this.updateDimensions(300);
        } else {
          // Update the widths and then update the URL
          if (this.width === 'auto') {
            this.imageWidth = element.offsetWidth;
          }
          if (this.height === 'auto') {
            this.imageHeight = element.offsetHeight;
          }
          this.doInitUrl();
        }
      }, timeout);
    } else {
      this.doInitUrl();
    }
  }

  private doInitUrl() {
    if (this.imageWidth && this.imageHeight) {
      this.url$.next(this.maps.staticUrl(this.address, this.imageWidth, this.imageHeight));
    }
  }

  private get element(): HTMLElement {
    return this.el.nativeElement;
  }
}
