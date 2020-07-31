import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  EventEmitter, Injector, Input, OnInit, Output, ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { ImageProperties } from 'app/shared/image-properties';
import { endsWith } from 'lodash-es';
import { BsModalRef } from 'ngx-bootstrap/modal';

/**
 * A dialog used by `html-field` to edit an image properties
 */
@Component({
  selector: 'image-properties-dialog',
  styleUrls: ['image-properties-dialog.component.scss'],
  templateUrl: 'image-properties-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePropertiesDialogComponent
  extends BaseComponent implements OnInit, AfterViewInit {

  form: FormGroup;
  constrain = new FormControl(true);
  ratio: number;
  updatingDimensions = false;
  @Input() img: HTMLImageElement;
  @Output() select = new EventEmitter<ImageProperties>();
  @ViewChild('preview') preview: ElementRef<HTMLImageElement>;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      width: null,
      height: null,
      float: null,
      borderWidth: null,
      marginTop: null,
      marginBottom: null,
      marginLeft: null,
      marginRight: null,
    });
    this.addSub(this.form.controls.width.valueChanges.subscribe(w => {
      if (this.updatingDimensions) {
        return;
      }
      this.updatingDimensions = true;
      if (this.constrain.value && this.ratio) {
        const width = parseInt(w, 10);
        if (w) {
          this.form.patchValue({ height: String(Math.round(width / this.ratio)) });
        }
      }
      this.updatingDimensions = false;
    }));
    this.addSub(this.form.controls.height.valueChanges.subscribe(h => {
      if (this.updatingDimensions) {
        return;
      }
      this.updatingDimensions = true;
      if (this.constrain.value && this.ratio) {
        const height = parseInt(h, 10);
        if (h) {
          this.form.patchValue({ width: String(Math.round(height * this.ratio)) });
        }
      }
      this.updatingDimensions = false;
    }));

    this.ratio = this.img.naturalWidth / this.img.naturalHeight;
  }

  ngAfterViewInit() {
    const value: ImageProperties = {};
    for (const key of Object.keys(this.form.controls)) {
      let val = this.img.style[key];
      if (empty(val)) {
        if (!['width', 'height', 'float'].includes(key)) {
          val = '0';
        }
      } else if (endsWith(val, 'px')) {
        val = val.substr(0, val.length - 'px'.length);
      }
      value[key] = val;
    }
    if (!value.width || !value.height) {
      value.width = String(this.img.naturalWidth);
      value.height = String(this.img.naturalHeight);
    }
    this.form.patchValue(value);
    this.addSub(this.form.valueChanges.subscribe(() => this.updatePreview()));
    this.updatePreview();
  }

  private updatePreview() {
    const style = this.preview.nativeElement.style;
    const properties = this.getImageProperties();
    for (const key of Object.keys(properties)) {
      style[key] = properties[key];
    }
    const width = parseInt(properties.width, 10);
    const height = parseInt(properties.height, 10);
    const ratio = width / height;
    let maxWidth: number;
    let maxHeight: number;
    if (width >= height) {
      maxWidth = 200;
      maxHeight = maxWidth / ratio;
    } else {
      maxHeight = 200;
      maxWidth = maxHeight * ratio;
    }
    style.maxWidth = `${maxWidth}px`;
    style.maxHeight = `${maxHeight}px`;
  }

  private getImageProperties() {
    const properties = this.form.value as ImageProperties;
    for (const key of Object.keys(properties)) {
      let val = properties[key];
      if (!empty(val) && /^\d+$/.test(val)) {
        val += 'px';
      }
      properties[key] = val;
    }
    if (properties.borderWidth && parseInt(properties.borderWidth, 10) > 0) {
      properties.borderStyle = 'solid';
    }
    return properties;
  }

  save() {
    this.select.emit(this.getImageProperties());
    this.modalRef.hide();
  }
}
