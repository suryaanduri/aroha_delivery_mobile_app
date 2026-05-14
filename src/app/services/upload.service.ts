import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  // Uses the same admin media upload endpoint — delivery persons have auth tokens
  private readonly uploadUrl = `${environment.apiBaseUrl}/api/admin/media/upload`;

  constructor(private readonly http: HttpClient) {}

  uploadFile(base64Data: string, mimeType: string): Observable<string> {
    const blob = this.base64ToBlob(base64Data, mimeType);
    const formData = new FormData();
    const extension = mimeType.split('/')[1] ?? 'jpg';
    formData.append('file', blob, `proof_${Date.now()}.${extension}`);

    return this.http.post<any>(this.uploadUrl, formData).pipe(
      map((res) => {
        const url = res?.data?.url ?? res?.url ?? res?.data?.logo ?? '';
        if (!url) throw new Error('Upload failed: no URL returned');
        return url as string;
      })
    );
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }
}
