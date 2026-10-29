import { State } from "./state.js";

// API Fluide
export interface StateExecutor<S, A> {
  // Le calcul d'état encapsulé
  readonly run: State<S, A>;

  // Fonction de chaînage fluide, ecrase le context avec le dernier résultat
  andThen<B>(f: (a: A) => State<S, B>): StateExecutor<S, B>;

  // Exécute une action sans capturer son résultat, mais propage le contexte
  tap(f: (a: A) => State<S, unknown>): StateExecutor<S, A>;

  // Capture le résultat sous une nouvelle clé dans l'objet contexte accumulé
  assign<K extends string, B>(key: K, f: (ctx: A) => State<S, B>): StateExecutor<S, A & Record<K, B>>;
}

// Constructeur d'exécuteur
export function stateExecutor<S, A>(operation: State<S, A>): StateExecutor<S, A> {
  return {
    run: operation,
    andThen<B>(f: (a: A) => State<S, B>): StateExecutor<S, B> {
      const operationsChainees: State<S, B> = (etatInitial: S) => {
        const [etatIntermediaire, a] = operation(etatInitial);
        const prochaineOperation = f(a);
        return prochaineOperation(etatIntermediaire);
      };

      return stateExecutor(operationsChainees);
    },
    tap(f: (a: A) => State<S, unknown>): StateExecutor<S, A> {
      return this.andThen((ctx) => (etat: S) => {
        const [nouvelEtat] = f(ctx)(etat);
        // On conserve le contexte 'ctx' intact
        return [nouvelEtat, ctx] as const;
      });
    },
    assign<K extends string, B>(key: K, f: (ctx: A) => State<S, B>) {
      return this.andThen((ctx) => (etat: S) => {
        // Exécute l'action avec l'état courant
        const [nouvelEtat, valeurProduite] = f(ctx)(etat);
        // Enrichit l'accumulateur immuable
        const nouveauContexte = { ...ctx, [key]: valeurProduite } as A & Record<K, B>;
        return [nouvelEtat, nouveauContexte] as const;
      });
    },
  };
}
