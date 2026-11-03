import {
  analysesEchantillon,
  collecterEchantillon,
  communiquerRover,
  deplacementRover,
  EtatRover,
  getAnalyses,
  getChargeBatterie,
  getEchantillons,
  getEtat,
  getPosition,
  rechargerBatterie,
  ResultatAnalyse,
  ResultatCollecte,
  ResultatCommunication,
  ResultatDeplacement,
  ResultatRecharge,
} from "./model.js";

export function deplacer(etat: EtatRover, dx: number, dy: number): [EtatRover, ResultatDeplacement] {
  return deplacementRover(etat, dx, dy);
}

export function collecter(etat: EtatRover, element: string): [EtatRover, ResultatCollecte] {
  return collecterEchantillon(etat, element);
}

export function analyser(etat: EtatRover): [EtatRover, ResultatAnalyse] {
  return analysesEchantillon(etat);
}

export function recharger(etat: EtatRover, gain: number): [EtatRover, ResultatRecharge] {
  return rechargerBatterie(etat, gain);
}

export function communiquer(etat: EtatRover, data: {}): [EtatRover, ResultatCommunication] {
  return communiquerRover(etat, data);
}

export function scenarioA(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioA {
    message: "Mission accomplie";
    restants: readonly string[];
    analyses: readonly string[];
  }

  const [etat1] = deplacer(etatInitial, 2, 0);
  const [etat2] = collecter(etat1, "regolithe");
  const [etat3] = deplacer(etat2, 0, 2);
  const [etat4] = analyser(etat3);

  const data: FormatDataScenarioA = {
    message: "Mission accomplie",
    restants: getEchantillons(etat4),
    analyses: getAnalyses(etat4),
  };

  return communiquer(etat4, data);
}

export function scenarioB(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioB {
    position: readonly [number, number];
    charge: number;
  }

  const [etat1, deplacement] = deplacer(etatInitial, 10, 0);
  const succesComplet = deplacement.succes && deplacement.complet;

  const [etat2] = succesComplet
      ? collecter(getEtat(communiquer(etat1, { statut: "Sur site" })), "glace")
      : recharger(getEtat(communiquer(etat1, { statut: "Arrêt prématuré" })), 50);

  const bilan: FormatDataScenarioB = {
    position: getPosition(etat2),
    charge: getChargeBatterie(etat2),
  };

  return communiquer(etat2, bilan);
}

export function scenarioC(etatInitial: EtatRover, nbCycles: number): readonly [EtatRover, ResultatCommunication] {
  interface FormatDataScenarioC {
    totalAnalyses: number;
    chargeFinale: number;
  }

  function cycleExploration(etat: EtatRover): EtatRover {
    const [etat1] = deplacer(etat, 1, 0);
    const [etat2] = collecter(etat1, "roche");
    const [etat3] = recharger(etat2, 20);
    return etat3;
  }

  function explorer(etat: EtatRover, cyclesRestants: number): EtatRover {
    return cyclesRestants <= 0
        ? etat
        : explorer(cycleExploration(etat), cyclesRestants - 1);
  }

  const [etatFinal] = analyser(explorer(etatInitial, nbCycles));

  const data: FormatDataScenarioC = {
    totalAnalyses: getAnalyses(etatFinal).length,
    chargeFinale: getChargeBatterie(etatFinal),
  };

  return communiquer(etatFinal, data);
}