/**
 * Textes des emails. Chaque email a un sujet, un aperçu (preheader) et des
 * paragraphes. La mise en forme est dans lib/email.ts.
 */

export type EmailContent = {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Gros texte mis en avant (ex. le code de connexion) */
  highlight?: string;
  cta?: { label: string; url: string };
  footnote?: string;
};

export function loginCodeEmail(code: string): EmailContent {
  return {
    subject: `${code} : ton code TejTaPuff`,
    preheader: "Ton code pour te connecter à l'app.",
    heading: "Ton code de connexion",
    paragraphs: ["Tape ce code dans l'app pour te connecter :"],
    highlight: code,
    footnote: "Il expire dans 1 heure. Si tu n'as rien demandé, ignore simplement cet email.",
  };
}
