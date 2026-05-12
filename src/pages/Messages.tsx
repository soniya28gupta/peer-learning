import { useEffect, useRef, useState } from "react";
import { Send, Search, Phone, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const Messages = ({ user }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const currentUserId = user?.id;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Users
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const getUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId);

      if (!error && data) {
        setUsers(data);

        if (data.length > 0) {
          setSelectedUser(data[0]);
        }
      }

      setLoading(false);
    };

    getUsers();
  }, [currentUserId]);

  // Fetch Messages
  const fetchMessages = async () => {
    if (!selectedUser || !currentUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }

    setLoading(false);
  };

  // Realtime
  useEffect(() => {
    fetchMessages();

    if (!selectedUser || !currentUserId) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;

          if (
            (newMsg.sender_id === currentUserId &&
              newMsg.receiver_id === selectedUser.id) ||
            (newMsg.sender_id === selectedUser.id &&
              newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUserId]);

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    await supabase.from("messages").insert([
      {
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        message: newMessage,
      },
    ]);

    setNewMessage("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#020B1F] to-[#050014] text-white relative">

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent)]" />

      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-3xl" />

      {/* SIDEBAR */}
      <div className="relative z-10 hidden w-[320px] flex-col border-r border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:flex">

        {/* Search */}
        <div className="mb-6 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search chats..."
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Users */}
        <div className="flex flex-col gap-3 overflow-y-auto">

          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`cursor-pointer rounded-3xl border p-4 transition-all duration-300 ${
                selectedUser?.id === user.id
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                  : "border-white/5 bg-white/5 hover:border-cyan-500/20 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">

                <div className="relative">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-black">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-black bg-cyan-400"></div>
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    {user.name}
                  </h3>

                  <p className="text-xs text-cyan-400">
                    Online
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="relative z-10 flex flex-1 flex-col">

        {/* TOP BAR */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 bg-white/5 px-6 backdrop-blur-2xl">

          {selectedUser && (
            <>
              <div className="flex items-center gap-4">

                <div className="relative">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-black">
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-black bg-cyan-400"></div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedUser.name}
                  </h2>

                  <p className="text-sm text-cyan-400">
                    Online
                  </p>
                </div>
              </div>

              <div className="flex gap-4">

                <button className="rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                  <Phone size={18} />
                </button>

                <button className="rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                  <Video size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

          {loading ? (
            <div className="space-y-4">

              <div className="h-14 w-52 animate-pulse rounded-2xl bg-white/10"></div>

              <div className="ml-auto h-14 w-72 animate-pulse rounded-2xl bg-white/10"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              No messages yet
            </div>
          ) : (
            messages.map((msg) => {
              const isSender = msg.sender_id === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isSender
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-3xl px-5 py-3 shadow-xl transition-all duration-300 ${
                      isSender
                        ? "rounded-br-md bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
                        : "rounded-bl-md border border-white/10 bg-white/10 backdrop-blur-xl"
                    }`}
                  >
                    <p className="text-sm">
                      {msg.message}
                    </p>

                    <p
                      className={`mt-2 text-[10px] ${
                        isSender
                          ? "text-black/60"
                          : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef}></div>
        </div>

        {/* INPUT */}
        <div className="border-t border-white/10 bg-white/5 p-5 backdrop-blur-2xl">

          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">

            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-500"
              value={newMessage}
              onChange={(e) =>
                setNewMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 p-3 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-105"
            >
              <Send
                size={18}
                className="text-black"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;