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

// ---------------------------------------------------------------------------
// Constructeurs
// ---------------------------------------------------------------------------

export function creerPosition(x: number, y: number): Position {
    return [x, y];
}

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

// ---------------------------------------------------------------------------
// Sélecteurs
// ---------------------------------------------------------------------------

export function getEtat(result: readonly [EtatRover, any]): EtatRover {
    return result[0];
}

export function getResultat<R>(result: readonly [EtatRover, R]): R {
    return result[1];
}

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

export function getAnalyses(etat: EtatRover): readonly string[] {
    return etat.analyses;
}

export function getCanalComms(etat: EtatRover): (data: {}) => void {
    return etat.canalComms;
}

export function getStatut(etat: EtatRover): "PRET" | "EN_CHARGE" {
    return etat.statut;
}

// ---------------------------------------------------------------------------
// Prédicats
// ---------------------------------------------------------------------------

export function estPret(etat: EtatRover): boolean {
    return getStatut(etat) === "PRET";
}

export function estEnCharge(etat: EtatRover): boolean {
    return getStatut(etat) === "EN_CHARGE";
}

export function estSoutePleine(etat: EtatRover): boolean {
    return getEchantillons(etat).length >= MAX_SOUTE;
}

export function manqueDeBatteriePourAction(etat: EtatRover, energieRequisePourAction: number): boolean {
    return getChargeBatterie(etat) < energieRequisePourAction;
}

export function manqueDeBatteriePourDeplacement(etat: EtatRover): boolean {
    return manqueDeBatteriePourAction(etat, ENERGIE_MIN_DEPLACEMENT);
}

// ---------------------------------------------------------------------------
// Opérateurs de base
// ---------------------------------------------------------------------------

export function changerStatut(etat: EtatRover, statut: "PRET" | "EN_CHARGE"): EtatRover {
    return {...etat, statut};
}

function changerBatterie(etat: EtatRover, nouvelleCharge: number): EtatRover {
    const charge = Math.max(MIN_CHARGE_BATTERIE, Math.min(MAX_CHARGE_BATTERIE, nouvelleCharge));
    const statut =
        charge <= MIN_CHARGE_BATTERIE ? "EN_CHARGE" :
            charge >= MAX_CHARGE_BATTERIE ? "PRET" :
                getStatut(etat);

    return {...etat, statut, chargeBatterie: charge};
}

function changerPosition(etat: EtatRover, position: Position): EtatRover {
    return {...etat, position};
}

function ajouterEchantillon(etat: EtatRover, echantillon: string): EtatRover {
    return {...etat, echantillons: [...getEchantillons(etat), echantillon]};
}

function retirerEchantillonsAnalyses(etat: EtatRover, nbAnalyses: number): EtatRover {
    return {
        ...etat,
        echantillons: getEchantillons(etat).slice(nbAnalyses),
        analyses: [...getAnalyses(etat), ...getEchantillons(etat).slice(0, nbAnalyses)]
    };
}

// ---------------------------------------------------------------------------
// Calculs
// ---------------------------------------------------------------------------

function norme(dx: number, dy: number): number {
    return Math.sqrt(dx * dx + dy * dy);
}

export function calculerDistance(posDepart: Position, posArrivee: Position): number {
    return norme(getX(posArrivee) - getX(posDepart), getY(posArrivee) - getY(posDepart));
}

function calculerEnergieDeplacement(dx: number, dy: number): number {
    return Math.ceil(ENERGIE_PAR_UNITE_DE_DEPLACEMENT * norme(dx, dy));
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function deplacementRover(etat: EtatRover, dx: number, dy: number): [EtatRover, ResultatDeplacement] {
    if (estEnCharge(etat)) {
        return [etat, {succes: false, raison: "Rover en charge"}];
    }

    if (manqueDeBatteriePourDeplacement(etat)) {
        return [etat, {succes: false, raison: "Batterie insuffisante"}];
    }

    const coutEnergie = calculerEnergieDeplacement(dx, dy);
    const complet = !manqueDeBatteriePourAction(etat, coutEnergie);
    const ratio = complet ? 1 : getChargeBatterie(etat) / coutEnergie;
    const energieDepensee = complet ? coutEnergie : getChargeBatterie(etat);

    const depart = getPosition(etat);
    const arrivee = creerPosition(getX(depart) + dx * ratio, getY(depart) + dy * ratio);
    const newEtat = changerPosition(
        changerBatterie(etat, getChargeBatterie(etat) - energieDepensee),
        arrivee
    );

    return [newEtat, {
        succes: true,
        complet,
        nouvellePosition: arrivee,
        distanceParcourue: calculerDistance(depart, arrivee),
        energieDepensee
    }];
}

export function rechargerBatterie(etat: EtatRover, gain: number): [EtatRover, ResultatRecharge] {
    const nouvelleCharge = Math.min(
        MAX_CHARGE_BATTERIE,
        getChargeBatterie(etat) + Math.max(0, gain)
    );

    const newEtat = changerBatterie(changerStatut(etat, "EN_CHARGE"), nouvelleCharge);

    return [newEtat, {
        chargeApres: nouvelleCharge,
        completementCharge: nouvelleCharge === MAX_CHARGE_BATTERIE
    }];
}

export function collecterEchantillon(etat: EtatRover, echantillon: string): [EtatRover, ResultatCollecte] {
    if (estEnCharge(etat)) {
        return [etat, {succes: false, raison: "Rover en charge"}];
    }

    if (estSoutePleine(etat)) {
        return [etat, {succes: false, raison: "Soute pleine"}];
    }

    if (manqueDeBatteriePourAction(etat, ENERGIE_COLLECTE)) {
        return [etat, {succes: false, raison: "Batterie insuffisante"}];
    }

    const newEtat = ajouterEchantillon(
        changerBatterie(etat, getChargeBatterie(etat) - ENERGIE_COLLECTE),
        echantillon
    );

    return [newEtat, {
        succes: true,
        echantillons: getEchantillons(newEtat),
        energieDepense: ENERGIE_COLLECTE
    }];
}

export function analysesEchantillon(etat: EtatRover): [EtatRover, ResultatAnalyse] {
    if (estEnCharge(etat)) {
        return [etat, {succes: false, raison: "Rover en charge"}];
    }

    const nbEnSoute = getEchantillons(etat).length;
    const nbAnalysables = Math.floor(getChargeBatterie(etat) / ENERGIE_PAR_ANALYSE);
    const nbAAnalyser = Math.min(nbEnSoute, nbAnalysables);

    if (nbAAnalyser === 0 && nbEnSoute > 0) {
        return [etat, {succes: false, raison: "Batterie insuffisante"}];
    }

    const echantillonsAnalyses = getEchantillons(etat).slice(0, nbAAnalyser);
    const energieDepense = nbAAnalyser * ENERGIE_PAR_ANALYSE;
    const newEtat = retirerEchantillonsAnalyses(
        changerBatterie(etat, getChargeBatterie(etat) - energieDepense),
        nbAAnalyser
    );

    return [newEtat, {
        succes: true,
        complet: nbAAnalyser === nbEnSoute,
        echantillonsAnalyses,
        energieDepense
    }];
}

export function communiquerRover(etat: EtatRover, data: {}): [EtatRover, ResultatCommunication] {
    getCanalComms(etat)(data);
    return [etat, {nbBytes: new TextEncoder().encode(JSON.stringify(data)).length}];
}
