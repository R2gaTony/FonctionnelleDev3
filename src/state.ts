export type State<S, A> = (etat: S) => readonly [S, A];

/**
 * Emballe une valeur sans modifier l'état.
 * Utile pour construire un état qui retourne une valeur donné sans changer l'état actuel.
 *
 * Aussi connu sous le nom de bind ou pure.
 */
export function of<S, A>(valeur: A): State<S, A> {
  return (etat: S) => [etat, valeur] as const;
}

/**
 * Extrait l'état complet du système pour le rendre accessible comme valeur de résultat (A = S) utilisable dans un flatMap.
 */
export const get =
  <S>(): State<S, S> =>
  (etat: S) =>
    [etat, etat] as const;

/**
 * Applique une fonction de projection sur l'état courant et expose uniquement la valeur calculée/extraite.
 */
export const inspect =
  <S, A>(selecteur: (etat: S) => A): State<S, A> =>
  (etat: S) =>
    [etat, selecteur(etat)] as const;

/**
 * Transforme le résultat (A -> B) sans toucher à l'état.
 */
export function map<S, A, B>(action: State<S, A>, f: (a: A) => B): State<S, B> {
  return (etatInitial: S) => {
    const [nouvelEtat, resultat] = action(etatInitial);
    return [nouvelEtat, f(resultat)] as const;
  };
}

/**
 * Enchaîne une action d'état avec une fonction 'f' qui produit l'action suivante.
 * Injecte automatiquement l'état intermédiaire produit par la 1re étape dans la 2e.
 *
 * Analogie avec flatMap sur les collections :
 * - Sur les tableaux, flatMap reçoit (a: A) => B[] et évite un tableau imbriqué B[][].
 * - Sur State, flatMap reçoit une fonction qui prend le résultat (a: A)
 *   et retourne un nouvel état State<S, B>. Elle aplatit la structure pour obtenir
 *   directement un State<S, B> au lieu d'un état imbriqué State<S, State<S, B>>.
 */
export function flatMap<S, A, B>(action: State<S, A>, f: (a: A) => State<S, B>): State<S, B> {
  return (etatInitial: S) => {
    // Exécuter la première transition d'état
    const [etatIntermediaire, resultatA] = action(etatInitial);

    // Obtenir la deuxième action à partir du résultat A
    const prochaineAction = f(resultatA);

    // Exécuter la deuxième action avec l'état intermédiaire
    return prochaineAction(etatIntermediaire);
  };
}
export const andThen = flatMap;

/**
 * Démarre l'exécution depuis un état initial.
 */
export function run<S, A>(action: State<S, A>, initial: S): readonly [S, A] {
  return action(initial);
}
