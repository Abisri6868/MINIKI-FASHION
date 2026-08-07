import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiSearch, FiTrash2, FiCornerUpLeft, FiCheck } from 'react-icons/fi';
import { getMessages, markMessageRead, replyToMessage, deleteMessage } from '../../services/contactService';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await getMessages({ search: search || undefined });
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchMessages, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openMessage = async (msg) => {
    setSelected(msg);
    setReplyText(msg.reply?.message || '');
    if (!msg.isRead) {
      try {
        await markMessageRead(msg._id);
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) { /* non-fatal */ }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return toast.error('Write a reply first');
    setSending(true);
    try {
      const { data } = await replyToMessage(selected._id, replyText);
      setMessages((prev) => prev.map((m) => (m._id === selected._id ? data.message : m)));
      setSelected(data.message);
      toast.success('Reply sent to customer');
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiMail className="text-pink-600" size={24} />
          <h1 className="text-2xl font-heading font-bold">Messages</h1>
          {unreadCount > 0 && (
            <span className="bg-pink-600 text-white text-xs font-semibold px-2 py-1 rounded-full">{unreadCount} unread</span>
          )}
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input-field !pl-9 !w-64"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No messages found</p>
          ) : (
            messages.map((m) => (
              <button
                key={m._id}
                onClick={() => openMessage(m)}
                className={`w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-pink-50 transition-colors ${selected?._id === m._id ? 'bg-pink-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${!m.isRead ? 'font-semibold' : 'font-medium'} text-gray-800`}>{m.name}</p>
                  {!m.isRead && <span className="w-2 h-2 rounded-full bg-pink-600" />}
                </div>
                <p className="text-xs text-gray-500 truncate">{m.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString('en-IN')}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3 card p-6">
          {!selected ? (
            <p className="text-center text-gray-400 py-20">Select a message to view details</p>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{selected.subject || 'General Inquiry'}</h3>
                  <p className="text-sm text-gray-500">{selected.name} · {selected.email} {selected.phone && `· ${selected.phone}`}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => handleDelete(selected._id)} className="text-red-500 hover:text-red-700"><FiTrash2 size={18} /></button>
              </div>

              <div className="bg-pink-50/60 rounded-xl p-4 text-sm text-gray-700 mb-5">{selected.message}</div>

              {selected.reply?.message && (
                <div className="border-l-4 border-pink-600 pl-4 mb-5">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><FiCheck size={12} /> Replied {new Date(selected.reply.repliedAt).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-700">{selected.reply.message}</p>
                </div>
              )}

              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                {selected.reply?.message ? 'Send another reply' : 'Reply to this message'}
              </label>
              <textarea
                rows={4}
                className="input-field mb-3"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button onClick={handleReply} disabled={sending} className="btn-primary">
                <FiCornerUpLeft size={16} /> {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
