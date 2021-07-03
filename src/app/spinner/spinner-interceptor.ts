import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SpinnerService } from '../spinner/spinner.service';

@Injectable({
    providedIn: 'root'
})
export class SpinnerInterceptor implements HttpInterceptor {

    constructor(
        private spinnerService: SpinnerService,
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        setTimeout(() => {
            this.spinnerService.show();
        });

        return next.handle(req)
            .pipe(tap(event => {
                if (event instanceof HttpResponse) {
                    this.spinnerService.enabled = false;
                }
            },
                error => {
                    if (error instanceof HttpErrorResponse) {
                        console.log(error);
                        this.spinnerService.enabled = false;
                    }
                }
            ));
    }
}
