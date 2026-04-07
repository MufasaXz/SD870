function terminateSession() {
    sessionStorage.removeItem('sec_token');
    window.location.href = "../index.html";
}

function generateCode() {
    const name = document.getElementById('t_name').value;
    const desc = document.getElementById('t_desc').value;
    const version = document.getElementById('t_version').value;
    const status = document.getElementById('t_status').value;
    const variant = document.getElementById('t_variant').value;
    const flash = document.getElementById('t_flash').value;
    const maintainer = document.getElementById('t_maintainer').value;
    const date = document.getElementById('t_date').value;
    const dl = document.getElementById('t_dl').value;
    const support = document.getElementById('t_support').value;

    const statusClass = status === 'OFFICIAL' ? 'tag-official' : 'tag-unofficial';
    const flashClass = flash === 'CLEAN ONLY' ? 'tag-clean' : 'tag-dirty';

    let htmlString = `
<div class="release-item">
    <div class="rel-info">
        <h3>${name}</h3>
        <p>${desc}</p>
    </div>
    
    <div class="rel-tags">
        <span class="tag tag-ver">${version}</span>
        <span class="tag ${statusClass}">${status}</span>
        ${variant !== 'N/A' ? `<span class="tag tag-variant">${variant}</span>` : ''}
        <span class="tag ${flashClass}">${flash}</span>
    </div>

    <div class="rel-meta">
        <span class="rel-date">${date}</span>
        <span class="rel-dev">by ${maintainer}</span>
    </div>

    <div class="rel-actions">
        <a href="${dl}" target="_blank" class="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            DOWNLOAD
        </a>
        ${support ? `<a href="${support}" target="_blank" class="btn btn-secondary">SUPPORT</a>` : ''}
    </div>
</div>
`;

    document.getElementById('outputArea').value = htmlString.trim();
}

function copyToClipboard() {
    const output = document.getElementById('outputArea');
    output.select();
    document.execCommand('copy');
    
    const btn = document.querySelector('.copy-btn');
    const originalText = btn.innerText;
    btn.innerText = 'COPIED!';
    btn.style.background = 'var(--accent)';
    btn.style.color = '#000';
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = 'transparent';
        btn.style.color = 'var(--accent)';
    }, 2000);
}

// Auto-fill today's date
window.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateInput = document.getElementById('t_date');
    if (dateInput) {
        dateInput.value = today.toLocaleDateString('en-GB', options);
    }
});
