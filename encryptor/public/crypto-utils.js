// Crypto utilities using CryptoJS for encryption/decryption
class CryptoUtils {
    
    // Generate random 32-byte key for AES-256
    static generateKey() {
        return CryptoJS.lib.WordArray.random(256/8); // 32 bytes
    }
    
    // Generate random 16-byte IV for AES-CBC
    static generateIV() {
        return CryptoJS.lib.WordArray.random(128/8); // 16 bytes
    }
    
    // Convert WordArray to base64 string
    static wordArrayToBase64(wordArray) {
        return CryptoJS.enc.Base64.stringify(wordArray);
    }
    
    // Convert base64 string to WordArray
    static base64ToWordArray(base64) {
        return CryptoJS.enc.Base64.parse(base64);
    }
    
    // Encrypt data using AES-256-CBC
    static encrypt(data, key, iv) {
        const encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        // Return the ciphertext as base64
        return encrypted.toString();
    }
    
    // Decrypt data using AES-256-CBC
    static decrypt(encryptedData, key, iv) {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        // Convert to UTF8 string
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    
    // Encrypt JSON data and return base64 encoded result with key and IV
    static encryptJSON(data) {
        const key = this.generateKey();
        const iv = this.generateIV();
        
        const jsonString = JSON.stringify(data);
        const encrypted = this.encrypt(jsonString, key, iv);
        
        return {
            encryptedData: encrypted,
            key: this.wordArrayToBase64(key),
            iv: this.wordArrayToBase64(iv)
        };
    }
    
    // Decrypt base64 encoded data with provided key and IV
    static decryptJSON(encryptedBase64, keyBase64, ivBase64) {
        const key = this.base64ToWordArray(keyBase64);
        const iv = this.base64ToWordArray(ivBase64);
        
        const decrypted = this.decrypt(encryptedBase64, key, iv);
        
        return JSON.parse(decrypted);
    }
    
    // Prepare encrypted request for server
    static prepareEncryptedRequest(data) {
        const key = this.generateKey();
        const iv = this.generateIV();
        
        const keyBase64 = this.wordArrayToBase64(key);
        const ivBase64 = this.wordArrayToBase64(iv);
        
        const jsonString = JSON.stringify(data);
        const encryptedData = this.encrypt(jsonString, key, iv);
        
        return {
            headers: {
                'Content-Type': 'text/plain',
                'X-Secret-Key': keyBase64,
                'X-Secret-IV': ivBase64
            },
            body: encryptedData
        };
    }
    
    // Process encrypted response from server
    static processEncryptedResponse(encryptedResponse, responseHeaders) {
        const responseKey = responseHeaders.get('X-Secret-Key') || responseHeaders.get('X-Secret-Key');
        const responseIV = responseHeaders.get('X-Secret-IV') || responseHeaders.get('X-Secret-IV');
        
        if (!responseKey || !responseIV) {
            throw new Error('Missing encryption headers in response');
        }
        
        return this.decryptJSON(encryptedResponse, responseKey, responseIV);
    }
    
    // Helper method for the frontend to get key bytes (for compatibility)
    static keyToBytes(key) {
        // In CryptoJS, we work with WordArrays, but for compatibility
        // we can convert to base64 and then to bytes if needed
        return Promise.resolve(this.wordArrayToBase64(key));
    }
    
    // Helper method to convert bytes to base64 (for compatibility)
    static bytesToBase64(data) {
        if (typeof data === 'string') {
            return data; // Already base64
        }
        return data.toString();
    }
}

// Make it globally available
window.CryptoUtils = CryptoUtils; 