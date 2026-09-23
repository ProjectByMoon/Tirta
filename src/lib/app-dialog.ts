export type DialogOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
};

function openDialog(options: DialogOptions, mode: 'alert' | 'confirm' | 'prompt'): Promise<string | boolean | void> {
  if (typeof document === 'undefined') return Promise.resolve(mode === 'confirm' ? false : mode === 'prompt' ? null as never : undefined);
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog';
    dialog.setAttribute('aria-modal', 'true');
    const title = options.title || (mode === 'prompt' ? 'Masukkan informasi' : mode === 'confirm' ? 'Konfirmasi' : 'Informasi');
    const cancel = options.cancelText || 'Batal';
    const confirm = options.confirmText || (mode === 'confirm' ? 'Lanjutkan' : 'OK');
    dialog.innerHTML = `
      <form method="dialog" class="app-dialog-card">
        <div class="app-dialog-head"><h2>${escapeHtml(title)}</h2><button type="button" class="app-dialog-close" data-action="cancel" aria-label="Tutup">×</button></div>
        <div class="app-dialog-body"><p>${escapeHtml(options.message || '')}</p>${mode === 'prompt' ? `<label class="app-dialog-field"><span>Nilai</span><input name="value" type="text" placeholder="${escapeAttr(options.placeholder || '')}" value="${escapeAttr(options.defaultValue || '')}" autocomplete="off" /></label>` : ''}</div>
        <div class="app-dialog-foot">${mode !== 'alert' ? `<button type="button" class="secondary" data-action="cancel">${escapeHtml(cancel)}</button>` : ''}<button type="button" class="primary" data-action="confirm">${escapeHtml(confirm)}</button></div>
      </form>`;
    document.body.appendChild(dialog);
    const finish = (value: string | boolean | void) => { dialog.close(); dialog.remove(); resolve(value); };
    dialog.querySelectorAll<HTMLElement>('[data-action="cancel"]').forEach(el => el.addEventListener('click', () => finish(mode === 'confirm' ? false : mode === 'prompt' ? null as never : undefined)));
    dialog.querySelector<HTMLElement>('[data-action="confirm"]')?.addEventListener('click', () => {
      if (mode === 'prompt') finish((dialog.querySelector<HTMLInputElement>('input[name="value"]')?.value || '').trim());
      else finish(mode === 'confirm' ? true : undefined);
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(mode === 'confirm' ? false : mode === 'prompt' ? null as never : undefined); }, { once: true });
    dialog.addEventListener('click', event => { if (event.target === dialog) finish(mode === 'confirm' ? false : mode === 'prompt' ? null as never : undefined); });
    dialog.showModal();
    const focus = dialog.querySelector<HTMLInputElement>('input') || dialog.querySelector<HTMLElement>('[data-action="confirm"]');
    focus?.focus();
  });
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char)); }
function escapeAttr(value: string) { return escapeHtml(value); }

export const appAlert = (message: string, title = 'Informasi') => openDialog({ title, message, confirmText: 'OK' }, 'alert') as Promise<void>;
export const appConfirm = (message: string, options: Omit<DialogOptions, 'message'> = {}) => openDialog({ ...options, message }, 'confirm') as Promise<boolean>;
export const appPrompt = (message: string, defaultValue = '', options: Omit<DialogOptions, 'message' | 'defaultValue'> = {}) => openDialog({ ...options, message, defaultValue, confirmText: options.confirmText || 'Simpan' }, 'prompt') as Promise<string | null>;
