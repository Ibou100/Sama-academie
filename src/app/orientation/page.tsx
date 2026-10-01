"use client";

import { useState } from "react";
import Link from "next/link";

interface FiliereDetail {
  id: string;
  title: string;
  badge: string;
  icon: string;
  shortDesc: string;
  etablissements: {
    nom: string;
    sigle: string;
    ville: string;
    acces: string;
    specialites: string[];
    description: string;
  }[];
  debouches: string[];
  conseilOrientation: string;
}

interface ConseilDetail {
  id: string;
  title: string;
  icon: string;
  badge: string;
  resume: string;
  etapes: { titre: string; detail: string }[];
  astucePro: string;
}

const FILIERES: FiliereDetail[] = [
  {
    id: "ingenieurs",
    title: "Grandes Écoles d'Ingénieurs & Instituts Technologiques",
    badge: "Scientifique & Technique",
    icon: "💻",
    shortDesc: "ESP Dakar, EPT Thiès, EPD Diamniadio, IPSL Saint-Louis, IUT Thiès, ESMT...",
    etablissements: [
      {
        nom: "École Supérieure Polytechnique de Dakar",
        sigle: "ESP Dakar (UCAD)",
        ville: "Dakar (Fann)",
        acces: "Concours national après Bac S1, S2, S3, STI ou sélection dossier DUT/DIC",
        specialites: ["Génie Informatique & IA", "Génie Civil", "Génie Électrique", "Génie Mécanique", "Génie Chimique & Biologie appliquée"],
        description: "L'une des écoles d'ingénieurs les plus prestigieuses d'Afrique de l'Ouest, rattachée à l'UCAD. Elle délivre le Diplôme d'Ingénieur de Conception (DIC) et le DUT."
      },
      {
        nom: "École Polytechnique de Thiès",
        sigle: "EPT Thiès",
        ville: "Thiès",
        acces: "Concours d'entrée très sélectif (Bac S1, S2, S3) niveau Terminale",
        specialites: ["Génie Civil (BTP & Ouvrages d'art)", "Génie Électromécanique", "Génie Informatique & Télécommunications", "Génie Aéronautique"],
        description: "Créée sur modèle polytechnique militaire, l'EPT forme des ingénieurs d'État sénégalais hautement qualifiés et réputés pour leur rigueur et leadership."
      },
      {
        nom: "École Polytechnique de Diamniadio",
        sigle: "EPD / Cité du Savoir",
        ville: "Diamniadio",
        acces: "Sélection d'excellence (Bacs scientifiques S1/S2 et prépas)",
        specialites: ["Intelligence Artificielle & Robotique", "Transition Énergétique", "Systèmes Numériques Embarqués", "Nanotechnologies"],
        description: "Pôle d'innovation technologique situé au cœur de la Cité du Savoir à Diamniadio, dédié aux métiers d'avenir et à la recherche avancée."
      },
      {
        nom: "Institut Polytechnique de Saint-Louis",
        sigle: "IPSL (UGB)",
        ville: "Saint-Louis",
        acces: "Concours national (Bacheliers scientifiques) avec classes préparatoires intégrées",
        specialites: ["Génie Civil", "Génie Mécanique", "Informatique & Réseaux Industriels"],
        description: "Institut d'ingénierie de l'Université Gaston Berger de Saint-Louis, réputé pour son cycle préparatoire d'excellence et son ancrage pratique."
      },
      {
        nom: "Institut Universitaire de Technologie de Thiès",
        sigle: "IUT de Thiès (UIDT)",
        ville: "Thiès",
        acces: "Sélection sur concours et dossier (Bac S, STI, G)",
        specialites: ["Génie Civil", "Génie Électrique & Informatique Industrielle", "Logistique & Transport", "Télécoms"],
        description: "Rattaché à l'Université Iba Der Thiam de Thiès, l'IUT est un pôle majeur de formation technologique supérieure courte (DUT) et longue (Licences et Masters pros)."
      },
      {
        nom: "École Supérieure Multinationale des Télécommunications",
        sigle: "ESMT Dakar",
        ville: "Dakar",
        acces: "Concours et tests d'admission (Bac S, L2, Licence scientifique)",
        specialites: ["Cybersécurité", "Télécommunications & 5G", "Cloud Computing", "Génie Logiciel"],
        description: "Institution inter-étatique panafricaine basée à Dakar, référence sous-régionale dans le domaine des télécommunications et de l'économie numérique."
      }
    ],
    debouches: [
      "Ingénieur Logiciel & Architecte Cloud",
      "Ingénieur Chef de Projet BTP / Génie Civil",
      "Expert en Énergies Renouvelables",
      "Consultant en Cybersécurité & Données",
      "Responsable Maintenance Industrielle",
      "Directeur Technique / CTO"
    ],
    conseilOrientation: "Ayez une moyenne solide en Mathématiques et Sciences Physiques (minimum 13/20 pour viser les concours). Préparez les annales de concours dès le premier trimestre de Terminale !"
  },
  {
    id: "universites",
    title: "Universités Publiques du Sénégal",
    badge: "Enseignement Supérieur",
    icon: "🎓",
    shortDesc: "UCAD (Dakar), UGB (Saint-Louis), UIDT (Thiès), UADB (Bambey), USSEIN (Kaolack), UNCHK...",
    etablissements: [
      {
        nom: "Université Cheikh Anta Diop",
        sigle: "UCAD",
        ville: "Dakar",
        acces: "Plateforme Campusen (Bacheliers sénégalais)",
        specialites: ["FST (Sciences & Technologies)", "FASEG (Économie & Gestion)", "FLSH (Lettres & Sciences Humaines)", "FSJP (Droit & Sciences Politiques)", "FMPO (Médecine)"],
        description: "La plus grande université d'Afrique francophone avec plus de 80 000 étudiants et des facultés historiques mondialement reconnues."
      },
      {
        nom: "Université Gaston Berger",
        sigle: "UGB",
        ville: "Saint-Louis (Sanar)",
        acces: "Campusen (sélection rigoureuse sur notes du Bac)",
        specialites: ["SAT (Sciences Appliquées & Technologies)", "SEG (Sciences Économiques et Gestion)", "SJP (Sciences Juridiques et Politiques)", "IPSL", "UFR Santé"],
        description: "Pôle d'excellence universitaire situé à Saint-Louis, réputé pour son cadre de travail propice et son fort taux de réussite."
      },
      {
        nom: "Université Iba Der Thiam",
        sigle: "UIDT",
        ville: "Thiès",
        acces: "Campusen",
        specialites: ["Sciences & Technologies", "Économie & Management", "Santé", "IUT de Thiès"],
        description: "Université moderne multipolaire au cœur du pôle économique et ferroviaire de Thiès."
      },
      {
        nom: "Université Alioune Diop de Bambey",
        sigle: "UADB",
        ville: "Bambey",
        acces: "Campusen",
        specialites: ["Santé communautaire", "TIC & Informatique", "Économie & Management", "Génie Électrique"],
        description: "Université spécialisée dans les formations professionnalisantes et le développement communautaire."
      },
      {
        nom: "Univ. du Sine Saloum El-Hâdj Ibrahima NIASS",
        sigle: "USSEIN",
        ville: "Kaolack / Fatick / Kaffrine",
        acces: "Campusen",
        specialites: ["Agronomie & Agriculture durable", "Élevage & Santé animale", "Nutrition & Agroalimentaire", "Écotourisme"],
        description: "Grande université à vocation agricole et de souveraineté alimentaire au Sénégal."
      },
      {
        nom: "Université Numérique Cheikh Hamidou Kane",
        sigle: "UNCHK (ex-UVS)",
        ville: "Espaces Numériques Ouverts (ENO) dans tout le Sénégal",
        acces: "Campusen",
        specialites: ["Informatique & Développement", "Droit & Administration", "Communication digitale", "Sciences économiques"],
        description: "Université publique d'enseignement à distance avec plus de 15 Espaces Numériques Ouverts (ENO) répartis dans tout le territoire."
      }
    ],
    debouches: [
      "Chercheurs, Enseignants-chercheurs et Professeurs de lycée/collège",
      "Juristes d'entreprise, Magistrats, Avocats",
      "Économistes, Analystes financiers, Auditeurs",
      "Spécialistes en Relations Internationales et Diplomatie",
      "Agronomes et Développeurs ruraux"
    ],
    conseilOrientation: "Le système LMD (Licence - Master - Doctorat) demande une grande autonomie. Ne ratez aucun TD dès le début du semestre 1."
  },
  {
    id: "sante",
    title: "Sciences Médicales, Pharmacie & Soins",
    badge: "Santé Publique",
    icon: "⚕️",
    shortDesc: "FMPO UCAD & UGB, ENDSS / INFAS, Écoles de sages-femmes et d'infirmiers...",
    etablissements: [
      {
        nom: "Faculté de Médecine, Pharmacie et Odontologie",
        sigle: "FMPO (UCAD)",
        ville: "Dakar",
        acces: "Campusen (Mention Très Bien / Bien obligatoire Bac S1 ou S2)",
        specialites: ["Médecine Générale & Spécialités", "Pharmacie", "Chirurgie Dentaire (Odontologie)"],
        description: "Le temple de la formation médicale au Sénégal, formant les médecins chefs et spécialistes de toute la sous-région."
      },
      {
        nom: "UFR Sciences de la Santé de Saint-Louis",
        sigle: "2S UGB",
        ville: "Saint-Louis",
        acces: "Campusen (Très forte sélection Bac S1/S2)",
        specialites: ["Médecine", "Sciences Infirmières et Obstétricales"],
        description: "Excellence académique et humaine pour les futurs médecins du Sénégal septentrional."
      },
      {
        nom: "École Nationale de Développement Sanitaire et Social",
        sigle: "ENDSS / INFAS",
        ville: "Dakar",
        acces: "Concours national direct après Bac ou BFEM selon la section",
        specialites: ["Infirmiers d'État", "Sages-Femmes d'État", "Techniciens de Laboratoire", "Travailleurs Sociaux"],
        description: "L'institution publique phare de formation des personnels paramédicaux au Sénégal."
      }
    ],
    debouches: [
      "Médecin généraliste / Spécialiste hospitalier",
      "Pharmacien d'officine et industriel",
      "Chirurgien-dentiste",
      "Sage-femme d'État & Infirmier d'État en structures hospitalières",
      "Biologiste médical et Technicien supérieur de laboratoire"
    ],
    conseilOrientation: "Les études médicales durent entre 7 et 8 ans. La régularité du travail et la résistance psychologique sont capitales."
  },
  {
    id: "commerce",
    title: "Commerce, Banque, Finance & Management",
    badge: "Gestion & Business",
    icon: "📊",
    shortDesc: "CESAG, ESP Gestion, BEM Dakar, ISM, FASEG...",
    etablissements: [
      {
        nom: "Centre Africain d'Études Supérieures en Gestion",
        sigle: "CESAG",
        ville: "Dakar",
        acces: "Concours d'entrée et étude de dossier (Bacs L, S, G)",
        specialites: ["Banque & Finance", "Expertise Comptable (DECOFI)", "Audit & Contrôle", "Management public"],
        description: "Institution régionale de la BCEAO et de l'UEMOA, référence absolue en finance et comptabilité."
      },
      {
        nom: "ESP - Département Gestion & Tertiaire",
        sigle: "ESP Tertiaire",
        ville: "Dakar",
        acces: "Concours national d'entrée (Bac S, G, L)",
        specialites: ["Comptabilité & Gestion Financière", "Gestion des Entreprises et Administrations (GEA)", "Commerce International"],
        description: "Formations publiques d'excellence à frais d'inscription universitaires standards."
      },
      {
        nom: "BEM Dakar & ISM (Grandes Écoles Privées Agréées)",
        sigle: "BEM / ISM",
        ville: "Dakar",
        acces: "Concours propres et entretien de motivation",
        specialites: ["Management International", "Supply Chain & Logistique", "Marketing Digital & Data", "Finance de Marché"],
        description: "Business Schools sénégalaises partenaires d'universités européennes et américaines."
      }
    ],
    debouches: [
      "Analyste Financier & Trader",
      "Expert-Comptable stagiaire / Auditeur financier",
      "Responsable Marketing & Digital Manager",
      "Gestionnaire de Portefeuille / Banque d'affaires",
      "Chef de projet Supply Chain & Achats"
    ],
    conseilOrientation: "Maîtrisez impérativement l'anglais des affaires et les outils d'analyse de données (Excel avancé, Power BI, Python financier)."
  },
  {
    id: "armee",
    title: "Forces de Défense, Sécurité & Concours Militaires",
    badge: "Sécurité & Défense",
    icon: "🛡️",
    shortDesc: "ENOA, École de l'Air, Police, Gendarmerie, Douanes, Sapeurs-Pompiers...",
    etablissements: [
      {
        nom: "École Nationale des Officiers d'Active",
        sigle: "ENOA Thiès",
        ville: "Thiès",
        acces: "Concours direct interarmées très sélectif (Niveau Licence/Master)",
        specialites: ["Commandement des Troupes", "Stratégie Militaire & Tactique", "Génie Militaire"],
        description: "Moule de l'élite militaire sénégalaise et africaine. Les lauréats sortent avec le grade de Sous-Lieutenant."
      },
      {
        nom: "École Nationale de Police et de la Formation Permanente",
        sigle: "ENP Dakar",
        ville: "Dakar",
        acces: "Concours direct annuel (Commissaires, Officiers, Sous-Officiers, Agents)",
        specialites: ["Police Judiciaire", "Sécurité Publique", "Renseignement & Police Scientifique"],
        description: "Formation de l'ensemble des forces de police sénégalaises."
      },
      {
        nom: "École des Douanes",
        sigle: "École des Douanes",
        ville: "Dakar",
        acces: "Concours direct de la Fonction Publique (Inspecteurs, Contrôleurs, Préposés)",
        specialites: ["Contrôle douanier & Fiscalité", "Surveillance frontalière & Maritime"],
        description: "Corps d'élite paramilitaire sous la tutelle du Ministère des Finances."
      },
      {
        nom: "Brigade Nationale des Sapeurs-Pompiers",
        sigle: "BNSP",
        ville: "Dakar / Régions",
        acces: "Concours spécifique de recrutement militaire",
        specialites: ["Secours d'urgence", "Lutte contre les sinistres et feux", "Gestion des catastrophes"],
        description: "Engagement d'honneur et de bravoure pour sauver des vies."
      }
    ],
    debouches: [
      "Officier dans l'Armée de Terre, de l'Air ou la Marine nationale",
      "Commissaire ou Inspecteur de Police",
      "Inspecteur des Douanes sénégalaises",
      "Officier de Sapeurs-Pompiers",
      "Expert en Renseignement & Sécurité intérieure"
    ],
    conseilOrientation: "Une excellente condition physique est indispensable en plus des épreuves écrites. Entraînez-vous à la course de fond et aux tractions dès maintenant."
  },
  {
    id: "formation-pro",
    title: "Instituts Supérieurs d'Enseignement Professionnel (ISEP)",
    badge: "Technique & Métiers",
    icon: "🔧",
    shortDesc: "ISEP Diamniadio, Thiès, Bignona, Matam, Richard-Toll, BTS d'État...",
    etablissements: [
      {
        nom: "Réseau des ISEP du Sénégal",
        sigle: "ISEP (Diamniadio, Thiès, Matam, Bignona)",
        ville: "National",
        acces: "Campusen et concours d'entrée après tout type de Baccalauréat",
        specialites: ["Maintenance Industrielle", "TIC & Réseaux Télécoms", "Agro-alimentaire", "Automobile & Mécatronique", "Bâtiment"],
        description: "Formations courtes de 2 ans orientées à 75% vers la pratique et les stages en entreprise, menant au diplôme de Technicien Supérieur Spécialisé."
      },
      {
        nom: "Centres de Formation Professionnelle & Technique",
        sigle: "CFPT Sénégal-Japon",
        ville: "Dakar",
        acces: "Concours d'entrée très réputé",
        specialites: ["Mécatronique", "Électrotechnique", "Automatisme industriel", "Froid et climatisation"],
        description: "Fruit de la coopération nippo-sénégalaise, référence absolue en formation technique industrielle."
      }
    ],
    debouches: [
      "Technicien Supérieur en Mécatronique",
      "Superviseur de chantier BTP",
      "Chef d'atelier en Maintenance Industrielle",
      "Entrepreneur / Artisan moderne qualifié",
      "Intégrateur de solutions solaires et énergétiques"
    ],
    conseilOrientation: "Les formations professionnelles courtes permettent d'entrer rapidement sur le marché du travail tout en gardant la possibilité de continuer en Licence pro."
  }
];

const CONSEILS: ConseilDetail[] = [
  {
    id: "reussir-examens",
    title: "Méthode infaillible pour réussir ses examens (BFEM, BAC, Concours)",
    icon: "📝",
    badge: "Méthodologie",
    resume: "Comment aborder les épreuves officielles avec sérénité et maximiser ses points le jour J.",
    etapes: [
      {
        titre: "1. Traiter les annales sous chrono réel",
        detail: "Ne vous contentez pas de lire les corrigés. Isolez-vous pendant 3h ou 4h avec le sujet des 5 dernières sessions et rédigez comme si vous étiez dans la salle d'examen."
      },
      {
        titre: "2. La stratégie des 15 premières minutes",
        detail: "Lisez l'intégralité du sujet avant d'écrire. Repérez les exercices où vous êtes le plus à l'aise pour garantir des points rapides et gagner en confiance."
      },
      {
        titre: "3. La présentation et la lisibilité",
        detail: "Un correcteur corrige des centaines de copies. Une écriture soignée, des résultats encadrés et des numérotations claires vous font gagner jusqu'à 2 points précieux."
      },
      {
        titre: "4. La gestion du temps d'épreuve",
        detail: "Réservez toujours 15 minutes à la fin de chaque épreuve pour la relecture (orthographe, calculs, unités de physique, omissions)."
      }
    ],
    astucePro: "Téléchargez les annales officielles directement sur notre page 'Exercices & Examens' pour vous entraîner régulièrement."
  },
  {
    id: "mieux-reviser",
    title: "Techniques de mémorisation active et révisions efficaces",
    icon: "🧠",
    badge: "Apprentissage",
    resume: "Passez de la lecture passive à l'apprentissage actif pour retenir deux fois plus vite.",
    etapes: [
      {
        titre: "1. La méthode Feynman (expliquer pour comprendre)",
        detail: "Après avoir appris un cours, essayez de l'expliquer oralement avec des mots très simples à un camarade ou à voix haute. Là où vous bloquez, c'est là où vous devez relire."
      },
      {
        titre: "2. Les fiches de synthèse recto-verso",
        detail: "Ne recopiez pas le cours. Notez uniquement : les définitions clés, les formules encadrées, les pièges récurrents et les schémas récapitulatifs."
      },
      {
        titre: "3. La répétition espacée (Spaced Repetition)",
        detail: "Révisez une notion le jour même (J0), puis le lendemain (J+1), puis à J+3, puis à J+7. Cela ancre l'information dans votre mémoire à long terme."
      },
      {
        titre: "4. Le travail en binôme motivé",
        detail: "Posez-vous mutuellement des questions pièges avec un camarade sérieux. Cela stimule l'attention et brise l'isolement des révisions."
      }
    ],
    astucePro: "Révisez les matières à fort coefficient le matin lorsque le cerveau est à son pic de concentration."
  },
  {
    id: "organiser-temps",
    title: "Organiser son temps et battre la procrastination",
    icon: "⏳",
    badge: "Organisation",
    resume: "Construire un planning de travail réaliste et le tenir sans s'épuiser.",
    etapes: [
      {
        titre: "1. La technique Pomodoro sénégalaise",
        detail: "Travaillez 25 à 30 minutes en coupant TOUTES les notifications de téléphone (WhatsApp, TikTok, Insta), puis accordez-vous 5 minutes de pause pour souffler."
      },
      {
        titre: "2. La loi de Pareto (80/20)",
        detail: "Identifiez les 20% des chapitres qui tombent 80% du temps aux examens (ex: suites & intégrales en Maths, cinématique en Physique, dissertations méthodiques)."
      },
      {
        titre: "3. Le rétroplanning hebdomadaire",
        detail: "Fixez des objectifs précis par demi-journée (ex: 'Mardi 15h : 3 exercices d'électrostatique', et non pas 'Mardi : faire de la physique')."
      },
      {
        titre: "4. Équilibrer les matières fortes et faibles",
        detail: "Ne passez pas tout votre temps sur votre matière préférée. Consacrez les créneaux où vous êtes le plus en forme à vos matières bêtes noires."
      }
    ],
    astucePro: "Dormez au minimum 7h par nuit. Le sommeil est l'étape où le cerveau classe et consolide tout ce que vous avez révisé pendant la journée."
  },
  {
    id: "lutter-stress",
    title: "Gérer le stress et la pression des épreuves",
    icon: "🧘🏾‍♂️",
    badge: "Bien-être",
    resume: "Techniques de respiration, confiance en soi et hygiène de vie pour le jour de l'examen.",
    etapes: [
      {
        titre: "1. La respiration ventrale 4-7-8",
        detail: "En cas de montée de panique devant une copie difficile : inspirez par le nez pendant 4 secondes, bloquez 7 secondes, puis expirez lentement par la bouche pendant 8 secondes. Votre rythme cardiaque ralentira immédiatement."
      },
      {
        titre: "2. La veille de l'épreuve : déconnexion",
        detail: "N'apprenez JAMAIS de nouveaux chapitres la veille à minuit. Rangez vos cahiers à 18h, préparez votre convocation, carte d'identité, calculatrice et stylos, et dormez tôt."
      },
      {
        titre: "3. Fuir les 'discussions anxiogènes' devant le centre",
        detail: "Le matin de l'examen, évitez les groupes qui crient des formules ou spéculent sur les sujets devant le portail. Restez calme et concentré dans votre bulle."
      },
      {
        titre: "4. L'hydratation et le glucose",
        detail: "Apportez une bouteille d'eau et une barre d'énergie ou des dattes dans la salle. Un cerveau déshydraté perd 15% de ses capacités d'analyse."
      }
    ],
    astucePro: "Ayez confiance en vos efforts ! La préparation méthodique est le meilleur antidote contre la peur."
  }
];

export default function OrientationPage() {
  const [selectedFiliere, setSelectedFiliere] = useState<FiliereDetail | null>(null);
  const [selectedConseil, setSelectedConseil] = useState<ConseilDetail | null>(null);

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

      {/* HEADER SECTION */}
      <div className="bg-sama-blue text-white rounded-3xl p-8 md:p-12 mb-12 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 text-blue-200">
            <span>🧭</span> Guide & Références Éducatives au Sénégal
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Orientation Scolaire & Conseils Pédagogiques
          </h1>
          <p className="text-blue-100 text-base md:text-lg leading-relaxed">
            Trouvez la filière d'excellence qui correspond à vos ambitions, découvrez les grandes écoles d'ingénieurs et universités du Sénégal, et maîtrisez les meilleures techniques de travail pour réussir vos examens et concours.
          </p>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] hidden md:block"></div>
      </div>

      {/* SECTION K : ORIENTATION SCOLAIRE ET FILIÈRES */}
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-sama-primary text-2xl shadow-sm">
              🧭
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Grandes Filières & Écoles au Sénégal
              </h2>
              <p className="text-gray-500 text-sm">
                Cliquez sur une filière pour afficher les établissements, conditions d'accès et débouchés
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FILIERES.map((filiere) => (
            <div
              key={filiere.id}
              onClick={() => setSelectedFiliere(filiere)}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-sama-primary/30 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{filiere.icon}</span>
                  <span className="bg-blue-50 text-sama-primary text-xs font-bold px-3 py-1 rounded-full">
                    {filiere.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sama-primary transition-colors">
                  {filiere.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  {filiere.shortDesc}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">
                  {filiere.etablissements.length} institutions détaillées
                </span>
                <button
                  type="button"
                  className="text-sama-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  Voir les détails &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION L : CONSEILS PÉDAGOGIQUES */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-sama-orange text-2xl shadow-sm">
            💡
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Conseils Pédagogiques & Méthodologie
            </h2>
            <p className="text-gray-500 text-sm">
              Guides pratiques pour réviser intelligemment et aborder les épreuves avec sérénité
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CONSEILS.map((conseil) => (
            <div
              key={conseil.id}
              onClick={() => setSelectedConseil(conseil)}
              className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-sama-orange/40 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-start gap-5">
                <div className="text-4xl bg-orange-50 p-4 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  {conseil.icon}
                </div>
                <div>
                  <span className="bg-orange-100/70 text-sama-orange text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                    {conseil.badge}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sama-orange transition-colors">
                    {conseil.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    {conseil.resume}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Guide étape par étape</span>
                <button
                  type="button"
                  className="text-sama-orange font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  Lire l'article complet &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BANNIÈRE ACCOMPAGNEMENT SUR MESURE */}
      <div className="bg-gradient-to-r from-sama-blue to-blue-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
        <h3 className="text-2xl md:text-3xl font-extrabold mb-3">
          Besoin d'un accompagnement personnalisé avec un professeur ?
        </h3>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-sm md:text-base">
          Nos enseignants vérifiés dispensent des cours de renforcement, du soutien scolaire à domicile ou en ligne, et vous préparent spécifiquement aux concours des grandes écoles.
        </p>
        <Link href="/enseignants" className="inline-block bg-sama-orange hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          Trouver un professeur pour mon orientation
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* MODAL INTERACTIF : DÉTAIL D'UNE FILIÈRE / ÉCOLES D'INGÉNIEURS             */}
      {/* ========================================================================= */}
      {selectedFiliere && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedFiliere(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{selectedFiliere.icon}</span>
                <div>
                  <span className="bg-blue-100 text-sama-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedFiliere.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
                    {selectedFiliere.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedFiliere(null)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Conseil Clé */}
            <div className="bg-blue-50 border-l-4 border-sama-primary p-4 rounded-r-2xl mb-8">
              <p className="text-xs font-bold uppercase text-sama-primary mb-1">
                📌 Conseil de l'Équipe Pédagogique
              </p>
              <p className="text-sm text-gray-700 font-medium">
                {selectedFiliere.conseilOrientation}
              </p>
            </div>

            {/* Liste détaillée des établissements */}
            <div className="mb-8">
              <h4 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏛️</span> Établissements de référence au Sénégal
              </h4>

              <div className="space-y-4">
                {selectedFiliere.etablissements.map((etab, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-sama-primary/40 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <h5 className="font-extrabold text-lg text-gray-900">
                          {etab.nom}
                        </h5>
                        <span className="text-xs font-bold text-sama-primary uppercase tracking-wider">
                          {etab.sigle} — 📍 {etab.ville}
                        </span>
                      </div>
                      <span className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-lg font-medium self-start sm:self-center">
                        🎯 {etab.acces}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {etab.description}
                    </p>

                    <div>
                      <span className="text-xs font-bold text-gray-400 block mb-1">Spécialités phares :</span>
                      <div className="flex flex-wrap gap-1.5">
                        {etab.specialites.map((spec, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-white text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium border border-gray-200"
                          >
                            ✓ {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Débouchés professionnels */}
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-lg font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <span>💼</span> Débouchés & Carrières Possibles
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedFiliere.debouches.map((deb, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <span className="text-sama-primary font-bold">▸</span> {deb}
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton Fermer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedFiliere(null)}
                className="btn-primary"
              >
                Fermer la fenêtre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTERACTIF : ARTICLE CONSEIL PÉDAGOGIQUE                            */}
      {/* ========================================================================= */}
      {selectedConseil && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedConseil(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{selectedConseil.icon}</span>
                <div>
                  <span className="bg-orange-100 text-sama-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedConseil.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
                    {selectedConseil.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedConseil(null)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Résumé */}
            <p className="text-base text-gray-700 font-medium mb-8 leading-relaxed">
              {selectedConseil.resume}
            </p>

            {/* Étapes détaillées */}
            <div className="space-y-6 mb-8">
              {selectedConseil.etapes.map((etape, eIdx) => (
                <div key={eIdx} className="bg-orange-50/40 p-5 rounded-2xl border border-orange-100">
                  <h5 className="font-extrabold text-gray-900 text-base mb-2 text-sama-blue">
                    {etape.titre}
                  </h5>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {etape.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Astuce Pro */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl mb-8">
              <p className="text-xs font-bold uppercase text-amber-800 mb-1">
                ⭐ L'Astuce SAMA ACADÉMIE
              </p>
              <p className="text-sm text-amber-900 font-medium">
                {selectedConseil.astucePro}
              </p>
            </div>

            {/* Bouton Fermer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedConseil(null)}
                className="bg-sama-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition"
              >
                J'ai compris, fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
