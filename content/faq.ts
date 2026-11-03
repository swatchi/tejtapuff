import { FIRST_WEEK, PRICE_SENTENCE, WEEKLY } from "@/config/pricing";
import { SITE } from "@/config/site";

export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: "Et si je craque ?",
    a: "Ça arrive, et ce n'est pas un échec. Tu appuies sur « J'ai craqué » : ton compteur repart de zéro, mais tout ce que tu as fait reste (tes missions, tes envies surmontées). Et tu reprends dès que tu veux.",
  },
  {
    q: "Je peux résilier quand ?",
    a: "Quand tu veux, depuis ton compte : Compte → Résilier → Confirmer. Pas de mail, pas de formulaire. Tu gardes l'accès jusqu'à la fin de la semaine déjà payée, et plus rien n'est prélevé ensuite.",
  },
  {
    q: "Ça coûte combien, exactement ?",
    a: `${PRICE_SENTENCE} Tu paies ${FIRST_WEEK} aujourd'hui, puis ${WEEKLY} tous les 7 jours tant que tu restes. On t'envoie un rappel 48 h avant le premier prélèvement à ${WEEKLY}.`,
  },
  {
    q: "C'est pour qui ?",
    a: `Pour les 18 ans et plus qui vapent (puff ou cigarette électronique) et qui veulent arrêter. Tu as moins de 18 ans ? Appelle ${SITE.tabacInfoService.label} au ${SITE.tabacInfoService.phone}, c'est gratuit et c'est fait pour ça.`,
  },
  {
    q: "C'est un traitement médical ?",
    a: `Non. ${SITE.medicalDisclaimer} Pour les substituts nicotiniques (patchs, gommes…), demande conseil à un pharmacien ou à un médecin.`,
  },
  {
    q: "Ça marche à tous les coups ?",
    a: "Personne ne peut te garantir que tu vas arrêter, et on ne le fera pas. Ce qu'on te donne : un plan clair, des outils pour les moments durs, et zéro jugement. Le reste, c'est toi.",
  },
  {
    q: "Je veux aussi parler à quelqu'un pour de vrai",
    a: `Bonne idée. ${SITE.tabacInfoService.label} : ${SITE.tabacInfoService.phone} (${SITE.tabacInfoService.note}), avec des tabacologues. Tu peux faire les deux en même temps.`,
  },
  {
    q: "Comment j'accède à l'app ?",
    a: "C'est une app web : pas besoin de store. Après le paiement, tu te connectes avec un code reçu par email, et tu peux l'ajouter à ton écran d'accueil comme une vraie app.",
  },
  {
    q: "Et mes données ?",
    a: "Tes réponses servent uniquement à construire et suivre ton plan. On ne les vend pas. Tu peux supprimer ton compte et toutes tes données depuis l'app, en un clic.",
  },
];
