import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostBinding } from '@angular/core';
import { CaptchaService } from 'app/api/services';
import { FormGroup } from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'captcha',
  templateUrl: 'captcha.component.html',
  styleUrls: ['captcha.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {

  @Input() group: string;

  /**
   * The form must have 2 defined fields: challenge and response,
   * just like the one returned by {@link ApiHelper.captchaFormGroup}
   */
  @Input() form: FormGroup;

  @ViewChild('image') image: ElementRef;

  currentUrl: string;

  constructor(
    private captchaService: CaptchaService,
    private element: ElementRef
  ) { }

  ngAfterViewInit() {
    this.newCaptcha();
  }

  ngOnDestroy() {
    this.revokeCurrent();
  }

  private revokeCurrent() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }

  get img(): HTMLImageElement {
    return this.image.nativeElement;
  }

  newCaptcha() {
    this.captchaService.newCaptchaResponse(this.group)
      .subscribe(response => {
        const id = response.body;
        this.form.patchValue({
          challenge: id,
          response: ''
        });
        this.captchaService.getCaptchaContent({ id: id, group: this.group }).subscribe(blob => {
          this.revokeCurrent();
          this.currentUrl = URL.createObjectURL(blob);
          this.img.src = this.currentUrl;
          this.updateWidth();
        });
      });
  }

  updateWidth() {
    const el = this.element.nativeElement as HTMLElement;
    el.style.width = `${this.img.getBoundingClientRect().width}px`;
  }
}
