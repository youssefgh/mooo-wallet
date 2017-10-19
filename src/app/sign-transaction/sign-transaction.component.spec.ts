import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SignTransactionComponent} from './sign-transaction.component';

describe('SignTransactionComponent', () => {
    let component: SignTransactionComponent;
    let fixture: ComponentFixture<SignTransactionComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SignTransactionComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SignTransactionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
