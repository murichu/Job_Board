import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

let socket;

export function initMessagingSocket(token, userId) {
  if (!socket) {
    socket = io(process.env.CLIENT_URL ? undefined : '/', {
      auth: { token },
      transports: ['websocket']
    });
  }

  socket.on('connect', () => {
    // Join user's personal room
    socket.emit('join', { userId });
  });

  return socket;
}

export function useMessages(conversationId, token, userId) {
  const [messages, setMessages] = useState([]);
  const mounted = useRef(false);

  useEffect(() => {
    if (!conversationId) return;
    let s = socket;
    let cancel = false;

    const fetch = async () => {
      try {
        const res = await axios.get(`/api/conversations/${conversationId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (!cancel) setMessages(res.data.messages || []);
      } catch (e) {
        console.error(e);
      }
    };

    fetch();

    if (s) {
      s.on('message:received', (payload) => {
        if (payload && payload.conversationId === conversationId) {
          setMessages(prev => [...prev, payload.message]);
        }
      });
    }

    return () => {
      cancel = true;
      if (s) s.off('message:received');
    };
  }, [conversationId]);

  return { messages, setMessages };
}

export function useSendMessage(token) {
  return async function sendMessage(conversationId, text, attachments = []) {
    const res = await axios.post(`/api/conversations/${conversationId}/messages`, { text, attachments }, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.message;
  };
}
