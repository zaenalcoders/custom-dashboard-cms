import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-avatar',
    imports: [CommonModule],
    standalone: true,
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
    constructor() { }
    @Input() name: any = {};
    @Input() height: number = 32;
    @Input() width: number = 32;
    @Input() imageURL: string | null = null;

    genStyle(): any {
        const bgCol = this.generateColor(this.name);
        const txCol = this.getBWColor(bgCol);
        return { 'background-color': bgCol, 'color': txCol, 'height': this.height + 'px', 'width': this.width + 'px' };
    }

    generateColor(str: string): string {
        if (!str) return `rgb(0,0,0)`;
        let hash = 0;
        if (str.length === 0) { return ''; }
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        const rgb = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            rgb[i] = (hash >> (i * 8)) & 255;
        }
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    getBWColor(strRGB: string): string {
        const rgb = strRGB.replace(/rgb|\(|\)/gm, '').split(',');
        const brightness = Math.round(((Number(rgb[0]) * 299) + (Number(rgb[1]) * 587) + Number(rgb[2]) * 114)) / 1000;
        return (brightness > 125) ? 'black' : 'white';
    }
}
