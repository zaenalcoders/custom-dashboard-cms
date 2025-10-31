import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    public status = new BehaviorSubject(false);;
    private counter = 0;

    start(): void {
        this.counter++;
        if (!this.status.getValue()) {
            this.status.next(true);
        }
    }

    done(): void {
        if (this.counter > 0) {
            this.counter--;
        }
        if (this.counter === 0 && this.status.getValue()) {
            this.status.next(false);
        }
    }
}
