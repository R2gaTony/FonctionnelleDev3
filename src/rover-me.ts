import {
  EtatRover,
  getAnalyses,
  getChargeBatterie,
  getEchantillons,
  getPosition,
  ResultatAnalyse,
  ResultatCollecte,
  ResultatCommunication,
  ResultatDeplacement,
  ResultatRecharge,
} from "./model.js";

import * as pe from "./rover-pe.js";
import { inspect, of, State } from "./state.js";
import { stateExecutor, StateExecutor } from "./state-executor.js";

export function deplacer(dx: number, dy: number): (etat: EtatRover) => [EtatRover, ResultatDeplacement] {
  return (etat) => pe.deplacer(etat, dx, dy);
}

export function collecter(element: string): (etat: EtatRover) => [EtatRover, ResultatCollecte] {
  return (etat) => pe.collecter(etat, element);
}

export function analyser(): (etat: EtatRover) => [EtatRover, ResultatAnalyse] {
  return (etat) => pe.analyser(etat);
}

export function recharger(gain: number): (etat: EtatRover) => [EtatRover, ResultatRecharge] {
  return (etat) => pe.recharger(etat, gain);
}

export function communiquer(data: {}): (etat: EtatRover) => [EtatRover, ResultatCommunication] {
  return (etat) => pe.communiquer(etat, data);
}

export function scenarioA(): StateExecutor<EtatRover, ResultatCommunication> {
  interface FormatDataScenarioA {
    message: "Mission accomplie";
    restants: readonly string[];
    analyses: readonly string[];
  }

  return stateExecutor(deplacer(2, 0))
      .andThen(() => collecter("regolithe"))
      .andThen(() => deplacer(0, 2))
      .andThen(() => analyser())
      .andThen(() => inspect((etat: EtatRover): FormatDataScenarioA => ({
        message: "Mission accomplie",
        restants: getEchantillons(etat),
        analyses: getAnalyses(etat),
      })))
      .andThen((data) => communiquer(data));
}

export function scenarioB(): StateExecutor<EtatRover, ResultatCommunication> {
  interface FormatDataScenarioB {
    position: readonly [number, number];
    charge: number;
  }

  const surSite: State<EtatRover, unknown> =
      stateExecutor(communiquer({ statut: "Sur site" }))
          .andThen(() => collecter("glace"))
          .run;

  const arretPremature: State<EtatRover, unknown> =
      stateExecutor(communiquer({ statut: "Arrêt prématuré" }))
          .andThen(() => recharger(50))
          .run;

  return stateExecutor(deplacer(10, 0))
      .andThen((deplacement) => deplacement.succes && deplacement.complet ? surSite : arretPremature)
      .andThen(() => inspect((etat: EtatRover): FormatDataScenarioB => ({
        position: getPosition(etat),
        charge: getChargeBatterie(etat),
      })))
      .andThen((bilan) => communiquer(bilan));
}

export function scenarioC(nbCycles: number): StateExecutor<EtatRover, ResultatCommunication> {
  interface FormatDataScenarioC {
    totalAnalyses: number;
    chargeFinale: number;
  }

  const cycleExploration: State<EtatRover, unknown> =
      stateExecutor(deplacer(1, 0))
          .andThen(() => collecter("roche"))
          .andThen(() => recharger(20))
          .run;

  function explorer(cyclesRestants: number): State<EtatRover, unknown> {
    return cyclesRestants <= 0
        ? of<EtatRover, unknown>(null)
        : stateExecutor(cycleExploration)
            .andThen(() => explorer(cyclesRestants - 1))
            .run;
  }

  return stateExecutor(explorer(nbCycles))
      .andThen(() => analyser())
      .andThen(() => inspect((etat: EtatRover): FormatDataScenarioC => ({
        totalAnalyses: getAnalyses(etat).length,
        chargeFinale: getChargeBatterie(etat),
      })))
      .andThen((data) => communiquer(data));
}