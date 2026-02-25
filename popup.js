const toggle = document.getElementById('toggleEffect');
const statusText = document.getElementById('statusText');
const statusPill = document.getElementById('statusPill');

function updateStatus(isEnabled) {
  statusText.innerText = isEnabled ? 'Activé' : 'Désactivé';
  statusPill.classList.toggle('active', isEnabled);
}

chrome.storage.sync.get('enabled', (data) => {
  const enabled = data.enabled || false;
  toggle.checked = enabled;
  updateStatus(enabled);
});

toggle.addEventListener('change', () => {
  const isEnabled = toggle.checked;
  chrome.storage.sync.set({ enabled: isEnabled }, () => {
    updateStatus(isEnabled);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});
