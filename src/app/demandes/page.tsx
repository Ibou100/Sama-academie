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

  // === SHARING DOCUMENTS & HOMEWORK ===
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState("Fiche d'exercices");
  const [docTitle, setDocTitle] = useState("");
  const [docInstruction, setDocInstruction] = useState("");
  const [docResourceLink, setDocResourceLink] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  const handleShareDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!docTitle.trim() && !docFile) || !activeChat || !currentUser) return;
    setSendingMsg(true);

    let finalLink = docResourceLink.trim();
    let finalTitle = docTitle.trim();

    if (docFile) {
      try {
        const formData = new FormData();
        formData.append("file", docFile);
        const res = await fetch("/api/upload-document", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || "Erreur de téléversement.");
        finalLink = json.fileUrl;
        if (!finalTitle) finalTitle = json.fileName || docFile.name;
      } catch (err: any) {
        alert("Erreur lors de l'envoi du document : " + (err?.message || ""));
        setSendingMsg(false);
        return;
      }
    }

    if (!finalTitle) finalTitle = "Document partagé";

    const formattedContent = `[SAMA_DOC]:::${docType}:::${finalTitle}:::${docInstruction.trim() || (finalLink ? "Consultez le document joint." : "Aucune consigne spécifique")}:::${finalLink}`;

    const { error } = await supabase.from("tutoring_messages").insert([{
      request_id: activeChat.id,
      sender_id: currentUser.id,
      content: formattedContent,
    }]);

    if (!error) {
      setShowDocModal(false);
      setDocTitle("");
      setDocInstruction("");
      setDocResourceLink("");
      setDocFile(null);
    }
    setSendingMsg(false);
  };

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
        
        if (received) {
          const sanitizedReceived = received.map((r: any) => ({
            ...r,
            message: r.message ? r.message.replace(/\[SAMA_CONTRAT\][\s\S]*$/i, "").trim() : null,
          }));
          setReceivedRequests(sanitizedReceived);
        }

        // 2. Récupérer les demandes ENVOYÉES (l'utilisateur est l'élève ou le parent)
        const { data: sent } = await supabase
          .from("tutoring_requests")
          .select(`*, teacher:profiles!teacher_id(first_name, last_name, email, subject, region, avatar_url)`)
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });
        
        if (sent) {
          const sanitizedSent = sent.map((r: any) => ({
            ...r,
            message: r.message ? r.message.replace(/\[SAMA_CONTRAT\][\s\S]*$/i, "").trim() : null,
          }));
          setSentRequests(sanitizedSent);
        }
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
                    {(() => {
                      const clean = req.message ? req.message.replace(/\[SAMA_CONTRAT\][\s\S]*$/i, "").trim() : "";
                      return clean ? `"${clean}"` : "Aucun message particulier attaché à cette demande.";
                    })()}
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
                  const isDoc = msg.content?.startsWith("[SAMA_DOC]");

                  if (isDoc) {
                    let docT = "Support";
                    let title = "Document";
                    let instructions = "";
                    let link = "";

                    if (msg.content.includes(":::")) {
                      const parts = msg.content.split(":::");
                      docT = parts[1] || "Support";
                      title = parts[2] || "Document";
                      instructions = parts[3] || "";
                      link = parts[4] || "";
                    } else {
                      const raw = msg.content.replace("[SAMA_DOC]", "").trim();
                      const parts = raw.split("|");
                      const header = parts[0]?.trim() || "";
                      if (header.includes(":")) {
                        docT = header.split(":")[0]?.trim() || "Devoir";
                        title = header.split(":").slice(1).join(":").trim() || "Document";
                      } else {
                        title = header;
                      }
                      const instPart = parts.find((p: string) => p.trim().startsWith("Consignes:"));
                      if (instPart) instructions = instPart.replace("Consignes:", "").trim();
                      const filePart = parts.find((p: string) => p.trim().startsWith("Fichier:"));
                      if (filePart) link = filePart.replace("Fichier:", "").trim();
                      const namePart = parts.find((p: string) => p.trim().startsWith("Nom:"));
                      if (namePart && !title) title = namePart.replace("Nom:", "").trim();
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                        <div className={`p-4 rounded-2xl text-xs sm:text-sm shadow-sm border ${
                          isMe 
                            ? "bg-slate-900 text-white border-slate-800 rounded-tr-none" 
                            : "bg-white text-gray-900 border-blue-200 rounded-tl-none"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-8 rounded-xl bg-sama-orange text-sama-blue flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                              📚
                            </span>
                            <div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isMe ? "bg-white/20 text-white" : "bg-blue-50 text-sama-primary border border-blue-100"
                              }`}>
                                {docT}
                              </span>
                              <h5 className="font-extrabold text-sm leading-tight mt-0.5">{title}</h5>
                            </div>
                          </div>

                          {instructions && instructions !== "Aucune consigne spécifique" && instructions !== "Consultez les exercices ci-joints." && (
                            <p className={`text-xs p-2.5 rounded-xl mb-3 ${isMe ? "bg-white/10 text-blue-100" : "bg-gray-50 text-gray-700 border border-gray-100"}`}>
                              <strong>Consignes :</strong> {instructions}
                            </p>
                          )}

                          {link && link.trim() !== "" ? (
                            <a
                              href={link.startsWith("http") || link.startsWith("data:") ? link : `https://${link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={title}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                                isMe ? "bg-sama-orange text-sama-blue hover:bg-amber-400" : "bg-sama-primary text-white hover:bg-blue-800"
                              }`}
                            >
                              <i className="fas fa-file-download text-xs"></i> Consulter / Télécharger le document
                            </a>
                          ) : (
                            <span className={`text-[11px] italic ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                              Document à étudier ensemble en cours
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

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

            {/* Modal Partage de Support / Devoir */}
            {showDocModal && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                      <span className="text-sama-orange">📚</span> Partager un Support de Cours
                    </h4>
                    <button onClick={() => setShowDocModal(false)} className="text-gray-400 hover:text-gray-600">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <form onSubmit={handleShareDocument} className="space-y-3">
                    {/* ZONE UPLOAD DOCUMENT */}
                    <div className="bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-2xl p-3 text-center">
                      <input
                        type="file"
                        id="demandes-doc-file"
                        accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png,.webp,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDocFile(file);
                            if (!docTitle) {
                              setDocTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
                            }
                          }
                        }}
                        className="hidden"
                      />

                      {docFile ? (
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-blue-100 text-left">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <i className="fas fa-file-alt text-sama-orange text-lg flex-shrink-0"></i>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-gray-900 truncate max-w-[170px]">{docFile.name}</p>
                              <p className="text-[10px] text-gray-400">{(docFile.size / 1024 / 1024).toFixed(2)} Mo</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDocFile(null)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="demandes-doc-file" className="cursor-pointer block py-1.5 space-y-1">
                          <i className="fas fa-cloud-upload-alt text-sama-orange text-xl"></i>
                          <p className="text-xs font-bold text-gray-800">
                            Importer un document (PDF, Word, Photo)
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Cliquez ici pour choisir votre fichier sur votre appareil
                          </p>
                        </label>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Type de document</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-gray-50 outline-none focus:bg-white"
                      >
                        <option>Fiche d&apos;exercices</option>
                        <option>Devoir maison à rendre</option>
                        <option>Polycopié / Fiche de cours</option>
                        <option>Sujet d&apos;entraînement type examen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Titre de la fiche / Devoir</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Devoir N°2 - Géométrie dans l'espace"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-gray-50 outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Consignes pour l&apos;élève (Optionnel)</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Exercices 1 et 3 à rédiger pour la séance du samedi..."
                        value={docInstruction}
                        onChange={(e) => setDocInstruction(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-gray-50 outline-none focus:bg-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Lien externe (Optionnel si fichier importé)</label>
                      <input
                        type="text"
                        placeholder="https://drive.google.com/... ou lien vidéo"
                        value={docResourceLink}
                        onChange={(e) => setDocResourceLink(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-gray-50 outline-none focus:bg-white"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDocModal(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={(!docTitle.trim() && !docFile) || sendingMsg}
                        className="flex-1 bg-sama-primary hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                      >
                        {sendingMsg ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <i className="fas fa-spinner fa-spin"></i> Envoi...
                          </span>
                        ) : (
                          "Partager"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="w-11 h-11 flex-shrink-0 bg-blue-50 hover:bg-blue-100 text-sama-primary rounded-full flex items-center justify-center transition"
                title="Partager un support de cours ou un devoir"
              >
                <i className="fas fa-paperclip text-base"></i>
              </button>
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
                className="w-11 h-11 flex-shrink-0 bg-sama-primary hover:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {sendingMsg ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane text-sm"></i>}
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
