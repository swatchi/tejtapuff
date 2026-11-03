/**
 * Le conseil du jour (tableau de bord). Un par jour du programme, puis ça tourne.
 * Des trucs concrets et faisables, pas de promesse médicale.
 */
export const CONSEILS: string[] = [
  "Jette tout ce qui reste : puffs, recharges, chargeurs. Ce qui n'est pas là ne se fume pas.",
  "Mets ton compteur en fond d'écran ou garde l'app sur ton écran d'accueil : tu la vois à chaque envie.",
  "Prépare ta phrase pour les potes : « Non merci, j'ai arrêté. » Courte, sans te justifier.",
  "Une envie dure quelques minutes. Lance le SOS et regarde-la passer.",
  "Bois un grand verre d'eau froide dès que l'envie monte. Ça occupe les mains et la bouche.",
  "Garde des chewing-gums ou un truc à grignoter sur toi : la bouche s'ennuie au début.",
  "Change un détail de ta routine à risque : autre chemin, autre place, autre musique.",
  "Dis-le à une personne de confiance. Quand quelqu'un sait, c'est plus facile de tenir.",
  "Note ce qui a déclenché ta dernière envie. Le savoir, c'est déjà moins la subir.",
  "Si tu stresses, bouge 2 minutes : marche, escaliers, 20 squats. Le corps a besoin de se vider.",
  "Range ton téléphone 30 minutes avant de dormir : les envies du soir passent mieux au calme.",
  "Pense à ce que tu t'achètes avec l'argent gardé. Ajoute-le comme objectif dans l'app.",
  "En soirée, garde un verre (sans alcool, c'est encore mieux) dans la main. Les mains occupées, c'est la moitié du travail.",
  "Évite les potes qui vapent juste les premiers jours. Pas pour toujours, juste le temps de te poser.",
  "Une envie n'est pas un ordre. Tu peux la sentir sans lui obéir.",
  "Félicite-toi pour chaque envie battue. Elles comptent toutes, même les petites.",
  "Si tu craques, ne rachète pas. Jette ce qui reste et appuie sur « J'ai craqué » : tout ce que tu as fait reste.",
  "Ton cerveau apprend que la puff n'est plus là. Chaque jour sans, c'est une leçon de plus pour lui.",
  "Remplace le « juste une » par « pas aujourd'hui ». Demain, tu verras.",
  "Prends une photo de ce que tu vas t'offrir avec l'argent gardé. Regarde-la quand ça tire.",
  "Écris au coach dès que tu sens venir une situation difficile, avant qu'elle arrive.",
];

export function conseilDuJour(day: number): string {
  const i = Math.max(0, day - 1) % CONSEILS.length;
  return CONSEILS[i];
}
