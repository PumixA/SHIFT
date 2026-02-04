"use client"

import { useState, useEffect } from "react"
import { socket } from "@/services/socket"

interface EmojiReaction {
  emoji: string
  senderId: string
  senderName: string
  timestamp: string
}

interface FloatingEmoji {
  id: string
  emoji: string
  x: number
  y: number
  senderName: string
}

interface EmojiReactionsProps {
  roomId: string
}

export function EmojiReactions({ roomId }: EmojiReactionsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])

  useEffect(() => {
    if (!roomId) return

    socket.on("emoji_reaction", (reaction: EmojiReaction) => {
      const id = `${Date.now()}-${Math.random()}`
      const x = 20 + Math.random() * 60 // Random position between 20% and 80%
      const y = 60 + Math.random() * 20 // Random position between 60% and 80%

      const newEmoji: FloatingEmoji = {
        id,
        emoji: reaction.emoji,
        x,
        y,
        senderName: reaction.senderName
      }

      setFloatingEmojis(prev => [...prev, newEmoji])

      // Remove after animation
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== id))
      }, 3000)
    })

    return () => {
      socket.off("emoji_reaction")
    }
  }, [roomId])

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {floatingEmojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-float-up"
          style={{
            left: `${emoji.x}%`,
            bottom: `${emoji.y}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-5xl drop-shadow-lg">{emoji.emoji}</span>
            <span className="text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-full mt-1">
              {emoji.senderName}
            </span>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-100px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(0.8);
          }
        }

        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Quick emoji bar for sending reactions
interface QuickEmojiBarProps {
  roomId: string
  playerName: string
}

const QUICK_EMOJIS = ["👍", "👎", "😂", "😮", "🔥", "🎉", "💪", "😎"]

export function QuickEmojiBar({ roomId, playerName }: QuickEmojiBarProps) {
  const [lastSent, setLastSent] = useState<number>(0)
  const COOLDOWN = 1000 // 1 second cooldown

  const sendEmoji = (emoji: string) => {
    const now = Date.now()
    if (now - lastSent < COOLDOWN) return

    socket.emit("chat_emoji_reaction", {
      roomId,
      emoji,
      senderName: playerName
    })

    setLastSent(now)
  }

  return (
    <div className="flex gap-1 p-2 bg-background/80 backdrop-blur-sm rounded-full border border-border/50">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendEmoji(emoji)}
          className="text-2xl hover:scale-125 transition-transform p-1"
          title={`Envoyer ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
