import React, { useEffect, useState } from 'react';
import { initMessagingSocket, useMessages, useSendMessage } from '../hooks/useMessaging';

export default function Chat({ token, userId }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!token || !userId) return;
    initMessagingSocket(token, userId);
    (async () => {
      try {
        const res = await fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token, userId]);

  const { messages } = useMessages(activeConv ? activeConv._id : null, token, userId);
  const sendMessage = useSendMessage(token);

  const handleSend = async () => {
    if (!activeConv) return;
    await sendMessage(activeConv._id, text);
    setText('');
  };

  return (
    <div className="chat">
      <div className="sidebar">
        {conversations.map(c => (
          <div key={c._id} onClick={() => setActiveConv(c)} className="conv-item">
            <div>Conversation: {c._id}</div>
            <div>{c.lastMessage}</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="messages">
          {messages.map(m => (
            <div key={m._id} className={`message ${m.sender === userId ? 'outgoing' : 'incoming'}`}>
              <div>{m.text}</div>
              <small>{new Date(m.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
        <div className="composer">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a message" />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
