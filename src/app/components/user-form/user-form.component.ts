import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() userToEdit: any | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  user: any = {};
  isEditMode = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userToEdit'] && this.userToEdit) {
      this.user = { ...this.userToEdit };
      this.isEditMode = true;
    } else {
      this.resetForm();
    }
  }

  resetForm(): void {
    // Define os valores padrão para um novo utilizador
    this.user = { name: '', email: '', status: 'Ativo', role: 'client' };
    this.isEditMode = false;
  }

  onClose(): void {
    this.close.emit();
    setTimeout(() => this.resetForm(), 300);
  }

  onSave(): void {
    this.save.emit(this.user);
    this.onClose();
  }
}
