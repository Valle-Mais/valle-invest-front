// src/app/components/asset-form/asset-form.component.ts
import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-form.component.html'
})
export class AssetFormComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() assetToEdit: any | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  asset: any = {};
  isEditMode = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assetToEdit'] && this.assetToEdit) {
      this.asset = { ...this.assetToEdit };
      this.isEditMode = true;
    } else {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.asset = { ticker: '', name: '', type: 'Ação' };
    this.isEditMode = false;
  }

  onClose(): void {
    this.close.emit();
    setTimeout(() => this.resetForm(), 300);
  }

  onSave(): void {
    this.save.emit(this.asset);
    this.onClose();
  }
}
