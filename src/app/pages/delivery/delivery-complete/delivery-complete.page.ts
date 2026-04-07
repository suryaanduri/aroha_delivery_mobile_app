import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  cameraOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  timeOutline,
} from 'ionicons/icons';
import { CustomerInfoCardComponent } from 'src/app/components/customer-info-card/customer-info-card.component';
import { DeliveryProductItem, ProductListComponent } from 'src/app/components/product-list/product-list.component';
import { SectionHeaderComponent } from 'src/app/components/section-header/section-header.component';
import { DeliveryStatus, ScheduleType, StatusChipComponent } from 'src/app/components/status-chip/status-chip.component';
import { DeliveryOrder } from 'src/app/models/order.model';
import { OrderService, UpdateOrderStatusPayload } from 'src/app/services/order.service';
import { getApiErrorMessage } from 'src/app/utils/api-contract.util';

type CompletionAction = 'DELIVERED' | 'CANCELLED' | 'SKIPPED';

interface ProofOption {
  key: 'photo' | 'note';
  label: string;
  helper: string;
  icon: string;
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
    CustomerInfoCardComponent,
    ProductListComponent,
    SectionHeaderComponent,
    StatusChipComponent,
  ],
})
export class DeliveryCompletePage implements OnInit {
  readonly stopId: string;
  selectedAction: CompletionAction = 'DELIVERED';
  loading = true;
  submitting = false;
  errorMessage = '';
  toastMessage = '';
  toastOpen = false;
  toastColor: 'success' | 'danger' = 'success';
  deliveryNote = '';
  selectedReason = '';
  proofState = {
    photo: false,
    note: false,
  };

  customerName = '';
  customerCode = '';
  routeLabel = '';
  address = '';
  landmark = '';
  scheduleType: ScheduleType = 'daily';
  currentStatus: DeliveryStatus = 'pending';
  timeSlot = '';
  items: DeliveryProductItem[] = [];
  readonly reasons = ['Customer unavailable', 'Address locked', 'Payment issue', 'Route blocked', 'Product damaged'];
  readonly proofOptions: ProofOption[] = [
    { key: 'photo', label: 'Photo', helper: 'Doorstep proof capture', icon: 'camera-outline' },
    { key: 'note', label: 'Note', helper: 'Add delivery remark', icon: 'chatbubble-ellipses-outline' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly orderService: OrderService
  ) {
    this.stopId = this.route.snapshot.paramMap.get('id') ?? '';
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      cameraOutline,
      chatbubbleEllipsesOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    const action = (this.route.snapshot.queryParamMap.get('action') ?? 'DELIVERED').toUpperCase();
    if (action === 'CANCELLED' || action === 'SKIPPED' || action === 'DELIVERED') {
      this.selectedAction = action;
    }
    this.loadOrder();
  }

  get itemSummary(): string {
    return `${this.items.length} product${this.items.length !== 1 ? 's' : ''}`;
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

  get canSubmit(): boolean {
    if (this.loading || this.submitting || !!this.errorMessage) {
      return false;
    }
    if (this.reasonRequired && !this.selectedReason.trim()) {
      return false;
    }
    return true;
  }

  get proofSummary(): string[] {
    const items: string[] = [];
    if (this.proofState.photo) {
      items.push('Photo ready');
    }
    if (this.proofState.note && this.deliveryNote.trim()) {
      items.push('Note added');
    }
    if (this.reasonRequired && this.selectedReason) {
      items.push(this.selectedReason);
    }
    return items;
  }

  selectAction(action: CompletionAction): void {
    this.selectedAction = action;
    if (action === 'DELIVERED') {
      this.selectedReason = '';
    }
  }

  toggleProof(key: ProofOption['key']): void {
    this.proofState[key] = !this.proofState[key];
  }

  resetProof(): void {
    this.deliveryNote = '';
    this.selectedReason = '';
    this.proofState = {
      photo: false,
      note: false,
    };
  }

  cancel(): void {
    void this.router.navigate(['/delivery', this.stopId]);
  }

  confirm(): void {
    if (!this.canSubmit) {
      if (this.reasonRequired && !this.selectedReason.trim()) {
        this.showToast('Reason is required for cancelled/skipped status.', 'danger');
      }
      return;
    }

    this.submitting = true;
    const payload: UpdateOrderStatusPayload = {
      status: this.selectedAction,
      reason: this.reasonRequired ? this.selectedReason : undefined,
      notes: this.deliveryNote.trim() || undefined,
      proofImage: this.proofState.photo ? 'captured' : undefined,
    };

    this.orderService.updateOrderStatus(this.stopId, payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.showToast(res.message || 'Status updated successfully.', 'success');
        setTimeout(() => void this.router.navigate(['/deliveries']), 900);
      },
      error: (err: unknown) => {
        this.submitting = false;
        this.showToast(getApiErrorMessage(err, 'Unable to update status.'), 'danger');
      },
    });
  }

  private loadOrder(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getOrderById(this.stopId).subscribe({
      next: (order) => {
        if (!order) {
          this.errorMessage = 'Delivery not found.';
          this.loading = false;
          return;
        }
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
    this.address = order.address ?? '';
    this.landmark = order.landmark ?? '';
    this.scheduleType = this.normalizeScheduleType(order.scheduleType);
    this.currentStatus = this.normalizeStatus(order.deliveryStatus ?? order.status);
    this.timeSlot = order.timeSlot ?? '';
    this.items = (order.items ?? []).map((item) => ({
      name: item.name ?? 'Item',
      quantity: [item.quantity, item.unit].filter(Boolean).join(' '),
    }));
  }

  private normalizeStatus(status?: string): DeliveryStatus {
    const normalized = (status ?? '').toUpperCase();
    if (normalized === 'DELIVERED' || normalized === 'COMPLETED') return 'delivered';
    if (normalized === 'IN_PROGRESS' || normalized === 'IN-PROGRESS' || normalized === 'STARTED') return 'in-progress';
    if (normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'FAILED') return 'failed';
    if (normalized === 'SKIPPED') return 'skipped';
    return 'pending';
  }

  private normalizeScheduleType(type?: string): ScheduleType {
    if (!type) return 'daily';
    const normalized = type.toLowerCase().replace(/_/g, '-');
    if (normalized.includes('alternate')) return 'alternate-day';
    if (normalized === 'onetime' || (normalized.includes('one') && normalized.includes('time'))) return 'one-time';
    return 'daily';
  }

  private showToast(message: string, color: 'success' | 'danger'): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
  }
}
