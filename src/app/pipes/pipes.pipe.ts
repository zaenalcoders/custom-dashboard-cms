import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DatePipe } from '@angular/common';

@Pipe({
    name: 'currencyName'
})
export class CurrencyNamePipe implements PipeTransform {
    transform(val: any, currencyCode?: string): string {
        return val + ` (${currencyCode || 'Rp'})`;
    }
}

@Pipe({
    name: 'haveKeys'
})
export class HaveKeysPipe implements PipeTransform {
    transform(val: any): boolean {
        let result: number = 0;
        Object.keys(val).forEach((key: any) => {
            if (val[key] != null) {
                result++;
            }
        });
        return result > 0;
    }
}

@Pipe({
    name: 'noSpace'
})
export class NoSpacePipe implements PipeTransform {
    transform(value: any): string {
        return (value || '').toString().replace(/\s/g, '');
    }
}

@Pipe({
    name: 'toSpace'
})
export class ToSpacePipe implements PipeTransform {
    transform(value: any, toReplace: string): string {
        return (value || '').toString().replace(new RegExp(toReplace, 'g'), ' ');
    }
}

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(value: any[], keyFilter: string, valFilter: any, orKeyFilter?: string, orValFilter?: any): any[] {
        return value.filter((e: any) => {
            if (valFilter == '' || valFilter === null || valFilter === undefined) {
                return true;
            }
            if (orKeyFilter) {
                return e[keyFilter] == valFilter || e[orKeyFilter] == orValFilter;
            }
            return e[keyFilter] == valFilter;
        });
    }
}

@Pipe({
    name: 'me'
})
export class MePipe implements PipeTransform {
    constructor(private auth: AuthService) { }
    transform(value?: any): string {
        return this.auth.getUserData()?.name;
    }
}

@Pipe({
    name: 'now'
})
export class NowPipe implements PipeTransform {
    constructor(private datePipe: DatePipe) { }
    transform(value?: any, dateFormat?: string): string | null {
        return this.datePipe.transform(new Date(), dateFormat || 'DD MMM YYYY, HH:mm');
    }
}

@Pipe({
    name: 'readableNumber'
})
export class ReadableNumberPipe implements PipeTransform {
    transform(value: any, options: { decimal: number, trimZero: boolean }): string {
        if (value == null || value == undefined) return '';
        const { decimal = 1, trimZero = true } = options;
        const format = (val: number, suffix: string) => {
            let str = val.toFixed(decimal);
            if (trimZero) str = str.replace(/\.0+$/, ""); // hapus .0
            return str + suffix;
        };
        const num = Number(value);
        if (num < 1000) {
            return num.toString();
        } else if (num < 1_000_000) {
            return format(num / 1000, "rb");
        } else if (num < 1_000_000_000) {
            return format(num / 1_000_000, "jt");
        } else if (num < 1_000_000_000_000) {
            return format(num / 1_000_000_000, "M");
        } else {
            return format(num / 1_000_000_000_000, "T");
        }
    }
}