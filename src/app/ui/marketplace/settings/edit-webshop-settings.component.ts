import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { WebshopSettingsView } from 'app/api/models';
import { WebshopSettingsService } from 'app/api/services';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';

/**
 * Edit settings for webshop products
 */
@Component({
  selector: 'edit-webshop-settings',
  templateUrl: 'edit-webshop-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditWebshopSettingsComponent
  extends BasePageComponent<WebshopSettingsView>
  implements OnInit {

  user: string;
  self: boolean;
  form: FormGroup;

  constructor(
    injector: Injector,
    private webshopSettingsService: WebshopSettingsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.webshopSettingsService.viewWebshopSettings({ user: this.user }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: WebshopSettingsView) {
    this.self = this.authHelper.isSelfOrOwner(data.user);
    this.form = this.formBuilder.group({
      productNumberGenerated: data.productNumberGenerated,
      productGenerationType: data.productNumberGenerated ? 'generated' : 'manual',
      productNumberMask: data.productNumberMask,
      customOrderNumberFormat: data.customOrderNumberFormat,
      orderGenerationType: data.customOrderNumberFormat ? 'manual' : 'generated',
      orderNumberInnerLength: data.orderNumberInnerLength,
      orderNumberPrefix: data.orderNumberPrefix,
      orderNumberSuffix: data.orderNumberSuffix,
    });
    this.addSub(this.form.controls.productGenerationType.valueChanges.subscribe(() => this.updateMaskControl()));
    this.addSub(this.form.controls.orderGenerationType.valueChanges.subscribe(() => this.updateOrderControls()));
    this.updateMaskControl();
    this.updateOrderControls();
  }

  /**
   * Updates mask control validator based on generation type
   */
  protected updateMaskControl() {
    const value = this.form.controls.productGenerationType.value;
    if (value === 'generated') {
      this.form.controls.productNumberMask.clearValidators();
    } else {
      this.form.controls.productNumberMask.setValidators(Validators.required);
    }
    this.form.controls.productNumberMask.updateValueAndValidity();
  }

  /**
   * Updates number controls validators based on custom order number
   */
  protected updateOrderControls() {
    const controls = [
      this.form.controls.orderNumberInnerLength,
      this.form.controls.orderNumberPrefix,
      this.form.controls.orderNumberSuffix];
    if (this.form.controls.orderGenerationType.value === 'generated') {
      controls.forEach(c => c.clearValidators());
    } else {
      controls.forEach(c => c.setValidators(Validators.required));
    }
    controls.forEach(c => c.updateValueAndValidity());
  }

  /**
   * Saves or edits the current settings
   */
  save() {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    const value = cloneDeep(this.form.value);
    value.productNumberGenerated = this.form.controls.productGenerationType.value === 'generated';
    delete value.productGenerationType;

    value.customOrderNumberFormat = this.form.controls.orderGenerationType.value === 'manual';
    delete value.orderGenerationType;

    this.addSub(this.webshopSettingsService.updateWebshopSettings({ user: this.user, body: value }).subscribe(() => {
      this.notification.snackBar(this.i18n.ad.webshopSettingsSaved);
    }));
  }

  resolveMenu(data: WebshopSettingsView) {
    return this.menu.userMenu(data.user, Menu.WEBSHOP_SETTINGS);
  }

}
