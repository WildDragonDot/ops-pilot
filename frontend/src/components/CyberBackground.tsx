import React, { useEffect, useRef } from 'react';

export const CyberBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // 1. Cyber Matrix Digital Text Tokens
    const tokens = ['01', '10', '0xFA', 'SSH', 'GIT', 'AST', '200_OK', 'PATCH', 'DEV', 'IP:22', 'JWT', 'DB', 'SEC', 'AI'];
    const columnsCount = Math.floor(width / 32);
    
    const codeStreams: {
      x: number;
      y: number;
      speed: number;
      token: string;
      alpha: number;
      color: string;
    }[] = [];

    const streamColors = ['#60a5fa', '#818cf8', '#3b82f6', '#38bdf8', '#93c5fd'];

    for (let i = 0; i < columnsCount; i++) {
      codeStreams.push({
        x: i * 32 + 8,
        y: Math.random() * -height,
        speed: Math.random() * 0.7 + 0.35,
        token: tokens[Math.floor(Math.random() * tokens.length)],
        alpha: Math.random() * 0.3 + 0.15,
        color: streamColors[Math.floor(Math.random() * streamColors.length)]
      });
    }

    // 2. Floating Server Nodes & Optical Fiber Connections
    const nodesCount = Math.min(18, Math.floor(width / 80));
    const serverNodes: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      label: string;
    }[] = [];

    const nodeLabels = ['PGSQL:5432', 'REDIS:6379', 'API:5080', 'NGINX:80', 'ZERO-DB', 'GIT:SSH', 'AI-ENGINE'];
    for (let i = 0; i < nodesCount; i++) {
      serverNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        label: nodeLabels[i % nodeLabels.length]
      });
    }

    // Central Radar Energy Ripple Waves
    let rippleRadius = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw High-Tech Grid Overlay
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
      ctx.lineWidth = 1;
      const step = 44;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Render Falling Cyber Matrix Digital Text Stream
      ctx.font = '11px "JetBrains Mono", monospace';
      for (const s of codeStreams) {
        s.y += s.speed;
        if (s.y > height + 25) {
          s.y = -25;
          s.x = Math.floor(Math.random() * columnsCount) * 32 + 8;
          s.token = tokens[Math.floor(Math.random() * tokens.length)];
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fillText(s.token, s.x, s.y);
      }

      // 3. Render Center Radar Pulse Waves
      rippleRadius += 0.8;
      if (rippleRadius > Math.max(width, height) * 0.6) {
        rippleRadius = 0;
      }
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.globalAlpha = Math.max(0, (1 - rippleRadius / (Math.max(width, height) * 0.6)) * 0.15);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Render Server Nodes & Laser Connections to Cursor
      for (let i = 0; i < serverNodes.length; i++) {
        const n1 = serverNodes[i];
        n1.x += n1.vx;
        n1.y += n1.vy;

        if (n1.x < 10 || n1.x > width - 10) n1.vx *= -1;
        if (n1.y < 10 || n1.y > height - 10) n1.vy *= -1;

        // Laser Arc to Cursor when close
        const mdx = n1.x - mouseX;
        const mdy = n1.y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < 180) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = '#38bdf8';
          ctx.globalAlpha = (1 - mdist / 180) * 0.4;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw Fiber Line to Neighbor Nodes
        for (let j = i + 1; j < serverNodes.length; j++) {
          const n2 = serverNodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 190) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = '#6366f1';
            ctx.globalAlpha = (1 - dist / 190) * 0.2;
            ctx.stroke();
          }
        }

        // Draw Node Core
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = 0.8;
        ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.globalAlpha = 0.6;
        ctx.fillText(n1.label, n1.x + 8, n1.y + 3);
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
