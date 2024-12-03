"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

export default function ChatRoom() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [activeUsers, setActiveUsers] = useState<
    { name: string; status: string }[]
  >([]);
  const [messages, setMessages] = useState<
    { sender: string; content: string }[]
  >([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_CHAT_WS_BASE_URL, {
      auth: { token },
    });

    newSocket.on("connect_error", (err) => {
      if (err.message === "AUTH_ERROR") {
        localStorage.removeItem("token");
        router.push("/");
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  useEffect(() => {
    if (!socket) return;

    socket.on("updateUsers", (users) => {
      setActiveUsers(users);
    });

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("updateUsers");
      socket.off("newMessage");
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && message) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit("typing");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping");
      }, 1000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (socket) {
      socket.disconnect();
    }
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Active Users Panel */}
      <div className="w-1/4 bg-white border-r border-gray-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Active Users</h2>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
        <ul>
          {activeUsers.map((user, index) => (
            <li key={index} className="p-4 border-b border-gray-200">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.status}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className="bg-white rounded-lg p-3 shadow">
              <div className="font-medium text-gray-900">{msg.sender}</div>
              <div className="text-gray-700">{msg.content}</div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSendMessage}
          className="bg-white p-4 border-t border-gray-200"
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleTyping}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
