import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, messageAPI } from '../services/api';
import { Search, Send, User as UserIcon, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

const ChatPage = () => {
  const { user: authUser, isAuthenticated, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserId = authUser?.id || authUser?._id;

  // Real-time Socket.io Connection
  useEffect(() => {
    if (!currentUserId) return;

    const authToken = token || localStorage.getItem('lumen_token');
    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : (import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || window.location.origin);
    const socket = io(backendUrl, {
      auth: { token: authToken },
    });
    socketRef.current = socket;

    socket.emit('join_room', currentUserId);

    socket.on('receive_message', (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, token]);

  // Scroll to bottom of message container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError('');

        const response = await userAPI.getAllUsers();
        const allUsers = response.data?.users || [];

        setUsers(allUsers);

        // Select first user other than logged in user
        const otherUser = allUsers.find(
          (u) => (u._id || u.id) !== currentUserId
        );
        if (otherUser) {
          setSelectedUser((prev) => prev || otherUser);
        }
      } catch (err) {
        console.error('Fetch users error:', err);
        setError('Unable to load user directory. Ensure backend is running.');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isAuthenticated) {
      fetchUsers();
    }
  }, [currentUserId, isAuthenticated]);

  // Fetch conversation messages
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        setError('');

        const selectedId = selectedUser._id || selectedUser.id;
        const response = await messageAPI.getConversation(selectedId);
        setMessages(response.data?.messages || []);
      } catch (err) {
        console.error('Fetch messages error:', err);
        setMessages([]);
        setError('Unable to load message history.');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUser, currentUserId]);

  const filteredUsers = users.filter((u) => {
    const isNotSelf = (u._id || u.id) !== currentUserId;
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                          u.email?.toLowerCase().includes(search.toLowerCase());
    return isNotSelf && matchesSearch;
  });

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !selectedUser || !currentUserId || sending) return;

    try {
      setSending(true);
      setError('');

      const selectedId = selectedUser._id || selectedUser.id;
      const response = await messageAPI.sendMessage({
        receiver: selectedId,
        text: trimmed,
      });

      const data = response.data;

      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        // Fallback message object
        setMessages((prev) => [
          ...prev,
          {
            _id: `msg-${Date.now()}`,
            sender: currentUserId,
            receiver: selectedId,
            text: trimmed,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      setMessageText('');
    } catch (err) {
      console.error('[ChatPage] Send message error:', err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center font-bold">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">Sign in to Access Chat</h2>
        <p className="text-sm text-stone-600">You must be logged in to participate in personal conversations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-[#EDE8DF] rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        
        {/* Users Sidebar */}
        <div className="md:col-span-4 border-r border-[#EDE8DF] bg-[#FAF7F2]/50 flex flex-col">
          
          <div className="p-4 border-b border-[#EDE8DF] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1A382B]" />
                Messages
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-[#1A382B] rounded-full border border-emerald-200">
                Online
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search colleagues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#EDE8DF] rounded-xl text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#EDE8DF]/60">
            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-stone-400">Loading directory...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">No users found.</div>
            ) : (
              filteredUsers.map((u) => {
                const uId = u._id || u.id;
                const selectedId = selectedUser?._id || selectedUser?.id;
                const isSelected = uId === selectedId;

                return (
                  <button
                    key={uId}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left p-3.5 transition flex items-center gap-3 ${
                      isSelected ? 'bg-white border-l-4 border-l-[#1A382B]' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1A382B]/10 text-[#1A382B] flex items-center justify-center font-bold text-xs shrink-0">
                      {u.name ? u.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-stone-800 truncate">{u.name}</p>
                        <span className="text-[10px] text-stone-400 capitalize">{u.role || 'user'}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {u.lastMessage || u.email || 'Click to chat'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-8 flex flex-col bg-white">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[#EDE8DF] flex items-center justify-between bg-[#FAF7F2]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A382B] text-white flex items-center justify-center font-bold text-sm">
                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{selectedUser.name}</h3>
                    <p className="text-[11px] text-stone-500">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F2]/30 min-h-[380px]">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-stone-400">Loading conversation...</div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500">No messages yet. Send a greeting to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const msgSenderId = typeof msg.sender === 'object' ? (msg.sender._id || msg.sender.id) : msg.sender;
                    const isMe = msgSenderId === currentUserId;

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs shadow-2xs ${
                            isMe
                              ? 'bg-[#1A382B] text-white rounded-br-xs'
                              : 'bg-white border border-[#EDE8DF] text-stone-800 rounded-bl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <p
                            className={`text-[9px] mt-1 text-right ${
                              isMe ? 'text-stone-300' : 'text-stone-400'
                            }`}
                          >
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSend} className="p-3 border-t border-[#EDE8DF] bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#1A382B]"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="px-4 py-2.5 bg-[#1A382B] hover:bg-[#11261D] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-400">
              Select a contact to begin messaging
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;
