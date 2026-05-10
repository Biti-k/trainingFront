import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "http://localhost:8000";

interface Message {
  role: "user" | "ai";
  text: string;
}

// Añade esta función arriba del componente
function renderMarkdown(text: string) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")   // **negrita**
    .replace(/\*(.+?)\*/g, "<em>$1</em>")               // *cursiva*
    .replace(/\n/g, "<br/>");                            // saltos de línea
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block opacity-50"
          style={{ animation: "chatBounce 1.2s infinite", animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! 💪 I'm your workout assistant. Ask me anything about your training or fitness in general." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const profileId =
    typeof window !== "undefined" ? localStorage.getItem("activeProfileId") : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          profile_id: profileId ? Number(profileId) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `⚠️ ${e.message ?? "Error connecting to the assistant."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.35); }
          50%       { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
        }
        .ai-bubble-btn { animation: chatPulse 2.8s ease-in-out infinite; }
        .ai-chat-window { animation: chatSlideUp 0.22s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* ── Botón flotante ── */}
      <button
        className="ai-bubble-btn fixed bottom-7 right-7 z-[1000] w-14 h-14 rounded-full
                   border border-green-500 bg-gradient-to-br from-green-900 to-green-800
                   text-white cursor-pointer flex items-center justify-center text-2xl
                   transition-transform duration-200 hover:scale-110"
        style={{ transform: open ? "rotate(45deg) scale(1.05)" : undefined }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* ── Ventana de chat ── */}
      {open && (
        <div
          className="ai-chat-window fixed z-[999] right-7 bottom-[5.25rem]
                     w-[min(420px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))]
                     rounded-2xl border border-white/10 flex flex-col overflow-hidden
                     bg-white/5 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-black/15 shrink-0">
            <span className="text-xl">🤖</span>
            <div>
              <div className="font-bold text-sm text-green-300 leading-tight">
                Workout Assistant
              </div>
              <div className="text-xs text-white/40 mt-0.5">
                {profileId ? "With your profile context" : "No active profile"}
              </div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)]" />
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={[
                  "px-3.5 py-2.5 text-sm leading-relaxed max-w-[88%] whitespace-pre-wrap break-words",
                  m.role === "user"
                    ? "bg-gradient-to-br from-green-700 to-green-600 text-white rounded-[18px_18px_4px_18px] self-end"
                    : "bg-white/7 border border-white/10 text-white/90 rounded-[18px_18px_18px_4px] self-start",
                ].join(" ")}
              >
                {renderMarkdown(m.text)}
              </div>
            ))}

            {loading && (
              <div className="bg-white/7 border border-white/10 rounded-[18px_18px_18px_4px] self-start px-3.5 py-2.5 max-w-[88%]">
                <TypingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-4 py-3 border-t border-white/10 bg-black/10 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 bg-glass-bg border border-white/10 rounded-lg px-3 py-2
                         text-sm text-white/90 placeholder:text-white/30
                         focus:outline-none focus:border-green-500 transition-colors
                         disabled:opacity-40"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 shrink-0 rounded-lg bg-green-600 flex items-center justify-center
                         transition-colors hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}