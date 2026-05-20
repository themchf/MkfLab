document.addEventListener('DOMContentLoaded', () => {
    // --- State & DOM Elements ---
    const MOCK_ADMIN_PASS = "admin2024"; // The password required to access the admin panel
    
    const views = {
        home: document.getElementById('view-home'),
        guest: document.getElementById('view-guest'),
        adminAuth: document.getElementById('view-admin-auth'),
        adminDash: document.getElementById('view-admin-dash')
    };

    const btnHome = document.getElementById('btn-home');

    // --- Navigation Logic ---
    function switchView(viewId) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[viewId].classList.remove('hidden');
        
        if (viewId === 'home') {
            btnHome.classList.add('hidden');
        } else {
            btnHome.classList.remove('hidden');
        }
    }

    document.getElementById('nav-guest').addEventListener('click', () => switchView('guest'));
    document.getElementById('nav-admin').addEventListener('click', () => {
        // Check if already authenticated in this session
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

        if (pass === MOCK_ADMIN_PASS) {
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

    // --- Database Simulation (Local Storage) ---
    function getDatabase() {
        const data = localStorage.getItem('mkf_lab_db');
        return data ? JSON.parse(data) : {};
    }

    function saveToDatabase(code, filename, base64Data) {
        const db = getDatabase();
        db[code.toUpperCase()] = { filename, data: base64Data, date: new Date().toISOString() };
        localStorage.setItem('mkf_lab_db', JSON.stringify(db));
    }

    function deleteFromDatabase(code) {
        const db = getDatabase();
        delete db[code];
        localStorage.setItem('mkf_lab_db', JSON.stringify(db));
        renderAdminTable();
    }

    // --- Admin Upload Logic ---
    document.getElementById('form-upload').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const codeInput = document.getElementById('assign-code').value.trim();
        const fileInput = document.getElementById('upload-pdf').files[0];
        const statusDiv = document.getElementById('upload-status');
        const btn = document.getElementById('btn-upload');

        if (!fileInput || fileInput.type !== 'application/pdf') {
            showStatus(statusDiv, 'Please select a valid PDF file.', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing...';

        // Convert PDF to Base64 to store in local browser storage
        const reader = new FileReader();
        reader.readAsDataURL(fileInput);
        reader.onload = () => {
            const base64String = reader.result;
            try {
                saveToDatabase(codeInput, fileInput.name, base64String);
                showStatus(statusDiv, `Document securely assigned to code: ${codeInput.toUpperCase()}`, 'success');
                document.getElementById('form-upload').reset();
                renderAdminTable();
            } catch (err) {
                // LocalStorage has a ~5MB limit. Catch overflow.
                showStatus(statusDiv, 'File too large. Browser storage limit exceeded.', 'error');
            }
            btn.disabled = false;
            btn.textContent = 'Secure & Upload Document';
        };
        reader.onerror = () => {
            showStatus(statusDiv, 'Error reading file.', 'error');
            btn.disabled = false;
            btn.textContent = 'Secure & Upload Document';
        };
    });

    function renderAdminTable() {
        const db = getDatabase();
        const tbody = document.getElementById('doc-list');
        tbody.innerHTML = '';

        if (Object.keys(db).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">No documents uploaded yet.</td></tr>';
            return;
        }

        Object.entries(db).forEach(([code, doc]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${code}</strong></td>
                <td>${doc.filename}</td>
                <td><button class="btn-text text-danger delete-btn" data-code="${code}">Delete</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                deleteFromDatabase(e.target.dataset.code);
            });
        });
    }

    // --- Guest Retrieval Logic ---
    document.getElementById('form-guest').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const code = document.getElementById('guest-code').value.trim().toUpperCase();
        const errorDiv = document.getElementById('guest-error');
        const resultDiv = document.getElementById('guest-result');
        const db = getDatabase();

        if (db[code]) {
            // Found
            errorDiv.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            
            document.getElementById('result-filename').textContent = db[code].filename;
            
            const downloadBtn = document.getElementById('btn-download');
            downloadBtn.href = db[code].data;
            downloadBtn.download = db[code].filename;
        } else {
            // Not Found
            resultDiv.classList.add('hidden');
            errorDiv.textContent = 'Invalid code or document not found.';
            errorDiv.classList.remove('hidden');
        }
    });

    // --- Utility Functions ---
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