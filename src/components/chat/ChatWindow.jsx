import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../axiosInstance.js';
import { connectSocket, getSocket } from '../../sockets/socketClient.js';

/**
 * Props (same as used in Clients.jsx):
 *   therapistId, clientId, currentRole ('therapist' | 'client')
 */
export default function ChatWindow({ therapistId, clientId, currentRole }) {
  const otherId = currentRole === 'therapist' ? clientId : therapistId;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!otherId) return undefined;
    let alive = true;

    axiosInstance
      .get(`/chat/${otherId}`)
      .then((res) => alive && setMessages(res.data))
      .catch(() => alive && setError('Could not load earlier messages'));

    const token = localStorage.getItem('unfazed_token') || localStorage.getItem('unfazed_client_token');
    const socket = getSocket() || connectSocket(token);

    const join = () => {
      setConnected(true);
      setError('');
      socket.emit('chat:join', { otherId });
      socket.emit('chat:read', { otherId });
    };
    const onMessage = (m) => {
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
      if (m.senderRole !== currentRole) socket.emit('chat:read', { otherId });
    };
    const onTyping = ({ role, isTyping }) => role !== currentRole && setOtherTyping(isTyping);
    const onRead = () =>
      setMessages((prev) => prev.map((m) => (m.senderRole === currentRole && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)));
    const onDisconnect = () => setConnected(false);
    const onError = (err) => { setConnected(false); setError(`Chat connection failed: ${err.message}`); };

    if (socket.connected) join();
    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);

    return () => {
      alive = false;
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:read', onRead);
    };
  }, [otherId, currentRole]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, otherTyping]);

  const send = (e) => {
    e.preventDefault();
    const socket = getSocket();
    if (!text.trim() || !socket) return;
    socket.emit('chat:send', { otherId, text: text.trim() }, (ack) => {
      if (ack && ack.ok === false) setError(`Message not sent: ${ack.error}`);
    });
    socket.emit('chat:typing', { otherId, isTyping: false });
    setText('');
  };

  const onChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    socket?.emit('chat:typing', { otherId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit('chat:typing', { otherId, isTyping: false }), 1200);
  };

  return (
    <div className="flex h-[480px] flex-col rounded-xl ring-1 ring-mist">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => {
          const mine = m.senderRole === currentRole;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-tide text-white' : 'bg-fog text-ink'}`}>
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className="mt-1 text-[10px] opacity-70">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && m.readAt ? ' · Read' : ''}
                </p>
              </div>
            </div>
          );
        })}
        {otherTyping && <p className="text-xs italic text-ink/60">typing…</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p role="alert" className="px-3 text-xs text-danger">{error}</p>}
      {!connected && !error && <p className="px-3 text-xs text-ink/60">Connecting…</p>}

      <form onSubmit={send} className="flex gap-2 border-t border-mist p-2">
        <input
          value={text}
          onChange={onChange}
          placeholder="Type a message"
          className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
        />
        <button type="submit" disabled={!connected || !text.trim()} className="rounded-lg bg-tide px-4 py-2 text-sm text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
