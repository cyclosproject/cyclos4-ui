import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ObservableMedia } from "@angular/flex-layout";
import { Subscription } from "rxjs/Subscription";

/**
 * Ensures a change detection is performed whenever the screen is resized
 */
@Component({
  selector: 'resize-events',
  template: ''
})
export class ResizeEventsComponent implements OnInit, OnDestroy {
  private mediaSubscription: Subscription;
  
  constructor(
    private changeDetector: ChangeDetectorRef,
    private media: ObservableMedia
  ) { }

  ngOnInit() {
    this.mediaSubscription = this.media.subscribe(() => {
      this.changeDetector.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.mediaSubscription.unsubscribe();
  }
}