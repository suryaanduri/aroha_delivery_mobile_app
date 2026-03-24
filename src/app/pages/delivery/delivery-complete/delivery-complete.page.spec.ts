import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryCompletePage } from './delivery-complete.page';

describe('DeliveryCompletePage', () => {
  let component: DeliveryCompletePage;
  let fixture: ComponentFixture<DeliveryCompletePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryCompletePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
