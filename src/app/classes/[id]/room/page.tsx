"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ParticipantPresence = {
  id: string;
  name: string;
  role: "teacher" | "student";
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isHost: boolean;
};

/* ------------------------------------------------------------------ */
/*  ICE (STUN) Config                                                  */
/* ------------------------------------------------------------------ */
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Remote Video Tile                                                  */
/* ------------------------------------------------------------------ */
function RemoteVideoTile({
  participant,
  stream,
  isCurrentUserTeacher,
  onMute,
  onKick,
}: {
  participant: ParticipantPresence;
  stream: MediaStream | null;
  isCurrentUserTeacher: boolean;
  onMute: (id: string, name: string) => void;
  onKick: (id: string, name: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (stream) {
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (audioRef.current) audioRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = participant.name
    .split(" ")
    .map((n) => n?.[0] || "")
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
      {participant.isHandRaised && (
        <div className="absolute top-3 right-3 bg-yellow-500 text-gray-950 font-bold px-2.5 py-1 rounded-full text-xs shadow-lg flex items-center gap-1 z-10 animate-bounce">
          ✋ Main levée
        </div>
      )}

      {/* Audio caché — TOUJOURS rendu pour que le son passe même si caméra off */}
      {stream && <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />}

      {stream && !participant.isCameraOff ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="text-center p-6">
          <div className={`w-20 h-20 rounded-full ${participant.isHost ? "bg-yellow-500 text-gray-900 border-yellow-300" : "bg-sama-primary text-white border-blue-400"} font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2`}>
            {initials}
          </div>
          <h4 className="font-bold text-sm text-white">{participant.name}</h4>
          <p className="text-[11px] text-gray-400">{participant.isHost ? "👨‍🏫 Professeur (Hôte)" : "👨‍🎓 Élève"}</p>
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5 z-10">
        <i className={`fas ${participant.isMuted ? "fa-microphone-slash text-red-400" : "fa-microphone text-green-400"}`} />
        <span>{participant.name}</span>
      </div>

      {isCurrentUserTeacher && !participant.isHost && (
        <div className="absolute top-3 left-3 flex gap-1 z-10 opacity-80 hover:opacity-100 transition">
          <button onClick={() => onMute(participant.id, participant.name)} title="Couper le micro" className="bg-black/60 hover:bg-yellow-600 text-yellow-400 hover:text-white p-1.5 rounded-lg text-xs backdrop-blur-sm">
            <i className="fas fa-microphone-slash" />
          </button>
          <button onClick={() => onKick(participant.id, participant.name)} title="Exclure" className="bg-black/60 hover:bg-red-600 text-red-400 hover:text-white p-1.5 rounded-lg text-xs backdrop-blur-sm">
            <i className="fas fa-user-minus" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  COMPOSANT PRINCIPAL                                                */
/* ================================================================== */
export default function VirtualClassroomRoom() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  /* ---- State ---- */
  const [virtualClass, setVirtualClass] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [allowStudentScreenShare, setAllowStudentScreenShare] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const iceQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const myUserIdRef = useRef("");
  const channelRef = useRef<any>(null);
  const presenceRef = useRef<ParticipantPresence | null>(null);
  const [participants, setParticipants] = useState<ParticipantPresence[]>([]);
  const connectedPeersRef = useRef<Set<string>>(new Set());

  const [activeSidePanel, setActiveSidePanel] = useState<"chat" | "participants" | null>("chat");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [meetingEndedAlert, setMeetingEndedAlert] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ref pour stocker les fonctions WebRTC (évite les dépendances circulaires useCallback)
  const rtcFns = useRef<any>({});

  /* ================================================================ */
  /*  WebRTC helper functions (via ref, pas de useCallback)             */
  /* ================================================================ */
  const addSysMsg = (text: string) => {
    setMessages((prev) => [...prev, { isSystem: true, text, created_at: new Date().toISOString() }]);
  };

  const closePeer = (remoteId: string) => {
    connectedPeersRef.current.delete(remoteId);
    if (peersRef.current[remoteId]) {
      try { peersRef.current[remoteId].close(); } catch {}
      delete peersRef.current[remoteId];
    }
    delete iceQueueRef.current[remoteId];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteId];
      return next;
    });
  };

  const createPeer = (remoteId: string): RTCPeerConnection => {
    if (peersRef.current[remoteId]) {
      try { peersRef.current[remoteId].close(); } catch {}
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peersRef.current[remoteId] = pc;

    // Ajouter les pistes locales
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // ICE candidate → envoyer au pair
    pc.onicecandidate = (ev) => {
      if (ev.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice_candidate",
          payload: {
            targetUserId: remoteId,
            senderUserId: myUserIdRef.current,
            candidate: ev.candidate.toJSON(),
          },
        });
      }
    };

    // Piste distante reçue
    pc.ontrack = (ev) => {
      const [remoteStream] = ev.streams;
      if (remoteStream) {
        setRemoteStreams((prev) => ({ ...prev, [remoteId]: remoteStream }));
      } else {
        setRemoteStreams((prev) => {
          const existing = prev[remoteId] || new MediaStream();
          existing.addTrack(ev.track);
          return { ...prev, [remoteId]: existing };
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "failed" || s === "closed") closePeer(remoteId);
    };

    return pc;
  };

  const drainIceQueue = async (remoteId: string, pc: RTCPeerConnection) => {
    const queue = iceQueueRef.current[remoteId] || [];
    while (queue.length > 0) {
      const c = queue.shift()!;
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
  };

  const sendOffer = async (remoteId: string) => {
    if (connectedPeersRef.current.has(remoteId)) return;
    connectedPeersRef.current.add(remoteId);
    try {
      const pc = createPeer(remoteId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({
        type: "broadcast",
        event: "sdp_offer",
        payload: {
          targetUserId: remoteId,
          senderUserId: myUserIdRef.current,
          sdp: pc.localDescription?.toJSON(),
        },
      });
    } catch (err) {
      console.error("[WebRTC] sendOffer error:", err);
      connectedPeersRef.current.delete(remoteId);
    }
  };

  const onOffer = async (payload: any) => {
    const { senderUserId, sdp } = payload;
    connectedPeersRef.current.add(senderUserId);
    try {
      const pc = createPeer(senderUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await drainIceQueue(senderUserId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: "broadcast",
        event: "sdp_answer",
        payload: {
          targetUserId: senderUserId,
          senderUserId: myUserIdRef.current,
          sdp: pc.localDescription?.toJSON(),
        },
      });
    } catch (err) {
      console.error("[WebRTC] onOffer error:", err);
    }
  };

  const onAnswer = async (payload: any) => {
    const { senderUserId, sdp } = payload;
    const pc = peersRef.current[senderUserId];
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await drainIceQueue(senderUserId, pc);
    } catch (err) {
      console.error("[WebRTC] onAnswer error:", err);
    }
  };

  const onIce = async (payload: any) => {
    const { senderUserId, candidate } = payload;
    const pc = peersRef.current[senderUserId];
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    } else {
      if (!iceQueueRef.current[senderUserId]) iceQueueRef.current[senderUserId] = [];
      iceQueueRef.current[senderUserId].push(candidate);
    }
  };

  // Stocker dans ref pour accès stable dans les closures du canal
  rtcFns.current = { sendOffer, onOffer, onAnswer, onIce, closePeer, addSysMsg };

  /* ================================================================ */
  /*  Presence update                                                  */
  /* ================================================================ */
  const updatePresence = async (overrides: Partial<ParticipantPresence>) => {
    if (!channelRef.current || !presenceRef.current) return;
    const updated = { ...presenceRef.current, ...overrides };
    presenceRef.current = updated;
    try { await channelRef.current.track(updated); } catch {}
  };

  /* ================================================================ */
  /*  MAIN SETUP EFFECT                                                */
  /* ================================================================ */
  useEffect(() => {
    let channel: any = null;
    let mounted = true;

    const run = async () => {
      /* Auth */
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push(`/login?redirect=/classes/${classId}/preview`); return; }
      myUserIdRef.current = user.id;

      /* Profil */
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!mounted) return;
      if (profile) setCurrentUser(profile);

      /* Classe */
      const { data: vClass } = await supabase
        .from("virtual_classes")
        .select("*, teacher:profiles(first_name, last_name)")
        .eq("id", classId).single();
      if (!mounted) return;
      if (!vClass) { setErrorAlert("Classe introuvable."); setLoading(false); return; }
      if (vClass.status === "ended") { setMeetingEndedAlert(true); setLoading(false); return; }

      setVirtualClass(vClass);
      const tCheck = vClass.teacher_id === user.id || profile?.role === "admin";
      setIsTeacher(tCheck);
      setAllowStudentScreenShare(vClass.allow_student_screen_share);

      const micPref = sessionStorage.getItem("user_mic_pref") !== "off";
      const camPref = sessionStorage.getItem("user_cam_pref") !== "off";
      setIsMicOn(micPref);
      setIsCamOn(camPref);

      /* Messages existants */
      const { data: dbMsgs } = await supabase
        .from("meeting_messages").select("*")
        .eq("virtual_class_id", classId)
        .order("created_at", { ascending: true });
      if (dbMsgs && mounted) setMessages(dbMsgs);

      /* ──── Média local (AVANT d'ouvrir le canal) ──── */
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        stream.getAudioTracks().forEach((t) => (t.enabled = micPref));
        stream.getVideoTracks().forEach((t) => (t.enabled = camPref));
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          stream.getAudioTracks().forEach((t) => (t.enabled = micPref));
          localStreamRef.current = stream;
          if (mounted) setIsCamOn(false);
        } catch {
          if (mounted) setErrorAlert("Impossible d'accéder au microphone. Autorisez l'accès dans votre navigateur.");
        }
      }

      /* ──── Présence locale ──── */
      const myName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Utilisateur";
      const myPresence: ParticipantPresence = {
        id: user.id, name: myName,
        role: tCheck ? "teacher" : "student",
        isMuted: !micPref, isCameraOff: !camPref,
        isScreenSharing: false, isHandRaised: false, isHost: tCheck,
      };
      presenceRef.current = myPresence;

      /* ──── Créer le canal Supabase ET tous les handlers AVANT subscribe ──── */
      channel = supabase.channel(`room:${classId}`, {
        config: { presence: { key: user.id } },
      });
      channelRef.current = channel;

      // PRESENCE: sync
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const active: ParticipantPresence[] = [];
        Object.keys(state).forEach((key) => {
          const arr = state[key] as any[];
          if (arr?.length) active.push(arr[arr.length - 1]);
        });
        setParticipants(active);

        // Initier les connexions P2P manquantes
        active.forEach((p) => {
          if (p.id !== user.id && !connectedPeersRef.current.has(p.id)) {
            // Celui dont l'ID est le plus petit envoie l'offre
            if (user.id < p.id) {
              rtcFns.current.sendOffer(p.id);
            }
          }
        });
      });

      // PRESENCE: leave
      channel.on("presence", { event: "leave" }, ({ leftPresences }: any) => {
        leftPresences?.forEach((p: any) => rtcFns.current.closePeer(p.id));
      });

      // SIGNALING: SDP offer
      channel.on("broadcast", { event: "sdp_offer" }, async ({ payload }: any) => {
        if (payload.targetUserId === user.id) await rtcFns.current.onOffer(payload);
      });

      // SIGNALING: SDP answer
      channel.on("broadcast", { event: "sdp_answer" }, async ({ payload }: any) => {
        if (payload.targetUserId === user.id) await rtcFns.current.onAnswer(payload);
      });

      // SIGNALING: ICE candidate
      channel.on("broadcast", { event: "ice_candidate" }, async ({ payload }: any) => {
        if (payload.targetUserId === user.id) await rtcFns.current.onIce(payload);
      });

      // CHAT
      channel.on("broadcast", { event: "chat_message" }, ({ payload }: any) => {
        setMessages((prev) => [...prev, payload]);
      });

      // MODERATION
      channel.on("broadcast", { event: "mute_user" }, ({ payload }: any) => {
        if (payload.userId === user.id) {
          setIsMicOn(false);
          localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
          updatePresence({ isMuted: true });
          rtcFns.current.addSysMsg("Le professeur a désactivé votre microphone.");
        }
      });
      channel.on("broadcast", { event: "kick_user" }, ({ payload }: any) => {
        if (payload.userId === user.id) {
          alert("Le professeur vous a retiré de la réunion.");
          router.push("/classes");
        }
      });
      channel.on("broadcast", { event: "end_meeting" }, () => {
        setMeetingEndedAlert(true);
      });

      /* ──── SUBSCRIBE (après TOUS les handlers) ──── */
      channel.subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track(myPresence);
          rtcFns.current.addSysMsg(`${myName} a rejoint la réunion.`);
        }
      });

      if (mounted) setLoading(false);
    };

    run();

    return () => {
      mounted = false;
      if (channel) { try { supabase.removeChannel(channel); } catch {} }
      Object.keys(peersRef.current).forEach((id) => { try { peersRef.current[id].close(); } catch {} });
      peersRef.current = {};
      connectedPeersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  /* Auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Attacher la vidéo locale quand la ref est prête */
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  });

  /* ================================================================ */
  /*  Actions utilisateur                                              */
  /* ================================================================ */
  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    updatePresence({ isMuted: !next });
  };

  const toggleCam = () => {
    const next = !isCamOn;
    setIsCamOn(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    updatePresence({ isCameraOff: !next });
  };

  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    updatePresence({ isHandRaised: next });
    if (next) addSysMsg(`${currentUser?.first_name || "Un participant"} a levé la main ✋`);
  };

  const toggleScreenShare = async () => {
    if (!isTeacher && !allowStudentScreenShare) {
      alert("Le partage d'écran est désactivé par le professeur.");
      return;
    }
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];
        setIsScreenSharing(true);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });
        updatePresence({ isScreenSharing: true });
        screenTrack.onended = () => stopScreenShare();
      } catch { /* annulé */ }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(camTrack);
    });
    updatePresence({ isScreenSharing: false });
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyNotification("Lien copié !");
    setTimeout(() => setCopyNotification(null), 3000);
  };
  const copyMeetingCode = () => {
    if (virtualClass?.meeting_code) {
      navigator.clipboard.writeText(virtualClass.meeting_code);
      setCopyNotification(`Code ${virtualClass.meeting_code} copié !`);
      setTimeout(() => setCopyNotification(null), 3000);
    }
  };

  /* ================================================================ */
  /*  Chat & Modération                                                */
  /* ================================================================ */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    const myName = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    const msgData = {
      virtual_class_id: classId, user_id: currentUser.id,
      user_name: myName, user_role: isTeacher ? "Professeur" : "Élève",
      message: newMessage, created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msgData]);
    setNewMessage("");
    await supabase.from("meeting_messages").insert([msgData]);
    channelRef.current?.send({ type: "broadcast", event: "chat_message", payload: msgData });
  };

  const handleMuteParticipant = (userId: string, pName: string) => {
    channelRef.current?.send({ type: "broadcast", event: "mute_user", payload: { userId } });
    addSysMsg(`Le professeur a désactivé le microphone de ${pName}.`);
  };
  const handleKickParticipant = (userId: string, pName: string) => {
    channelRef.current?.send({ type: "broadcast", event: "kick_user", payload: { userId } });
    addSysMsg(`${pName} a été exclu de la classe.`);
  };
  const handleToggleStudentScreenShare = async () => {
    const next = !allowStudentScreenShare;
    setAllowStudentScreenShare(next);
    await supabase.from("virtual_classes").update({ allow_student_screen_share: next }).eq("id", classId);
    addSysMsg(`Partage d'écran étudiants : ${next ? "autorisé 🟢" : "désactivé 🔴"}`);
  };
  const handleEndMeetingForAll = async () => {
    if (!confirm("Terminer la classe virtuelle pour tous les participants ?")) return;
    await supabase.from("virtual_classes").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", classId);
    channelRef.current?.send({ type: "broadcast", event: "end_meeting", payload: {} });
    setMeetingEndedAlert(true);
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center bg-gray-950 min-h-screen text-white">
        <div className="text-center space-y-3">
          <i className="fas fa-spinner fa-spin text-sama-primary text-4xl" />
          <p className="text-xs text-gray-400">Connexion à la salle WebRTC…</p>
        </div>
      </main>
    );
  }

  if (meetingEndedAlert) {
    return (
      <main className="flex-grow flex items-center justify-center py-12 px-4 bg-gray-950 text-white min-h-screen">
        <div className="max-w-md w-full bg-gray-900 rounded-3xl p-8 border border-gray-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-900/50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl border border-red-700">
            <i className="fas fa-video-slash" />
          </div>
          <h2 className="text-2xl font-extrabold">Classe virtuelle terminée</h2>
          <p className="text-gray-400 text-sm">{isTeacher ? "Vous avez mis fin à cette session." : "Le professeur a terminé la classe."}</p>
          <Link href="/classes" className="block w-full bg-sama-primary hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition text-sm mt-4">Retour au tableau de bord</Link>
        </div>
      </main>
    );
  }

  const otherParticipants = participants.filter((p) => p.id !== currentUser?.id);

  return (
    <main className="flex-grow bg-gray-950 text-white flex flex-col h-screen overflow-hidden">
      {copyNotification && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <i className="fas fa-check-circle" /> {copyNotification}
        </div>
      )}

      {/* TOP BAR */}
      <header className="bg-gray-900 px-6 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="SAMA" className="h-8 object-contain bg-white/10 rounded-lg p-1" />
          <div>
            <h1 className="font-extrabold text-sm text-white leading-tight flex items-center gap-2">
              {virtualClass?.title}
              <button onClick={copyMeetingCode} title="Copier le code" className="text-[10px] bg-green-950 text-green-400 border border-green-700/50 px-2 py-0.5 rounded-md font-mono hover:bg-green-900 transition flex items-center gap-1">
                {virtualClass?.meeting_code} <i className="fas fa-copy text-[9px]" />
              </button>
            </h1>
            <p className="text-[11px] text-gray-400">Professeur : <span className="text-yellow-400 font-semibold">{virtualClass?.teacher?.first_name} {virtualClass?.teacher?.last_name}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyMeetingLink} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-700 transition flex items-center gap-1.5"><i className="fas fa-link text-xs" /> Copier le lien</button>
          <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full border border-red-500/30 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> EN DIRECT ({participants.length})</span>
          {isTeacher ? (
            <button onClick={handleEndMeetingForAll} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"><i className="fas fa-power-off" /> Terminer</button>
          ) : (
            <Link href="/classes" className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-4 py-2 rounded-xl transition border border-gray-700">Quitter</Link>
          )}
        </div>
      </header>

      {/* ZONE PRINCIPALE */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 overflow-hidden relative">
        <div className={`p-4 bg-gray-950 ${activeSidePanel ? "lg:col-span-3" : "lg:col-span-4"} transition-all flex flex-col justify-between overflow-y-auto`}>
          {errorAlert && (
            <div className="mb-3 bg-red-900/80 text-red-200 text-xs p-3 rounded-xl border border-red-700 flex items-center gap-2"><i className="fas fa-exclamation-circle" /> {errorAlert}</div>
          )}
          {isScreenSharing ? (
            <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative border border-gray-800 flex items-center justify-center">
              <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 z-10"><i className="fas fa-desktop" /> Partage d&apos;écran</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Ma tuile */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden group min-h-[220px]">
                {isHandRaised && <div className="absolute top-3 right-3 bg-yellow-500 text-gray-950 font-bold px-2.5 py-1 rounded-full text-xs shadow-lg flex items-center gap-1 z-10 animate-bounce">✋</div>}
                {isCamOn ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                ) : (
                  <div className="text-center p-6">
                    <div className={`w-20 h-20 rounded-full ${isTeacher ? "bg-yellow-500 text-gray-900 border-yellow-300" : "bg-sama-primary text-white border-blue-400"} font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2`}>
                      {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                    </div>
                    <h4 className="font-bold text-sm text-white">{currentUser?.first_name} {currentUser?.last_name}</h4>
                    <p className="text-[11px] text-gray-400">{isTeacher ? "👨‍🏫 Professeur (Vous)" : "👨‍🎓 Élève (Vous)"}</p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1.5 z-10">
                  <i className={`fas ${isMicOn ? "fa-microphone text-green-400" : "fa-microphone-slash text-red-400"}`} />
                  {currentUser?.first_name} {currentUser?.last_name} (Vous)
                </div>
              </div>

              {otherParticipants.map((p) => (
                <RemoteVideoTile key={p.id} participant={p} stream={remoteStreams[p.id] || null} isCurrentUserTeacher={isTeacher} onMute={handleMuteParticipant} onKick={handleKickParticipant} />
              ))}

              {otherParticipants.length === 0 && (
                <div className="bg-gray-900/50 rounded-2xl border border-dashed border-gray-800 flex flex-col items-center justify-center p-8 text-center text-gray-500 col-span-1 md:col-span-1 lg:col-span-2">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 text-gray-400"><i className="fas fa-users-slash text-xl" /></div>
                  <p className="font-bold text-sm text-gray-300">En attente d&apos;autres participants…</p>
                  <p className="text-xs text-gray-500 mt-1">Code : <strong className="text-green-400 font-mono">{virtualClass?.meeting_code}</strong></p>
                  <button onClick={copyMeetingLink} className="mt-4 bg-gray-800 hover:bg-gray-700 text-sama-primary text-xs font-bold px-4 py-2 rounded-xl transition border border-gray-700 flex items-center gap-2"><i className="fas fa-copy" /> Copier le lien</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANNEAU LATÉRAL */}
        {activeSidePanel && (
          <div className="bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex gap-4">
                <button onClick={() => setActiveSidePanel("chat")} className={`text-xs font-bold pb-1 border-b-2 transition ${activeSidePanel === "chat" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-400"}`}><i className="fas fa-comments mr-1" /> Chat</button>
                <button onClick={() => setActiveSidePanel("participants")} className={`text-xs font-bold pb-1 border-b-2 transition ${activeSidePanel === "participants" ? "border-sama-primary text-sama-primary" : "border-transparent text-gray-400"}`}><i className="fas fa-users mr-1" /> Participants ({participants.length})</button>
              </div>
              <button onClick={() => setActiveSidePanel(null)} className="text-gray-500 hover:text-gray-300"><i className="fas fa-times text-xs" /></button>
            </div>

            {activeSidePanel === "chat" && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-grow p-4 overflow-y-auto space-y-3">
                  {messages.map((msg, idx) =>
                    msg.isSystem ? (
                      <div key={idx} className="text-center my-2 text-[11px] text-gray-400 italic bg-gray-800/40 py-1.5 px-3 rounded-xl border border-gray-800">🔔 {msg.text}</div>
                    ) : (
                      <div key={idx} className={`p-3 rounded-2xl text-xs ${msg.user_role === "Professeur" ? "bg-yellow-950/40 border border-yellow-500/30 text-white" : "bg-gray-800 text-gray-200"}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold ${msg.user_role === "Professeur" ? "text-yellow-400" : "text-sama-orange"}`}>{msg.user_name} {msg.user_role === "Professeur" && "🎓"}</span>
                          <span className="text-[10px] text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="leading-relaxed">{msg.message}</p>
                      </div>
                    )
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Envoyer un message…" className="flex-grow bg-gray-950 text-white text-xs rounded-xl p-3 outline-none border border-gray-800 focus:border-sama-primary" />
                  <button type="submit" className="bg-sama-primary text-white p-3 rounded-xl hover:bg-blue-600 transition"><i className="fas fa-paper-plane text-xs" /></button>
                </form>
              </div>
            )}

            {activeSidePanel === "participants" && (
              <div className="p-4 space-y-4 overflow-y-auto flex-grow text-xs">
                {isTeacher && (
                  <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 space-y-2">
                    <p className="font-bold text-gray-300">Droits des étudiants</p>
                    <button onClick={handleToggleStudentScreenShare} className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${allowStudentScreenShare ? "bg-green-900/60 text-green-300 border border-green-700" : "bg-gray-700 text-gray-400"}`}>
                      <span>Partage d&apos;écran</span><span>{allowStudentScreenShare ? "Autorisé 🟢" : "Désactivé 🔴"}</span>
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Présents ({participants.length})</p>
                  {participants.map((p) => (
                    <div key={p.id} className="bg-gray-800 p-3 rounded-2xl flex items-center justify-between gap-2 border border-gray-700/50">
                      <div>
                        <p className="font-bold text-white text-xs flex items-center gap-1">
                          {p.name} {p.id === currentUser?.id && <span className="text-blue-400 text-[10px]">(Vous)</span>} {p.isHost && <span className="text-yellow-400 text-[10px]">🎓</span>}
                        </p>
                        <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                          <span>{p.isMuted ? "🔴 Micro off" : "🟢 Micro on"}</span>
                          {p.isHandRaised && <span className="text-yellow-400 font-bold">✋</span>}
                        </div>
                      </div>
                      {isTeacher && !p.isHost && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleMuteParticipant(p.id, p.name)} className="bg-gray-700 hover:bg-gray-600 text-yellow-400 p-2 rounded-lg text-xs"><i className="fas fa-microphone-slash" /></button>
                          <button onClick={() => handleKickParticipant(p.id, p.name)} className="bg-gray-700 hover:bg-red-900 text-red-400 p-2 rounded-lg text-xs"><i className="fas fa-user-minus" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BARRE INFÉRIEURE */}
      <footer className="bg-gray-900 px-6 py-4 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="text-white text-xs font-semibold hidden md:block">{virtualClass?.title}</div>
        <div className="flex items-center gap-3 mx-auto md:mx-0">
          <button onClick={toggleMic} title={isMicOn ? "Couper le micro" : "Activer le micro"} className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${isMicOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-600 text-white"}`}><i className={`fas ${isMicOn ? "fa-microphone" : "fa-microphone-slash"} text-base`} /></button>
          <button onClick={toggleCam} title={isCamOn ? "Couper la caméra" : "Activer la caméra"} className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${isCamOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-600 text-white"}`}><i className={`fas ${isCamOn ? "fa-video" : "fa-video-slash"} text-base`} /></button>
          <button onClick={toggleScreenShare} title="Partager l'écran" className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${isScreenSharing ? "bg-green-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-white"}`}><i className="fas fa-desktop text-base" /></button>
          <button onClick={toggleHandRaise} title="Lever la main" className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md ${isHandRaised ? "bg-yellow-500 text-gray-900 font-bold" : "bg-gray-800 hover:bg-gray-700 text-white"}`}><span className="text-lg">✋</span></button>
          {isTeacher ? (
            <button onClick={handleEndMeetingForAll} title="Terminer" className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow-lg ml-2"><i className="fas fa-power-off text-base" /></button>
          ) : (
            <Link href="/classes" title="Quitter" className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition shadow-lg ml-2"><i className="fas fa-phone-slash text-base" /></Link>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setActiveSidePanel(activeSidePanel === "chat" ? null : "chat")} className={`p-3 rounded-xl text-xs font-bold transition ${activeSidePanel === "chat" ? "bg-sama-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}><i className="fas fa-comments" /></button>
          <button onClick={() => setActiveSidePanel(activeSidePanel === "participants" ? null : "participants")} className={`p-3 rounded-xl text-xs font-bold transition ${activeSidePanel === "participants" ? "bg-sama-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}><i className="fas fa-users" /></button>
        </div>
      </footer>
    </main>
  );
}
