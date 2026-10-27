import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../../sockets/socketClient';
import Button from '../common/Button.jsx';

export default function ChatWindow({ therapistId, clientId, currentRole }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (!socket || !therapistId || !clientId) return;

    // 1. Join the room
    socket.emit('chat:join', { therapistId, clientId }, (ack) => {
      if (!ack.ok) console.error('Failed to join chat', ack.error);
    });

    // 2. Fetch previous messages (REST fallback)
    // Note: For portal, you'd call a different endpoint. Assuming this is therapist view for now.
    if (currentRole === 'therapist') {
      // You can add the fetch here if needed, or rely purely on socket if you don't need history
    }

    // 3. Listen for incoming messages
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    const handleTyping = ({ fromRole, isTyping }) => {
      if (fromRole !== currentRole) setIsTyping(isTyping);
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:typing', handleTyping);
    };
  }, [socket, therapistId, clientId, currentRole]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('chat:send', { therapistId, clientId, body: input }, (ack) => {
      if (ack.ok) setInput('');
      else alert('Failed to send message');
    });
    socket.emit('chat:typing', { therapistId, clientId, isTyping: false });
  };

  const handleTypingInput = (e) => {
    setInput(e.target.value);
    socket?.emit('chat:typing', { therapistId, clientId, isTyping: e.target.value.length > 0 });
  };

  return (
    <div className="flex h-[500px] flex-col rounded-xl bg-white ring-1 ring-mist">
      {/* Header */}
      <div className="border-b border-mist p-4 font-display font-bold text-ink">Secure Chat</div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && <p className="text-center text-sm text-ink/50">No messages yet. Say hello!</p>}
        
        {messages.map((m, i) => {
          const isMe = m.senderRole === currentRole;
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${isMe ? 'bg-tide text-white' : 'bg-mist/50 text-ink'}`}>
                {m.body}
              </div>
            </div>
          );
        })}
        {isTyping && <p className="text-xs text-ink/50 italic">Typing...</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-mist p-4">
        <input
          type="text"
          value={input}
          onChange={handleTypingInput}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-tide"
        />
        <Button type="submit" disabled={!input.trim()}>Send</Button>
      </form>
    </div>
  );
}