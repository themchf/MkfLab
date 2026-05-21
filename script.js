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
    let currentBlobUrl = null;

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

    // --- Admin Authentication ---
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
                showStatus(statusDiv, `Linked to ${code.toUpperCase()}`, 'success');
                document.getElementById('form-upload').reset();
                renderAdminTable();
            } catch (err) {
                showStatus(statusDiv, `Failed: ${err.message}`, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Secure & Upload Document';
            }
        };
    });

    async function renderAdminTable() {
        const tbody = document.getElementById('doc-list');
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td>This is a common issue with Safari on iOS. Apple’s security model often blocks "Data URIs" (the raw code for the file) from being downloaded</tr>';

        try {
            const response = await fetch(`${WORKER_URL}/api/list`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
            });
            const docs = await response.json();
            tbody.innerHTML = '';
             or opened programmatically after an asynchronous `fetch` call, as it no longer considers the action "user-initiated."

To fix this, we will:docs.forEach(doc => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><strong>${doc.code}</strong></td><td>${
1.  **Remove the `download` attribute**: This tells the browser to view the file rather than save it.
2.  **Use `window.open` indirectly**: We'll update the button to a "View Result" button. When the user clicks it, it will open the processed Blob in a new tab,doc.filename}</td><td><button class="btn-text text-danger delete-btn" data-code="${doc.code}">Delete</button></td>`;
                tbody.appendChild(tr);
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    await fetch(`${WORKER_URL}/api/document?code=${e.target.dataset.code}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
                    });
                    renderAdminTable();
                });
            }); which Safari allows because the click is direct.
3.  **Sanitize the Blob**: Ensure the MIME type is explicitly `application/pdf` so iOS knows
        } catch {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Sync error.</td></tr>';
        }
    }

    // --- Guest Operations (iOS Optimization) ---
    document.getElementById('form-guest'). exactly how to render it.

### Updated `script.js`

Replace your existing script with this version. I have optimized the PDF handling specifically for the iOSaddEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('guest-code').value.trim().toUpperCase();
 Safari viewer.
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const WORKER_URL = "[https://mkf-lab.michaelsuperhand.workers.dev](https://mkf-lab.michaelsuperhand.workers.dev)"; 
    const ADMIN_SECRET = "AdminMKFLab"; 

    const views = {
        home: document.getElementById('view-home'),
        guest: document.getElementById('view-guest'),
        adminAuth: document.getElementById('view-admin-auth'),
        adminDash: document.getElementById('view-admin-dash')
    };

    const btnHome = document.getElementById('btn-home');
    let currentBlobUrl = null;

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

    // --- Admin Authentication ---
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
        btn.textContent = 'Syncing...';

        const reader = new FileReader();
        reader.readAsDataURL(fileInput);
        reader.onload = async () => {
            try {
                const response = await fetch(${WORKER_URL}/api/upload, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': Bearer ${ADMIN_SECRET}
                    },
                    body: JSON.stringify({
                        code: code,
                        filename: fileInput.name,
                        fileData: reader.result
                    })
                });

                if (!response.ok) throw new Error(await response.text());

                showStatus(statusDiv, Linked to ${code.toUpperCase()}, 'success');
                document.getElementById('form-upload').reset();
                renderAdminTable();
            } catch (err) {
                showStatus(statusDiv, Upload Failed: ${err.message}, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Secure & Upload Document';
            }
        };
    });

    async function renderAdminTable() {
        const tbody = document.getElementById('doc-list');
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';

        try {
            const response = await fetch(${WORKER_URL}/api/list, {
                method: 'GET',
                headers: { 'Authorization': Bearer ${ADMIN_SECRET} }
            });
            const docs = await response.json();
            
            tbody.innerHTML = '';
            docs.forEach(doc => {
                const tr = document.createElement('tr');
                tr.```

### Why this works
1.  **Blob Object:** We convert the encoded string back into a standard `application/pdf` binary.
2.  **`window.open`:** On many mobile browsers, if the window opens successfully, it will immediately shift focus to the PDF.
3.  **The "View" Fallback:** If the browser blocks the automatic popup, the app shows the card. Clicking "View Document" now points to a local `blob:` URL. iOS handles these as native files rather than web links, triggering the built-in PDF reader.innerHTML = `
                    <td><strong>${doc.code}</strong></td>
                    <td>${doc.filename}</td>
                    <td><button class="btn-text text-danger delete-btn" data-code="${doc.code}">Delete</button></td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const targetCode = e.target.dataset.code;
                    await fetch(`${WORKER_URL}/api/document?code=${targetCode}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
                    });
                    renderAdminTable();
                });
            });
        } catch {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Sync failed.</td></tr>';
        }
    }

    // --- Guest Operations (iOS Safari Optimized) ---
    document.getElementById('form-guest').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = document.getElementById('guest-code').value.trim().toUpperCase();
        const errorDiv = document.getElementById('guest-error');
        const resultDiv = document.getElementById('guest-result');
        const downloadBtn = document.getElementById('btn-download');
        
        errorDiv.classList.add('hidden');
        resultDiv.classList.add('hidden');

        try {
            const response = await fetch(`${WORKER_URL}/api/document?code=${code}`);
            if (!response.ok) throw new Error('Document not found.');

            const doc = await response.json();
            
            // 1. Convert to binary Blob
            if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
            const blob = base64ToBlob(doc.fileData);
            currentBlobUrl = URL.createObjectURL(blob);
            
            // 2. Prepare the button for a direct user click
            document.getElementById('result-filename').textContent = doc.filename;
            downloadBtn.href = currentBlobUrl;
            downloadBtn.textContent = "View Lab Result";
            downloadBtn.removeAttribute('download'); // Remove download to force view
            downloadBtn.target = "_blank"; // Open in new tab
            downloadBtn.rel = "noopener noreferrer";
            
            resultDiv.classList.remove('hidden');
            
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('hidden');
        }
    });

    // --- PDF Helper ---
    function base64ToBlob(base64String) {
        const parts = base64String.split(',');
        const base64Data = parts[1] || parts[0];
        const contentType = 'application/pdf'; // Force PDF MIME type
        
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
