import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Injector, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CaptchaService } from 'app/api/services/captcha.service';
import { AbstractComponent } from 'app/shared/abstract.component';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'captcha',
  templateUrl: 'captcha.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaptchaComponent extends AbstractComponent implements AfterViewInit, OnDestroy {

  @Input() group: string;

  /**
   * The form must have 2 defined fields: challenge and response,
   * just like the one returned by {@link ApiHelper.captchaFormGroup}
   */
  @Input() form: FormGroup;

  @ViewChild('image', { static: true }) image: ElementRef;

  currentUrl: string;

  constructor(
    injector: Injector,
    private captchaService: CaptchaService,
  ) {
    super(injector);
  }

  ngAfterViewInit() {
    if (this.form.value.challenge) {
      // Has an initial value
      this.addSub(this.loadImage().subscribe());
    } else {
      this.newCaptcha();
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
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
    this.addSub(this.captchaService.newCaptcha({ group: this.group }).pipe(
      switchMap(id => {
        this.form.patchValue({
          challenge: id,
          response: '',
        });
        return this.loadImage();
      })).subscribe());
  }

  private loadImage() {
    const id = this.form.value.challenge;
    return this.captchaService.getCaptchaContent({ id, group: this.group }).pipe(tap(blob => {
      this.revokeCurrent();
      this.currentUrl = URL.createObjectURL(blob);
      this.image.nativeElement.style.display = 'none';
      const tempImage = new Image();
      tempImage.onload = () => this.updateImage(tempImage);
      tempImage.onerror = () => setTimeout(() => this.newCaptcha(), 1000);
      tempImage.src = this.currentUrl;
    }));
  }

  updateImage(tempImage: HTMLImageElement) {
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
