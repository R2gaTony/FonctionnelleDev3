export const moi = {
    nom: "Antoine Pellegrini",
    cip: "22 116 416",
};

const MAX_SOUTE = 10;
const MIN_CHARGE_BATTERIE = 0;
const MAX_CHARGE_BATTERIE = 100;
const ENERGIE_MIN_DEPLACEMENT = 5;
const ENERGIE_PAR_UNITE_DE_DEPLACEMENT = 5;
const ENERGIE_COLLECTE = 10;
const ENERGIE_PAR_ANALYSE = 10;

type Position = [number, number]; // [x, y]

interface BaseEtatRover {
    readonly position: Position;
    readonly chargeBatterie: number; // 0 à 100%
    readonly echantillons: readonly string[];
    readonly analyses: readonly string[];
    readonly canalComms: (data: {}) => void;
}

export interface RoverPret extends BaseEtatRover {
    readonly statut: "PRET";
}

export interface RoverEnCharge extends BaseEtatRover {
    readonly statut: "EN_CHARGE";
}

export type EtatRover = RoverPret | RoverEnCharge;

export type SuccesDeplacement = {
    readonly succes: true;
    readonly complet: boolean;
    readonly nouvellePosition: Position;
    readonly distanceParcourue: number;
    readonly energieDepensee: number;
};
export type EchecDeplacement = {
    readonly succes: false;
    readonly raison: "Batterie insuffisante" | "Rover en charge";
};
export type ResultatDeplacement = SuccesDeplacement | EchecDeplacement;

export type SuccesCollecte = {
    readonly succes: true;
    readonly echantillons: readonly string[];
    readonly energieDepense: number;
};
export type EchecCollecte = {
    readonly succes: false;
    readonly raison: "Batterie insuffisante" | "Soute pleine" | "Rover en charge";
};
export type ResultatCollecte = SuccesCollecte | EchecCollecte;

export type ResultatRecharge = {
    readonly chargeApres: number;
    readonly completementCharge: boolean;
};

export type SuccesAnalyse = {
    readonly succes: true;
    readonly complet: boolean;
    readonly echantillonsAnalyses: readonly string[];
    readonly energieDepense: number;
};
export type EchecAnalyse = {
    readonly succes: false;
    readonly raison: "Batterie insuffisante" | "Rover en charge";
};
export type ResultatAnalyse = SuccesAnalyse | EchecAnalyse;

export type ResultatCommunication = {
    readonly nbBytes: number;
};

// AJOUTER ICI LES CONSTRUCTEURS, SÉLECTEURS, PRÉDICATS ET OPÉRATEURS NÉCESSAIRES.

// Sélecteurs
export function getPosition(etat: EtatRover): Position {
    return etat.position;
}

export function getX(position: Position): number {
    return position[0];
}

export function getY(position: Position): number {
    return position[1];
}

export function getChargeBatterie(etat: EtatRover): number {
    return etat.chargeBatterie;
}

export function getEchantillons(etat: EtatRover): readonly string[] {
    return etat.echantillons;
}

export function getLastEchantillon(etat: EtatRover): string {
    return etat.echantillons[etat.echantillons.length - 1];
}

export function getAnalyses(etat: EtatRover): readonly string[] {
    return etat.analyses;
}

export function getCanalComms(etat: EtatRover): (data: {}) => void {
    return etat.canalComms;
}

export function getStatut(etat: EtatRover): "PRET" | "EN_CHARGE" {
    return etat.statut;
}

// Prédicats
export function estPret(etat: EtatRover): boolean {
    return getStatut(etat) == "PRET";
}

export function estEnCharge(etat: EtatRover): boolean {
    return getStatut(etat) == "EN_CHARGE";
}

export function estSoutePleine(etat: EtatRover): boolean {
    return getEchantillons(etat).length >= MAX_SOUTE;
}

export function manqueDeBatteriePourAction(etat: EtatRover, energieRequisePourAction: number): boolean {
    return getChargeBatterie(etat) < energieRequisePourAction;
}

export function manqueDeBatteriePourDeplacement(etat: EtatRover): boolean {
    return getChargeBatterie(etat) < ENERGIE_MIN_DEPLACEMENT;
}

//Operateurs
function calculerEnergieDeplacement(etat: EtatRover, nouvellePosition: Position): number {

    const dx = getX(nouvellePosition) - getX(getPosition(etat));
    const dy = getY(nouvellePosition) - getY(getPosition(etat));

    return Math.ceil(ENERGIE_PAR_UNITE_DE_DEPLACEMENT * Math.sqrt(dx * dx + dy * dy));
}

function calcDeplacementIncomplet(etat: EtatRover, nouvellePosition: Position, coutEnergie: number): Position {

    const pourcentageDeplacement = getChargeBatterie(etat) / coutEnergie;
    const dx = (getX(nouvellePosition) - getX(getPosition(etat))) * pourcentageDeplacement;
    const dy = (getY(nouvellePosition) - getY(getPosition(etat))) * pourcentageDeplacement;

    return [getX(getPosition(etat)) + dx, getY(getPosition(etat)) + dy];
}

export function changerPosition(etat: EtatRover, nouvellePosition: Position): EtatRover {
    const coutEnergie = calculerEnergieDeplacement(etat, nouvellePosition);

    if (manqueDeBatteriePourDeplacement(etat)) {
        return etat;
    }

    const newPosition = manqueDeBatteriePourAction(etat, coutEnergie) ?
        calcDeplacementIncomplet(etat, nouvellePosition, coutEnergie) :
        nouvellePosition;

    const newEtat = manqueDeBatteriePourAction(etat, coutEnergie) ?
        changerBatterie(etat, 0) :
        changerBatterie(etat, getChargeBatterie(etat) - coutEnergie);

    return {
        ...newEtat,
        position: newPosition
    };
}

export function changerBatterie(etat: EtatRover, nouvelleCharge: number): EtatRover {
    const chargeValide = nouvelleCharge >= MIN_CHARGE_BATTERIE && nouvelleCharge <= MAX_CHARGE_BATTERIE
        ? nouvelleCharge
        : getChargeBatterie(etat);

    if (chargeValide <= MIN_CHARGE_BATTERIE) {
        etat = changerStatut(etat, "EN_CHARGE");
    } else if (chargeValide >= MAX_CHARGE_BATTERIE) {
        etat = changerStatut(etat, "PRET");
    }

    return {
        ...etat,
        chargeBatterie: chargeValide
    };
}

export function ajouterEchantillon(etat: EtatRover, echantillon: string): EtatRover {
    if (estSoutePleine(etat) || manqueDeBatteriePourAction(etat, ENERGIE_COLLECTE)) {
        return etat;
    }

    const newChargeBatterie = getChargeBatterie(etat) - ENERGIE_COLLECTE;
    const newEtat = changerBatterie(etat, newChargeBatterie);

    return {
        ...newEtat,
        echantillons: [echantillon, ...getEchantillons(etat)]
    }
}

export function mettreAJourEchantillonsEtAnalyses(etat: EtatRover): EtatRover {
    if (manqueDeBatteriePourAction(etat, ENERGIE_PAR_ANALYSE) || getEchantillons(etat).length <= 0) {
        return etat;
    }

    const newEtat = {
        ...changerBatterie(etat, getChargeBatterie(etat) - ENERGIE_PAR_ANALYSE),
        analyses: [getLastEchantillon(etat), ...getAnalyses(etat)],
        echantillons: getEchantillons(etat).slice(0, -1)
    };

    return mettreAJourEchantillonsEtAnalyses(newEtat);
}

export function changerStatut(etat: EtatRover, statut: "PRET" | "EN_CHARGE"): EtatRover {
    return {
        ...etat,
        statut: statut
    };
}

/*export function calculerDistance(posDepart: Position, posArrivee: Position): number {

}*/

export function roverPret(
    position: Position,
    batterie: number,
    echantillons: readonly string[],
    analyses: readonly string[],
    canalComms: (data: {}) => void,
): RoverPret {
    return {statut: "PRET", position, chargeBatterie: batterie, echantillons, analyses, canalComms};
}

export function roverEnCharge(
    position: Position,
    batterie: number,
    echantillons: readonly string[],
    analyses: readonly string[],
    canalComms: (data: {}) => void,
): RoverEnCharge {
    return {statut: "EN_CHARGE", position, chargeBatterie: batterie, echantillons, analyses, canalComms};
}
