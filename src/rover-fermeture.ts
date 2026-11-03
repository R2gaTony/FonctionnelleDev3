import {
    analysesEchantillon,
    collecterEchantillon,
    communiquerRover,
    deplacementRover,
    EtatRover,
    getAnalyses,
    getChargeBatterie,
    getEchantillons,
    getPosition,
    rechargerBatterie,
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
    let etat: EtatRover = initial;

    function appliquer<R>(action: (e: EtatRover) => [EtatRover, R]): R {
        const [nouvelEtat, resultat] = action(etat);
        etat = nouvelEtat;
        return resultat;
    }

    return {
        deplacer: (dx, dy) => appliquer(e => deplacementRover(e, dx, dy)),
        collecter: (element) => appliquer(e => collecterEchantillon(e, element)),
        recharger: (gain) => appliquer(e => rechargerBatterie(e, gain)),
        analyser: () => appliquer(analysesEchantillon),
        communiquer: (data) => appliquer(e => communiquerRover(e, data)),
        obtenirEtat: () => etat,
    };
}

export function scenarioA(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
    interface FormatDataScenarioA {
        message: "Mission accomplie";
        restants: readonly string[];
        analyses: readonly string[];
    }

    const rover = creerRover(etatInitial);

    rover.deplacer(2, 0);
    rover.collecter("regolithe");
    rover.deplacer(0, 2);
    rover.analyser();

    const data: FormatDataScenarioA = {
        message: "Mission accomplie",
        restants: getEchantillons(rover.obtenirEtat()),
        analyses: getAnalyses(rover.obtenirEtat()),
    };
    const resultatComm = rover.communiquer(data);

    return [rover.obtenirEtat(), resultatComm] as const;
}

export function scenarioB(etatInitial: EtatRover): readonly [EtatRover, ResultatCommunication] {
    interface FormatDataScenarioB {
        position: readonly [number, number];
        charge: number;
    }

    const rover = creerRover(etatInitial);

    const deplacement = rover.deplacer(10, 0);

    if (deplacement.succes && deplacement.complet) {
        rover.communiquer({statut: "Sur site"});
        rover.collecter("glace");
    } else {
        rover.communiquer({statut: "Arrêt prématuré"});
        rover.recharger(50);
    }

    const bilan: FormatDataScenarioB = {
        position: getPosition(rover.obtenirEtat()),
        charge: getChargeBatterie(rover.obtenirEtat()),
    };
    const resultatComm = rover.communiquer(bilan);

    return [rover.obtenirEtat(), resultatComm] as const;
}

export function scenarioC(etatInitial: EtatRover, nbCycles: number): readonly [EtatRover, ResultatCommunication] {
    interface FormatDataScenarioC {
        totalAnalyses: number;
        chargeFinale: number;
    }

    const rover = creerRover(etatInitial);

    // Pas de boucle : les cycles d'exploration sont faits par récursion.
    function explorer(cyclesRestants: number): void {
        if (cyclesRestants <= 0) {
            return;
        }
        rover.deplacer(1, 0);
        rover.collecter("roche");
        rover.recharger(20);
        explorer(cyclesRestants - 1);
    }

    explorer(nbCycles);
    rover.analyser();

    const data: FormatDataScenarioC = {
        totalAnalyses: getAnalyses(rover.obtenirEtat()).length,
        chargeFinale: getChargeBatterie(rover.obtenirEtat()),
    };
    const resultatComm = rover.communiquer(data);

    return [rover.obtenirEtat(), resultatComm] as const;
}