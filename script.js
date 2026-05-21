document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const WORKER_URL = "https://mkflab.michaelsuperhand.workers.dev"; 
    const ADMIN_SECRET = "AdminMKFLab"; 

    const views = {
        home: document.getElementById('view-home'),
        guest: document.getElementById('view-guest'),
        adminAuth: document.getElementById('view-admin-auth'),
        adminDash: document.getElementById('view-admin-dash')
    };

    const btnHome = document.getElementById('btn-home');
    let currentBlobUrl = null; // Used to manage memory for iOS Safari fix

    function switchView(viewId) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[viewId].classList.remove('hidden');
        btnHome.classList.toggle('hidden', viewId === 'home');
    }

    // --- Navigation ---
    document.getElementById('nav-guest').addEventListener('click', () => switchView('guest'));
    document.getElementById('nav-admin').addEventListener('click', () => {
        if (sessionStorage.getItem('mkf_admin_auth') === 'true') {
            switchView('adminDash');
            renderAdminTable();
        } else {
            switchView('adminAuth');
        }
    });
    btnHome.addEventListener('click', () => {
        switchView('home');
        resetForms();
    });

    // --- Admin Authentication (Frontend Guard) ---
    document.getElementById('form-admin-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('admin-pass').value;
        const errorDiv = document.getElementById('auth-error');

        if (pass === ADMIN_SECRET) {
            sessionStorage.setItem('mkf_admin_auth', 'true');
            errorDiv.classList.add('hidden');
            document.getElementById('admin-pass').value = '';
            switchView('adminDash');
            renderAdminTable();
        } else {
            errorDiv.classList.remove('hidden');
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('mkf_admin_auth');
        switchView('home');
    });

    // --- Admin Operations ---
    document.getElementById('form-upload').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('assign-code').value.trim();
        const fileInput = document.getElementById('upload-pdf').files[0];
        const statusDiv = document.getElementById('upload-status');
        const btn = document.getElementById('btn-upload');

        if (!fileInput || fileInput.type !== 'application/pdf') {
            showStatus(statusDiv, 'Please select a valid PDF file.', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Syncing with Worker...';

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
                document.getElementById('form-upload').reset();
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
        const tbody = document.getElementById('doc-list');
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

    // --- Guest Operations ---
    document.getElementById('form-guest').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('guest-code').value.trim().toUpperCase();
        const errorDiv = document.getElementById('guest-error');
        const resultDiv = document.getElementById('guest-result');
        const downloadBtn = document.getElementById('btn-download');
        
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch(`${WORKER_URL}/api/document?code=${code}`);
            if (!response.ok) throw new Error(response.status === 404 ? 'Code not found.' : 'Server error.');

            const doc = await response.json();
            
            resultDiv.classList.remove('hidden');
            document.getElementById('result-filename').textContent = doc.filename;
            
            // Clean up old memory if the user searched multiple times
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }

            // Fix for iOS Safari: Convert Base64 to a raw binary Blob
            const blob = base64ToBlob(doc.fileData);
            currentBlobUrl = URL.createObjectURL(blob);
            
            downloadBtn.href = currentBlobUrl;
            downloadBtn.download = doc.filename;
            downloadBtn.target = "_blank"; // Forces iOS to open the native PDF viewer sheet
            
        } catch (err) {
            resultDiv.classList.add('hidden');
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('hidden');
        }
    });

    // --- Helpers ---
    function base64ToBlob(base64String) {
        // Safely split the base64 string regardless of prefix presence
        const parts = base64String.split(',');
        const base64Data = parts[1] || parts[0];
        const contentType = parts[0].includes(':') ? parts[0].split(':')[1].split(';')[0] : 'application/pdf';
        
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        // Process in chunks to prevent memory spikes on large files
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        
        return new Blob(byteArrays, { type: contentType });
    }

    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('hidden'), 4000);
    }

    function resetForms() {
        document.getElementById('form-guest').reset();
        document.getElementById('form-admin-login').reset();
        document.getElementById('guest-error').classList.add('hidden');
        document.getElementById('guest-result').classList.add('hidden');
        document.getElementById('auth-error').classList.add('hidden');
    }
});
