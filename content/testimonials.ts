/**
 * VRAIS témoignages uniquement, avec consentement écrit de la personne
 * (garde la preuve). Tant que cette liste est vide, la section n'apparaît pas.
 * Il faut aussi passer FEATURES.testimonials à true dans config/site.ts.
 */
export type Testimonial = {
  firstName: string;
  age?: number;
  text: string;
  /** Date du consentement écrit (AAAA-MM-JJ) */
  consentDate: string;
};

export const TESTIMONIALS: Testimonial[] = [];
