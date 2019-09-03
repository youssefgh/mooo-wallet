import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MnemonicDerivationComponent } from './mnemonic-derivation.component';

describe('MnemonicDerivationComponent', () => {
  let component: MnemonicDerivationComponent;
  let fixture: ComponentFixture<MnemonicDerivationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MnemonicDerivationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MnemonicDerivationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
