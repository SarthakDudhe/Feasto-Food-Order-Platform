import React, { useRef, useEffect, useState } from "react";
import "./ScratchCard.css";

export default function ScratchCard({ onReveal }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratched, setScratched] = useState(false);
  const [revealedCode, setRevealedCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const coupons = [
    { code: "WELCOME20", desc: "20% OFF (Max $8)" },
    { code: "FEASTO10", desc: "10% OFF (Max $6)" },
    { code: "SAVE5", desc: "$5 OFF on orders > $25" }
  ];

  // Select a coupon randomly on mount
  useEffect(() => {
    const randomCoupon = coupons[Math.floor(Math.random() * coupons.length)];
    setRevealedCode(randomCoupon.code);
    setDiscountInfo(randomCoupon.desc);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on container bounding rect
    const resizeCanvas = () => {
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Draw metallic gold cover layer
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#ffe3b3");
      grad.addColorStop(0.3, "#ffc875");
      grad.addColorStop(0.5, "#ffb03a");
      grad.addColorStop(0.8, "#ffc875");
      grad.addColorStop(1, "#ffe3b3");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw shiny dots/glitter
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 3 + 1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw border inside canvas
      ctx.strokeStyle = "rgba(44, 33, 29, 0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      // Add diner styled text
      ctx.setLineDash([]);
      ctx.fillStyle = "#2c211d";
      ctx.font = "bold 14px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("FEASTO SECRET GIFT", canvas.width / 2, canvas.height / 2 - 12);
      
      ctx.font = "italic 11px Outfit, sans-serif";
      ctx.fillStyle = "#7a655b";
      ctx.fillText("✦ Scratch to Reveal ✦", canvas.width / 2, canvas.height / 2 + 12);
    };

    resizeCanvas();
  }, [scratched]);

  // Calculate the amount of scratched pixels
  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let clearedCount = 0;

    // Inspect alpha values (index % 4 === 3)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        clearedCount++;
      }
    }

    const percentage = (clearedCount / (pixels.length / 4)) * 100;
    if (percentage > 48) {
      revealCoupon();
    }
  };

  const revealCoupon = () => {
    if (scratched) return;
    setScratched(true);
    setShowConfetti(true);
    if (onReveal) {
      onReveal(revealedCode);
    }
    // Auto remove confetti after 4 seconds
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Dragging event handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const draw = (e) => {
    if (!isDrawing || scratched) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    // Blending mode to erase canvas
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Check progress occasionally to prevent lags
    if (Math.random() < 0.12) {
      checkScratchPercentage();
    }
  };

  const handleStart = (e) => {
    if (scratched) return;
    setIsDrawing(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    checkScratchPercentage();
  };

  return (
    <div className="scratch-card-container" ref={containerRef}>
      {showConfetti && (
        <div className="scratch-confetti">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="confetti-dot" style={{ left: `${Math.random() * 100}%` }}></div>
          ))}
        </div>
      )}

      {/* Revealed Ticket Content */}
      <div className={`coupon-ticket-revealed ${scratched ? "visible" : ""}`}>
        <div className="ticket-header">
          <span className="ticket-decor">✦</span>
          <h4>SECRET COUPON REVEALED</h4>
          <span className="ticket-decor">✦</span>
        </div>
        <div className="ticket-body">
          <div className="coupon-code-badge">{revealedCode}</div>
          <p className="coupon-desc">{discountInfo}</p>
        </div>
        <div className="ticket-footer">
          <span className="apply-auto-badge">Auto-applied to cart! 🎉</span>
        </div>
      </div>

      {/* Erasable Canvas */}
      {!scratched && (
        <canvas
          ref={canvasRef}
          className="scratch-canvas"
          onMouseDown={handleStart}
          onMouseMove={draw}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={draw}
          onTouchEnd={handleEnd}
        />
      )}
    </div>
  );
}
