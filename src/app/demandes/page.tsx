"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getAvatarBg(firstName: string) {
  const colors = ["bg-pink-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-teal-400"];
  const index = (firstName?.charCodeAt(0) ?? 0) % colors.length;
  return colors[index];
}

export default function DemandesCours() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // === CHAT STATES ===
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/demandes");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setCurrentUser(profile);

      if (profile) {
        // 1. Récupérer les demandes REÇUES (l'utilisateur est le professeur)
        // STRICT SAMA ACADÉMIE : Le professeur ne voit que les missions officiellement assignées/validées par l'administration
        const { data: received } = await supabase
          .from("tutoring_requests")
          .select(`*, student:profiles!student_id(first_name, last_name, email, region, level, avatar_url)`)
          .eq("teacher_id", user.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });
        
        if (received) setReceivedRequests(received);

        // 2. Récupérer les demandes ENVOYÉES (l'utilisateur est l'élève ou le parent)
        const { data: sent } = await supabase
          .from("tutoring_requests")
          .select(`*, teacher:profiles!teacher_id(first_name, last_name, email, subject, region, avatar_url)`)
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });
        
        if (sent) setSentRequests(sent);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [router]);

  // === CHAT LOGIC ===
  useEffect(() => {
    let channel: any = null;

    const loadChat = async () => {
      if (!activeChat) return;

      // 1. Fetch l'historique
      const { data: history } = await supabase
        .from("tutoring_messages")
        .select("*")
        .eq("request_id", activeChat.id)
        .order("created_at", { ascending: true });
      
      if (history) setMessages(history);

      // 2. Abonnement Temps Réel
      channel = supabase
        .channel(`chat_${activeChat.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "tutoring_messages", filter: `request_id=eq.${activeChat.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
    };

    loadChat();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeChat]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;
    
    setSendingMsg(true);
    const { error } = await supabase.from("tutoring_messages").insert([{
      request_id: activeChat.id,
      sender_id: currentUser.id,
      content: newMessage.trim()
    }]);

    if (!error) {
      // Notification Email
      const isTeacher = activeChat.teacher_id === currentUser.id;
      const partner = isTeacher ? activeChat.student : activeChat.teacher;
      
      if (partner?.email) {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'new_message',
              toEmail: partner.email,
              recipientName: partner.first_name,
              senderName: currentUser.first_name,
              messagePreview: newMessage.trim()
            })
          });
        } catch (e) {
          console.error("Erreur d'envoi d'email", e);
        }
      }

      setNewMessage("");
    }
    setSendingMsg(false);
  };

  const openChat = (req: any) => {
    setActiveChat(req);
  };

  // === STATUS LOGIC ===
  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("tutoring_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    
    if (!error) {
      setReceivedRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)));
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-[50vh]">
        <i className="fas fa-spinner fa-spin text-sama-primary text-4xl"></i>
      </main>
    );
  }

  // Composant pour afficher une liste de demandes (Reçues ou Envoyées)
  const RequestList = ({ requests, type }: { requests: any[], type: "received" | "sent" }) => {
    if (requests.length === 0) return null;

    return (
      <div className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
          {type === "received" ? "Demandes reçues (Élèves qui vous contactent)" : "Demandes envoyées (Professeurs que vous avez contactés)"}
        </h2>
        {requests.map((req) => {
          const isIncoming = type === "received";
          const partner = isIncoming ? req.student : req.teacher;
          if (!partner) return null;

          const isPending = req.status === "pending";
          const isAccepted = req.status === "accepted";
          const isDeclined = req.status === "declined";

          return (
            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition hover:shadow-md flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              <div className="flex items-start gap-4">
                {partner.avatar_url ? (
                  <img src={partner.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className={`w-14 h-14 rounded-full ${getAvatarBg(partner.first_name)} text-white flex items-center justify-center font-bold text-xl shadow-sm`}>
                    {getInitials(partner.first_name, partner.last_name)}
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {partner.first_name} {partner.last_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {isIncoming 
                      ? `Niveau : ${partner.level || "Non précisé"}`
                      : `Matière : ${partner.subject || "Non précisée"}`}
                    {" • "} 📍 {partner.region || "Région inconnue"}
                  </p>
                  
                  <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-700 italic">
                    {req.message ? `"${req.message}"` : "Aucun message attaché à cette demande."}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Demande envoyée le {new Date(req.created_at).toLocaleDateString("fr-FR")} à {new Date(req.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 min-w-[220px]">
                {isPending && (
                  <div className="text-right">
                    <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">
                      <i className="fas fa-clock text-amber-600"></i> Traitement Direction SAMA
                    </span>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Validation pédagogique en cours
                    </p>
                  </div>
                )}
                {isAccepted && (
                  <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1">
                    <i className="fas fa-check-circle text-green-600"></i> Encadrement Actif
                  </span>
                )}
                {isDeclined && <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">❌ Non retenue</span>}

                {/* Bouton Discuter Interne — Uniquement lorsque la demande a été validée par la direction */}
                {isAccepted && (
                  <div className="mt-2 w-full space-y-2 text-right">
                    <button 
                      onClick={() => openChat(req)}
                      className="w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-comments text-sm"></i> Ouvrir la messagerie interne
                    </button>
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                      <i className="fas fa-shield-alt text-sama-primary"></i> Espace d&apos;échange sécurisé SAMA
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
      
      {/* === MODAL DE CHAT === */}
      {activeChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full md:w-[450px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarBg(activeChat.teacher_id === currentUser.id ? activeChat.student?.first_name : activeChat.teacher?.first_name)}`}>
                  {getInitials(
                    activeChat.teacher_id === currentUser.id ? activeChat.student?.first_name : activeChat.teacher?.first_name, 
                    activeChat.teacher_id === currentUser.id ? activeChat.student?.last_name : activeChat.teacher?.last_name
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">
                    {activeChat.teacher_id === currentUser.id 
                      ? `${activeChat.student?.first_name} ${activeChat.student?.last_name}` 
                      : `${activeChat.teacher?.first_name} ${activeChat.teacher?.last_name}`}
                  </h3>
                  <p className="text-xs text-sama-primary font-semibold">Discussion en direct</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">
                  <i className="fas fa-comments text-3xl mb-2 opacity-50 block"></i>
                  Aucun message. Commencez la discussion !
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "bg-sama-primary text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2 items-center">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez un message..."
                className="flex-grow bg-gray-100 border-none rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-sama-primary/50"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || sendingMsg}
                className="w-12 h-12 flex-shrink-0 bg-sama-primary hover:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {sendingMsg ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === PAGE PRINCIPALE === */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sama-primary/10 text-sama-primary text-xs font-bold mb-2">
            <i className="fas fa-shield-alt"></i> Espace Sécurisé & Encadré
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <i className="fas fa-comments text-sama-primary"></i>
            Messagerie & Suivi Pédagogique
          </h1>
          <p className="text-gray-600 mt-2 text-sm max-w-2xl">
            Échangez en direct avec vos enseignants ou élèves en toute sécurité au sein de la plateforme. Toutes les séances et messages sont encadrés par l&apos;équipe pédagogique de SAMA ACADÉMIE.
          </p>
        </div>
      </div>

      {sentRequests.length === 0 && receivedRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <i className="fas fa-inbox text-5xl text-gray-300 mb-4 block"></i>
          <h3 className="font-bold text-gray-700 text-xl">Aucune demande pour le moment</h3>
          <p className="text-gray-500 mt-2">
            Vos demandes envoyées ou reçues apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <RequestList requests={receivedRequests} type="received" />
          <RequestList requests={sentRequests} type="sent" />
        </>
      )}
    </main>
  );
}
