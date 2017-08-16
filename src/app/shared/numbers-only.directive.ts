import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from "@angular/forms";

const ALLOWED = [
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "End", "Home", "Delete", "Backspace", "Tab",
  "Shift", "Control", "Alt", "Super", "Meta",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
];

/**
 * A directive to only allow digits to be entered by users
 */
@Directive({
  selector: '[numbersOnly]'
})
export class NumbersOnlyDirective {
  constructor(
    private el: ElementRef, 
    private control: NgControl) {}

  private enabled: boolean;

  @Input()
  public set numbersOnly(numbersOnly: boolean | string) {
    this.enabled = numbersOnly === '' || numbersOnly === 'true' || numbersOnly === true;
  }


  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (this.enabled) {
      if (!event.ctrlKey && !event.altKey && ALLOWED.indexOf(event.key) < 0) {
        event.preventDefault();
      }
    }
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    if (this.enabled) {
      let data = event.clipboardData.getData('text/plain');
      if (!/^\d+$/.test(data)) {
        event.preventDefault();
      }
    }
  }
}