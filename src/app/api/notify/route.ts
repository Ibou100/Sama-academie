import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialisation de Resend. 
// Si la clé n'est pas définie, on affichera juste un log dans la console (mode mock).
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, toEmail, recipientName, senderName, messagePreview } = body;

    if (!toEmail) {
      return NextResponse.json({ error: "L'email du destinataire est manquant." }, { status: 400 });
    }

    let subject = "";
    let htmlContent = "";

    if (type === "new_request") {
      subject = `SAMA ACADÉMIE - Vous avez une nouvelle demande de cours !`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #2563eb;">SAMA ACADÉMIE</h2>
          <p>Bonjour <strong>${recipientName}</strong>,</p>
          <p>Excellente nouvelle ! <strong>${senderName}</strong> vient de vous faire une demande de cours de soutien.</p>
          ${messagePreview ? `<div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; font-style: italic;">"${messagePreview}"</div>` : ""}
          <p>Connectez-vous rapidement à votre espace pour accepter ou refuser cette demande.</p>
          <a href="https://votre-site.com/demandes" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Voir la demande</a>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">L'équipe SAMA ACADÉMIE</p>
        </div>
      `;
    } else if (type === "new_message") {
      subject = `SAMA ACADÉMIE - Nouveau message de ${senderName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #2563eb;">SAMA ACADÉMIE</h2>
          <p>Bonjour <strong>${recipientName}</strong>,</p>
          <p><strong>${senderName}</strong> vous a envoyé un nouveau message concernant votre demande de cours :</p>
          <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
            "${messagePreview}"
          </div>
          <p>Cliquez ci-dessous pour lui répondre directement sur la plateforme.</p>
          <a href="https://votre-site.com/demandes" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Répondre au message</a>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">L'équipe SAMA ACADÉMIE</p>
        </div>
      `;
    } else {
      return NextResponse.json({ error: "Type de notification inconnu." }, { status: 400 });
    }

    if (resend) {
      // Envoi réel via l'API Resend
      const { data, error } = await resend.emails.send({
        from: 'SAMA ACADEMIE <onboarding@resend.dev>', // Adresse de test par défaut de Resend
        to: toEmail,
        subject: subject,
        html: htmlContent,
      });

      if (error) {
        console.error("Erreur Resend :", error);
        return NextResponse.json({ error }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Mode simulation (Mock) pour le développement si RESEND_API_KEY n'est pas définie
      console.log("=========================================");
      console.log("📧 EMAIL SIMULÉ (Clé API Resend non configurée)");
      console.log(`À: ${toEmail}`);
      console.log(`Sujet: ${subject}`);
      console.log(`Contenu: ${htmlContent}`);
      console.log("=========================================");
      
      return NextResponse.json({ 
        success: true, 
        message: "Email simulé dans la console. Configurez RESEND_API_KEY pour l'envoi réel." 
      });
    }

  } catch (error: any) {
    console.error("Erreur serveur API notify :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
