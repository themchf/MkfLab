document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const WORKER_URL = "https://mkflab.michaelsuperhand.workers.dev"; 
    const ADMIN_SECRET = "AdminMKFLab"; 

    // Safe DOM selector to prevent crashes
    const el = (id) => document.getElementById(id);

    const views = {
        home: el('view-home'),
        guest: el('view-guest'),
        adminAuth: el('view-admin-auth'),
        adminDash: el('view-admin-dash')
    };

    const btnHome = el('btn-home');
    let currentBlobUrl = null;

    function switchView(viewId) {
        Object.values(views).forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (views[viewId]) {
            views[viewId].classList.remove('hidden');
        }
        if (btnHome) {
            btnHome.classList.toggle('hidden', viewId === 'home');
        }
    }

    // Safe event listener wrapper
    const addSafeListener = (id, event, handler) => {
        const element = el(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`MKF Lab Warning: Element #${id} not found.`);
        }
    };

    // --- Navigation Bindings ---
    addSafeListener('nav-guest', 'click', () => switchView('guest'));
    
    addSafeListener('nav-admin', 'click', () => {
        if (sessionStorage.getItem('mkf_admin_auth') === 'true') {
            switchView('adminDash');
            renderAdminTable();
        } else {
            switchView('adminAuth');
        }
    });

    addSafeListener('btn-home', 'click', () => {
        switchView('home');
        resetForms();
    });

    // --- Admin Authentication ---
    addSafeListener('form-admin-login', 'submit', (e) => {
        e.preventDefault();
        const pass = el('admin-pass').value;
        const errorDiv = el('auth-error');

        if (pass === ADMIN_SECRET) {
            sessionStorage.setItem('mkf_admin_auth', 'true');
            errorDiv.classList.add('hidden');
            el('admin-pass').value = '';
            switchView('adminDash');
            renderAdminTable();
        } else {
            errorDiv.classList.remove('hidden');
        }
    });

    addSafeListener('btn-logout', 'click', () => {
        sessionStorage.removeItem('mkf_admin_auth');
        switchView('home');
    });

    // --- Admin Operations ---
    addSafeListener('form-upload', 'submit', async (e) => {
        e.preventDefault();
        const code = el('assign-code').value.trim();
        const fileInput = el('upload-pdf').files[0];
        const statusDiv = el('upload-status');
        const btn = el('btn-upload');

        if (!fileInput || fileInput.type !== 'application/pdf') {
            showStatus(statusDiv, 'Please select a valid PDF file.', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Syncing...';

        const reader = new FileReader();
        reader.readAsDataURL(fileInput);
        reader.onload = async () => {
            try {
                const response = await fetch(`${WORKER_URL}/api/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ADMIN_SECRET}`
                    },
                    body: JSON.stringify({
                        code: code,
                        filename: fileInput.name,
                        fileData: reader.result
                    })
                });

                if (!response.ok) throw new Error(await response.text());

                showStatus(statusDiv, `Document successfully linked to ${code.toUpperCase()}`, 'success');
                el('form-upload').reset();
                renderAdminTable();
            } catch (err) {
                showStatus(statusDiv, `Upload Failed: ${err.message}`, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Secure & Upload Document';
            }
        };
    });

    async function renderAdminTable() {
        const tbody = el('doc-list');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">Loading records...</td></tr>';

        try {
            const response = await fetch(`${WORKER_URL}/api/list`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
            });
            
            if (!response.ok) throw new Error();
            const docs = await response.json();
            
            tbody.innerHTML = '';
            if (docs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">No active cloud files.</td></tr>';
                return;
            }

            docs.forEach(doc => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${doc.code}</strong></td>
                    <td>${doc.filename}</td>
                    <td><button class="btn-text text-danger delete-btn" data-code="${doc.code}">Delete</button></td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const targetCode = e.target.dataset.code;
                    e.target.textContent = "Removing...";
                    await fetch(`${WORKER_URL}/api/document?code=${targetCode}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
                    });
                    renderAdminTable();
                });
            });
        } catch {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Failed to sync index.</td></tr>';
        }
    }

    // --- Guest Operations (New Tab View Strategy) ---
    addSafeListener('form-guest', 'submit', async (e) => {
        e.preventDefault();
        
        const code = el('guest-code').value.trim().toUpperCase();
        const errorDiv = el('guest-error');
        const resultDiv = el('guest-result');
        const actionBtn = el('btn-download');
        
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch(`${WORKER_URL}/api/document?code=${code}`);
            if (!response.ok) throw new Error(response.status === 404 ? 'Code not found.' : 'Server error.');

            const doc = await response.json();
            
            // Memory cleanup
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }

            // Convert to a native browser file format
            const blob = base64ToBlob(doc.fileData);
            currentBlobUrl = URL.createObjectURL(blob);
            
            // Show the result
            resultDiv.classList.remove('hidden');
            el('result-filename').textContent = doc.filename;
            
            // Assign to the anchor tag exactly as requested
            actionBtn.href = currentBlobUrl;
            actionBtn.target = "_blank"; // Opens in new tab
            actionBtn.removeAttribute('download'); // Stops it from forcing a file download
            
        } catch (err) {
            resultDiv.classList.add('hidden');
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('hidden');
        }
    });

    // --- Core Helper Utilities ---
    function base64ToBlob(base64String) {
        try {
            const parts = base64String.split(',');
            const base64Data = parts[1] || parts[0];
            let contentType = 'application/pdf';
            
            if (parts[0].includes(':')) {
                contentType = parts[0].split(':')[1].split(';')[0];
            }
            
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                byteArrays.push(new Uint8Array(byteNumbers));
            }
            
            return new Blob(byteArrays, { type: contentType });
        } catch (error) {
            throw new Error("File conversion error.");
        }
    }

    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('hidden'), 4000);
    }

    function resetForms() {
        el('form-guest')?.reset();
        el('form-admin-login')?.reset();
        el('guest-error')?.classList.add('hidden');
        el('guest-result')?.classList.add('hidden');
        el('auth-error')?.classList.add('hidden');
    }
});
