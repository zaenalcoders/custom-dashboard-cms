import {
    Directive,
    ElementRef,
    HostListener,
    Input,
    forwardRef
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors
} from '@angular/forms';

@Directive({
    selector: '[appNumberFormat]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NumberFormatDirective),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => NumberFormatDirective),
            multi: true
        }
    ]
})
export class NumberFormatDirective implements ControlValueAccessor {
    private onChange = (value: any) => { };
    private onTouched = () => { };
    private lastRawValue: string = '';
    private formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    constructor(private el: ElementRef<HTMLInputElement>) { }
    @Input() min?: number;
    @Input() max?: number;

    @HostListener('input', ['$event'])
    onInput() {
        const input = this.el.nativeElement;
        const selectionStart = input.selectionStart || 0;

        const rawInput = input.value;
        const cleaned = rawInput.replace(/[^0-9.\-]/g, '');

        // Valid number structure (allow incomplete decimal)
        if (/^[-]?[0-9]*\.?[0-9]*$/.test(cleaned)) {
            this.lastRawValue = cleaned;
            this.onChange(cleaned); // Kirim ke ngModel sebagai string

            // Format hanya jika input valid dan tidak berakhir dengan "."
            if (cleaned && !cleaned.endsWith('.')) {
                const parsed = parseFloat(cleaned);
                if (!isNaN(parsed)) {
                    const formatted = this.formatter.format(parsed);
                    const diff = formatted.length - rawInput.length;
                    input.value = formatted;

                    // Set caret
                    const newPos = selectionStart + diff;
                    setTimeout(() => {
                        input.setSelectionRange(newPos, newPos);
                    });
                }
            }
        } else {
            // Revert kalau input aneh
            input.value = this.formatter.format(Number(this.lastRawValue) || 0);
        }
    }

    @HostListener('blur')
    onBlur() {
        this.onTouched();

        const parsed = parseFloat(this.lastRawValue);
        if (!isNaN(parsed)) {
            const formatted = this.formatter.format(parsed);
            this.el.nativeElement.value = formatted;
            this.lastRawValue = parsed.toString();
            this.onChange(parsed);
        } else {
            this.el.nativeElement.value = '';
        }
    }

    writeValue(value: any): void {
        if (value != null && !isNaN(value)) {
            this.lastRawValue = value.toString();
            const formatted = this.formatter.format(Number(value));
            this.el.nativeElement.value = formatted;
        } else {
            this.lastRawValue = '';
            this.el.nativeElement.value = '';
        }
    }

    validate(control: AbstractControl): ValidationErrors | null {
        const value = parseFloat(this.lastRawValue);

        if (isNaN(value)) {
            return null; // Biarkan validator lain menangani required dsb
        }

        if (this.min != null && value < this.min) {
            return { min: { requiredMin: this.min, actual: value } };
        }

        if (this.max != null && value > this.max) {
            return { max: { requiredMax: this.max, actual: value } };
        }

        return null;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.el.nativeElement.disabled = isDisabled;
    }
}
