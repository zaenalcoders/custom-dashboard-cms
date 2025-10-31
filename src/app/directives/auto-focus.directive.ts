import { AfterContentInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
    selector: '[appAutoFocus]',
    standalone: true
})
export class AutoFocusDirective implements AfterContentInit {

    constructor(private el: ElementRef) { }
    @Input() appAutoFocus!: boolean;

    ngAfterContentInit(): void {
        setTimeout(() => {
            this.el.nativeElement.focus();
        }, 500);
    }
}
