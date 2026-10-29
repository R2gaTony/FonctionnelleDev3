import {
  EtatRover,
  ResultatAnalyse,
  ResultatCollecte,
  ResultatCommunication,
  ResultatDeplacement,
  ResultatRecharge,
} from "./model.js";

import { StateExecutor } from "./state-executor.js";

export function deplacer(dx: number, dy: number): (etat: EtatRover) => [EtatRover, ResultatDeplacement] {
  // Écrire l'implémentation de la fonction deplacer ici.
  return null as any as (etat: EtatRover) => [EtatRover, ResultatDeplacement];
}

export function collecter(element: string): (etat: EtatRover) => [EtatRover, ResultatCollecte] {
  // Écrire l'implémentation de la fonction collecter ici.
  return null as any as (etat: EtatRover) => [EtatRover, ResultatCollecte];
}

export function analyser(): (etat: EtatRover) => [EtatRover, ResultatAnalyse] {
  // Écrire l'implémentation de la fonction analyser ici.
  return null as any as (etat: EtatRover) => [EtatRover, ResultatAnalyse];
}

export function recharger(gain: number): (etat: EtatRover) => [EtatRover, ResultatRecharge] {
  // Écrire l'implémentation de la fonction recharger ici.
  return null as any as (etat: EtatRover) => [EtatRover, ResultatRecharge];
}

export function communiquer(data: {}): (etat: EtatRover) => [EtatRover, ResultatCommunication] {
  // Écrire l'implémentation de la fonction communiquer ici.
  return null as any as (etat: EtatRover) => [EtatRover, ResultatCommunication];
}

export function scenarioA(): StateExecutor<EtatRover, ResultatCommunication> {
  interface FormatDataScenarioA {
    message: "Mission accomplie";
    restants: readonly string[];
    analyses: readonly string[];
  }

  // Écrire le scénario A ici, en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer pour effectuer les actions.
  return null as any as StateExecutor<EtatRover, ResultatCommunication>;
}

export function scenarioB(): StateExecutor<EtatRover, ResultatCommunication> {
  interface FormatDataScenarioB {
    position: [number, number];
    charge: number;
  }

  // Écrire le scénario B ici, en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer pour effectuer les actions.
  return null as any as StateExecutor<EtatRover, ResultatCommunication>;
}

export function scenarioC(nbCycles: number): StateExecutor<EtatRover, ResultatCommunication> {
  interface FormatDataScenarioC {
    totalAnalyses: number;
    chargeFinale: number;
  }

  // Écrire le scénario C ici, en utilisant les fonctions deplacer, collecter, analyser, recharger et communiquer pour effectuer les actions.
  return null as any as StateExecutor<EtatRover, ResultatCommunication>;
}
