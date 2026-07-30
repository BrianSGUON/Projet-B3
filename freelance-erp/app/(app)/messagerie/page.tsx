'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Paperclip, MessageSquareText, Search, Upload, FileText, Download, Bell } from 'lucide-react'

type UserSummary = {
  id: string
  name: string
  email: string
  company?: string | null
}

type MessageAttachment = {
  id: string
  fileName: string
  mimeType: string
  size: number
}

type Message = {
  id: string
  content?: string | null
  createdAt: string
  senderId: string
  sender: { id: string; name: string }
  isRead: boolean
  attachments: MessageAttachment[]
}

type Conversation = {
  id: string
  userAId: string
  userBId: string
  messages: Message[]
  otherUser: UserSummary
}

function mergeMessages(existing: Message[], incoming: Message[]) {
  const merged = new Map(existing.map((message) => [message.id, message]))
  incoming.forEach((message) => merged.set(message.id, message))
  return Array.from(merged.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export default function MessageriePage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [contacts, setContacts] = useState<UserSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [messagePage, setMessagePage] = useState(1)
  const [messageHasMore, setMessageHasMore] = useState(false)
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentUserId = session?.user?.id

  const filteredConversations = useMemo(() => {
    const q = search.toLowerCase()
    return conversations.filter((conversation) => {
      const target = `${conversation.otherUser.name} ${conversation.otherUser.email} ${conversation.otherUser.company ?? ''}`.toLowerCase()
      return target.includes(q)
    })
  }, [conversations, search])

  const unreadCount = useMemo(() => conversations.reduce((total, conversation) => {
    const incoming = conversation.messages.filter((message) => message.senderId !== currentUserId && !message.isRead)
    return total + incoming.length
  }, 0), [conversations, currentUserId])

  const selectedConversation = useMemo(
    () => filteredConversations.find((conv) => conv.id === selectedConversationId) ?? filteredConversations[0] ?? null,
    [filteredConversations, selectedConversationId],
  )

  useEffect(() => {
    if (!currentUserId) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/messaging')
        const data = await res.json()
        if (data?.conversations) {
          setConversations(data.conversations)
          setMessagePage(data.page ?? 1)
          setMessageHasMore(Boolean(data.hasMore))
          if (data.conversations.length > 0 && !selectedConversationId) {
            setSelectedConversationId(data.conversations[0].id)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    const loadContacts = async () => {
      setLoadingContacts(true)
      try {
        const res = await fetch('/api/messaging?type=contacts')
        const data = await res.json()
        if (Array.isArray(data)) {
          setContacts(data)
        }
      } finally {
        setLoadingContacts(false)
      }
    }
    load()
    loadContacts()
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId || !selectedConversationId) return
    const loadHistory = async () => {
      setHistoryLoading(true)
      const res = await fetch(`/api/messaging?conversationId=${selectedConversationId}&page=1&pageSize=25`)
      const data = await res.json()
      if (data?.messages) {
        setConversations((prev) => prev.map((conversation) => conversation.id === selectedConversationId
          ? { ...conversation, messages: mergeMessages(conversation.messages, data.messages) }
          : conversation))
        setMessagePage(data.page ?? 1)
        setMessageHasMore(Boolean(data.hasMore))
      }
      setHistoryLoading(false)
    }
    loadHistory()
  }, [currentUserId, selectedConversationId])

  useEffect(() => {
    if (!currentUserId || !selectedConversation) return
    const interval = window.setInterval(async () => {
      const res = await fetch('/api/messaging')
      const data = await res.json()
      if (data?.conversations) {
        const next = data.conversations.find((item: Conversation) => item.id === selectedConversation.id)
        if (next) {
          setConversations((prev) => prev.map((conversation) => conversation.id === selectedConversation.id
            ? { ...conversation, messages: mergeMessages(conversation.messages, next.messages) }
            : conversation))
          if (!selectedConversationId) setSelectedConversationId(next.id)
        }
      }
    }, 5000)
    return () => window.clearInterval(interval)
  }, [currentUserId, selectedConversation, selectedConversationId])

  const loadOlderMessages = async () => {
    if (!selectedConversation || historyLoading) return
    const nextPage = messagePage + 1
    setHistoryLoading(true)
    const res = await fetch(`/api/messaging?conversationId=${selectedConversation.id}&page=${nextPage}&pageSize=25`)
    const data = await res.json()
    if (data?.messages) {
      setConversations((prev) => prev.map((conversation) => conversation.id === selectedConversation.id
        ? { ...conversation, messages: mergeMessages(conversation.messages, data.messages) }
        : conversation))
      setMessagePage(nextPage)
      setMessageHasMore(Boolean(data.hasMore))
    }
    setHistoryLoading(false)
  }

  const startConversation = async (recipientId: string) => {
    const formData = new FormData()
    formData.append('recipientId', recipientId)
    const res = await fetch('/api/messaging', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.conversation) {
        setConversations((prev) => {
          const existing = prev.find((conversation) => conversation.id === data.conversation.id)
          return existing ? prev : [data.conversation, ...prev]
        })
        setSelectedConversationId(data.conversation.id)
      }
    }
  }

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedConversation || (!messageContent.trim() && !fileInputRef.current?.files?.length)) return

    const formData = new FormData()
    formData.append('conversationId', selectedConversation.id)
    formData.append('content', messageContent)
    if (fileInputRef.current?.files?.length) {
      Array.from(fileInputRef.current.files).forEach((file) => formData.append('files', file))
    }

    const res = await fetch('/api/messaging', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const nextMessage = await res.json()
      setConversations((prev) => prev.map((conversation) => conversation.id === selectedConversation.id
        ? { ...conversation, messages: [...conversation.messages, nextMessage] }
        : conversation))
      setMessageContent('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = async () => {
    const files = fileInputRef.current?.files
    if (!selectedConversation || !files?.length) return

    setUploading(true)
    const formData = new FormData()
    formData.append('conversationId', selectedConversation.id)
    formData.append('content', '')
    Array.from(files).forEach((file) => formData.append('files', file))

    const res = await fetch('/api/messaging', { method: 'POST', body: formData })
    if (res.ok) {
      const nextMessage = await res.json()
      setConversations((prev) => prev.map((conversation) => conversation.id === selectedConversation.id
        ? { ...conversation, messages: [...conversation.messages, nextMessage] }
        : conversation))
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen flex-col bg-[#f8f9fc] p-4 lg:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messagerie</h1>
          <p className="text-sm text-slate-500">Discutez avec vos contacts et partagez des fichiers.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">
          <Bell size={15} />
          <span>{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-full flex-col lg:flex-row">
          <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-3 flex flex-col">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm"
                placeholder="Rechercher un contact"
              />
            </div>
            <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-2">
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Nouveau contact</div>
              {loadingContacts ? <p className="px-2 py-2 text-sm text-slate-400">Chargement…</p> : contacts.length === 0 ? <p className="px-2 py-2 text-sm text-slate-400">Aucun autre utilisateur</p> : (
                <div className="max-h-40 overflow-auto space-y-1">
                  {contacts.map((contact) => (
                    <button key={contact.id} onClick={() => startConversation(contact.id)} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-slate-50">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">{contact.name}</div>
                        <div className="truncate text-xs text-slate-500">{contact.company || contact.email}</div>
                      </div>
                      <span className="text-xs text-violet-600">Démarrer</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {loading && <p className="text-sm text-slate-400">Chargement…</p>}
              {!loading && filteredConversations.length === 0 && <p className="text-sm text-slate-400">Aucune conversation</p>}
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${selectedConversation?.id === conversation.id ? 'border-violet-500 bg-violet-50' : 'border-transparent bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{conversation.otherUser.name}</div>
                      <div className="text-xs text-slate-500">{conversation.otherUser.company || conversation.otherUser.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conversation.messages.some((message) => message.senderId !== currentUserId && !message.isRead) && (
                        <span className="rounded-full bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Nouveau</span>
                      )}
                      <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{conversation.messages.length}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="border-b border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">{selectedConversation.otherUser.name}</div>
                  <div className="text-sm text-slate-500">{selectedConversation.otherUser.email}</div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50/70 p-4 space-y-3">
                  {historyLoading && <div className="text-center text-sm text-slate-400">Chargement de l’historique…</div>}
                  {selectedConversation.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.senderId === currentUserId ? 'bg-violet-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                        {message.content ? <div className="text-sm whitespace-pre-wrap">{message.content}</div> : null}
                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className={`rounded-xl border px-3 py-2 text-sm ${message.senderId === currentUserId ? 'border-violet-400/40 bg-violet-500/20' : 'border-slate-200 bg-slate-50'}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={14} className="shrink-0" />
                                    <span className="truncate">{attachment.fileName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setShowPreview(attachment.id)} className="text-xs font-medium underline">Aperçu</button>
                                    <a href={`/api/messaging/file/${attachment.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium underline">
                                      <Download size={12} />
                                      Télécharger
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`mt-2 text-[11px] ${message.senderId === currentUserId ? 'text-violet-100' : 'text-slate-400'}`}>
                          {new Date(message.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {messageHasMore && (
                    <div className="flex justify-center">
                      <button type="button" onClick={loadOlderMessages} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        {historyLoading ? 'Chargement…' : 'Charger plus'}
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-100">
                      <Paperclip size={18} />
                    </button>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={2}
                      className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Écrivez votre message…"
                    />
                    <button type="submit" className="rounded-2xl bg-violet-600 p-3 text-white hover:bg-violet-700">
                      <Send size={18} />
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Upload size={14} />
                    <span>{uploading ? 'Envoi en cours…' : 'Ajoutez des fichiers et envoyez-les dans la conversation.'}</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageSquareText size={36} className="mx-auto mb-3 text-slate-300" />
                  <p>Aucune conversation sélectionnée</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowPreview(null)}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Aperçu du fichier</div>
              <button type="button" onClick={() => setShowPreview(null)} className="text-sm text-slate-500">Fermer</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Les fichiers joints peuvent maintenant être ouverts ou téléchargés directement depuis cette conversation.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
