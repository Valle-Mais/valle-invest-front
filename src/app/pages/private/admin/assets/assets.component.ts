// src/app/pages/private/admin/assets/assets.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetFormComponent } from '../../../../components/asset-form/asset-form.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../security/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, AssetFormComponent],
  templateUrl: './assets.component.html',
})
export class AssetsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  isAssetFormOpen = false;
  assetToEdit: any | null = null;
  allAssets: any[] = [];

  ngOnInit(): void {
    this.fetchAssets();
  }

  fetchAssets(): void {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    this.http.get<any[]>(`${this.apiUrl}/assets`, { headers }).subscribe(data => {
      this.allAssets = data;
    });
  }

  openAddAssetModal(): void {
    this.assetToEdit = null;
    this.isAssetFormOpen = true;
  }

  openEditAssetModal(asset: any): void {
    this.assetToEdit = asset;
    this.isAssetFormOpen = true;
  }

  closeAssetForm(): void {
    this.isAssetFormOpen = false;
    this.assetToEdit = null;
  }

  saveAsset(asset: any): void {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    if (this.assetToEdit) {
      const updateData = { name: asset.name, type: asset.type };
      this.http.patch(`${this.apiUrl}/assets/${this.assetToEdit.id}`, updateData, { headers })
        .subscribe(() => this.fetchAssets());
    } else {
      this.http.post(`${this.apiUrl}/assets`, asset, { headers })
        .subscribe(() => this.fetchAssets());
    }
  }

  deleteAsset(assetId: string): void {
    if (confirm('Tem a certeza que deseja apagar este ativo?')) {
      const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
      this.http.delete(`${this.apiUrl}/assets/${assetId}`, { headers })
        .subscribe(() => this.fetchAssets());
    }
  }
}
