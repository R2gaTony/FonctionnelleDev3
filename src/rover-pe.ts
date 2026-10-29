import {
  EtatRover,
  ResultatAnalyse,
  ResultatCollecte,
  ResultatCommunication,
  ResultatDeplacement,
  ResultatRecharge,
} from "./model.js";

export function deplacer(etat: EtatRover, dx: number, dy: number): [EtatRover, ResultatDeplacement] {
  // Écrire l'implémentation de la fonction deplacer ici.
  return null as any as [EtatRover, ResultatDeplacement];
}

export function collecter(etat: EtatRover, element: string): [EtatRover, ResultatCollecte] {
  // Écrire l'implémentation de la fonction collecter ici.
  return null as any as [EtatRover, ResultatCollecte];
}

export function analyser(etat: EtatRover): [EtatRover, ResultatAnalyse] {
  // Écrire l'implémentation de la fonction analyser ici.
  return null as any as [EtatRover, ResultatAnalyse];
}

export function recharger(etat: EtatRover, gain: number): [EtatRover, ResultatRecharge] {
  // Écrire l'implémentation de la fonction recharger ici.
  return null as any as [EtatRover, ResultatRecharge];
}

export function communiquer(etat: EtatRover, data: {}): [EtatRover, ResultatCommunication] {
  // Écrire l'implémentation de la fonction communiquer ici.
  return null as any as [EtatRover, ResultatCommunication];
}

export function scenarioA(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioA {
    message: "Mission accomplie";
    restants: readonly string[];
    analyses: readonly string[];
  }

  // Écrire le scénario A ici, en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer pour effectuer les actions.
  return null as any as readonly [EtatRover, ResultatCommunication];
}

export function scenarioB(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioB {
    position: [number, number];
    charge: number;
  }
  // Écrire le scénario B ici, en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer pour effectuer les actions.
  return null as any as readonly [EtatRover, ResultatCommunication];
}

export function scenarioC(etatInitial: EtatRover, nbCycles: number): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioC {
    totalAnalyses: number;
    chargeFinale: number;
  }
  // Écrire le scénario C ici, en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer pour effectuer les actions.
  return null as any as readonly [EtatRover, ResultatCommunication];
}
