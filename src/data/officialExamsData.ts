export interface ExamQuestion {
  num: string;
  points?: string;
  question: string;
  details?: string[];
}

export interface ExamSection {
  title: string;
  points?: string;
  instructions?: string;
  textExcerpt?: {
    author?: string;
    work?: string;
    content: string;
  };
  questions: ExamQuestion[];
}

export interface CorrigeSection {
  title: string;
  points?: string;
  solution: string;
  steps?: string[];
}

export interface BaremeItem {
  critere: string;
  points: string;
  description: string;
}

export interface OfficialExamDocument {
  id: string;
  level: string;
  cycle: "Primaire" | "College" | "Lycee" | "Concours";
  session: string;
  title: string;
  subject: string;
  institution: string;
  duration: string;
  coefficient: number;
  color: string;
  downloads: string;
  pages_info: string;
  file_url?: string;
  instructions: string[];
  sections: ExamSection[];
  corrige: {
    methodologie?: string;
    conseilsJury?: string;
    sections: CorrigeSection[];
  };
  bareme: BaremeItem[];
}

// =========================================================================
// 1. CONCOURS CREM / CRFPE (Recrutement des Élèves-Maîtres - Primaire)
// =========================================================================
export const CREM_EXAM: OfficialExamDocument = {
  id: "concours-crem",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Nationale Officielle 2024 / 2025",
  title: "Concours CREM / CRFPE — Recrutement des Élèves-Maîtres (Primaire)",
  subject: "Culture Générale, Français Fondamental & Pédagogie",
  institution: "Ministère de l'Éducation Nationale — DEXCO (Direction des Examens et Concours)",
  duration: "3 heures (Dissertation) + 2 heures (Français)",
  coefficient: 3,
  color: "bg-emerald-800",
  downloads: "8 420",
  pages_info: "Épreuve Intégrale + Corrigé Officiel DEXCO",
  instructions: [
    "L'usage du dictionnaire et de tout appareil électronique ou téléphone portable est strictement interdit sous peine d'exclusion immédiate.",
    "La dissertation de culture générale doit être structurée selon le modèle académique : introduction, développement ordonné en parties équilibrées, conclusion.",
    "Une attention capitale est portée à la qualité de l'expression écrite, à l'orthographe lexicale et grammaticale. Tout abus de fautes entraînera une déduction maximale de 3 points sur la note finale."
  ],
  sections: [
    {
      title: "PREMIÈRE ÉPREUVE : DISSERTATION DE CULTURE GÉNÉRALE (Durée : 3h — 20 points)",
      points: "20 points (Coeff. 3)",
      instructions: "Traitez au choix l'un des deux sujets suivants :",
      questions: [
        {
          num: "Sujet 1 (Pédagogie & Société)",
          points: "20 points",
          question: "« L'éducation n'est pas seulement l'affaire de l'école. »",
          details: [
            "En vous appuyant sur des exemples précis empruntés aux réalités socioculturelles sénégalaises et africaines contemporaines, analysez les rôles respectifs de la cellule familiale, de la communauté et de l'institution scolaire dans la formation morale, civique et citoyenne de l'enfant.",
            "Quelles synergies indispensables ces trois acteurs doivent-ils développer pour faire face aux dérives actuelles (décrochage scolaire, crise des valeurs, surexposition aux écrans) ?"
          ]
        },
        {
          num: "Sujet 2 (Développement & Citoyenneté)",
          points: "20 points",
          question: "« Le maître d'école primaire est le premier bâtisseur de la République et du patriotisme économique. »",
          details: [
            "Partagez-vous ce point de vue ? Montrez d'abord comment l'instituteur façonne les fondements de la citoyenneté et du civisme dès le bas âge.",
            "Expliquez ensuite les défis matériels, pédagogiques et sociaux auxquels le corps enseignant fait face en milieu rural et périurbain au Sénégal."
          ]
        }
      ]
    },
    {
      title: "DEUXIÈME ÉPREUVE : TEXTE SUIVI DE QUESTIONS & MAÎTRISE DE LA LANGUE (Durée : 2h — 20 points)",
      points: "20 points (Coeff. 2)",
      textExcerpt: {
        author: "Cheikh Hamidou Kane",
        work: "L'Aventure ambiguë (1961)",
        content: "« L'école nouvelle participe de la nature du canon et de l'aimant. Du canon, elle a l'efficacité de l'arme qui blesse et subjugue ; de l'aimant, elle a la force d'attraction invincible. Les Diallobé, vaincus par les armes, venaient à présent chercher dans l'école le secret de la puissance matérielle de ceux qui les avaient conquis. Mais en apprenant à lier le bois au bois pour construire des demeures solides, n'allaient-ils pas désapprendre la prière et perdre leur âme ? C'était là le dilemme angoissant posé à la Grande Royale et au maître des Diallobé. »"
      },
      questions: [
        {
          num: "I. Compréhension du Texte & Idées Générales",
          points: "4 points",
          question: "Répondez avec précision et concision aux questions suivantes :",
          details: [
            "1. Expliquez la double métaphore employée par l'auteur comparant l'école à un « canon » et à un « aimant ». (2 pts)",
            "2. Quel est le dilemme spirituel et culturel qui tourmente les dignitaires des Diallobé face à l'école moderne ? (2 pts)"
          ]
        },
        {
          num: "II. Vocabulaire & Sémantique",
          points: "4 points",
          question: "Étude lexicale :",
          details: [
            "1. Donnez la signification contextuelle des verbes : « subjuguer » et « lier le bois au bois ». (2 pts)",
            "2. Donnez deux mots de la même famille que « attraction » et employez l'un d'eux dans une phrase personnelle. (2 pts)"
          ]
        },
        {
          num: "III. Grammaire & Maniement de la Langue",
          points: "6 points",
          question: "Analyse logique, syntaxique et transformations :",
          details: [
            "1. Donnez la nature grammaticale et la fonction exacte de la proposition : « qui blesse et subjugue ». (2 pts)",
            "2. Transformez la phrase suivante à la voix passive : « L'école nouvelle transforme les mentalités traditionnelles. » (2 pts)",
            "3. Mettez la phrase au subjonctif présent : « Il est indispensable que les enfants apprennent à préserver leur culture. » (2 pts)"
          ]
        },
        {
          num: "IV. Production d'Écrits Pédagogiques",
          points: "6 points",
          question: "Court essai argumentatif (15 à 20 lignes) :",
          details: [
            "En tant que futur élève-maître, expliquez quelles méthodes actives et bienveillantes vous mettrez en place dans votre classe pour concilier l'enseignement des valeurs traditionnelles sénégalaises (Jom, Kersa, Teranga) avec l'ouverture au monde numérique moderne."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Pour réussir la dissertation du CREM, il est impératif d'adopter un plan dialectique ou thématique rigoureux, de s'abstenir de tout bavardage non argumenté et d'illustrer chaque idée par un exemple tiré du contexte éducatif sénégalais (ex: programmes d'éducation civique de l'élémentaire, rôle des daaras, impact des associations de parents d'élèves APE).",
    conseilsJury: "Le jury valorise l'authenticité de la réflexion, l'absence de clichés et la parfaite maîtrise des accords grammaticaux. Une copie propre, bien aérée et exempte de ratures est un atout déterminant pour figurer dans la liste d'admission principale.",
    sections: [
      {
        title: "Corrigé Détaillé du Sujet 1 : « L'éducation n'est pas seulement l'affaire de l'école »",
        points: "20 points",
        solution: `PLAN DÉTAILLÉ DE RÉDACTION :

1. INTRODUCTION (4 points) :
• Accroche : Depuis des décennies, l'opinion publique a tendance à imputer tous les maux de la jeunesse (délinquance, indiscipline, perte des repères) à l'école. Pourtant, un proverbe africain bien connu rappelle qu'« il faut tout un village pour élever un enfant ».
• Définition des termes : L'éducation désigne le processus global de développement moral, physique et intellectuel d'un être humain. L'école en est le cadre institutionnel formel, mais non l'unique vecteur.
• Problématique : Dans quelle mesure la formation citoyenne de l'enfant résulte-t-elle d'une responsabilité conjointe de la famille, de la communauté et de l'institution scolaire ?
• Annonce du plan : Nous examinerons d'abord le rôle premier de la famille en tant que berceau affectif et moral, puis la mission spécifique de l'école dans l'instruction républicaine, avant de démontrer la nécessité d'une alliance communautaire indéfectible.

2. DÉVELOPPEMENT (12 points) :

I. La famille : socle originel et premier repère axiologique (4 points)
- L'acquisition des valeurs cardinales de base : le respect des aînés, la pudeur (Kersa), le sens de l'honneur (Jom) et la dignité s'acquièrent dès le berceau à travers l'exemple parental.
- L'encadrement affectif et émotionnel : une famille équilibrée prémunit l'enfant contre les déviances précoces et lui confère la sécurité nécessaire à l'apprentissage.

II. L'école : sanctuaire de l'universel, de la laïcité et de l'égalité républicaine (4 points)
- La transmission des savoirs formels et des compétences critiques : lire, écrire, compter, raisonner scientifiquement.
- L'apprentissage du vivre-ensemble démocratique : la cour de récréation et la classe transcendent les clivages ethniques, régionaux ou religieux pour forger le citoyen sénégalais conscient de ses devoirs patriotiques.

III. La communauté et la société civile : régulateurs et prolongements éducatifs (4 points)
- Le quartier, le village, les guides communautaires et religieux exercent un regard bienveillant et protecteur sur la jeunesse.
- Les défis contemporains imposent une synergie active : création de comités de veille contre le vagabondage numérique, implication des APE (Associations de Parents d'Élèves) dans la gestion des écoles de quartier.

3. CONCLUSION (4 points) :
• Bilan : L'école ne saurait agir en vase clos sans s'épuiser. L'éducation est une chaîne continue où le maillon familial et le maillon sociétal sont tout aussi déterminants.
• Ouverture : Face à la révolution de l'intelligence artificielle et des réseaux sociaux, ne devrions-nous pas repenser un pacte éducatif national refondé unissant maîtres, parents et sages de la nation ?`
      },
      {
        title: "Corrigé des Questions de Langue & Grammaire (Texte de Cheikh Hamidou Kane)",
        points: "20 points",
        solution: `I. Compréhension (4 pts) :
1. Le « canon » symbolise la brutalité conquérante de la colonisation militaire occidentale, tandis que « l'aimant » incarne la séduction irrésistible de la science, de la technique et du modernisme matériel occidental.
2. Le dilemme consiste à choisir entre l'efficacité matérielle apportée par l'école européenne et la préservation de la spiritualité et des racines islamo-africaines ancestrales des Diallobé.

II. Vocabulaire (4 pts) :
1. « Subjuguer » : réduire à l'obéissance totale, dominer irrésistiblement. « Lier le bois au bois » : métaphore de l'apprentissage des techniques de construction et de la technologie moderne.
2. Mots de la même famille qu'attraction : attractif, attirer, attracteur. Phrase : « Les filières scientifiques exercent un pouvoir hautement attractif sur les jeunes lauréats. »

III. Grammaire (6 pts) :
1. « qui blesse et subjugue » : proposition subordonnée relative, introduite par le pronom relatif « qui », ayant pour antécédent le nom « arme » (ou « arme qui blesse »).
2. Voix passive : « Les mentalités traditionnelles sont transformées par l'école nouvelle. »
3. Subjonctif : « Il est indispensable que les enfants apprennent (verbe apprendre au présent du subjonctif, 3e pers. du pluriel) à préserver leur culture. »

IV. Production écrite (6 pts) :
Notation selon la clarté des propositions pédagogiques concrètes (instauration de l'heure du conte et de la sagesse africaine, débats civiques réguliers, ateliers numériques encadrés).`
      }
    ]
  },
  bareme: [
    { critere: "Compréhension du sujet & Problématisation", points: "4 pts", description: "Clarté de la problématique, pertinence de l'accroche et cohérence de l'annonce du plan." },
    { critere: "Qualité de l'argumentation & Exemples sénégalais", points: "8 pts", description: "Richesse des arguments, transitions fluides, illustrations locales crédibles et variées." },
    { critere: "Structure logique du plan (3 parties équilibrées)", points: "4 pts", description: "Respect de la structure canonique de la dissertation sans saut d'idées." },
    { critere: "Correction de la langue & Vocabulaire", points: "4 pts", description: "Orthographe irréprochable, syntaxe fluide, vocabulaire académique soutenu." }
  ]
};

// =========================================================================
// 2. CONCOURS FASTEF (CAPES & CAEM - Enseignement Moyen & Secondaire)
// =========================================================================
export const FASTEF_EXAM: OfficialExamDocument = {
  id: "concours-fastef",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Officielle 2024 / 2025",
  title: "Concours FASTEF (ex-ENS) — Recrutement des Professeurs de Lycée & Collège",
  subject: "Pédagogie Générale, Didactique & Culture Éducative",
  institution: "Université Cheikh Anta Diop de Dakar (UCAD) — FASTEF",
  duration: "4 heures",
  coefficient: 3,
  color: "bg-indigo-900",
  downloads: "5 940",
  pages_info: "Sujet Officiel d'Admissibilité + Corrigé Type",
  instructions: [
    "L'épreuve vise à évaluer la maturité intellectuelle, la culture épistémologique et les aptitudes didactiques des futurs professeurs de l'enseignement secondaire.",
    "La réflexion doit intégrer les réformes curriculaires sénégalaises (Approche Par les Compétences, numérisation des apprentissages, enseignement des sciences)."
  ],
  sections: [
    {
      title: "ÉPREUVE UNIQUE D'ADMISSIBILITÉ : DIDACTIQUE GÉNÉRALE & PHILOSOPHIE DE L'ÉDUCATION",
      points: "20 points (Coeff. 3)",
      questions: [
        {
          num: "Sujet de Réflexion Pédagogique",
          points: "20 points",
          question: "« Éduquer, ce n'est pas remplir un vase, c'est allumer un feu. » (Montaigne / Plutarque)",
          details: [
            "1. En vous appuyant sur l'histoire de la pédagogie (de la méthode magistrale transmissive aux méthodes actives socioconstructivistes de Piaget et Vygotski), analysez cette conception de l'acte d'enseigner.",
            "2. Comment le professeur de lycée ou de collège au Sénégal peut-il concrètement allumer ce feu intellectuel face aux effectifs pléthoriques et au manque de matériel didactique ?"
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Montrer la différence fondamentale entre enseignement transmissif passif (le modèle de la 'tête bien pleine' décrié par Montaigne) et la pédagogie active (l'élève acteur de son savoir, la démarche d'investigation en sciences, l'esprit critique en lettres).",
    sections: [
      {
        title: "Synthèse et Pistes de Résolution Pédagogique",
        points: "20 points",
        solution: `I. Dépassement du paradigme transmissif traditionnel :
- La métaphore du vase plein renvoie à l'encyclopédisme passif où l'apprenant mémorise sans comprendre ni pouvoir réinvestir ses savoirs.
- L'allumage du feu symbolise l'éveil de la curiosité épistémique, le développement de l'autonomie intellectuelle et le questionnement critique.

II. Réalités et solutions pour la classe sénégalaise :
- Recours à la pédagogie de projet et au travail collaboratif par petits groupes pour surmonter les contraintes des grands effectifs.
- Exploitation des ressources locales et environnementales pour l'expérimentation scientifique (matériel de récupération, sorties écologiques).
- Intégration raisonnée des ressources numériques (cours téléchargeables, simulateurs gratuits, classes virtuelles).`
      }
    ]
  },
  bareme: [
    { critere: "Maîtrise des théories de l'apprentissage", points: "6 pts", description: "Connaissance des auteurs majeurs (Piaget, Vygotski, Freinet, Meirieu)." },
    { critere: "Pertinence des propositions pour le contexte sénégalais", points: "8 pts", description: "Réalisme didactique face aux contraintes du terrain." },
    { critere: "Rigueur d'expression et plan", points: "6 pts", description: "Style académique châtié et transitions nettes." }
  ]
};

// =========================================================================
// 3. CONCOURS ENA (École Nationale d'Administration du Sénégal)
// =========================================================================
export const ENA_EXAM: OfficialExamDocument = {
  id: "concours-ena",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Nationale d'Élite 2024 / 2025",
  title: "Concours ENA Sénégal — Section Diplomatie, Administration Générale, Trésor",
  subject: "Droit Public, Finances Publiques & Économie du Développement",
  institution: "École Nationale d'Administration du Sénégal (ENA Dakar)",
  duration: "4 heures",
  coefficient: 4,
  color: "bg-blue-900",
  downloads: "6 780",
  pages_info: "Épreuve Officielle d'Admissibilité + Grille de Notation",
  instructions: [
    "Les candidats doivent faire preuve d'une rigueur juridique sans faille et d'une vision stratégique des politiques publiques sénégalaises.",
    "Forme attendue : Dissertation administrative rigoureusement charpentée en deux parties et deux sous-parties (I. A, B — II. A, B)."
  ],
  sections: [
    {
      title: "ÉPREUVE DE DROIT CONSTITUTIONNEL & INSTITUTIONS PUBLIQUES SÉNÉGALAISES",
      points: "20 points (Coeff. 4)",
      questions: [
        {
          num: "Sujet Majeur d'Admissibilité",
          points: "20 points",
          question: "« Le Conseil Constitutionnel et la régulation du jeu politique au Sénégal : arbitre juridictionnel ou garant de la continuité démocratique ? »",
          details: [
            "Analysez l'évolution des compétences du Conseil Constitutionnel sénégalais à la lumière des récents contentieux électoraux.",
            "Étudiez la conciliation entre le respect strict de la légalité constitutionnelle et l'impératif de préservation de la paix civile et de la stabilité institutionnelle."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Plan bipartite strict requis pour les concours de la haute fonction publique (I. La consolidation du rôle juridictionnel du Conseil — II. Les impératifs d'adaptation face aux défis démocratiques contemporains).",
    sections: [
      {
        title: "Cadre d'Analyse Juridique",
        points: "20 points",
        solution: `I. UN ARBITRE JURIDICTIONNEL AU CŒUR DE L'ÉTAT DE DROIT
A. Le contrôle de constitutionnalité et la régulation des pouvoirs publics (compétences d'attribution, contrôle a priori des lois ordinaires et organiques).
B. Le juge électoral impartial : proclamation des résultats définitifs et examen de la recevabilité des candidatures.

II. UN GARANT STRATÉGIQUE DE LA CONTINUITÉ INSTITUTIONNELLE
A. La gestion des crises électorales et la préservation du calendrier républicain.
B. Les perspectives de réformes : vers un élargissement de la saisine citoyenne (QPC) et le renforcement de l'indépendance de la haute juridiction.`
      }
    ]
  },
  bareme: [
    { critere: "Exactitude des références textuelles et jurisprudentielles", points: "8 pts", description: "Citations précises de la Constitution de 2001 révisée et des décisions du Conseil." },
    { critere: "Structure bipartite rigoureuse", points: "6 pts", description: "Équilibre strict des sous-parties avec chapeaux et transitions." },
    { critere: "Style administratif soutenu", points: "6 pts", description: "Neutralité axiologique, précision des concepts de droit public." }
  ]
};

// =========================================================================
// 4. CONCOURS CFJ (Centre de Formation Judiciaire - Magistrature)
// =========================================================================
export const CFJ_EXAM: OfficialExamDocument = {
  id: "concours-cfj",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Officielle 2024 / 2025",
  title: "Concours CFJ Sénégal — Section Magistrature & Greffiers en Chef",
  subject: "Droit Pénal Général & Procédure Pénale Sénégalaise",
  institution: "Centre de Formation Judiciaire (CFJ Dakar) — Ministère de la Justice",
  duration: "4 heures",
  coefficient: 4,
  color: "bg-slate-900",
  downloads: "4 320",
  pages_info: "Cas Pratique d'Admissibilité + Corrigé Juridique Type",
  instructions: [
    "Code pénal et Code de procédure pénale non annotés autorisés.",
    "Raisonnement sous forme de syllogisme juridique obligatoire (Majeure, Mineure, Conclusion)."
  ],
  sections: [
    {
      title: "CAS PRATIQUE DE DROIT PÉNAL ET PROCÉDURE PÉNALE",
      points: "20 points (Coeff. 4)",
      questions: [
        {
          num: "Casus Juridique",
          points: "20 points",
          question: "Dans la nuit du 14 mai à Dakar, un commerçant surprend deux individus en train de forcer la porte métallique de sa boutique. Armé d'un gourdin, il assène un coup violent à l'un d'eux qui s'effondre avec une fracture crânienne, tandis que le second prend la fuite.",
          details: [
            "1. Qualifiez juridiquement les actes posés par les cambrioleurs et par le commerçant selon le Code Pénal sénégalais.",
            "2. Le commerçant peut-il valablement invoquer la légitime défense (article 316 et suivants du Code pénal) ? Quelles en sont les conditions légales strictes ?",
            "3. Décrivez la procédure régulière de garde à vue et les droits fondamentaux de l'interpellé garantis par la loi."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Pour chaque infraction, expliciter l'élément légal (texte d'incrimination), l'élément matériel (actes positifs constatés) et l'élément moral (intention coupable).",
    sections: [
      {
        title: "Résolution Juridique du Cas Pratique",
        points: "20 points",
        solution: `1. Qualification : Tentative de vol aggravé (vol commis la nuit avec effraction par deux individus) puni de peines criminelles par les articles 364 et suivants du Code pénal sénégalais.
2. Examen de la légitime défense :
- L'article 316 présume la légitime défense en cas de repoussement de nuit d'une escalade ou effraction de maison habitée.
- Cependant, la jurisprudence sénégalaise exige la proportionnalité entre les moyens de riposte employés et la gravité de l'attaque. Si le voleur fuyait ou était désarmé, l'excès de légitime défense est caractérisé.
3. Garde à vue : Durée légale de 48h renouvelable une fois sur autorisation écrite du Procureur de la République. Droit immédiat à l'examen médical et à l'assistance d'un avocat dès la première heure.`
      }
    ]
  },
  bareme: [
    { critere: "Rigueur du syllogisme juridique", points: "8 pts", description: "Enchaînement logique sans extrapolation des faits." },
    { critere: "Visas exacts des articles de loi", points: "6 pts", description: "Exactitude des références textuelles sénégalaises." },
    { critere: "Clarté des conclusions de qualification", points: "6 pts", description: "Détermination nette des responsabilités pénales." }
  ]
};

// =========================================================================
// 5. CONCOURS DES DOUANES SÉNÉGALAISES
// =========================================================================
export const DOUANES_EXAM: OfficialExamDocument = {
  id: "concours-douanes",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Officielle 2024 / 2025",
  title: "Concours des Douanes Sénégalaises — Contrôleurs & Préposés des Douanes",
  subject: "Économie Douanière, ZLECAf & Fiscalité des Échanges Extérieurs",
  institution: "Direction Générale des Douanes — Ministère des Finances et du Budget",
  duration: "3 heures",
  coefficient: 3,
  color: "bg-amber-900",
  downloads: "5 110",
  pages_info: "Sujet Officiel d'Épreuve Écrite + Corrigé Économique",
  instructions: [
    "Les candidats doivent maîtriser les enjeux du commerce extérieur, les missions fiscales et de surveillance de la douane sénégalaise."
  ],
  sections: [
    {
      title: "ÉPREUVE DE CULTURE ÉCONOMIQUE ET DOUANIÈRE",
      points: "20 points",
      questions: [
        {
          num: "Sujet de Dissertation Économique",
          points: "20 points",
          question: "« Entre facilitation des échanges et protection de la production locale : les défis de la Douane sénégalaise à l'ère de la Zone de Libre-Échange Continentale Africaine (ZLECAf). »",
          details: [
            "1. Présentez les missions fondamentales de la Douane sénégalaise (fiscale, économique, sécuritaire et environnementale).",
            "2. Analysez l'impact de l'ouverture tarifaire continentale sur les recettes budgétaires de l'État sénégalais et proposez des solutions d'adaptation (modernisation technologique, scannage automatisé, gestion des risques Gaïndé)."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Démontrer que la douane moderne n'est plus une simple barrière fiscale de perception, mais un levier de compétitivité industrielle et de sécurité du territoire national.",
    sections: [
      {
        title: "Éléments de Corrigé",
        points: "20 points",
        solution: `I. Le double rôle traditionnel et contemporain de la Douane :
- Mission fiscale historique : pourvoyeur majeur de recettes pour le budget national du Sénégal.
- Mission de surveillance et de santé publique : lutte contre les faux médicaments, les stupéfiants et les produits prohibés.

II. Les impératifs imposés par la ZLECAf :
- Baisse programmée des droits de douane intra-africains nécessitant un élargissement de l'assiette de TVA intérieure.
- Accélération des délais de dédouanement au Port Autonome de Dakar grâce au système dématérialisé GAINDÉ et au guichet unique ORBUS.`
      }
    ]
  },
  bareme: [
    { critere: "Connaissance du dispositif douanier sénégalais", points: "8 pts", description: "Systèmes Gaïndé, Orbus, tarif extérieur commun CEDEAO." },
    { critere: "Analyse économique de la ZLECAf", points: "6 pts", description: "Compréhension des flux et du démantèlement tarifaire." },
    { critere: "Qualité rédactionnelle", points: "6 pts", description: "Clarté et précision des termes commerciaux." }
  ]
};

// =========================================================================
// 6. CONCOURS POLICE & GENDARMERIE NATIONALE
// =========================================================================
export const POLICE_EXAM: OfficialExamDocument = {
  id: "concours-police",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Officielle 2024 / 2025",
  title: "Concours Police & Gendarmerie — Officiers, Sous-Officiers et Inspecteurs",
  subject: "Sécurité Publique, Déontologie & Rédaction Civique",
  institution: "Ministère de l'Intérieur / Haut Commandement de la Gendarmerie Nationale",
  duration: "3 heures",
  coefficient: 3,
  color: "bg-slate-800",
  downloads: "6 250",
  pages_info: "Épreuve Officielle d'Admissibilité + Corrigé Déontologique",
  instructions: [
    "L'épreuve apprécie le sens civique, le respect des droits humains et la capacité d'analyse d'un agent de la force publique."
  ],
  sections: [
    {
      title: "ÉPREUVE DE RÉDACTION CIVIQUE ET SÉCURITAIRE",
      points: "20 points",
      questions: [
        {
          num: "Sujet de Réflexion",
          points: "20 points",
          question: "« La police de proximité et la coproduction de la sécurité : comment restaurer et pérenniser la confiance mutuelle entre les forces de défense et de sécurité et la population sénégalaise ? »",
          details: [
            "Analysez les causes de la défiance réciproque dans certains quartiers urbains.",
            "Formulez des recommandations concrètes pour une sécurité de partenariat respectueuse des libertés fondamentales."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Articuler le devoir régalien d'ordre public avec l'éthique républicaine et la charte déontologique des forces de sécurité.",
    sections: [
      {
        title: "Pistes de Développement",
        points: "20 points",
        solution: `I. Constat et diagnostic des relations citoyens - forces de l'ordre :
- Perceptions négatives nées des contrôles intempestifs ou du manque de communication.
- Nécessité de sortir d'une approche uniquement répressive au profit de la prévention.

II. Les leviers de la coproduction de sécurité :
- Implication des comités de quartier et des notables dans la médiation sociale.
- Formation continue des policiers et gendarmes aux droits de l'homme, à l'accueil du public et à la gestion non violente des foules.`
      }
    ]
  },
  bareme: [
    { critere: "Sens de l'intérêt général et déontologie", points: "8 pts", description: "Respect des valeurs de la République et des droits humains." },
    { critere: "Pertinence des propositions pratiques", points: "6 pts", description: "Solutions réalistes adaptées aux grandes agglomérations." },
    { critere: "Qualité d'expression", points: "6 pts", description: "Clarté, sobriété du ton et orthographe." }
  ]
};

// =========================================================================
// 7. CONCOURS POLYTECHNIQUE (EPT Thiès / ESP Dakar)
// =========================================================================
export const EPT_EXAM: OfficialExamDocument = {
  id: "concours-ept",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Nationale d'Ingénieurs 2024 / 2025",
  title: "Concours d'Ingénieurs EPT Thiès / ESP Dakar — Diplôme d'Ingénieur de Conception",
  subject: "Mathématiques Générales & Physique Rationnelle",
  institution: "École Polytechnique de Thiès (EPT) / ESP UCAD",
  duration: "4 heures (Maths) + 3 heures (Physique)",
  coefficient: 5,
  color: "bg-cyan-900",
  downloads: "7 150",
  pages_info: "Sujet Intégral d'Élite + Corrigé Mathématique Avancé",
  instructions: [
    "Calculatrices programmables interdites. Seules les calculatrices scientifiques simples non graphiques sont tolérées.",
    "La plus grande clarté et concision dans les démonstrations algébriques sont exigées par le jury d'admission."
  ],
  sections: [
    {
      title: "PROBLÈME 1 : ALGÈBRE LINÉAIRE & ESPACES VECTORIELS (10 points)",
      points: "10 points",
      questions: [
        {
          num: "Étude d'un Endomorphisme Nilpotent",
          points: "5 points",
          question: "Soit E un espace vectoriel de dimension finie n sur ℝ. Soit f un endomorphisme de E tel que f^n = 0 et f^(n-1) ≠ 0.",
          details: [
            "1. Démontrer qu'il existe un vecteur x₀ de E tel que la famille (x₀, f(x₀), f²(x₀), ..., f^(n-1)(x₀)) soit une base de E.",
            "2. Écrire la matrice de f dans cette base (matrice de Jordan associée).",
            "3. Déterminer le polynôme caractéristique et le polynôme minimal de f. f est-il diagonalisable ?"
          ]
        },
        {
          num: "Calcul de Puissances et Exponentielle de Matrice",
          points: "5 points",
          question: "Soit A = I + N, où I est la matrice identité d'ordre n et N la matrice nilpotente précédente.",
          details: [
            "1. Justifier que pour tout k ∈ ℕ, A^k peut se calculer par la formule du binôme de Newton.",
            "2. En déduire l'inversibilité de A et donner l'expression explicite de son inverse A^(-1) en fonction des puissances de N."
          ]
        }
      ]
    },
    {
      title: "PROBLÈME 2 : ANALYSE & INTÉGRALES IMPROPRES DE DIRICHLET (10 points)",
      points: "10 points",
      questions: [
        {
          num: "Convergence et Calcul d'Intégrale",
          points: "10 points",
          question: "On considère pour tout x > 0 la fonction F(x) = ∫₀^∞ (sin(t) / t) · e^(-xt) dt.",
          details: [
            "1. Justifier la convergence de l'intégrale définissant F(x) pour tout x > 0.",
            "2. Démontrer que F est dérivable sur ]0, +∞[ et calculer sa dérivée F'(x).",
            "3. En déduire que F(x) = (π/2) - arctan(x), puis établir la célèbre valeur de l'intégrale de Dirichlet : ∫₀^∞ (sin(t) / t) dt = π / 2."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Rigueur absolue dans les justifications de liberté de familles et application licite du théorème de dérivation sous le signe intégral.",
    sections: [
      {
        title: "Résolution Mathématique Complète",
        points: "20 points",
        solution: `1. Liberté de la famille : Supposons λ₀ x₀ + λ₁ f(x₀) + ... + λ_(n-1) f^(n-1)(x₀) = 0. En appliquant f^(n-1), tous les termes s'annulent sauf le premier : λ₀ f^(n-1)(x₀) = 0. Comme f^(n-1)(x₀) ≠ 0, λ₀ = 0. Par récurrence immédiate, tous les λ_i = 0. La famille est donc libre ; ayant n éléments dans un espace de dimension n, elle forme une base de E.
2. Matrice : Matrice compagnon comportant des 1 sur la sous-diagonale et des 0 partout ailleurs.
3. Polynôme caractéristique : P_f(X) = (-1)^n X^n. Unique valeur propre 0. Si f était diagonalisable, f serait l'endomorphisme nul, ce qui contredit f^(n-1) ≠ 0. Donc f n'est pas diagonalisable.
4. Intégrale de Dirichlet : F'(x) = -∫₀^∞ sin(t) e^(-xt) dt = -1 / (1 + x²). En intégrant : F(x) = C - arctan(x). La limite en +∞ donne C = π/2. La continuité en 0 permet de conclure à π/2.`
      }
    ]
  },
  bareme: [
    { critere: "Rigueur des démonstrations algébriques", points: "10 pts", description: "Justifications complètes des étapes sans saut logique." },
    { critere: "Justification de dérivation de l'intégrale", points: "6 pts", description: "Domination sur tout segment compact de ]0, +∞[." },
    { critere: "Résultats numériques exacts", points: "4 pts", description: "Valeur correcte de la constante d'intégration." }
  ]
};

// =========================================================================
// 8. BACCALAURÉAT SÉNÉGALAIS S2 — MATHÉMATIQUES (Session Officielle)
// =========================================================================
export const BACS2_EXAM: OfficialExamDocument = {
  id: "lyc-1",
  level: "BAC S2",
  cycle: "Lycee",
  session: "Session Normale 2024 / 2025",
  title: "Baccalauréat Sénégalais — Mathématiques Séries S1 & S2",
  subject: "Mathématiques Générales (Algèbre, Probabilités, Analyse)",
  institution: "Office du Baccalauréat du Sénégal — Université Cheikh Anta Diop (UCAD)",
  duration: "4 heures",
  coefficient: 5,
  color: "bg-sama-blue",
  downloads: "9 840",
  pages_info: "Épreuve Officielle Complète + Corrigé Pas à Pas",
  instructions: [
    "L'usage de la calculatrice non graphique et non programmable est autorisé.",
    "La qualité de la rédaction, la clarté des raisonnements et la précision des tracés graphiques entreront pour une part importante dans l'appréciation des copies."
  ],
  sections: [
    {
      title: "EXERCICE 1 : NOMBRES COMPLEXES & SIMILITUDES DIRECTES (4 points)",
      points: "4 points",
      questions: [
        {
          num: "Résolution d'équation dans ℂ",
          points: "2 points",
          question: "Soit l'équation (E) : z² - 2(√3)z + 4 = 0.",
          details: [
            "1. Résoudre dans l'ensemble des nombres complexes ℂ l'équation (E). On notera z₁ la solution dont la partie imaginaire est strictement positive et z₂ son conjugué.",
            "2. Écrire z₁ et z₂ sous forme trigonométrique et sous forme exponentielle r·e^(iθ)."
          ]
        },
        {
          num: "Configuration géométrique du plan complexe",
          points: "2 points",
          question: "Dans le plan complexe rapporté à un repère orthonormé direct (O, u⃗, v⃗), on considère les points A d'affixe z_A = √3 + i, B d'affixe z_B = √3 - i et C d'affixe z_C = 2i.",
          details: [
            "1. Calculer (z_C - z_A) / (z_B - z_A) et déterminer sa forme exponentielle.",
            "2. En déduire la nature précise du triangle ABC.",
            "3. Déterminer les éléments caractéristiques (rapport, angle et centre) de la similitude plane directe S qui transforme A en C et laisse B invariant."
          ]
        }
      ]
    },
    {
      title: "EXERCICE 2 : PROBABILITÉS & VARIABLES ALÉATOIRES (5 points)",
      points: "5 points",
      questions: [
        {
          num: "Tirage dans une urne de semences sélectionnées",
          points: "5 points",
          question: "Une coopérative agricole à Kaolack dispose d'un sac de semences certifiées contenant 4 graines d'arachide de variété précoce, 3 graines de maïs hybride et 3 graines de mil.",
          details: [
            "On prélève simultanément et au hasard 3 graines dans ce sac.",
            "1. Calculer la probabilité de chacun des événements suivants :",
            "   • A : « Obtenir exactement 2 graines d'arachide ».",
            "   • B : « Obtenir au moins une graine de chaque espèce ».",
            "2. Soit X la variable aléatoire désignant le nombre de graines d'arachide tirées.",
            "   a) Déterminer la loi de probabilité de X.",
            "   b) Calculer l'espérance mathématique E(X) et interpréter le résultat.",
            "   c) Calculer la variance V(X) et l'écart-type σ(X)."
          ]
        }
      ]
    },
    {
      title: "PROBLÈME : ÉTUDE DE FONCTION EXPONENTIELLE & CALCUL D'AIRE (11 points)",
      points: "11 points",
      questions: [
        {
          num: "Partie A : Étude d'une fonction auxiliaire g",
          points: "3 points",
          question: "Soit g la fonction définie sur ℝ par g(x) = (1 - x)e^x - 1.",
          details: [
            "1. Étudier les variations de g et dresser son tableau de variations.",
            "2. En déduire le signe de g(x) pour tout réel x."
          ]
        },
        {
          num: "Partie B : Étude de la fonction principale f",
          points: "6 points",
          question: "Soit f la fonction définie sur ℝ par f(x) = (2 - x)e^x + x - 2.",
          details: [
            "1. Calculer la limite de f en -∞. Démontrer que la droite (D) d'équation y = x - 2 est asymptote oblique à la courbe (C_f) au voisinage de -∞.",
            "2. Préciser la position relative de (C_f) par rapport à l'asymptote (D).",
            "3. Calculer la limite de f en +∞, puis étudier la branche parabolique.",
            "4. Démontrer que pour tout x réel, f'(x) = g(x). En déduire le sens de variation de f.",
            "5. Tracer avec soin la droite (D) et la courbe (C_f) dans un repère orthonormé d'unité 2 cm."
          ]
        },
        {
          num: "Partie C : Calcul d'intégrale et aire géométrique",
          points: "2 points",
          question: "Calcul d'aire du domaine délimité :",
          details: [
            "1. À l'aide d'une intégration par parties, calculer I = ∫₀¹ (2 - x)e^x dx.",
            "2. En déduire l'aire 𝒜 en cm² du domaine plan délimité par la courbe (C_f), l'asymptote (D) et les droites verticales x = 0 et x = 1."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Résolution pas à pas avec vérification systématique des conditions d'application de l'intégration par parties et du théorème des valeurs intermédiaires.",
    sections: [
      {
        title: "Corrigé Exercice 1 (Complexes)",
        points: "4 points",
        solution: `1. Équation (E) : Δ' = (√3)² - 4 = 3 - 4 = -1 = i².
Les racines sont z₁ = √3 + i et z₂ = √3 - i.
Forme trigonométrique :
|z₁| = √(3 + 1) = 2. cos θ₁ = √3/2, sin θ₁ = 1/2 ⇒ θ₁ = π/6 [2π].
Donc z₁ = 2(cos(π/6) + i sin(π/6)) = 2·e^(iπ/6).
De même, z₂ = 2·e^(-iπ/6).

2. Géométrie :
(z_C - z_A) / (z_B - z_A) = (2i - √3 - i) / (√3 - i - √3 - i) = (-√3 + i) / (-2i) = (√3/2)i + 1/2 = e^(iπ/3).
Le module vaut 1 et l'argument π/3, ce qui démontre rigoureusement que le triangle ABC est un triangle équilatéral direct.`
      },
      {
        title: "Corrigé Exercice 2 (Probabilités)",
        points: "5 points",
        solution: `Nombre total d'issues possibles : C(10, 3) = (10 × 9 × 8) / (3 × 2 × 1) = 120 tirages équiprobables.
• Événement A (2 arachides, 1 autre) : C(4, 2) × C(6, 1) = 6 × 6 = 36. Probabilité P(A) = 36/120 = 3/10 = 0,30.
• Événement B (1 arachide, 1 maïs, 1 mil) : C(4, 1) × C(3, 1) × C(3, 1) = 4 × 3 × 3 = 36. P(B) = 36/120 = 0,30.
• Loi de X : X prend les valeurs {0, 1, 2, 3}.
P(X=0) = C(6,3)/120 = 20/120 = 1/6.
P(X=1) = C(4,1)×C(6,2)/120 = 60/120 = 1/2.
P(X=2) = 36/120 = 3/10.
P(X=3) = C(4,3)/120 = 4/120 = 1/30.
Espérance mathématique E(X) = 0 + 60/120 + 72/120 + 12/120 = 144/120 = 1,2 graine d'arachide en moyenne.`
      },
      {
        title: "Corrigé Problème (Analyse & Intégrale)",
        points: "11 points",
        solution: `Partie A : g'(x) = -e^x + (1-x)e^x = -x·e^x.
g'(x) > 0 pour x < 0 et g'(x) < 0 pour x > 0.
Maximum atteint en 0 : g(0) = (1-0)e⁰ - 1 = 0.
Par conséquent, pour tout réel x, g(x) ≤ 0, avec égalité uniquement en 0.

Partie B : lim_(x→-∞) (2-x)e^x = 0 car lim x·e^x = 0. Donc lim_(x→-∞) f(x) - (x-2) = 0.
La droite (D) y = x - 2 est bien asymptote oblique. Comme (2-x)e^x > 0 pour x < 2, la courbe (C_f) est au-dessus de (D) sur ]-∞, 2[.

Partie C : Intégration par parties :
Posons u(x) = 2 - x ⇒ u'(x) = -1. v'(x) = e^x ⇒ v(x) = e^x.
I = [(2-x)e^x]₀¹ - ∫₀¹ (-1)e^x dx = (e - 2) + [e^x]₀¹ = e - 2 + e - 1 = 2e - 3.
Aire 𝒜 = I × unité d'aire = (2e - 3) × 4 cm² = 8e - 12 cm² ≈ 9,75 cm².`
      }
    ]
  },
  bareme: [
    { critere: "Exercice 1 : Nombres complexes", points: "4 pts", description: "Équation du 2nd degré, formes exponentielles, similitude directe." },
    { critere: "Exercice 2 : Probabilités", points: "5 pts", description: "Dénombrement équiprobable, loi de variable aléatoire et espérance." },
    { critere: "Problème : Étude de fonction et calcul intégral", points: "11 pts", description: "Étude de g, asymptote oblique, variations de f, intégration par parties." }
  ]
};

// =========================================================================
// 9. BFEM SÉNÉGAL (Brevet de Fin d'Études Moyennes - Collège 3e)
// =========================================================================
export const BFEM_EXAM: OfficialExamDocument = {
  id: "col-1",
  level: "Collège (3e/BFEM)",
  cycle: "College",
  session: "Session Officielle Nationale 2024 / 2025",
  title: "Brevet de Fin d'Études Moyennes (BFEM) — Mathématiques",
  subject: "Activités Numériques & Activités Géométriques",
  institution: "Ministère de l'Éducation Nationale — DEXCO",
  duration: "2 heures",
  coefficient: 3,
  color: "bg-sama-blue",
  downloads: "8 720",
  pages_info: "Sujet Officiel Brevet + Grille de Notation Nationale",
  instructions: [
    "Les calculatrices sont autorisées.",
    "La propreté de la copie et la clarté du raisonnement géométrique sont prises en compte pour 2 points dans le barème."
  ],
  sections: [
    {
      title: "PREMIÈRE PARTIE : ACTIVITÉS NUMÉRIQUES (10 points)",
      points: "10 points",
      questions: [
        {
          num: "Exercice 1 : Racines carrées et quotients",
          points: "5 points",
          question: "Opérations et simplifications algébriques :",
          details: [
            "1. Écrire le nombre A = √108 - 2√75 + 3√12 sous la forme a√3 où a est un entier relatif.",
            "2. Rendre rationnel le dénominateur de la fraction B = (2√3) / (3 - √5).",
            "3. Comparer les nombres 2√7 et 3√3 en comparant leurs carrés."
          ]
        },
        {
          num: "Exercice 2 : Calcul littéral et inéquations",
          points: "5 points",
          question: "Factorisation et étude de signe :",
          details: [
            "Soit l'expression littérale E(x) = (3x - 2)² - (x + 4)².",
            "1. Développer, réduire et ordonner E(x).",
            "2. Factoriser E(x) sous la forme d'un produit de deux facteurs du premier degré.",
            "3. Résoudre dans ℝ l'équation E(x) = 0.",
            "4. Dresser le tableau de signes et résoudre l'inéquation (4x + 2)(2x - 6) ≤ 0. Représenter l'ensemble des solutions sur une droite graduée."
          ]
        }
      ]
    },
    {
      title: "DEUXIÈME PARTIE : ACTIVITÉS GÉOMÉTRIQUES & PROBLÈME (10 points)",
      points: "10 points",
      questions: [
        {
          num: "Exercice 3 : Trigonométrie et relations métriques",
          points: "5 points",
          question: "Triangle rectangle et projections orthogonales :",
          details: [
            "Soit ABC un triangle tel que AB = 6 cm, AC = 8 cm et BC = 10 cm.",
            "1. Démontrer à l'aide de la réciproque du théorème de Pythagore que ABC est un triangle rectangle en A.",
            "2. Calculer cos(B̂), sin(B̂) et tan(B̂). En déduire la mesure de l'angle B̂ arrondie au degré près.",
            "3. Soit H le projeté orthogonal de A sur le côté [BC]. Démontrer que AH × BC = AB × AC, puis en déduire la longueur exacte de AH."
          ]
        },
        {
          num: "Problème : Aménagement d'une parcelle agricole à Thiès",
          points: "5 points",
          question: "Un groupement de femmes maraîchères de Pout souhaite clôturer un terrain trapézoïdal.",
          details: [
            "La petite base mesure 40 m, la grande base 70 m et la hauteur 30 m.",
            "1. Calculer l'aire totale de la parcelle en mètres carrés, puis en ares.",
            "2. Sachant qu'un mètre de grillage coûte 1 800 FCFA et qu'on réserve une porte d'entrée de 4 m, calculez la dépense totale engagée pour la clôture si le périmètre vaut 185 m."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Pour les racines carrées, décomposer en produit de facteurs premiers. En géométrie, toujours énoncer explicitement le théorème avant de poser les calculs.",
    sections: [
      {
        title: "Corrigé Activités Numériques",
        points: "10 points",
        solution: `1. Racines carrées :
A = √(36×3) - 2√(25×3) + 3√(4×3) = 6√3 - 2(5√3) + 3(2√3) = (6 - 10 + 6)√3 = 2√3.
Fraction B : (2√3)(3 + √5) / ((3 - √5)(3 + √5)) = (6√3 + 2√15) / (9 - 5) = (6√3 + 2√15) / 4 = (3√3 + √15) / 2.
Comparaison : (2√7)² = 28 et (3√3)² = 27. Comme 28 > 27 et que les deux nombres sont positifs, 2√7 > 3√3.

2. Factorisation :
E(x) = [(3x - 2) - (x + 4)] [(3x - 2) + (x + 4)] = (2x - 6)(4x + 2).
Équation E(x) = 0 ⇔ 2x - 6 = 0 ou 4x + 2 = 0 ⇔ x = 3 ou x = -1/2. S = {-1/2 ; 3}.`
      },
      {
        title: "Corrigé Activités Géométriques & Problème",
        points: "10 points",
        solution: `1. Pythagore : BC² = 100. AB² + AC² = 36 + 64 = 100. Comme BC² = AB² + AC², d'après la réciproque du théorème de Pythagore, le triangle ABC est rectangle en A.
2. Trigonométrie : cos(B̂) = AB / BC = 6 / 10 = 0,6. À la calculatrice, B̂ ≈ 53°.
3. Hauteur AH : L'aire du triangle vaut (AB × AC)/2 = (BC × AH)/2 ⇒ AH = (6 × 8) / 10 = 48 / 10 = 4,8 cm.
4. Problème parcelle :
Aire trapèze = ((Grande base + Petite base) × Hauteur) / 2 = ((70 + 40) × 30) / 2 = (110 × 30) / 2 = 1 650 m² = 16,5 ares.
Longueur du grillage = Périmètre - porte = 185 m - 4 m = 181 m.
Dépense totale = 181 m × 1 800 FCFA = 325 800 FCFA.`
      }
    ]
  },
  bareme: [
    { critere: "Activités numériques (Racines et factorisation)", points: "10 pts", description: "Exactitude des étapes de calcul et factorisation propre." },
    { critere: "Activités géométriques (Pythagore et trigonométrie)", points: "5 pts", description: "Énoncé rigoureux des théorèmes et calculs d'angles." },
    { critere: "Résolution de problème de la vie courante", points: "5 pts", description: "Calcul d'aire et budget de clôture sans faute." }
  ]
};

// =========================================================================
// 10. CFEE SÉNÉGAL (Certificat de Fin d'Études Élémentaires - CM2)
// =========================================================================
export const CFEE_EXAM: OfficialExamDocument = {
  id: "prim-1",
  level: "Primaire (CM2/CFEE)",
  cycle: "Primaire",
  session: "Session Officielle 2024 / 2025",
  title: "Certificat de Fin d'Études Élémentaires (CFEE) & Entrée en 6e",
  subject: "Contrôle des Ressources & Résolution de Problèmes",
  institution: "Ministère de l'Éducation Nationale — DEXCO",
  duration: "1h 30min",
  coefficient: 2,
  color: "bg-sama-blue",
  downloads: "7 890",
  pages_info: "Sujet Officiel CFEE + Grille de Correction Nationale",
  instructions: [
    "Posez et effectuez soigneusement toutes les opérations sur la copie d'examen.",
    "Présentez la résolution du problème en deux colonnes : Solutions à gauche, Opérations posées à droite."
  ],
  sections: [
    {
      title: "PREMIÈRE ÉPREUVE : CONTRÔLE DES RESSOURCES (40 points)",
      points: "40 points",
      questions: [
        {
          num: "Activités Numériques & Opérations",
          points: "20 points",
          question: "Posez et effectuez les opérations suivantes :",
          details: [
            "1. 45 879,65 + 8 493,8 = ...",
            "2. 75 000 - 38 467,45 = ...",
            "3. 648 × 75,5 = ...",
            "4. 4 392 ÷ 36 = ..."
          ]
        },
        {
          num: "Activités de Mesure & Géométrie",
          points: "20 points",
          question: "Conversions et constructions :",
          details: [
            "1. Convertissez dans l'unité demandée : 4,5 ha = ... m² | 3 850 kg = ... quintaux.",
            "2. Tracez un rectangle de 8 cm de longueur et de 5 cm de largeur. Calculez son périmètre et son aire."
          ]
        }
      ]
    },
    {
      title: "DEUXIÈME ÉPREUVE : CONTRÔLE DE LA COMPÉTENCE (Résolution de Problème - 60 points)",
      points: "60 points",
      questions: [
        {
          num: "Énoncé du Problème : La Campagne Maraîchère de Mamadou",
          points: "60 points",
          question: "Mamadou, maraîcher à Sangalkam, exploite un champ rectangulaire de 120 m de long sur 80 m de large.",
          details: [
            "1. Il décide d'entourer son champ de 3 rangées de fil de fer barbelé en laissant une ouverture de 5 m pour la porte. Calculez la longueur totale de fil de fer nécessaire. (20 pts)",
            "2. Le rouleau de 100 m de fil de fer coûte 15 000 FCFA. Calculez la dépense totale engagée pour l'achat du fil de fer. (20 pts)",
            "3. Pendant la récolte, le champ produit 45 cageots d'oignons vendus à 8 500 FCFA le cageot. Les frais de transport et de main-d'œuvre s'élèvent à 62 500 FCFA. Calculez le bénéfice net réalisé par Mamadou. (20 pts)"
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Vérifier le sens des questions, bien aligner les virgules pour les opérations décimales et ne pas oublier les unités de mesure (m, m², FCFA).",
    sections: [
      {
        title: "Corrigé Détaillé du CFEE",
        points: "100 points",
        solution: `I. Opérations (40 pts) :
1. Addition : 45 879,65 + 8 493,8 = 54 373,45.
2. Soustraction : 75 000 - 38 467,45 = 36 532,55.
3. Multiplication : 648 × 75,5 = 48 924.
4. Division : 4 392 ÷ 36 = 122.
Conversions : 4,5 ha = 45 000 m². 3 850 kg = 38,5 quintaux.
Rectangle : Périmètre = (8 + 5) × 2 = 26 cm. Aire = 8 × 5 = 40 cm².

II. Résolution du Problème (60 pts) :
1. Périmètre du champ = (120 + 80) × 2 = 400 m.
Longueur pour 1 tour avec porte = 400 m - 5 m = 395 m.
Longueur totale pour 3 rangées = 395 m × 3 = 1 185 m de fil de fer.
2. Nombre de rouleaux nécessaires = 1 185 ÷ 100 = 11,85, soit 12 rouleaux achetés.
Dépense pour le fil de fer = 12 × 15 000 FCFA = 180 000 FCFA.
(Si calcul exact proportionnel : 1 185 × 150 FCFA = 177 750 FCFA, les deux réponses sont acceptées au barème ministériel).
3. Recette des oignons = 45 cageots × 8 500 FCFA = 382 500 FCFA.
Bénéfice net = 382 500 FCFA - 62 500 FCFA = 320 000 FCFA.`
      }
    ]
  },
  bareme: [
    { critere: "Ressources numériques et opérations posées", points: "40 pts", description: "Alignement des décimaux, tables de multiplication maîtrisées." },
    { critere: "Raisonnement logique du problème", points: "30 pts", description: "Choix des bonnes opérations pour chaque question intermédiaire." },
    { critere: "Exactitude des résultats et unités (FCFA, m)", points: "30 pts", description: "Précision des totaux et unités clairement mentionnées." }
  ]
};

// =========================================================================
// 11. BACCALAURÉAT SÉNÉGALAIS L (Philosophie Séries L & S)
// =========================================================================
export const BACL_EXAM: OfficialExamDocument = {
  id: "lyc-2",
  level: "BAC L",
  cycle: "Lycee",
  session: "Session Normale 2024 / 2025",
  title: "Baccalauréat Sénégalais — Philosophie Séries L1, L2 & L'",
  subject: "Philosophie Générale & Pensée Africaine",
  institution: "Office du Baccalauréat du Sénégal — Université Cheikh Anta Diop (UCAD)",
  duration: "4 heures",
  coefficient: 6,
  color: "bg-sama-blue",
  downloads: "8 210",
  pages_info: "Sujets Officiels de Dissertation & Commentaire + Plans Corrigés",
  instructions: [
    "Le candidat traitera, au choix, l'un des trois sujets proposés.",
    "L'usage du dictionnaire et de documents personnels est rigoureusement interdit.",
    "La dissertation exige une introduction complète (accroche, définition, problématisation, annonce de plan), un développement dialectique ordonné et une conclusion avec prise de position."
  ],
  sections: [
    {
      title: "ÉPREUVE DE PHILOSOPHIE : TROIS SUJETS AU CHOIX (20 points)",
      points: "20 points (Coeff. 6)",
      questions: [
        {
          num: "Sujet 1 (Dissertation - Philosophie Politique)",
          points: "20 points",
          question: "« L'État est-il le protecteur ou l'ennemi de la liberté des citoyens ? »",
          details: [
            "Convoquez les thèses contractualistes (Hobbes, Locke, Rousseau) et les critiques anarchistes/marxistes.",
            "Illustrez votre réflexion à l'aide des dynamiques démocratiques contemporaines en Afrique."
          ]
        },
        {
          num: "Sujet 2 (Dissertation - Culture & Universalité)",
          points: "20 points",
          question: "« La pluralité des cultures compromet-elle l'idéal d'une humanité universelle ? »",
          details: [
            "Analysez les risques de l'ethnocentrisme et du repli identitaire.",
            "Étudiez le concept de « Civilisation de l'Universel » selon Léopold Sédar Senghor."
          ]
        },
        {
          num: "Sujet 3 (Commentaire de Texte Suivi de Questions)",
          points: "20 points",
          question: "Expliquez le texte suivant de Paulin Hountondji (Sur la « philosophie africaine », 1976) :",
          details: [
            "« L'africanité d'une philosophie ne réside pas dans son contenu thématique, ni dans une quelconque unanimité collective inconsciente, mais dans la liberté critique du débat mené par des Africains eux-mêmes sur tous les problèmes du monde... »",
            "1. Dégagez le thème, la thèse de l'auteur et la structure logique du texte.",
            "2. Expliquez pourquoi Hountondji récuse la notion d'ethnophilosophie collective.",
            "3. Dans une discussion critique argumentée, montrez en quoi la philosophie africaine moderne participe au progrès scientifique et humain."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Proscrire les dissertations à plan unique ou les catalogues de citations sans analyse conceptuelle. Structurer rigoureusement en 3 moments : I. Thèse de la contrainte étatique — II. Antithèse de la libération par la loi — III. Synthèse : l'État de droit démocratique comme condition de possibilité des libertés effectives.",
    sections: [
      {
        title: "Plan Détaillé du Sujet 1 (L'État et la Liberté)",
        points: "20 points",
        solution: `I. L'État perçu comme menace et appareil de coercition :
- La tentation totalitaire et policière de l'appareil étatique.
- La critique anarchiste (Bakounine : « L'État est un vaste cimetière où viennent s'enterrer toutes les manifestations de la vie individuelle ») et marxiste (l'État comme instrument de domination de classe).

II. L'État comme rempart indispensable contre la barbarie de l'état de nature :
- Chez Thomas Hobbes, l'absence d'État engendre la guerre de tous contre tous (« l'homme est un loup pour l'homme »).
- Chez Jean-Jacques Rousseau (Du Contrat Social), la liberté civile issue de la Volonté Générale transcende la liberté animale originelle : « L'obéissance à la loi qu'on s'est prescrite est liberté ».

III. La synthèse : L'État de droit républicain et la souveraineté citoyenne :
- La séparation des pouvoirs (Montesquieu) et le contrôle citoyen garantissent que la puissance publique demeure au service exclusif des droits inaliénables de l'homme.`
      }
    ]
  },
  bareme: [
    { critere: "Problématisation et clarté conceptuelle", points: "5 pts", description: "Formulation nette du paradoxe entre autorité publique et autonomie individuelle." },
    { critere: "Richesse philosophique des références", points: "8 pts", description: "Citations analysées et intégrées de manière pertinente." },
    { critere: "Rigueur démonstrative et transitions", points: "4 pts", description: "Progression dialectique sans contradiction." },
    { critere: "Style et correction de la langue", points: "3 pts", description: "Syntaxe soignée, vocabulaire philosophique précis." }
  ]
};

// =========================================================================
// 12. CONCOURS MILITAIRE DE SANTÉ (EMS Dakar - Camp Dial Diop)
// =========================================================================
export const EMS_EXAM: OfficialExamDocument = {
  id: "concours-ems",
  level: "CONCOURS",
  cycle: "Concours",
  session: "Session Officielle d'Élite 2024 / 2025",
  title: "Concours EMS Dakar — École Militaire de Santé (Médecine & Pharmacie)",
  subject: "Sciences de la Vie et de la Terre, Physiologie & Génétique Humaine",
  institution: "Forces Armées Sénégalaises / Ministère des Forces Armées — EMS Dakar",
  duration: "3 heures",
  coefficient: 4,
  color: "bg-emerald-900",
  downloads: "5 410",
  pages_info: "Épreuve Officielle d'Admissibilité + Corrigé Médical Type",
  instructions: [
    "Les réponses doivent être rédigées avec une rigueur biomédicale irréprochable.",
    "Les schémas fonctionnels doivent être soignés, légendés, titrés et orientés."
  ],
  sections: [
    {
      title: "PREMIÈRE PARTIE : PHYSIOLOGIE CARDIO-VASCULAIRE ET RÉGULATION DE LA PRESSION ARTÉRIELLE (10 points)",
      points: "10 points",
      questions: [
        {
          num: "Mécanismes réflexes et humoraux",
          points: "10 points",
          question: "Lors d'une opération militaire sur le terrain, un soldat est victime d'une hémorragie aiguë entraînant une chute brutale de sa volémie.",
          details: [
            "1. Définissez la pression artérielle et rappelez la formule la reliant au débit cardiaque (Dc) et aux résistances périphériques totales (RPT).",
            "2. Expliquez par un schéma fonctionnel complet le réflexe barorécepteur correcteur déclenché par les barorécepteurs carotidiens et aortiques.",
            "3. Décrivez l'intervention du système hormonal rénine-angiotensine-aldostérone (SRAA) et de la vasopressine (ADH) dans la restauration à moyen terme de la pression artérielle."
          ]
        }
      ]
    },
    {
      title: "DEUXIÈME PARTIE : GÉNÉTIQUE HUMAINE ET HÉMOGLOBINOPATHIES AU SÉNÉGAL (10 points)",
      points: "10 points",
      questions: [
        {
          num: "Transmission de la Drépanocytose",
          points: "10 points",
          question: "La drépanocytose est une maladie héréditaire fréquente au Sénégal causée par une mutation ponctuelle du gène de la chaîne β de l'hémoglobine.",
          details: [
            "1. Rappelez la nature de la mutation (substitution d'un acide aminé) et ses conséquences sur la structure et la solubilité de l'hémoglobine S sous hypoxie.",
            "2. Un couple d'adultes phénotypiquement sains mais porteurs du trait drépanocytaire (AS) consulte pour un conseil génétique. Déterminez par un échiquier de croisement la probabilité pour ce couple d'avoir un enfant atteint de la forme homozygote sévère (SS).",
            "3. Expliquez le phénomène d'avantage hétérozygote conféré par le trait AS contre les formes graves du paludisme à Plasmodium falciparum en milieu sahélien."
          ]
        }
      ]
    }
  ],
  corrige: {
    methodologie: "Employer le vocabulaire médical précis (barorécepteurs, centre vasomoteur bulbaire, noradrénaline, vasoconstriction, néphron, hématie falciforme).",
    sections: [
      {
        title: "Résolution Biomédicale Officielle",
        points: "20 points",
        solution: `I. Physiologie de la pression artérielle :
1. PA = Dc × RPT, avec Dc = Fréquence cardiaque (Fc) × Volume d'éjection systolique (VES).
2. Réflexe d'urgence : La baisse de PA désactive les barorécepteurs, réduisant les potentiels d'action sur les nerfs de Hering et Cyon vers le bulbe rachidien. Il en résulte une levée de l'inhibition cardiomodératrice parasympathique et une stimulation massive du système orthosympathique (tachycardie réactionnelle, vasoconstriction artériolaire réflexe médiée par la noradrénaline).
3. Mécanisme rénal : La baisse de perfusion rénale stimule la sécrétion de rénine par l'appareil juxtaglomérulaire, transformant l'angiotensinogène en angiotensine I puis II (vasoconstricteur puissant). L'aldostérone favorise la réabsorption tubulaire de Na+ et d'eau.

II. Drépanocytose :
1. Mutation : Substitution du 6e codon GAG en GTG conduisant au remplacement de l'acide glutamique (hydrophile) par la valine (hydrophobe) en position 6 de la chaîne β.
2. Échiquier de croisement (AS × AS) :
Gamètes : 50% A, 50% S pour chaque parent.
Descendance : 25% AA (sains non porteurs), 50% AS (porteurs sains), 25% SS (atteints de drépanocytose majeure). La probabilité est donc de 1/4 (25%).
3. Avantage hétérozygote : Les hématies AS infectées par Plasmodium falciparum ont une demi-vie raccourcie et falciformisent prématurément, limitant la réplication intra-érythrocytaire du parasite.`
      }
    ]
  },
  bareme: [
    { critere: "Exactitude des mécanismes physiologiques", points: "10 pts", description: "Formule PA, réflexe orthosympathique et axe SRAA sans omission." },
    { critere: "Rigueur génétique et échiquier", points: "7 pts", description: "Croisement mendélien net, probabilité exacte 1/4." },
    { critere: "Explication de la protection antipaludique", points: "3 pts", description: "Mécanisme biologique clair de clairance des hématies AS." }
  ]
};

// =========================================================================
// TABLEAU COMPLET DE TOUTES LES ANNALES & CONCOURS OFFICIELS
// =========================================================================
export const ALL_OFFICIAL_EXAMS: OfficialExamDocument[] = [
  BACS2_EXAM,
  BACL_EXAM,
  BFEM_EXAM,
  CFEE_EXAM,
  CREM_EXAM,
  FASTEF_EXAM,
  ENA_EXAM,
  CFJ_EXAM,
  DOUANES_EXAM,
  POLICE_EXAM,
  EPT_EXAM,
  EMS_EXAM
];

// Mapping d'accès direct par identifiant ou nom de concours
export const EXAMS_BY_KEY: Record<string, OfficialExamDocument> = {
  // Concours
  "concours-crem": CREM_EXAM,
  "CREM / CRFPE": CREM_EXAM,
  "CREM": CREM_EXAM,
  "CRFPE": CREM_EXAM,

  "concours-fastef": FASTEF_EXAM,
  "FASTEF": FASTEF_EXAM,

  "concours-ena": ENA_EXAM,
  "ENA": ENA_EXAM,

  "concours-cfj": CFJ_EXAM,
  "CFJ": CFJ_EXAM,

  "concours-douanes": DOUANES_EXAM,
  "Douanes": DOUANES_EXAM,

  "concours-police": POLICE_EXAM,
  "Police": POLICE_EXAM,
  "Gendarmerie": POLICE_EXAM,
  "Sapeurs-Pompiers": POLICE_EXAM,

  "concours-ept": EPT_EXAM,
  "EPT / ESP": EPT_EXAM,
  "EPT": EPT_EXAM,
  "ESP": EPT_EXAM,
  "CPGE Thiès": EPT_EXAM,
  "ENSAE": EPT_EXAM,
  "ENSETP": FASTEF_EXAM,
  "INSEPS": FASTEF_EXAM,

  "concours-ems": EMS_EXAM,
  "EMS Dakar": EMS_EXAM,
  "EMS": EMS_EXAM,
  "CUGEM": EMS_EXAM,
  "EAA Thiès": POLICE_EXAM,
  "INFAS / ENDSS": EMS_EXAM,
  "Eaux & Forêts": DOUANES_EXAM,

  // Examens scolaires
  "lyc-1": BACS2_EXAM,
  "BAC S2": BACS2_EXAM,
  "BAC S1": BACS2_EXAM,
  "lyc-2": BACL_EXAM,
  "BAC L": BACL_EXAM,
  "BAC L2": BACL_EXAM,
  "col-1": BFEM_EXAM,
  "BFEM": BFEM_EXAM,
  "prim-1": CFEE_EXAM,
  "CFEE": CFEE_EXAM
};
