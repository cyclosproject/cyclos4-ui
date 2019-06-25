import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild, Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CaptchaService } from 'app/api/services';
import { AbstractComponent } from 'app/shared/abstract.component';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'captcha',
  templateUrl: 'captcha.component.html',
  styleUrls: ['captcha.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    private captchaService: CaptchaService
  ) {
    super(injector);
  }

  ngAfterViewInit() {
    this.newCaptcha();
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
          response: ''
        });
        return this.captchaService.getCaptchaContent({ id: id, group: this.group }).pipe(tap(blob => {
          this.revokeCurrent();
          this.currentUrl = URL.createObjectURL(blob);
          this.img.src = this.currentUrl;
          this.updateWidth();
        }));
      })).subscribe());
  }

  updateWidth() {
    this.element.style.width = `${this.img.getBoundingClientRect().width}px`;
  }
}
