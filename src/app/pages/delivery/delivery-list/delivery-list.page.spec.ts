import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryListPage } from './delivery-list.page';

describe('DeliveryListPage', () => {
  let component: DeliveryListPage;
  let fixture: ComponentFixture<DeliveryListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
