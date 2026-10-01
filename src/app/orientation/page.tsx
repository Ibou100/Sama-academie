"use client";

import { useState } from "react";
import Link from "next/link";

type StatutAcces = "concours" | "mixte" | "payant";

interface Etablissement {
  nom: string;
  sigle: string;
  ville: string;
  statutAcces: StatutAcces;
  fraisOuBourse: string;
  acces: string;
  specialites: string[];
  description: string;
}

interface FiliereDetail {
  id: string;
  title: string;
  badge: string;
  icon: string;
  shortDesc: string;
  etablissements: Etablissement[];
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
    title: "Grandes Écoles d'Ingénieurs & Classes Préparatoires",
    badge: "Scientifique & Technique",
    icon: "💻",
    shortDesc: "CPGE Thiès, ESP Dakar, EPT Thiès, DAUST Mbour, Diamniadio, IPSL, IUT Thiès, ESMT...",
    etablissements: [
      {
        nom: "Classes Préparatoires aux Grandes Écoles du Sénégal",
        sigle: "CPGE de Thiès",
        ville: "Thiès (Campus EPT)",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours d'État Gratuit — Bourse d'excellence et hébergement assurés par l'État du Sénégal",
        acces: "Sélection nationale d'excellence sur dossier après Bac S1, S2 ou S3 (Mention Bien ou Très Bien exigée)",
        specialites: [
          "MPSI (Maths, Physique, Sciences de l'Ingénieur)",
          "PCSI (Physique, Chimie, Sciences de l'Ingénieur)",
          "Voies de 2e année : MP, PC et PSI"
        ],
        description: "Filière d'élite créée par l'État du Sénégal pour préparer en 2 ans les bacheliers les plus brillants aux concours des plus grandes écoles d'ingénieurs sénégalaises (EPT, ESP) et internationales (Polytechnique Paris, Mines-Ponts, CentraleSupélec)."
      },
      {
        nom: "École Polytechnique de Thiès",
        sigle: "EPT Thiès",
        ville: "Thiès",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours National Gratuit — Prise en charge d'État et bourses complètes",
        acces: "Concours direct national très sélectif (Bac S1, S2, S3) niveau Terminale",
        specialites: [
          "Génie Civil (Ouvrages d'art, Ponts & BTP)",
          "Génie Électromécanique",
          "Génie Informatique & Télécommunications",
          "Génie Aéronautique & Systèmes"
        ],
        description: "L'institution historique polytechnique du Sénégal. Cursus d'ingénieur de conception d'État en 5 ans, réputé pour sa rigueur scientifique et son encadrement militaire."
      },
      {
        nom: "École Supérieure Polytechnique de Dakar",
        sigle: "ESP Dakar (UCAD)",
        ville: "Dakar (Fann)",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Concours Public boursier (frais universitaires d'État réduits) OU Section Privée / Formation continue payante",
        acces: "Voie publique : Concours national après Bac S1, S2, S3, STI | Voie payante : Admission sur dossier et entretien",
        specialites: [
          "Génie Informatique & Intelligence Artificielle",
          "Génie Civil & BTP",
          "Génie Électrique & Énergies Renouvelables",
          "Génie Mécanique",
          "Génie Chimique & Biologie Appliquée",
          "Gestion & Management Tertiaire"
        ],
        description: "Fleuron technologique de l'UCAD. Propose à la fois des places au concours public d'ingénieurs (DIC) et DUT, ainsi qu'une filière payante de très haut niveau pour les professionnels et étudiants autorisés."
      },
      {
        nom: "Dakar American University of Science and Technology",
        sigle: "DAUST (Somone / Mbour)",
        ville: "La Somone / Mbour (Région de Thiès)",
        statutAcces: "payant",
        fraisOuBourse: "Établissement Privé Payant — Modèle américain d'ingénierie (Bourses d'excellence partielles disponibles sur mérite)",
        acces: "Sélection sur dossier académique, test d'anglais/maths et entretien de motivation (Bacs S1, S2, S3, L'option maths)",
        specialites: [
          "Génie Mécanique & Robotique",
          "Génie Aérospatial",
          "Génie Informatique & Software Engineering",
          "Génie Électrique & Systèmes Énergétiques",
          "Programme Dual Degree 2+2 avec University of Nebraska (USA)"
        ],
        description: "Université technologique privée anglophone d'avant-garde fondée par le Pr Sidy Ndao à La Somone (Mbour). Pédagogie pratique 'Learning by Doing', campus à l'américaine et débouchés directs aux USA et à l'international."
      },
      {
        nom: "École Polytechnique de Diamniadio",
        sigle: "EPD / Cité du Savoir",
        ville: "Diamniadio",
        statutAcces: "concours",
        fraisOuBourse: "Concours & Sélection d'Excellence Publique de l'État (Gratuit / Boursiers)",
        acces: "Sélection d'excellence nationale (Bacs scientifiques S1/S2 et prépas)",
        specialites: [
          "Intelligence Artificielle & Big Data",
          "Robotique & Mécatronique Industrielle",
          "Transition Énergétique & Nanotechnologies",
          "Systèmes Numériques Embarqués"
        ],
        description: "Pôle d'innovation technologique de dernière génération de l'État du Sénégal, implanté dans la Cité du Savoir à Diamniadio pour former les ingénieurs des technologies de pointe."
      },
      {
        nom: "Institut Polytechnique de Saint-Louis",
        sigle: "IPSL (UGB)",
        ville: "Saint-Louis (Sanar)",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Concours Public d'État boursier OU Admission spéciale sur titre payante selon quotas",
        acces: "Concours national pour bacheliers S1, S2, S3 avec cycle préparatoire intégré de 2 ans",
        specialites: [
          "Génie Civil & Ouvrages hydrauliques",
          "Génie Mécanique & Productique",
          "Informatique Industrielle & Réseaux"
        ],
        description: "L'école d'ingénieurs de l'Université Gaston Berger de Saint-Louis. Deux années de prépa intégrée suivies de trois années de spécialisation ingénieur de conception."
      },
      {
        nom: "Institut Universitaire de Technologie de Thiès",
        sigle: "IUT de Thiès (UIDT)",
        ville: "Thiès",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Concours Public / Campusen OU Formations professionnelles payantes du soir",
        acces: "Sélection sur concours et étude de dossier (Bacs scientifiques et techniques)",
        specialites: [
          "Génie Civil",
          "Génie Électrique & Informatique Industrielle",
          "Logistique & Transport ferroviaire / routier",
          "Télécommunications & Réseaux"
        ],
        description: "Institut technologique supérieur de l'Université Iba Der Thiam de Thiès. Propose des DUT et Licences Professionnelles très prisés par les entreprises industrielles."
      },
      {
        nom: "École Supérieure Multinationale des Télécommunications",
        sigle: "ESMT Dakar",
        ville: "Dakar (Colobane)",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Bourses d'État sur concours national OU Admissions directes privées payantes",
        acces: "Bacheliers S et L2/Licences scientifiques (sur tests et examen de dossier)",
        specialites: [
          "Cybersécurité & Défense Numérique",
          "Télécommunications & Réseaux 5G/Fibre",
          "Génie Logiciel & Cloud Computing",
          "Systèmes Intelligents & IoT"
        ],
        description: "Organisation intergouvernementale africaine basée à Dakar, formant les cadres supérieurs des télécommunications et de l'informatique pour toute l'Afrique de l'Ouest."
      }
    ],
    debouches: [
      "Ingénieur Logiciel, IA & Architecte Cloud",
      "Ingénieur Chef de Projet BTP / Ouvrages d'art",
      "Ingénieur Robotique & Systèmes Aéronautiques",
      "Consultant en Cybersécurité et Réseaux Télécoms",
      "Ingénieur Énergies Renouvelables et Transition Énergétique",
      "Directeur Technique / Entrepreneur Tech"
    ],
    conseilOrientation: "Pour les concours d'ingénieurs (CPGE, EPT, ESP), préparez les épreuves de Maths et Physique dès la 1ère et la Terminale. Pour DAUST, travaillez intensivement l'anglais oral et écrit."
  },
  {
    id: "sante",
    title: "Sciences Médicales, Santé Militaire & Soins",
    badge: "Santé & Médecine",
    icon: "⚕️",
    shortDesc: "EMS Dakar (Armée), FMPO UCAD/UGB, ENDSS / INFAS, Écoles de Sages-Femmes...",
    etablissements: [
      {
        nom: "École Militaire de Santé de Dakar",
        sigle: "EMS Dakar (Camp Dial Diop)",
        ville: "Dakar (Plateau / Fann)",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours Militaire Gratuit — Élèves logés, nourris, soignés et rémunérés (solde militaire mensuelle pendant toutes les études)",
        acces: "Concours direct national très sélectif (Bacs S1 et S2, âgés de 18 à 20 ans pour médecine, jusqu'à 22 ans pour pharmacie). Visite médicale militaire stricte (profil SIGYCOP).",
        specialites: [
          "Médecine Militaire & Chirurgie d'Urgence",
          "Pharmacie Militaire & Toxicologie",
          "Chirurgie Dentaire (Odontologie)",
          "Médecine Vétérinaire (via EISMV)"
        ],
        description: "L'institution d'élite formant les officiers médecins, pharmaciens et vétérinaires des Forces Armées sénégalaises. Les élèves suivent les cours médicaux à l'UCAD tout en recevant une instruction militaire d'excellence."
      },
      {
        nom: "Faculté de Médecine, Pharmacie et Odontologie",
        sigle: "FMPO (UCAD)",
        ville: "Dakar (Fann)",
        statutAcces: "concours",
        fraisOuBourse: "Sélection d'État Campusen (Frais universitaires publics réduits / Bourses d'État)",
        acces: "Sélection rigoureuse sur plateforme Campusen (Mentions Très Bien et Bien obligatoires, Bacs S1 et S2)",
        specialites: [
          "Médecine Générale & Spécialités Cliniques (8 ans)",
          "Pharmacie (6 ans)",
          "Chirurgie Dentaire / Odonto-Stomatologie (6 ans)"
        ],
        description: "La plus prestigieuse et historique faculté de médecine d'Afrique noire francophone, formant l'essentiel des médecins spécialistes du pays."
      },
      {
        nom: "UFR Sciences de la Santé de Saint-Louis",
        sigle: "2S (UGB)",
        ville: "Saint-Louis",
        statutAcces: "concours",
        fraisOuBourse: "Sélection d'État Campusen (Frais universitaires d'État)",
        acces: "Sélection drastique sur notes du Bac S1/S2 via Campusen",
        specialites: [
          "Médecine Générale",
          "Sciences Infirmières et Obstétricales"
        ],
        description: "Pôle médical moderne et très réputé pour la qualité de son encadrement et son partenariat avec l'Hôpital régional de Saint-Louis."
      },
      {
        nom: "École Nationale de Développement Sanitaire et Social",
        sigle: "ENDSS / INFAS",
        ville: "Dakar",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Concours Public d'État (gratuit/boursier) OU Section Privée payante sur dossier",
        acces: "Concours direct d'État (Bacheliers ou niveau BFEM selon filière) ou admission payante autorisée",
        specialites: [
          "Infirmiers d'État",
          "Sages-Femmes d'État",
          "Techniciens Supérieurs de Laboratoire Médical",
          "Assistants Sociaux & Kinésithérapie"
        ],
        description: "Le centre national public historique de formation de l'ensemble du personnel paramédical du Sénégal."
      }
    ],
    debouches: [
      "Médecin Militaire d'Unité & Capitaine / Médecin Hospitalier",
      "Médecin Généraliste et Spécialiste (Cardiologue, Pédiatre, Chirurgien...)",
      "Pharmacien d'Officine ou Biologiste Médical",
      "Chirurgien-Dentiste en cabinet ou hôpital",
      "Sage-Femme d'État et Infirmier Major d'État"
    ],
    conseilOrientation: "Pour le concours de l'EMS : commencez la préparation physique très tôt et assurez-vous d'avoir au moins 13/20 en SVT, Physique-Chimie et Maths."
  },
  {
    id: "armee",
    title: "Haute Administration Publique (ENA), Forces Armées & Sécurité",
    badge: "Administration & Défense",
    icon: "🏛️",
    shortDesc: "ENA Sénégal, Concours CUGEM (Écoles étrangères), ENOA Thiès, Douanes, Police...",
    etablissements: [
      {
        nom: "École Nationale d'Administration du Sénégal",
        sigle: "ENA Sénégal",
        ville: "Dakar (Colobane / Bd Dial Diop)",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours d'État Gratuit — Élèves fonctionnaires rémunérés par l'État pendant toute la durée de la formation",
        acces: "Concours direct national annuel : Cycle Supérieur (Master 2 / Maîtrise Bac+4/5), Cycle Moyen Supérieur (Licence Bac+3), Cycle Moyen (Bac+2)",
        specialites: [
          "Administration Générale (Préfets, Sous-Préfets, Administrateurs civils)",
          "Diplomatie (Conseillers des Affaires Étrangères, Diplomates)",
          "Trésor Public (Inspecteurs et Contrôleurs du Trésor)",
          "Impôts et Domaines (Inspecteurs des Impôts et du Cadastre)",
          "Travail et Sécurité Sociale (Inspecteurs du Travail)",
          "Enquêtes Économiques & Commerce Extérieur"
        ],
        description: "La prestigieuse institution de la République formant la haute fonction publique et les grands commis de l'État du Sénégal. L'admission se fait sur concours très sélectif et garantit une intégration directe dans la haute administration sénégalaise."
      },
      {
        nom: "Concours Unique d'entrée dans les Grandes Écoles Militaires étrangères",
        sigle: "Concours CUGEM",
        ville: "Concours à Dakar (Formations en France, Maroc, Brésil, Allemagne...)",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours d'État d'Élite — Bourse d'État intégrale, prise en charge des études, billets et rémunération militaire à l'étranger",
        acces: "Concours national officiel organisé par l'État-Major des Armées (Niveau Bac S/L âgé de 18 à 21 ans, ou niveau Licence 3 âgé de 19 à 25 ans). Épreuves sportives éliminatoires puis épreuves écrites poussées.",
        specialites: [
          "École Spéciale Militaire de Saint-Cyr (France)",
          "École Navale & Officiers de Marine (Brest, France)",
          "École de l'Air (Salon-de-Provence, France)",
          "Académie Royale Militaire de Meknès (Maroc)",
          "Écoles d'officiers au Brésil, Allemagne et pays partenaires"
        ],
        description: "La voie royale pour les jeunes Sénégalais visant le commandement supérieur des Armées. Les lauréats sont envoyés dans les meilleures académies militaires du monde et deviennent officiers d'active dès leur retour."
      },
      {
        nom: "École Nationale des Officiers d'Active",
        sigle: "ENOA de Thiès",
        ville: "Thiès",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours d'État Gratuit — Statut d'élève officier soldé",
        acces: "Concours direct (bacheliers avec diplôme universitaire Bac+2/Bac+3) ou semi-direct pour sous-officiers",
        specialites: [
          "Commandement d'Infanterie et d'Armes combinées",
          "Tactique Militaire & Stratégie Opérationnelle",
          "Leadership et Éthique du Commandement"
        ],
        description: "L'école mère de formation des officiers de l'Armée de Terre sénégalaise et d'une quinzaine de pays africains partenaires."
      },
      {
        nom: "École Nationale de Police et de la Formation Permanente",
        sigle: "ENP Dakar",
        ville: "Dakar",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours de la Fonction Publique Gratuit",
        acces: "Concours direct selon le grade : Commissaires (Master 2 Droit), Officiers (Licence), Sous-Officiers (Bac), Agents de Police (BFEM)",
        specialites: [
          "Police Judiciaire & Enquêtes Criminelles",
          "Sécurité Publique & Maintien de l'Ordre",
          "Police Scientifique & Cybersécurité"
        ],
        description: "L'école assurant la formation de tous les corps de la Police Nationale du Sénégal."
      },
      {
        nom: "École des Douanes du Sénégal",
        sigle: "École des Douanes",
        ville: "Dakar",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours d'État Gratuit",
        acces: "Concours annuel du Ministère des Finances (Inspecteurs niveau Master, Contrôleurs niveau Bac, Préposés niveau BFEM)",
        specialites: [
          "Fiscalité Douanière & Droit Commercial",
          "Surveillance Frontalière, Portuaire et Aéroportuaire",
          "Lutte contre la Fraude et Blanchiment"
        ],
        description: "Corps paramilitaire d'élite chargé de la protection de l'économie et de la perception des recettes douanières de l'État."
      },
      {
        nom: "École des Sapeurs-Pompiers (BNSP)",
        sigle: "Brigade Nationale des Sapeurs-Pompiers",
        ville: "Dakar / Régions",
        statutAcces: "concours",
        fraisOuBourse: "100% Concours Militaire Gratuit",
        acces: "Concours de recrutement direct de l'Armée",
        specialites: [
          "Secours d'Urgence aux Personnes",
          "Extinction des Incendies & Feux Industriels",
          "Gestion des Risques et Catastrophes Naturelles"
        ],
        description: "Militaires du feu dévoués à la protection des populations sur tout le territoire national."
      }
    ],
    debouches: [
      "Administrateur Civil, Préfet, Sous-Préfet, Gouverneur (ENA)",
      "Diplomate, Ambassadeur, Conseiller des Affaires Étrangères (ENA)",
      "Inspecteur des Impôts et Domaines / Inspecteur du Trésor Public (ENA)",
      "Inspecteur du Travail et de la Sécurité Sociale (ENA)",
      "Officier Supérieur d'Armée (Sous-Lieutenant, Capitaine...)",
      "Commissaire ou Inspecteur de Police",
      "Inspecteur ou Contrôleur des Douanes",
      "Officier de Sapeurs-Pompiers",
      "Spécialiste de la Sécurité Nationale & du Renseignement"
    ],
    conseilOrientation: "Pour l'ENA, une excellente maîtrise de la culture générale, du droit public, des finances publiques et de l'économie est requise. Pour le CUGEM et l'ENOA, une condition physique irréprochable est indispensable en plus de l'écrit !"
  },
  {
    id: "universites",
    title: "Universités Publiques du Sénégal",
    badge: "Enseignement Supérieur Public",
    icon: "🎓",
    shortDesc: "UCAD (Dakar), UGB (Saint-Louis), UIDT (Thiès), UADB (Bambey), USSEIN (Kaolack), UNCHK...",
    etablissements: [
      {
        nom: "Université Cheikh Anta Diop",
        sigle: "UCAD Dakar",
        ville: "Dakar",
        statutAcces: "concours",
        fraisOuBourse: "Université Publique d'État (Frais d'inscription annuels modiques de 25 000 à 50 000 FCFA)",
        acces: "Attribution automatique via la plateforme nationale Campusen selon notes du Bac",
        specialites: [
          "FST (Sciences et Technologies)",
          "FASEG (Sciences Économiques et Gestion)",
          "FSJP (Sciences Juridiques et Politiques)",
          "FLSH (Lettres et Sciences Humaines)",
          "FASTEF (Formation des Enseignants)"
        ],
        description: "La plus grande université publique d'Afrique de l'Ouest, avec plus de 80 000 étudiants et des facultés historiques formant les cadres de la nation."
      },
      {
        nom: "Université Gaston Berger",
        sigle: "UGB Saint-Louis",
        ville: "Saint-Louis (Sanar)",
        statutAcces: "concours",
        fraisOuBourse: "Université Publique d'État (Frais d'inscription d'État)",
        acces: "Campusen (sélection rigoureuse sur résultats au Baccalauréat)",
        specialites: [
          "SAT (Sciences Appliquées et Technologies)",
          "SJP (Droit & Sciences Politiques)",
          "SEG (Économie & Gestion)",
          "CRAC (Civilisations, Religions, Arts et Communication)"
        ],
        description: "Pôle d'excellence universitaire dans un cadre arboré à Saint-Louis, réputé pour sa rigueur et son fort taux de réussite au CAMES."
      },
      {
        nom: "Université Iba Der Thiam de Thiès",
        sigle: "UIDT Thiès",
        ville: "Thiès",
        statutAcces: "concours",
        fraisOuBourse: "Université Publique d'État",
        acces: "Campusen",
        specialites: ["Sciences Économiques", "Santé", "Sciences & Techniques", "Génie Ferroviaire"],
        description: "Université multipolaire en plein essor au cœur du carrefour économique de Thiès."
      },
      {
        nom: "Université Alioune Diop de Bambey",
        sigle: "UADB Bambey",
        ville: "Bambey",
        statutAcces: "concours",
        fraisOuBourse: "Université Publique d'État",
        acces: "Campusen",
        specialites: ["TIC & Informatique", "Santé Communautaire", "Management des Organisations"],
        description: "Spécialisée dans les filières professionnelles et les technologies de l'information."
      },
      {
        nom: "Université du Sine Saloum El-Hâdj Ibrahima NIASS",
        sigle: "USSEIN Kaolack",
        ville: "Kaolack / Fatick / Kaffrine",
        statutAcces: "concours",
        fraisOuBourse: "Université Publique d'État",
        acces: "Campusen",
        specialites: ["Agronomie & Agroforesterie", "Élevage & Productions Animales", "Pêche & Aquaculture"],
        description: "Grande université publique à vocation agricole et de souveraineté alimentaire au Sénégal."
      },
      {
        nom: "Université Numérique Cheikh Hamidou Kane",
        sigle: "UNCHK (ex-UVS)",
        ville: "Réseau national des Espaces Numériques Ouverts (ENO)",
        statutAcces: "concours",
        fraisOuBourse: "Université Publique d'État (Ordinateur subventionné et connexion fournis)",
        acces: "Campusen",
        specialites: ["Développement Web & Mobile", "Administration Système & Réseaux", "Droit & Économie Numérique"],
        description: "Université numérique d'État permettant de suivre des cours en ligne avec des Espaces Numériques Ouverts (ENO) dans chaque département du Sénégal."
      }
    ],
    debouches: [
      "Chercheurs, Enseignants et Professeurs certifiés",
      "Juristes d'Entreprise, Avocats, Magistrats",
      "Économistes, Analystes Financiers, Gestionnaires",
      "Agronomes & Experts du Développement Rural",
      "Cadres de la Fonction Publique sénégalaise"
    ],
    conseilOrientation: "Le système LMD demande de l'assiduité dès la 1ère semaine. Révisez quotidiennement pour valider vos crédits à la première session."
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
        sigle: "CESAG Dakar",
        ville: "Dakar",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Bourses d'excellence UEMOA/BCEAO sur concours OU Admission privée payante",
        acces: "Concours international et sélection sur dossier académique",
        specialites: [
          "Banque & Marchés Financiers",
          "Expertise Comptable & Audit (DECOFI)",
          "Gestion des Projets et Passation des Marchés",
          "Management Public et Privé"
        ],
        description: "Établissement public international de la BCEAO et de l'UEMOA, référence suprême de la finance en Afrique de l'Ouest."
      },
      {
        nom: "ESP - Département Gestion & Tertiaire",
        sigle: "ESP Tertiaire",
        ville: "Dakar",
        statutAcces: "mixte",
        fraisOuBourse: "Mixte : Concours Public gratuit/boursier OU Formation continue payante",
        acces: "Concours d'État d'entrée (Bacs S, G, L)",
        specialites: [
          "Comptabilité & Gestion Financière",
          "Gestion des Entreprises et des Administrations",
          "Commerce International & Transit"
        ],
        description: "Formations publiques universitaires d'élite en gestion, réputées pour l'insertion rapide de leurs diplômés."
      },
      {
        nom: "BEM Dakar & ISM (Grandes Écoles Privées Agréées)",
        sigle: "BEM / ISM",
        ville: "Dakar",
        statutAcces: "payant",
        fraisOuBourse: "Établissements Privés Payants (Possibilités de bourses partielles de partenaires)",
        acces: "Concours propres à chaque école, tests écrits et entretien de motivation",
        specialites: [
          "International Business & Management",
          "Supply Chain & Logistique Internationale",
          "Marketing Digital, IA & Communication",
          "Finance d'Entreprise"
        ],
        description: "Grandes Business Schools sénégalaises partenaires d'institutions européennes délivrant des diplômes reconnus par le CAMES."
      }
    ],
    debouches: [
      "Analyste Financier & Banquier d'Affaires",
      "Expert-Comptable & Auditeur de Cabinet",
      "Responsable Marketing & Digital Manager",
      "Chef de Projet Transit, Logistique & Supply Chain",
      "Directeur Administratif et Financier (DAF)"
    ],
    conseilOrientation: "Les compétences en analyse de données (Excel avancé, Power BI, SQL) et la maîtrise parfaite du français et de l'anglais sont indispensables."
  },
  {
    id: "formation-pro",
    title: "Instituts Supérieurs d'Enseignement Professionnel (ISEP)",
    badge: "Technique & Métiers",
    icon: "🔧",
    shortDesc: "ISEP Diamniadio, Thiès, Bignona, Matam, Richard-Toll, CFPT Sénégal-Japon...",
    etablissements: [
      {
        nom: "Réseau des Instituts Supérieurs Professionnels",
        sigle: "ISEP (Diamniadio, Thiès, Bignona, Matam, Richard-Toll)",
        ville: "National (plusieurs pôles)",
        statutAcces: "concours",
        fraisOuBourse: "Instituts Publics d'État (Frais d'inscription symboliques, formation prise en charge par l'État)",
        acces: "Campusen et concours direct après tout type de Baccalauréat (L, S, G, T)",
        specialites: [
          "Maintenance Industrielle & Électromécanique",
          "TIC, Réseaux & Systèmes Connectés",
          "Transformation Agroalimentaire & Packaging",
          "Électronique Automobile & Mécatronique",
          "Bâtiment, Travaux Publics & Énergies Solaires"
        ],
        description: "Modèle de formation professionnelle courte d'État (2 ans) axé à 75% sur la pratique en atelier et les stages en entreprise, menant au diplôme de Technicien Supérieur Spécialisé."
      },
      {
        nom: "Centre de Formation Professionnelle et Technique",
        sigle: "CFPT Sénégal-Japon",
        ville: "Dakar",
        statutAcces: "concours",
        fraisOuBourse: "Établissement Public d'État (Coopération Sénégalo-Japonaise)",
        acces: "Concours national très compétitif (Bacs scientifiques et techniques ou BFEM selon section)",
        specialites: [
          "Automatisme Industriel & Robotique",
          "Mécatronique Automobile",
          "Électrotechnique de Puissance",
          "Froid et Climatisation Industrielle"
        ],
        description: "Référence d'excellence pour l'enseignement technique industriel en Afrique subsaharienne."
      }
    ],
    debouches: [
      "Technicien Supérieur Mécatronique et Automatisme",
      "Superviseur de Maintenance Industrielle",
      "Chef de Chantier BTP & Travaux Publics",
      "Installateur de Parcs Solaires et Énergies Vertes",
      "Entrepreneur Technique Indépendant"
    ],
    conseilOrientation: "Ces formations permettent une insertion professionnelle immédiate dès Bac+2, tout en conservant la passerelle vers les Licences et Masters d'ingénierie."
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
  const [modalFilter, setModalFilter] = useState<"all" | StatutAcces>("all");

  const filteredEtablissements = selectedFiliere
    ? selectedFiliere.etablissements.filter((e) => modalFilter === "all" || e.statutAcces === modalFilter)
    : [];

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
            Découvrez toutes les grandes écoles du Sénégal, les concours d'excellence (CPGE Thiès, EMS Dakar, CUGEM, EPT, ESP...), les universités publiques et les instituts technologiques avec leurs modes d'accès (Concours gratuits, Mixtes ou Payants).
          </p>

          {/* Légende rapide des modes d'accès */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10 text-xs">
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1 rounded-full font-bold">
              🟢 Concours Public d'État Gratuit
            </span>
            <span className="bg-amber-500/20 text-amber-200 border border-amber-400/40 px-3 py-1 rounded-full font-bold">
              🟡 Mixte (Concours Public OU Voie Payante)
            </span>
            <span className="bg-sky-500/20 text-sky-200 border border-sky-400/40 px-3 py-1 rounded-full font-bold">
              🔵 Établissement Privé Payant
            </span>
          </div>
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
              onClick={() => {
                setSelectedFiliere(filiere);
                setModalFilter("all");
              }}
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
          Nos enseignants vérifiés dispensent des cours de renforcement, du soutien scolaire à domicile ou en ligne, et vous préparent spécifiquement aux concours des grandes écoles (CPGE, EPT, ESP, EMS, CUGEM...).
        </p>
        <Link href="/enseignants" className="inline-block bg-sama-orange hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          Trouver un professeur pour mon orientation
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* MODAL INTERACTIF : DÉTAIL D'UNE FILIÈRE / ÉCOLES & MODES D'ACCÈS          */}
      {/* ========================================================================= */}
      {selectedFiliere && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedFiliere(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-10 my-6"
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

            {/* Filtre par mode d'accès dans la modale */}
            <div className="mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase px-2">Filtrer par statut :</span>
              <button
                onClick={() => setModalFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${modalFilter === "all" ? "bg-sama-blue text-white shadow-sm" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"}`}
              >
                Tous ({selectedFiliere.etablissements.length})
              </button>
              <button
                onClick={() => setModalFilter("concours")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${modalFilter === "concours" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"}`}
              >
                🟢 100% Concours Gratuit ({selectedFiliere.etablissements.filter(e => e.statutAcces === "concours").length})
              </button>
              <button
                onClick={() => setModalFilter("mixte")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${modalFilter === "mixte" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"}`}
              >
                🟡 Mixte Concours & Payant ({selectedFiliere.etablissements.filter(e => e.statutAcces === "mixte").length})
              </button>
              <button
                onClick={() => setModalFilter("payant")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${modalFilter === "payant" ? "bg-sky-600 text-white shadow-sm" : "bg-white text-sky-800 hover:bg-sky-50 border border-sky-200"}`}
              >
                🔵 Établissement Privé Payant ({selectedFiliere.etablissements.filter(e => e.statutAcces === "payant").length})
              </button>
            </div>

            {/* Conseil Clé */}
            <div className="bg-blue-50 border-l-4 border-sama-primary p-4 rounded-r-2xl mb-8">
              <p className="text-xs font-bold uppercase text-sama-primary mb-1">
                📌 Conseil d'Orientation
              </p>
              <p className="text-sm text-gray-700 font-medium">
                {selectedFiliere.conseilOrientation}
              </p>
            </div>

            {/* Liste détaillée des établissements */}
            <div className="mb-8">
              <h4 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏛️</span> Établissements & Conditions d'admission
              </h4>

              <div className="space-y-4">
                {filteredEtablissements.map((etab, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-sama-primary/40 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h5 className="font-extrabold text-lg text-gray-900">
                            {etab.nom}
                          </h5>
                          {etab.statutAcces === "concours" && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                              🟢 100% Concours d'État Gratuit
                            </span>
                          )}
                          {etab.statutAcces === "mixte" && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                              🟡 Mixte : Concours Public OU Section Payante
                            </span>
                          )}
                          {etab.statutAcces === "payant" && (
                            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-300">
                              🔵 Établissement Privé Payant
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-sama-primary uppercase tracking-wider block">
                          {etab.sigle} — 📍 {etab.ville}
                        </span>
                      </div>
                    </div>

                    {/* Encadré Frais et Bourse */}
                    <div className="mb-3 bg-white p-3 rounded-xl border border-gray-200 text-xs">
                      <span className="font-bold text-gray-700 block mb-0.5">💰 Modalité Financière & Bourse :</span>
                      <p className="text-gray-600 font-medium">{etab.fraisOuBourse}</p>
                    </div>

                    <div className="mb-3 text-xs text-gray-700">
                      <strong className="text-gray-900">🎯 Conditions d'accès : </strong>
                      {etab.acces}
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
