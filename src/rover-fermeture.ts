import {
  EtatRover,
  ResultatAnalyse,
  ResultatCollecte,
  ResultatCommunication,
  ResultatDeplacement,
  ResultatRecharge,
} from "./model.js";

export interface Rover {
  deplacer(dx: number, dy: number): ResultatDeplacement;
  collecter(element: string): ResultatCollecte;
  recharger(gain: number): ResultatRecharge;
  analyser(): ResultatAnalyse;
  communiquer(data: {}): ResultatCommunication;
  obtenirEtat(): EtatRover;
}

export function creerRover(initial: EtatRover): Rover {
  //  Écrire l'implémentation du rover ici.
  return null as any as Rover;
}

export function scenarioA(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioA {
    message: "Mission accomplie";
    restants: readonly string[];
    analyses: readonly string[];
  }
  const rover = creerRover(etatInitial);

  //  Écrire le scénario A ici en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer du rover créer à la ligne précédent.

  return [rover.obtenirEtat(), null as any as ResultatCommunication] as const;
}

export function scenarioB(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioB {
    position: [number, number];
    charge: number;
  }

  const rover = creerRover(etatInitial);

  //  Écrire le scénario B ici en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer du rover créer à la ligne précédent.

  return [rover.obtenirEtat(), null as any as ResultatCommunication] as const;
}

export function scenarioC(etatInitial: EtatRover, nbCycles: number): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioC {
    totalAnalyses: number;
    chargeFinale: number;
  }
  const rover = creerRover(etatInitial);

  //  Écrire le scénario C ici en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer du rover créer à la ligne précédent.

  return [rover.obtenirEtat(), null as any as ResultatCommunication] as const;
}
