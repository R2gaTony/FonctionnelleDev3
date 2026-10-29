export const moi = {
  nom: "???",
  cip: "???",
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
export function roverPret(
  position: Position,
  batterie: number,
  echantillons: readonly string[],
  analyses: readonly string[],
  canalComms: (data: {}) => void,
): RoverPret {
  return { statut: "PRET", position, chargeBatterie: batterie, echantillons, analyses, canalComms };
}

export function roverEnCharge(
  position: Position,
  batterie: number,
  echantillons: readonly string[],
  analyses: readonly string[],
  canalComms: (data: {}) => void,
): RoverEnCharge {
  return { statut: "EN_CHARGE", position, chargeBatterie: batterie, echantillons, analyses, canalComms };
}
