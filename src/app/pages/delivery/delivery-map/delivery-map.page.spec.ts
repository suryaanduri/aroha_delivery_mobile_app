import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryMapPage } from './delivery-map.page';

describe('DeliveryMapPage', () => {
  let component: DeliveryMapPage;
  let fixture: ComponentFixture<DeliveryMapPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryMapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
