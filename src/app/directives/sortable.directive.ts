import { Directive, EventEmitter, Input, Output } from '@angular/core';

export type SortColumn = keyof {} | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { 'asc': 'desc', 'desc': 'asc' };

export interface SortEvent {
    column: SortColumn;
    direction: SortDirection;
}

@Directive({
    selector: 'th[sortable]',
    host: {
        '(click)': 'rotate()'
    },
    standalone: true
})
export class SortableDirective {

    @Input() sortable: string = '';
    @Input() direction: 'asc' | 'desc' | '' = 'asc';
    @Output() sort = new EventEmitter<any>();

    rotate() {
        this.direction = rotate[this.direction];
        this.sort.emit({ column: this.sortable, direction: this.direction });
    }

}
