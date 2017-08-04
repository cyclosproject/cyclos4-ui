import { Injectable, OnDestroy} from '@angular/core';
import { Response } from '@angular/http';
import { ObservableMedia, MediaChange, BreakPointRegistry } from "@angular/flex-layout";
import { Subscription } from "rxjs/Subscription";
import { Subject } from "rxjs/Subject";

/**
 * Shared definitions for the application layout
 */
@Injectable()
export class LayoutService implements OnDestroy {
  private mediaSubscription: Subscription;
  private firstUpdate: boolean;

  constructor(
    private media: ObservableMedia,
    private breakPoints: BreakPointRegistry
  ) {
    this.mediaSubscription = this.media.subscribe((change: MediaChange) => {
      this.updateStyles();
    });
    this.updateStyles();
  }

  ngOnDestroy(): void {
    this.mediaSubscription.unsubscribe();
  }

  private updateStyles(): void {
    let body = document.body;
    for (let breakPoint of this.breakPoints.items) {
      if (this.media.isActive(breakPoint.alias)) {
        body.classList.add(breakPoint.alias);
      } else {
        body.classList.remove(breakPoint.alias);
      }
    }
  }

  public get xs(): boolean {
    return this.media.isActive('xs');
  }
  public get sm(): boolean {
    return this.media.isActive('sm');
  }
  public get md(): boolean {
    return this.media.isActive('md');
  }
  public get lg(): boolean {
    return this.media.isActive('lg');
  }
  public get xl(): boolean {
    return this.media.isActive('xl');
  }
  
  public get ltsm(): boolean {
    return this.media.isActive('lt-sm');
  }
  public get ltmd(): boolean {
    return this.media.isActive('lt-md');
  }
  public get ltlg(): boolean {
    return this.media.isActive('lt-lg');
  }
  public get ltxl(): boolean {
    return this.media.isActive('lt-xl');
  }

  public get gtxs(): boolean {
    return this.media.isActive('gt-xs');
  }
  public get gtsm(): boolean {
    return this.media.isActive('gt-sm');
  }
  public get gtmd(): boolean {
    return this.media.isActive('gt-md');
  }
  public get gtlg(): boolean {
    return this.media.isActive('gt-lg');
  }

}