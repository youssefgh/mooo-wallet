import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedKeyDerivationComponent } from './extended-key-derivation.component';

describe('ExtendedKeyDerivationComponent', () => {
  let component: ExtendedKeyDerivationComponent;
  let fixture: ComponentFixture<ExtendedKeyDerivationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtendedKeyDerivationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtendedKeyDerivationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
