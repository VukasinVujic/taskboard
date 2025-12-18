import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  standalone: true,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  @Input() action: string = '';
  @Input() taskId: string = '';

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  onCancel() {
    this.cancel.emit();
  }

  onConfirm(taskId: string) {
    this.confirm.emit(taskId);
  }
}
