import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";

export default function Foodbot() {
  const [open, setOpen] = useState(false);
  const { url, addToCart, cartItems } = useContext(StoreContext);

  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi, I'm Feasto AI. What are you craving today?" }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchBotResponse = async (userQuery) => {
    setMessages(m => [...m, { role: "bot", text: "Feasto AI is thinking..." }]);

    try {
      const { data } = await axios.post(`${url}/api/ai/chat-recommend`, { inp_text: userQuery });

      if (!data.success) {
        setMessages(m => [
          ...m.slice(0, -1),
          { role: "bot", text: "Sorry, I couldn't fetch recommendations right now." }
        ]);
        return;
      }

      setMessages(m => [
        ...m.slice(0, -1),
        { 
          role: "bot", 
          text: data.message, 
          intent: data.intent, 
          items: data.items 
        }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(m => [
        ...m.slice(0, -1),
        { role: "bot", text: "Something went wrong. Please try again." }
      ]);
    }
  };

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    await fetchBotResponse(userMsg);
  };

  return (
    <>
      {!open && (
        <button className="floating-chat-btn" onClick={() => setOpen(true)}>
          ✦
        </button>
      )}

      {open && (
        <div className="feasto-chat-overlay">
          <div className="chat-card">
            <header className="chat-header">
              <div>
                <h3>Feasto AI</h3>
                <p>Smart food assistant</p>
              </div>
              <button onClick={() => setOpen(false)}>×</button>
            </header>

            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i} className="message-wrapper">
                  <div
                    className={`bubble ${m.role}`}
                    style={m.role === "bot" ? { whiteSpace: "pre-line" } : {}}
                  >
                    {m.text}
                  </div>
                  {m.role === "bot" && m.items && m.items.length > 0 && (
                    <div className="bot-recommendations">
                      {m.items.map((item) => {
                        const inCartCount = cartItems[item._id] || 0;
                        return (
                          <div key={item._id} className="recommend-card">
                            <img src={url + "/images/" + item.image} alt={item.name} className="recommend-item-img" />
                            <div className="recommend-item-info">
                              <h4 className="recommend-item-name">{item.name}</h4>
                              <p className="recommend-item-price">${item.price}</p>
                            </div>
                            <button 
                              className={`btn-add-recommend ${inCartCount > 0 ? "added" : ""}`}
                              onClick={() => addToCart(item._id)}
                            >
                              {inCartCount > 0 ? `Added (${inCartCount})` : "Add +"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="chat-input">
              <input
                placeholder="Ask for food recommendations..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
              />
              <button onClick={send}>→</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .floating-chat-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff5a3d 0%, #ff7a55 100%);
          color: white;
          font-size: 26px;
          border: none;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(255, 90, 61, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .floating-chat-btn:hover {
          transform: translateY(-2px) scale(1.03);
        }

        .feasto-chat-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26, 16, 13, 0.22);
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          padding: 16px;
          z-index: 1000;
          pointer-events: none;
        }

        .chat-card {
          width: 380px;
          height: 560px;
          background: rgba(255, 255, 255, 0.96);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 52px rgba(32, 19, 15, 0.2);
          border: 1px solid var(--border);
          animation: slideIn 0.3s ease-out;
          pointer-events: auto;
        }

        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(135deg, #fff 0%, #fff6f1 100%);
          border-radius: 24px 24px 0 0;
        }

        .chat-header h3 {
          margin: 0;
          color: var(--text);
        }

        .chat-header p {
          color: var(--muted);
          font-size: 13px;
          margin-top: 4px;
        }

        .chat-header button {
          border: none;
          background: var(--accent-soft);
          color: var(--accent-dark);
          width: 36px;
          height: 36px;
          border-radius: 999px;
          font-size: 20px;
          cursor: pointer;
        }

        .chat-body {
          flex: 1;
          padding: 14px;
          overflow-y: auto;
          background:
            radial-gradient(circle at top right, rgba(255, 90, 61, 0.06), transparent 30%),
            linear-gradient(180deg, #fffdfb 0%, #fff7f3 100%);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .bubble {
          max-width: 80%;
          padding: 10px 12px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .bubble.bot {
          background: #fff;
          border: 1px solid var(--border);
          box-shadow: 0 8px 18px rgba(76, 42, 31, 0.06);
          color: var(--text);
          align-self: flex-start;
        }

        .bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, var(--accent) 0%, #ff7453 100%);
          color: white;
          box-shadow: 0 12px 22px rgba(255, 90, 61, 0.22);
        }

        .bot-recommendations {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 4px 10px;
          margin-top: 2px;
          max-width: 100%;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
          align-self: flex-start;
        }

        .bot-recommendations::-webkit-scrollbar {
          height: 6px;
        }

        .bot-recommendations::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 99px;
        }

        .recommend-card {
          flex: 0 0 150px;
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 8px;
          box-shadow: 0 6px 12px rgba(76, 42, 31, 0.04);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .recommend-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(76, 42, 31, 0.08);
        }

        .recommend-item-img {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          object-fit: cover;
          margin-bottom: 8px;
          border: 1px solid var(--border);
        }

        .recommend-item-info {
          width: 100%;
          margin-bottom: 8px;
        }

        .recommend-item-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 0 2px 0;
        }

        .recommend-item-price {
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-dark);
          margin: 0;
        }

        .btn-add-recommend {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid rgba(255, 90, 61, 0.18);
          border-radius: 99px;
          background: var(--accent-soft);
          color: var(--accent-dark);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-recommend:hover {
          background: #ffe1d8;
        }

        .btn-add-recommend.added {
          background: #e8fcf6;
          color: #0f8b6d;
          border-color: rgba(46, 196, 182, 0.15);
        }

        .chat-input {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.94);
          border-radius: 0 0 24px 24px;
        }

        .chat-input input {
          flex: 1;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid var(--border);
          outline: none;
          background: #fff;
        }

        .chat-input button {
          min-width: 52px;
          background: var(--text);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 0 14px;
          font-size: 18px;
          cursor: pointer;
        }

        @media (max-width: 600px) {
          .chat-card {
            width: 100%;
            height: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </>
  );
}
