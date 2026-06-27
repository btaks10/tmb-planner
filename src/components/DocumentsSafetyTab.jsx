import { useState, useMemo } from 'react';
import { FileText, Phone, ExternalLink, Plus, X, Save, AlertTriangle, Shield } from 'lucide-react';

function GlassCard({ children, className = '' }) {
  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

const KIND_LABELS = {
  confirmation: 'Confirmation',
  receipt: 'Receipt',
  summary: 'Summary',
  'notion-entry': 'Notion',
  overview: 'Overview',
  ticket: 'Ticket',
  insurance: 'Insurance',
  passport: 'Passport',
  other: 'Other',
};

const KIND_ICONS = {
  confirmation: '📋',
  receipt: '🧾',
  summary: '📝',
  ticket: '🎫',
  insurance: '🛡️',
  passport: '🛂',
  other: '📄',
};

function DocumentRow({ doc, onViewFile }) {
  const [loadingUrl, setLoadingUrl] = useState(false);

  const handleView = async () => {
    if (!onViewFile) return;
    setLoadingUrl(true);
    try {
      const url = await onViewFile(doc.storage_path);
      if (url) window.open(url, '_blank');
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-b-0">
      <span className="text-base">{KIND_ICONS[doc.kind] || '📄'}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white truncate block">{doc.title}</span>
        {doc.kind && (
          <span className="text-[10px] text-slate-500">{KIND_LABELS[doc.kind] || doc.kind}</span>
        )}
      </div>
      <button
        onClick={handleView}
        disabled={loadingUrl}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
      >
        {loadingUrl ? (
          <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ExternalLink className="w-3 h-3" />
        )}
        View
      </button>
    </div>
  );
}

function ContactCard({ contact, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const startEdit = () => {
    setDraft({ label: contact.label, phone: contact.phone || '', notes: contact.notes || '' });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(contact.id, {
      label: draft.label,
      phone: draft.phone || null,
      notes: draft.notes || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 space-y-2 bg-white/[0.03] rounded-xl border border-white/10">
        <input
          value={draft.label}
          onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
          className="w-full text-sm bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white"
          placeholder="Name / Label"
        />
        <input
          value={draft.phone}
          onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))}
          className="w-full text-sm bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white"
          placeholder="Phone number"
        />
        <textarea
          value={draft.notes}
          onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
          className="w-full text-xs bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white resize-none"
          rows={2}
          placeholder="Notes"
        />
        <div className="flex gap-2">
          <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30">
            <Save className="w-3 h-3" /> Save
          </button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 text-slate-400 text-xs hover:bg-white/15">
            Cancel
          </button>
          <button onClick={() => onDelete(contact.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 ml-auto">
            <X className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={startEdit} className="w-full text-left p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {contact.phone ? (
            <Phone className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white">{contact.label}</span>
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={e => e.stopPropagation()}
              className="block text-sm text-blue-400 hover:text-blue-300 font-mono mt-0.5"
            >
              {contact.phone}
            </a>
          )}
          {contact.notes && (
            <p className="text-xs text-slate-500 mt-1">{contact.notes}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function DocumentsSafetyTab({
  bookings,
  contacts,
  getFileUrl,
  contactsLoading,
  contactsError,
  tripId,
  onCreateContact,
  onUpdateContact,
  onDeleteContact,
}) {
  // Collect all documents from bookings
  const documents = useMemo(() => {
    if (!bookings) return [];
    const docs = [];
    for (const b of bookings) {
      if (b.documents && Array.isArray(b.documents)) {
        for (const d of b.documents) {
          docs.push({ ...d, _bookingName: b.place_name });
        }
      }
    }
    return docs;
  }, [bookings]);

  // Group documents by kind
  const docsByKind = useMemo(() => {
    const map = new Map();
    for (const doc of documents) {
      const kind = doc.kind || 'other';
      if (!map.has(kind)) map.set(kind, []);
      map.get(kind).push(doc);
    }
    return map;
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* Documents vault */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">Documents Vault</h3>
          <span className="text-xs text-slate-500 ml-auto">{documents.length} files</span>
        </div>

        {documents.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-slate-400 text-sm">No documents uploaded yet. Upload receipts and confirmations in the Bookings tab.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {[...docsByKind.entries()].map(([kind, docs]) => (
              <GlassCard key={kind} className="overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {KIND_LABELS[kind] || kind} ({docs.length})
                  </span>
                </div>
                {docs.map(doc => (
                  <DocumentRow key={doc.id} doc={doc} onViewFile={getFileUrl} />
                ))}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Emergency contacts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-red-400" />
          <h3 className="text-base font-semibold text-white">Emergency Contacts</h3>
        </div>

        {contactsLoading ? (
          <GlassCard className="p-6 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading contacts...</p>
          </GlassCard>
        ) : contactsError ? (
          <GlassCard className="p-6 text-center">
            <p className="text-red-400 text-sm">Error: {contactsError}</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {contacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onUpdate={onUpdateContact}
                onDelete={onDeleteContact}
              />
            ))}

            <button
              onClick={() => onCreateContact({ trip_id: tripId, label: 'New Contact', phone: '', notes: '' })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 text-slate-400 text-sm hover:bg-white/5 hover:border-white/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add contact
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
