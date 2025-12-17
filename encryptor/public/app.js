class AdmissionChecker {
    constructor() {
        this.form = document.getElementById('index-form-form');
        this.registrationInput = document.getElementById('index-form-registration-number');
        this.dayInput = document.getElementById('index-form-birthday-day');
        this.monthInput = document.getElementById('index-form-birthday-month');
        this.yearInput = document.getElementById('index-form-birthday-year');
        this.submitBtn = document.getElementById('index-form-submit');
        this.alertElement = document.getElementById('index-form-alert');
        this.formContainer = document.getElementById('index-form');
        this.resultsContainer = document.getElementById('index-accepted');
        
        this.initEventListeners();
        this.initValidation();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.checkAdmissionStatus();
        });
    }
    
    initValidation() {
        const inputs = [this.registrationInput, this.dayInput, this.monthInput, this.yearInput];
        
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
            
            input.addEventListener('keypress', (e) => {
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                    e.preventDefault();
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const numbersOnly = paste.replace(/\D/g, '');
                e.target.value = numbersOnly;
            });
        });
    }
    
    async checkAdmissionStatus() {
        try {
            this.setLoading(true);
            this.hideAlert();
            
            const formData = this.getFormData();
            if (!formData) {
                return;
            }
            
            const response = await this.sendEncryptedRequest(formData);
            
            this.handleResponse(response);
            
        } catch (error) {
            console.error('Check failed:', error);
            this.showAlert('Nomor Pendaftaran atau tanggal lahir tidak ditemukan');
        } finally {
            this.setLoading(false);
        }
    }
    
    getFormData() {
        const registrationNumber = this.registrationInput.value.trim();
        const day = this.dayInput.value.trim();
        const month = this.monthInput.value.trim();
        const year = this.yearInput.value.trim();
        
        if (!registrationNumber || !day || !month || !year) {
            this.showAlert('Silakan lengkapi semua field');
            return null;
        }
        
        if (!/^\d+$/.test(registrationNumber) || !/^\d+$/.test(day) || !/^\d+$/.test(month) || !/^\d+$/.test(year)) {
            this.showAlert('Semua field harus berisi angka saja');
            return null;
        }
        
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        if (dayNum < 1 || dayNum > 31) {
            this.showAlert('Hari harus antara 1-31');
            return null;
        }
        
        if (monthNum < 1 || monthNum > 12) {
            this.showAlert('Bulan harus antara 1-12');
            return null;
        }
        
        if (yearNum < 1900 || yearNum > 2025) {
            this.showAlert('Tahun harus antara 1900-2025');
            return null;
        }
        
        const birthDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        
        return {
            registrationNumber: registrationNumber,
            birthDate: birthDate
        };
    }
    
    async sendEncryptedRequest(data) {
        const encryptedRequest = CryptoUtils.prepareEncryptedRequest(data);
        
        const response = await fetch('/check', {
            method: 'POST',
            headers: encryptedRequest.headers,
            body: encryptedRequest.body
        });
        
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        
        const encryptedResponse = await response.text();
        
        return CryptoUtils.processEncryptedResponse(encryptedResponse, response.headers);
    }
    
    handleResponse(decryptedResponse) {
        if (decryptedResponse.status === 'accepted') {
            const userData = JSON.parse(decryptedResponse.data);
            this.showAcceptanceResult(userData);
        } else if (decryptedResponse.status === 'not_found') {
            this.showAlert('Nomor Pendaftaran atau tanggal lahir tidak ditemukan');
        } else {
            this.showAlert('Terjadi kesalahan. Silakan coba lagi.');
        }
    }
    
    showAcceptanceResult(data) {
        this.formContainer.style.display = 'none';
        this.resultsContainer.style.display = 'block';
        
        this.resultsContainer.innerHTML = this.buildAcceptanceHTML(data);
    }
    
    buildAcceptanceHTML(data) {
        return `
            <div class="index-accepted-header">
                <img src="/img/snbp.png" alt="Logo" class="index-accepted-header-icon">
                <div class="index-accepted-header-title">
                    <h1 class="index-accepted-header-title-text">SELAMAT! ANDA DINYATAKAN LULUS SELEKSI SNBP 2025</h1>
                </div>
            </div>
            <div class="index-accepted-content">
                <div class="index-accepted-content-upper">
                    <div class="index-accepted-content-upper-bio">
                        <span class="index-accepted-content-upper-bio-nisn">NISN <span>${data.nisn}</span> - NOREG <span>${data.noreg}</span></span>
                        <span class="index-accepted-content-upper-bio-name">${data.name}</span>
                        <span class="index-accepted-content-upper-bio-program">${data.major}</span>
                        <span class="index-accepted-content-upper-bio-university">${data.college}</span>
                    </div>
                    <img class="index-accepted-content-upper-qr" alt="QR" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQAQMAAAC6caSPAAAABlBMVEX///8AAABVwtN+AAACFUlEQVR4nO3bO3KDMBDG8fWkoOQIOQpHg6P5KBwhpQsGRY9dSRA7r4nkFP9tEmT9VH2DHoAIRbWu0eXa/eV8S83zJq/avErp4i8gkB5k0YBOe/A3mapfRV4C0XHiBQTShbyEDrdAfIIt0aEtjOMSieMsEMgTyJj/pkZfm+8DgTyT+Brc9ZK7xvoq/BBICyKpUoI9iVc6zjeWChBIA5LLyMW9pV1SiHUkpSCQHuROFeLjvd3vA4G0JJbksmlPSdZGXynROg4E0oOITu3WVaf4nGSnN9jdekIgPyaz7W70ON3iWWKZ15ZWEEhbUrY8yRvVZeQU/55vsBBIW2In50NJ8l7P7NYrnBotAoH0I+UMaNb5Px4QhXG2dIOdjvM+BNKepF9d6BorJnmV6oDoej/8EEgTMuawii0C8k48NNm5Zbz7bhBIF6KVWmOC7YCoeroznMIPgbQl+kw8X8SHjxpvOZwpjafH6BBISyL6a9kd2XLUSscpSYZA2hMRm/erDZHtkiI5LhUgkF+RGMvF4mkLTnuJUjO7QiAdyKHK2jKV7sRFTp9FQCBtic3brrylpgvO9eM7vdXAEEhTov/Ur5pXb6lp3m0xsEIgfUj9Yc4y5AMi98lSAQLpSUKvULN99L3leDsI5HlkKgdEQ/3dmHkIpAdJ2a0375I/zHExvI/ehYNAWpFchyRLvsEafbSxgkD+nFDUv6t37pg7IDeGw/cAAAAASUVORK5CYII=">
                </div>
                <div class="index-accepted-content-lower">
                    <div class="index-accepted-content-lower-column index-accepted-content-lower-column-25">
                        <div class="index-accepted-content-lower-column-field">
                            <span class="index-accepted-content-lower-column-field-caption">Tanggal Lahir</span>
                            <span class="index-accepted-content-lower-column-field-value">${data.birthdate}</span>
                        </div>
                        <div class="index-accepted-content-lower-column-field">
                            <span class="index-accepted-content-lower-column-field-caption">Asal Sekolah</span>
                            <span class="index-accepted-content-lower-column-field-value">${data.school}</span>
                        </div>
                    </div>
                    <div class="index-accepted-content-lower-column index-accepted-content-lower-column-25">
                        <div class="index-accepted-content-lower-column-field">
                            <span class="index-accepted-content-lower-column-field-caption">Kabupaten/Kota</span>
                            <span class="index-accepted-content-lower-column-field-value">${data.city}</span>
                        </div>
                        <div class="index-accepted-content-lower-column-field">
                            <span class="index-accepted-content-lower-column-field-caption">Provinsi</span>
                            <span class="index-accepted-content-lower-column-field-value">${data.province}</span>
                        </div>
                    </div>
                    <div class="index-accepted-content-lower-column index-accepted-content-lower-column-50">
                        <div class="index-accepted-content-lower-column-note">
                            <span class="index-accepted-content-lower-column-note-title">Silakan lakukan pendaftaran ulang.</span>
                            <span class="index-accepted-content-lower-column-note-subtitle">Informasi pendaftaran ulang di PTN/Politeknik Negeri dapat dilihat pada link berikut:</span>
                            <a href="${data.website}" target="_blank" class="index-accepted-content-lower-column-note-link">${data.website}</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="index-accepted-footer">
                <p class="index-accepted-footer-paragraph">Status penerimaan Anda sebagai mahasiswa akan ditetapkan setelah PTN tujuan melakukan verifikasi data akademik (rapor dan/atau portofolio). Silakan Anda membaca peraturan tentang penerimaan mahasiswa baru di laman PTN tujuan.</p>
                <p class="index-accepted-footer-paragraph">Khusus peserta KIP Kuliah, PTN tujuan juga dapat melakukan verifikasi data ekonomi dan/atau kunjungan ke tempat tinggal Anda sebelum menetapkan status penerimaan Anda.</p>
            </div>
        `;
    }
    
    showAlert(message) {
        this.alertElement.textContent = message;
        this.alertElement.style.display = 'block';
    }
    
    hideAlert() {
        this.alertElement.style.display = 'none';
    }
    
    setLoading(loading) {
        this.submitBtn.disabled = loading;
        this.submitBtn.value = loading ? 'MEMPROSES...' : 'LIHAT HASIL SELEKSI';
        
        this.registrationInput.disabled = loading;
        this.dayInput.disabled = loading;
        this.monthInput.disabled = loading;
        this.yearInput.disabled = loading;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdmissionChecker();
}); 