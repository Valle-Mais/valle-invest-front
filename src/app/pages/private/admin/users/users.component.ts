import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserFormComponent } from '../../../../components/user-form/user-form.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../security/auth.service';
import { environment } from '../../../../../environments/environment'; // 1. Importa o ficheiro de ambiente

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterLink, UserFormComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  // 2. Utiliza a apiUrl definida no ficheiro de ambiente
  private apiUrl = environment.apiUrl;

  isUserFormOpen = false;
  userToEdit: any | null = null;
  allUsers: any[] = [];

  currentPage = 1;
  itemsPerPage = 10;

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.get<any[]>(`${this.apiUrl}/users`, { headers }).subscribe(data => {
      this.allUsers = data.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    });
  }

  get paginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.allUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.allUsers.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  openAddUserModal(): void {
    this.userToEdit = null;
    this.isUserFormOpen = true;
  }

  openEditUserModal(user: any): void {
    this.userToEdit = user;
    this.isUserFormOpen = true;
  }

  closeUserForm(): void {
    this.isUserFormOpen = false;
    this.userToEdit = null;
  }

  saveUser(user: any): void {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    if (this.userToEdit) {
      const updateData = { name: user.name, status: user.status, role: user.role };
      this.http.patch(`${this.apiUrl}/users/${this.userToEdit.id}`, updateData, { headers })
        .subscribe(() => this.fetchUsers());
    } else {
      const newUser = { name: user.name, email: user.email, role: user.role };
      this.http.post(`${this.apiUrl}/auth/register`, newUser, { headers })
        .subscribe(() => this.fetchUsers());
    }
  }

  deleteUser(userId: string): void {
    if (confirm('Tem a certeza que deseja apagar este utilizador? Esta ação é irreversível.')) {
      const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
      this.http.delete(`${this.apiUrl}/users/${userId}`, { headers })
        .subscribe(() => this.fetchUsers());
    }
  }

  toggleAccess(user: any): void {
    const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.patch(`${this.apiUrl}/users/${user.id}`, { status: newStatus }, { headers }).subscribe(() => {
      user.status = newStatus;
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ').filter(Boolean);
    if (names.length === 0) return '';
    const initials = names.length > 1
      ? `${names[0].charAt(0)}${names[1].charAt(0)}`
      : names[0].charAt(0);
    return initials.toUpperCase();
  }
}
