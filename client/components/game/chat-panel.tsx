"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Smile, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { socket } from "@/services/socket"

interface ChatMessage {
    id: string
    senderId: string
    senderName: string
    content: string
    type: "text" | "emoji" | "system"
    createdAt: string
}

interface ChatPanelProps {
    roomId: string
    playerName: string
    isOpen: boolean
    onClose: () => void
}

const QUICK_EMOJIS = ["👍", "👎", "😂", "😮", "😢", "🔥", "🎉", "💪", "🤔", "😎", "🙄", "❤️"]

export function ChatPanel({ roomId, playerName, isOpen, onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout>(null)

    useEffect(() => {
        if (!roomId) return

        // Get chat history
        socket.emit("get_chat_history", { roomId })

        socket.on("chat_history", (history: ChatMessage[]) => {
            setMessages(history)
        })

        socket.on("chat_message", (message: ChatMessage) => {
            setMessages((prev) => [...prev, message])
        })

        socket.on("typing_update", (data: { userId: string; isTyping: boolean; typingUsers: string[] }) => {
            setTypingUsers(data.typingUsers.filter((u) => u !== socket.id))
        })

        return () => {
            socket.off("chat_history")
            socket.off("chat_message")
            socket.off("typing_update")
        }
    }, [roomId])

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = () => {
        if (!inputValue.trim()) return

        socket.emit("chat_message", {
            roomId,
            content: inputValue,
            senderName: playerName,
        })

        setInputValue("")
        handleTypingStop()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleTypingStart = () => {
        if (!isTyping) {
            setIsTyping(true)
            socket.emit("typing_indicator", { roomId, isTyping: true })
        }

        // Reset timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(handleTypingStop, 2000)
    }

    const handleTypingStop = () => {
        if (isTyping) {
            setIsTyping(false)
            socket.emit("typing_indicator", { roomId, isTyping: false })
        }
    }

    const sendEmoji = (emoji: string) => {
        socket.emit("chat_emoji_reaction", {
            roomId,
            emoji,
            senderName: playerName,
        })
    }

    if (!isOpen) return null

    return (
        <div className="bg-background border-border fixed right-4 bottom-4 z-50 flex h-96 w-80 flex-col rounded-lg border shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-3">
                <h3 className="font-semibold">Chat</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.type === "system" ? "justify-center" : msg.senderId === socket.id ? "flex-row-reverse" : ""}`}
                        >
                            {msg.type === "system" ? (
                                <p className="text-muted-foreground text-xs italic">{msg.content}</p>
                            ) : (
                                <>
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback className="text-xs">
                                            {msg.senderName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`max-w-[70%] ${msg.senderId === socket.id ? "text-right" : ""}`}>
                                        <p className="text-muted-foreground mb-0.5 text-xs">{msg.senderName}</p>
                                        <div
                                            className={`rounded-lg px-3 py-2 text-sm ${
                                                msg.senderId === socket.id ? "bg-cyan-500/20 text-cyan-400" : "bg-muted"
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <span className="flex gap-1">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce delay-100">.</span>
                                <span className="animate-bounce delay-200">.</span>
                            </span>
                            {typingUsers.length === 1 ? "écrit" : "écrivent"}...
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Quick Emojis */}
            <div className="flex gap-1 overflow-x-auto border-t px-3 py-2">
                {QUICK_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => sendEmoji(emoji)}
                        className="text-lg transition-transform hover:scale-125"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 border-t p-3">
                <Input
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        handleTypingStart()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
