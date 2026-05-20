import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { IonButton, IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  cameraOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
  imageOutline,
  refreshOutline,
  returnDownBackOutline,
  timeOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { CustomerInfoCardComponent } from 'src/app/components/customer-info-card/customer-info-card.component';
import { DeliveryProductItem, ProductListComponent } from 'src/app/components/product-list/product-list.component';
import { ActionBarComponent } from 'src/app/components/action-bar/action-bar.component';
import { PageShellComponent } from 'src/app/components/page-shell/page-shell.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { DeliveryStatus, StatusChipComponent } from 'src/app/components/status-chip/status-chip.component';
import { SurfaceCardComponent } from 'src/app/components/surface-card/surface-card.component';
import { TopHeaderComponent } from 'src/app/components/top-header/top-header.component';
import { DeliveryOrder, ReturnableBottle } from 'src/app/models/order.model';
import { OrderService, UpdateOrderStatusPayload } from 'src/app/services/order.service';
import { UploadService } from 'src/app/services/upload.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';
import { mapOrderItems, normalizeDeliveryStatus, formatProductCountLabel } from 'src/app/utils/delivery-view.util';

type CompletionAction = 'DELIVERED' | 'CANCELLED' | 'SKIPPED';

interface ConfettiPiece {
  style: { [key: string]: string };
  shape: 'square' | 'circle' | 'ribbon';
}

@Component({
  selector: 'app-delivery-complete',
  templateUrl: './delivery-complete.page.html',
  styleUrls: ['./delivery-complete.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    IonToast,
    CommonModule,
    FormsModule,
    ActionBarComponent,
    CustomerInfoCardComponent,
    PageShellComponent,
    ProductListComponent,
    SectionHeaderComponent,
    StatusChipComponent,
    SurfaceCardComponent,
    TopHeaderComponent,
  ],
})
export class DeliveryCompletePage implements OnInit {
  readonly stopId: string;
  selectedAction: CompletionAction = 'DELIVERED';
  loading = true;
  submitting = false;
  uploadingPhoto = false;
  errorMessage = '';
  toastMessage = '';
  toastOpen = false;
  toastColor: 'success' | 'danger' = 'success';
  deliveryNote = '';
  selectedReason = '';
  noteOpen = false;

  // Photo proof
  capturedPhotoBase64: string | null = null;   // base64 for preview
  capturedPhotoMime: string = 'image/jpeg';
  uploadedPhotoUrl: string | null = null;       // URL after upload

  customerName = '';
  customerCode = '';
  routeLabel = '';
  address = '';
  landmark = '';
  currentStatus: DeliveryStatus = 'pending';
  timeSlot = '';
  items: DeliveryProductItem[] = [];

  // Bottle returnables
  pendingReturnables: ReturnableBottle[] = [];
  returnableStatuses: Record<string, 'RETURNED' | 'DAMAGED' | 'LOST' | null> = {};
  loadingReturnables = false;
  savingReturnable: Record<string, boolean> = {};

  readonly reasons = ['Customer unavailable', 'Address locked', 'Payment issue', 'Route blocked', 'Product damaged'];

  showConfetti = false;
  readonly confettiPieces: ConfettiPiece[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly orderService: OrderService,
    private readonly uploadService: UploadService
  ) {
    this.stopId = this.route.snapshot.paramMap.get('id') ?? '';
    this.confettiPieces = this.buildConfettiPieces(55);
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      cameraOutline,
      chatbubbleEllipsesOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      closeOutline,
      imageOutline,
      refreshOutline,
      returnDownBackOutline,
      timeOutline,
      trashOutline,
      warningOutline,
    });
  }

  ngOnInit(): void {
    const action = (this.route.snapshot.queryParamMap.get('action') ?? 'DELIVERED').toUpperCase();
    if (action === 'CANCELLED' || action === 'SKIPPED' || action === 'DELIVERED') {
      this.selectedAction = action as CompletionAction;
    }
    this.loadOrder();
  }

  get itemSummary(): string {
    return formatProductCountLabel(this.items.length);
  }

  get headerEyebrow(): string {
    return [this.routeLabel, this.timeSlot].filter(Boolean).join(' • ') || 'Delivery stop';
  }

  get selectedActionLabel(): string {
    return this.selectedAction.charAt(0) + this.selectedAction.slice(1).toLowerCase();
  }

  get finalCtaLabel(): string {
    return this.selectedAction === 'DELIVERED' ? 'Confirm Delivery' : 'Submit Status';
  }

  get reasonRequired(): boolean {
    return this.selectedAction === 'CANCELLED' || this.selectedAction === 'SKIPPED';
  }

  get hasPhoto(): boolean {
    return this.capturedPhotoBase64 !== null;
  }

  get canSubmit(): boolean {
    if (this.loading || this.submitting || this.uploadingPhoto || !!this.errorMessage) return false;
    if (this.reasonRequired && !this.selectedReason.trim()) return false;
    return true;
  }

  get proofSummaryItems(): string[] {
    const items: string[] = [];
    if (this.hasPhoto) items.push(this.uploadedPhotoUrl ? 'Photo uploaded' : 'Photo ready');
    if (this.deliveryNote.trim()) items.push('Note added');
    if (this.reasonRequired && this.selectedReason) items.push(this.selectedReason);
    return items;
  }

  selectAction(action: CompletionAction): void {
    this.selectedAction = action;
    if (action === 'DELIVERED') this.selectedReason = '';
  }

  async capturePhoto(): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (!image.base64String) return;

      void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      this.capturedPhotoBase64 = image.base64String;
      this.capturedPhotoMime = image.format === 'png' ? 'image/png' : 'image/jpeg';
      this.uploadedPhotoUrl = null;

      // Upload immediately
      this.uploadingPhoto = true;
      this.uploadService.uploadFile(image.base64String, this.capturedPhotoMime).subscribe({
        next: (url) => { this.uploadedPhotoUrl = url; this.uploadingPhoto = false; },
        error: (err: unknown) => {
          this.uploadingPhoto = false;
          this.showToast(getApiErrorMessage(err, 'Photo upload failed. It will be retried on submit.'), 'danger');
        },
      });
    } catch (err) {
      // User cancelled or permission denied — no error needed
    }
  }

  removePhoto(): void {
    this.capturedPhotoBase64 = null;
    this.uploadedPhotoUrl = null;
  }

  resetProof(): void {
    this.removePhoto();
    this.deliveryNote = '';
    this.selectedReason = '';
    this.noteOpen = false;
  }

  cancel(): void {
    void this.navCtrl.navigateBack(['/delivery', this.stopId]);
  }

  confirm(): void {
    if (!this.canSubmit) {
      if (this.reasonRequired && !this.selectedReason.trim()) {
        this.showToast('Please select a reason for cancelling or skipping.', 'danger');
      }
      return;
    }

    const doSubmit = (photoUrl?: string) => {
      this.submitting = true;
      const payload: UpdateOrderStatusPayload = {
        status: this.selectedAction,
        reason: this.reasonRequired ? this.selectedReason : undefined,
        notes: this.deliveryNote.trim() || undefined,
        proofImage: photoUrl,
      };

      this.orderService.updateOrderStatus(this.stopId, payload).subscribe({
        next: (res) => {
          this.submitting = false;
          void Haptics.notification({ type: NotificationType.Success }).catch(() => {});

          if (this.selectedAction === 'DELIVERED') {
            // Show confetti celebration, then navigate after animation completes
            this.showConfetti = true;
            this.showToast(res.message || 'Delivered successfully! 🎉', 'success');
            setTimeout(() => void this.navCtrl.navigateRoot('/deliveries'), 2600);
          } else {
            this.showToast(res.message || 'Status updated successfully.', 'success');
            setTimeout(() => void this.navCtrl.navigateRoot('/deliveries'), 900);
          }
        },
        error: (err: unknown) => {
          this.submitting = false;
          void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
          this.showToast(getApiErrorMessage(err, 'Unable to update status.'), 'danger');
        },
      });
    };

    // If photo was captured but upload failed, retry upload then submit
    if (this.capturedPhotoBase64 && !this.uploadedPhotoUrl) {
      this.uploadingPhoto = true;
      this.uploadService.uploadFile(this.capturedPhotoBase64, this.capturedPhotoMime).subscribe({
        next: (url) => { this.uploadingPhoto = false; doSubmit(url); },
        error: () => {
          this.uploadingPhoto = false;
          // Submit without photo rather than blocking the delivery
          doSubmit(undefined);
        },
      });
      return;
    }

    doSubmit(this.uploadedPhotoUrl ?? undefined);
  }

  private loadOrder(): void {
    this.loading = true;
    this.errorMessage = '';
    this.orderService.getOrderById(this.stopId).subscribe({
      next: (order) => {
        if (!order) { this.errorMessage = 'Delivery not found.'; this.loading = false; return; }
        this.applyOrder(order);
        this.loading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = getApiErrorMessage(err, 'Unable to load delivery details.');
        this.loading = false;
      },
    });
  }

  private applyOrder(order: DeliveryOrder): void {
    this.customerName = order.customerName ?? 'Customer';
    this.customerCode = order.customerCode ?? '';
    this.routeLabel = order.routeLabel ?? '';
    this.address = order.address?.trim() || 'Location not available';
    this.landmark = order.landmark ?? '';
    this.currentStatus = normalizeDeliveryStatus(order.deliveryStatus ?? order.status);
    this.timeSlot = order.timeSlot ?? '';
    this.items = mapOrderItems(order);

    // Load pending bottle returns for this customer
    if (order.userId) {
      this.loadReturnables(order.userId);
    }
  }

  private loadReturnables(userId: string): void {
    this.loadingReturnables = true;
    this.orderService.getPendingReturnables(userId).subscribe({
      next: (bottles) => {
        this.pendingReturnables = bottles;
        // Default all to RETURNED (most common case)
        for (const b of bottles) {
          this.returnableStatuses[b.id] = 'RETURNED';
        }
        this.loadingReturnables = false;
      },
      error: () => { this.loadingReturnables = false; },
    });
  }

  markReturnable(bottleId: string, status: 'RETURNED' | 'DAMAGED' | 'LOST'): void {
    this.savingReturnable[bottleId] = true;
    this.orderService.updateReturnable(bottleId, { status }).subscribe({
      next: () => {
        this.pendingReturnables = this.pendingReturnables.filter(b => b.id !== bottleId);
        delete this.returnableStatuses[bottleId];
        delete this.savingReturnable[bottleId];
        this.showToast(
          status === 'RETURNED' ? 'Bottle collected ✓' :
          status === 'DAMAGED'  ? 'Bottle recorded as damaged' : 'Bottle recorded as lost',
          status === 'RETURNED' ? 'success' : 'danger'
        );
      },
      error: () => {
        this.savingReturnable[bottleId] = false;
        this.showToast('Failed to update bottle status', 'danger');
      },
    });
  }

  private showToast(message: string, color: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
  }

  private buildConfettiPieces(count: number): ConfettiPiece[] {
    // Brand + celebration palette
    const colors = [
      '#193d34', // brand green
      '#45866f', // brand teal
      '#d08c49', // warm amber
      '#e87040', // coral
      '#4a7fd4', // blue
      '#e45678', // pink
      '#78c86e', // lime
      '#f0c070', // gold
    ];
    const shapes: ConfettiPiece['shape'][] = ['square', 'circle', 'ribbon'];

    return Array.from({ length: count }, (_, i) => {
      // Deterministic spread across the screen
      const leftPct = ((i * 1.9) % 100).toFixed(1);
      const delayMs  = (i % 14) * 70;           // 0–910 ms stagger
      const durationMs = 1100 + (i % 7) * 180;  // 1.1s – 2.2s
      const sizePx = 7 + (i % 5) * 2;           // 7, 9, 11, 13, 15 px
      const swayPx = (i % 2 === 0 ? 1 : -1) * (10 + (i % 6) * 8); // alternating drift
      const color = colors[i % colors.length];
      const shape = shapes[i % shapes.length];

      return {
        shape,
        style: {
          left:                  `${leftPct}%`,
          'background-color':    color,
          width:                 shape === 'ribbon' ? `${Math.round(sizePx * 0.45)}px` : `${sizePx}px`,
          height:                shape === 'ribbon' ? `${sizePx * 3}px` : `${sizePx}px`,
          'border-radius':       shape === 'circle' ? '50%' : shape === 'ribbon' ? '3px' : '2px',
          'animation-delay':     `${delayMs}ms`,
          'animation-duration':  `${durationMs}ms`,
          '--sway':              `${swayPx}px`,
        },
      };
    });
  }
}
