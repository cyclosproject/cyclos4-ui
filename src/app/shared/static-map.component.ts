import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  HostBinding, Input, OnInit, ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { Address } from 'app/api/models';
import { MapsService } from 'app/core/maps.service';
import { LayoutService } from 'app/shared/layout.service';
import { Subscription } from 'rxjs';
import { AddressHelperService } from 'app/core/address-helper.service';

/**
 * Shows a static image for an address location
 */
@Component({
  selector: 'static-map',
  templateUrl: 'static-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaticMapComponent implements OnInit, OnDestroy, AfterViewInit {

  @HostBinding('class.d-block') classBlock = true;
  @HostBinding('class.flex-grow-1') classFlexGrow = true;
  @HostBinding('class.w-100') classW100 = true;

  @Input() address: Address;
  @Input() width: number | 'auto' = 'auto';
  @Input() height: number | 'auto' = 260;

  url: string;
  externalUrl: string;
  title: string;
  widthWasAuto: boolean;
  heightWasAuto: boolean;
  imageWidth: string;
  imageHeight: string;
  anchorHeight: string;
  private sub: Subscription;

  constructor(
    private maps: MapsService,
    private el: ElementRef,
    private cd: ChangeDetectorRef,
    private addressHelper: AddressHelperService,
    private layout: LayoutService) {
  }

  ngOnInit() {
    this.title = this.address.addressLine1 || this.addressHelper.addressStreet(this.address);
    this.externalUrl = this.maps.externalUrl(this.address);
    this.widthWasAuto = this.width === 'auto';
    this.heightWasAuto = this.height === 'auto';
    this.sub = this.layout.breakpointChanges$.subscribe(() => {
      if (this.widthWasAuto) {
        this.width = 'auto';
      }
      if (this.heightWasAuto) {
        this.height = 'auto';
      }
      this.url = null;
      this.imageWidth = null;
      this.imageHeight = null;
      this.cd.detectChanges();
      this.checkSizes();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.checkSizes();
  }

  private checkSizes() {
    if (typeof this.height === 'number') {
      this.anchorHeight = `${this.height}px`;
    } else {
      this.anchorHeight = null;
    }
    if (this.width === 'auto' || this.height === 'auto') {
      setTimeout(() => {
        const element = this.element;
        if (this.width === 'auto') {
          this.width = element.offsetWidth;
        }
        if (this.height === 'auto') {
          this.height = element.offsetHeight;
        }
        this.doInitUrl();
      }, 1);
    } else {
      this.doInitUrl();
    }
  }

  private doInitUrl() {
    if (typeof this.width === 'number' && typeof this.height === 'number') {
      this.url = this.maps.staticUrl(this.address, this.width, this.height);
      this.imageWidth = this.width + 'px';
      this.imageHeight = this.height + 'px';
      this.cd.detectChanges();
    }
  }

  private get element(): HTMLElement {
    return this.el.nativeElement;
  }
}
