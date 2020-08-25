import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  Host, Injector, OnInit, Optional, SkipSelf, ViewChild,
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RoleEnum } from 'app/api/models';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty, focus, htmlCollectionToArray } from 'app/shared/helper';
import { ImageProperties } from 'app/shared/image-properties';
import { ImagePropertiesDialogComponent } from 'app/shared/image-properties-dialog.component';
import { InsertImageDialogComponent } from 'app/shared/insert-image-dialog.component';
import { LinkProperties } from 'app/shared/link-properties';
import { LinkPropertiesDialogComponent } from 'app/shared/link-properties-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import * as rangy from 'rangy';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

export type ActionWidget = 'select' | 'button';

interface ActionValue {
  value: string;
  label: string;
}

abstract class Action {
  icon?: string;
  expandSelection = false;
  constructor(
    public fieldId: string,
    public widget: ActionWidget,
    public tooltip: string,
  ) { }

  element(): HTMLElement {
    return document.getElementById(this.fieldId);
  }

  expand(): this {
    this.expandSelection = true;
    return this;
  }
}
abstract class Command extends Action {
  constructor(
    idPrefix: string,
    public type: ActionWidget,
    public command: string,
    tooltip: string,
  ) {
    super(`${idPrefix}_${command}`, type, tooltip);
  }
}
class CommandSelect extends Command {
  constructor(
    idPrefix: string,
    command: string,
    tooltip: string,
    public values?: ActionValue[],
  ) {
    super(idPrefix, 'select', command, tooltip);
  }

  element() {
    return super.element() as HTMLSelectElement;
  }
}
class CommandButton extends Command {
  constructor(
    idPrefix: string,
    command: string,
    tooltip: string,
    public icon: string,
  ) {
    super(idPrefix, 'button', command, tooltip);
  }

  element() {
    return super.element() as HTMLButtonElement;
  }
}

class CustomButton extends Action {
  constructor(
    fieldId: string,
    public callback: () => any,
    tooltip: string,
    public icon: string,
  ) {
    super(fieldId, 'button', tooltip);
  }
}

/**
 * Component used to display an rich text field.
 */
@Component({
  selector: 'html-field',
  templateUrl: 'html-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: HtmlFieldComponent, multi: true },
  ],
})
export class HtmlFieldComponent
  extends BaseFormFieldComponent<string> implements OnInit, AfterViewInit {

  @ViewChild('editor') private editor: ElementRef<HTMLElement>;

  actions: Action[][];

  source$ = new BehaviorSubject(false);

  selection: RangyRange[];

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private modal: BsModalService) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.actions = [
      [
        new CommandButton(this.id, 'undo', this.i18n.field.html.undo, 'fa-undo'),
        new CommandButton(this.id, 'redo', this.i18n.field.html.redo, 'fa-undo fa-flip-horizontal'),
      ],
      [
        new CommandSelect(this.id, 'formatblock', this.i18n.field.html.block, [
          { value: 'h1', label: this.i18n.field.html.blockH1 },
          { value: 'h2', label: this.i18n.field.html.blockH2 },
          { value: 'h3', label: this.i18n.field.html.blockH3 },
          { value: 'h4', label: this.i18n.field.html.blockH4 },
          { value: 'h5', label: this.i18n.field.html.blockH5 },
          { value: 'h6', label: this.i18n.field.html.blockH6 },
          { value: 'p', label: this.i18n.field.html.blockP },
          { value: 'pre', label: this.i18n.field.html.blockPre },
        ]),
      ],
      [
        new CommandSelect(this.id, 'fontname', this.i18n.field.html.font, [
          { value: getComputedStyle(document.body).fontFamily, label: this.i18n.field.html.fontDefault },
          { value: 'sans-serif', label: this.i18n.field.html.fontSansSerif },
          { value: 'serif', label: this.i18n.field.html.fontSerif },
          { value: 'monospace', label: this.i18n.field.html.fontMonospace },
        ]).expand(),
      ],
      [
        new CommandSelect(this.id, 'fontsize', this.i18n.field.html.size, [
          { value: '1', label: this.i18n.field.html.size1 },
          { value: '2', label: this.i18n.field.html.size2 },
          { value: '3', label: this.i18n.field.html.size3 },
          { value: '4', label: this.i18n.field.html.size4 },
          { value: '5', label: this.i18n.field.html.size5 },
          { value: '6', label: this.i18n.field.html.size6 },
          { value: '7', label: this.i18n.field.html.size7 },
        ]).expand(),
      ],
      [
        new CommandButton(this.id, 'bold', this.i18n.field.html.bold, 'fa-bold').expand(),
        new CommandButton(this.id, 'italic', this.i18n.field.html.italic, 'fa-italic').expand(),
        new CommandButton(this.id, 'underline', this.i18n.field.html.underline, 'fa-underline').expand(),
        new CommandButton(this.id, 'strikethrough', this.i18n.field.html.strikethrough, 'fa-strikethrough').expand(),
      ],
      [
        new CommandButton(this.id, 'justifyLeft', this.i18n.field.html.alignLeft, 'fa-align-left'),
        new CommandButton(this.id, 'justifyCenter', this.i18n.field.html.alignCenter, 'fa-align-center'),
        new CommandButton(this.id, 'justifyRight', this.i18n.field.html.alignRight, 'fa-align-right'),
        new CommandButton(this.id, 'justifyFull', this.i18n.field.html.alignJustify, 'fa-align-justify'),
      ],
      [
        new CommandButton(this.id, 'insertUnorderedList', this.i18n.field.html.listBulleted, 'fa-list-ul'),
        new CommandButton(this.id, 'insertOrderedList', this.i18n.field.html.listNumbered, 'fa-list-ol'),
        new CommandButton(this.id, 'outdent', this.i18n.field.html.indentLess, 'fa-indent'),
        new CommandButton(this.id, 'indent', this.i18n.field.html.indentMore, 'fa-outdent'),
      ],
      this.actionsWithImage,
      [
        new CommandButton(this.id, 'removeformat', this.i18n.field.html.removeFormat, 'fa-remove').expand(),
      ],
    ].filter(a => !empty(a));
  }

  private get actionsWithImage(): Action[] {
    const actions: Action[] = [];

    const auth = this.dataForUiHolder.auth;
    const permissions = this.dataForUiHolder.auth.permissions || {};
    const imagePermissions = permissions.images || {};
    if (imagePermissions.myCustom || auth.role === RoleEnum.ADMINISTRATOR) {
      // Admins can link an external URL or use system images. Users can only use custom images.
      // However, this user don't have this permission, so we can't show the insert image button.
      actions.push(new CustomButton(`${this.id}_insertImage`, () => this.insertImage(), this.i18n.field.html.image.tooltip, 'fa-image'));
    }

    actions.push(new CustomButton(`${this.id}_insertLink`, () => this.insertLink(), this.i18n.field.html.link.tooltip, 'fa-link').expand());
    actions.push(new CustomButton(`${this.id}_removeLink`, () => this.unlink(), this.i18n.field.html.unlink, 'fa-unlink'));
    return actions;
  }

  ngAfterViewInit() {
    const editor = this.editor.nativeElement;
    editor.innerHTML = this.value || '';
    editor.querySelectorAll('img').forEach(img => this.setupImage(img));
  }

  updateToolbarState() {
    for (const group of this.actions) {
      for (const action of group) {
        if (!(action instanceof Command)) {
          continue;
        }
        const element = document.getElementById(`${this.id}_${action.command}`);
        if (element) {
          const tag = element.tagName.toLowerCase();
          if (tag === 'select') {
            const value = document.queryCommandValue(action.command);
            const select = element as HTMLSelectElement;
            let index = 0;
            const options = select.options;
            for (let i = 0; i < options.length; i++) {
              if (options.item(i).value === value) {
                index = i;
                break;
              }
            }
            options.selectedIndex = index;
          } else {
            const state = document.queryCommandState(action.command);
            if (state) {
              element.classList.add('active');
            } else {
              element.classList.remove('active');
            }
          }
        }
      }
    }
  }

  getFocusableControl() {
    return this.editor.nativeElement;
  }

  protected getDisabledValue(): string {
    return this.value;
  }

  toggleSource() {
    const source = !this.source$.value;
    this.source$.next(source);
    if (!source) {
      this.editor.nativeElement.innerHTML = this.value;
    }
    for (const group of this.actions) {
      for (const action of group) {
        const element = action.element();
        if (element && typeof element['disabled'] !== 'undefined') {
          element['disabled'] = source;
        }
      }
    }
    setTimeout(() => focus(`${this.id}_${source ? 'source' : 'editor'}`));
  }

  run(action: Action) {
    this.focusEditor('store');
    let expandedRange = false;
    if (action.expandSelection) {
      expandedRange = this.expandSelection();
    }
    if (action instanceof CommandSelect) {
      this.doRunCommand(action.command, action.element().value);
    } else if (action instanceof CommandButton) {
      this.doRunCommand(action.command);
    } else if (action instanceof CustomButton) {
      action.callback();
    }
    if (expandedRange && action instanceof Command) {
      const sel = rangy.getSelection();
      sel.collapseToEnd();
    }
  }

  private expandSelection(): boolean {
    if (!empty(this.selection)) {
      const range = this.selection[0];
      if (range && range.collapsed) {
        // Expand the range
        const content = range.startContainer.textContent;
        if (!empty(content)) {
          let start = range.startOffset;
          let end = range.startOffset;
          while (start > 0 && /\w/.test(content.charAt(start - 1))) {
            start--;
          }
          while (end <= content.length && /\w/.test(content.charAt(end))) {
            end++;
          }
          const newRange = rangy.createRangyRange();
          newRange.setStart(range.startContainer, start);
          newRange.setEnd(range.startContainer, end);
          newRange.select();
          this.selection = [newRange];
          return true;
        }
      }
    }
    return false;
  }

  private doRunCommand(command: string, value?: string) {
    this.focusEditor();
    document.execCommand(command, false, value);
    this.focusEditor();
    this.updateValue();
    this.updateToolbarState();
  }

  private focusEditor(selection: 'none' | 'store' | 'restore' = 'none') {
    this.editor.nativeElement.focus();
    switch (selection) {
      case 'store':
        this.selection = rangy.getSelection().getAllRanges();
        break;
      case 'restore':
        if (!empty(this.selection)) {
          rangy.getSelection().setRanges(this.selection);
        }
        break;
    }
  }

  private updateValue() {
    this.value = this.editor.nativeElement.innerHTML;
  }

  private insertImage() {
    this.focusEditor('store');
    const ref = this.modal.show(InsertImageDialogComponent, {
      class: 'modal-form modal-form-medium',
    });
    const component = ref.content as InsertImageDialogComponent;
    component.select.pipe(first()).subscribe(i => this.doInsertImage(i));
    this.modal.onHide.pipe(first()).subscribe(() => this.focusEditor('restore'));
  }

  private insertLink() {
    this.focusEditor('store');
    this.showLinkProperties();
  }

  private unlink() {
    this.focusEditor('store');
    if (empty(this.selection)) {
      return;
    }
    const sel = rangy.getSelection();
    if (sel.isCollapsed) {
      // First expand up to the parent anchor
      let el: Node = sel.focusNode;
      while (el.nodeType === Node.TEXT_NODE
        || (el.nodeType === Node.ELEMENT_NODE && el.nodeName.toLowerCase() !== 'a')) {
        el = el.parentElement;
      }
      if (!el || el.nodeName.toLowerCase() !== 'a') {
        // No <a> to unlink
        return;
      }
      const range = rangy.createRangyRange();
      range.selectNode(el);
      range.select();
      this.selection = [range];
    }
    this.doRunCommand('unlink');
  }

  private doInsertImage(url: string) {
    const id = `img_${new Date().getTime()}`;
    this.doRunCommand('insertHTML', `<img id="${id}">`);
    const img = document.getElementById(id) as HTMLImageElement;
    img.removeAttribute('id');
    img.src = url;
    this.setupImage(img);
    this.updateValue();
  }

  private setupImage(img: HTMLImageElement) {
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    const listener = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      this.showImageProperties(img);
    };
    img.addEventListener('dblclick', listener, false);
    img.addEventListener('contextmenu', listener, false);
  }

  private setupLink(a: HTMLAnchorElement) {
    const listener = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      this.showLinkProperties(a);
    };
    a.addEventListener('dblclick', listener, false);
    a.addEventListener('contextmenu', listener, false);
  }

  private showImageProperties(img: HTMLImageElement) {
    const ref = this.modal.show(ImagePropertiesDialogComponent, {
      class: 'modal-form modal-form-medium',
      initialState: {
        img,
      },
    });
    const component = ref.content as ImagePropertiesDialogComponent;
    component.select.pipe(first()).subscribe(props => this.doSetImageProperties(img, props));
    this.modal.onHide.pipe(first()).subscribe(() => this.focusEditor('restore'));
  }

  private showLinkProperties(a?: HTMLAnchorElement) {
    const ref = this.modal.show(LinkPropertiesDialogComponent, {
      class: 'modal-form modal-form-medium',
      initialState: {
        link: a,
      },
    });
    const component = ref.content as LinkPropertiesDialogComponent;
    component.select.pipe(first()).subscribe(props => this.doSetLinkProperties(a, props));
    this.modal.onHide.pipe(first()).subscribe(() => this.focusEditor('restore'));
  }

  private doSetImageProperties(img: HTMLImageElement, props: ImageProperties) {
    const style = img.style;
    for (const key of Object.keys(props)) {
      style[key] = props[key];
    }

    this.updateValue();
  }

  private doSetLinkProperties(a: HTMLAnchorElement, props: LinkProperties) {
    if (a) {
      // Editing an existing link properties
      if (props == null || empty(props.href)) {
        const parent = a.parentElement;
        parent.insertBefore(document.createTextNode(a.innerText), a);
        parent.removeChild(a);
      } else {
        a.href = props.href;
        a.innerText = props.text || props.href;
      }
    } else if (!empty(this.selection)) {
      // Creating a link to a selection
      this.focusEditor('restore');
      this.doRunCommand('createLink', props.href);
      const element = this.selection[0].startContainer;
      switch (element.nodeType) {
        case Node.ELEMENT_NODE:
          // The selection was an element which had the link inserted
          htmlCollectionToArray((element as HTMLElement).getElementsByTagName('a')).forEach(
            (anchor: HTMLAnchorElement) => this.setupLink(anchor));
          break;
        case Node.TEXT_NODE:
          if (element.parentElement && element.parentElement.tagName.toLowerCase() === 'a') {
            // The selection was just a text, and had the link inserted surrounding it
            this.setupLink(element.parentElement as HTMLAnchorElement);
          }
          break;
      }
    }
    this.updateValue();
  }

  values(action: Action): ActionValue[] {
    if (action instanceof CommandSelect) {
      return action.values;
    }
  }
}
