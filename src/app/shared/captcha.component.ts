import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CaptchaInput, CaptchaProviderEnum } from 'app/api/models';
import { CaptchaService } from 'app/api/services/captcha.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LayoutService } from 'app/core/layout.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { switchMap, tap } from 'rxjs/operators';

/**
 * Displays a CAPCHA input.
 * Supports both internal and reCAPTCHA v2 providers.
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'captcha',
  templateUrl: 'captcha.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptchaComponent extends AbstractComponent implements AfterViewInit, OnDestroy {
  @Input() captchaInput: CaptchaInput;

  @Input() group: string;

  /**
   * The form must have 2 defined fields: challenge and response,
   * just like the one returned by `AuthHelper.captchaFormGroup`.
   */
  @Input() form: FormGroup;

  @Input() focused: boolean;

  @ViewChild('image') image: ElementRef;

  currentUrl: string;

  constructor(
    injector: Injector,
    private captchaService: CaptchaService,
    private errorHandler: ErrorHandlerService,
    public layout: LayoutService
  ) {
    super(injector);
  }

  ngAfterViewInit() {
    if (this.captchaInput.provider === CaptchaProviderEnum.INTERNAL) {
      this.newCaptcha();
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.revokeCurrent();
    // Remove current challenge if it's pending
    if (this.captchaInput.provider === CaptchaProviderEnum.INTERNAL) {
      this.errorHandler.requestWithCustomErrorHandler(() =>
        this.addSub(this.captchaService.deleteCaptcha({ id: this.form.value.challenge }).subscribe())
      );
    }
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
    if (this.captchaInput.provider === CaptchaProviderEnum.INTERNAL) {
      this.addSub(
        this.captchaService
          .newCaptcha({ group: this.group, previousChallenge: this.form.value.challenge })
          .pipe(
            switchMap(id => {
              this.form.patchValue({
                challenge: id,
                response: ''
              });
              return this.loadImage();
            })
          )
          .subscribe()
      );
    } else if (this.captchaInput.provider === CaptchaProviderEnum.RECAPTCHA_V_2) {
    }
  }

  private loadImage() {
    const id = this.form.value.challenge;
    return this.captchaService.getCaptchaContent({ id, group: this.group }).pipe(
      tap(blob => {
        this.revokeCurrent();
        this.currentUrl = URL.createObjectURL(blob);
        this.image.nativeElement.style.display = 'none';
        const tempImage = new Image();
        tempImage.onload = () => this.updateImage(tempImage);
        tempImage.onerror = () => setTimeout(() => this.newCaptcha(), 1000);
        tempImage.src = this.currentUrl;
      })
    );
  }

  private updateImage(tempImage: HTMLImageElement) {
    const width = tempImage.width;
    if (width > 0) {
      this.img.style.width = `${width}px`;
      this.element.style.width = `${width}px`;
    }
    const img = this.image.nativeElement as HTMLImageElement;
    img.src = tempImage.src;
    img.style.display = '';
  }
}
