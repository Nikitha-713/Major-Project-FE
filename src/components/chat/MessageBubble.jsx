export default function MessageBubble({ message, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div className={`mt-1 text-[10px] ${mine ? 'text-indigo-100' : 'text-gray-500'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {mine && message.readAt ? ' · Read' : ''}
        </div>
      </div>
    </div>
  );
}
