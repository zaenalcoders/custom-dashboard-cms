import { Injectable } from '@angular/core';
import { AES, enc } from 'crypto-ts';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EncryptService {
	private static key: string = environment.appKey;
	static encrypt(stringToEncrypt: string): string {
	    return AES.encrypt(stringToEncrypt, this.key).toString();
	}
	static decrypt(stringToDecrypt: string): any {
	    let _decrypt: any;
	    try {
	        _decrypt = AES.decrypt(stringToDecrypt, this.key).toString(enc.Utf8);
	        return _decrypt;
	    } catch (e) {
	        return null;
	    }
	}
}
