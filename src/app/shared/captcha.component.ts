import { Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CaptchaService } from 'app/api/services';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FormGroup } from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'captcha',
  templateUrl: './captcha.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {
  constructor(private captchaService: CaptchaService) { }

  @Input() group: string;

  /**
   * The form must have 2 defined fields: challenge and response,
   * just like the one returned by {@link ApiHelper.captchaFormGroup}
   */
  @Input() form: FormGroup;

  @ViewChild('image') image: ElementRef;

  currentUrl: string;

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
          this.image.nativeElement.src = this.currentUrl;
        });
      });
  }
}
