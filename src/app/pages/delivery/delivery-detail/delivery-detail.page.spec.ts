import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryDetailPage } from './delivery-detail.page';

describe('DeliveryDetailPage', () => {
  let component: DeliveryDetailPage;
  let fixture: ComponentFixture<DeliveryDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
