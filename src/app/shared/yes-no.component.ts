import { Component, Input, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Messages } from 'app/messages/messages';

/**
 * Component used to show a yes / no dialog
 */
@Component({
  selector: 'yes-no',
  templateUrl: 'yes-no.component.html',
  styleUrls: ['yes-no.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YesNoComponent {
  constructor(
    public messages: Messages,
    public dialogRef: MatDialogRef<YesNoComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string,
  ) { }

  no() {
    this.dialogRef.close(false);
  }

  yes() {
    this.dialogRef.close(true);
  }
}
