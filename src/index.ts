import {
    creerPosition,
    EtatRover,
    getAnalyses,
    getChargeBatterie,
    getEchantillons,
    getPosition,
    getStatut,
    ResultatCommunication,
    roverEnCharge,
    roverPret,
} from "./model.js";

import * as fermeture from "./rover-fermeture.js";
import * as pe from "./rover-pe.js";
import * as me from "./rover-me.js";

// ---------------------------------------------------------------------------
// Petit utilitaire de test (aucune dépendance externe)
// ---------------------------------------------------------------------------

interface Test {
    readonly nom: string;
    readonly executer: () => void;
}

function egal(actuel: unknown, attendu: unknown, libelle: string): void {
    const a = JSON.stringify(actuel);
    const b = JSON.stringify(attendu);
    if (a !== b) {
        throw new Error(`${libelle} : attendu ${b}, obtenu ${a}`);
    }
}

interface EtatAttendu {
    readonly position: readonly [number, number];
    readonly charge: number;
    readonly statut: "PRET" | "EN_CHARGE";
    readonly echantillons: readonly string[];
    readonly analyses: readonly string[];
}

function verifierEtat(etat: EtatRover, attendu: EtatAttendu): void {
    egal(getPosition(etat), attendu.position, "position");
    egal(getChargeBatterie(etat), attendu.charge, "charge");
    egal(getStatut(etat), attendu.statut, "statut");
    egal(getEchantillons(etat), attendu.echantillons, "échantillons");
    egal(getAnalyses(etat), attendu.analyses, "analyses");
}

// ---------------------------------------------------------------------------
// Fabrication des états initiaux (avec capture des communications)
// ---------------------------------------------------------------------------

interface Contexte {
    readonly etat: EtatRover;
    readonly messages: unknown[]; // remplie par le canal de communication
}

function contextePret(charge: number, echantillons: readonly string[] = []): Contexte {
    const messages: unknown[] = [];
    const etat = roverPret(creerPosition(0, 0), charge, echantillons, [], (data) => {
        messages.push(data);
    });
    return { etat, messages };
}

function contexteEnCharge(charge: number): Contexte {
    const messages: unknown[] = [];
    const etat = roverEnCharge(creerPosition(0, 0), charge, [], [], (data) => {
        messages.push(data);
    });
    return { etat, messages };
}

// ---------------------------------------------------------------------------
// Les trois implémentations, présentées sous une interface commune
// ---------------------------------------------------------------------------

type Sortie = readonly [EtatRover, ResultatCommunication];

interface Implementation {
    readonly nom: string;
    readonly scenarioA: (etat: EtatRover) => Sortie;
    readonly scenarioB: (etat: EtatRover) => Sortie;
    readonly scenarioC: (etat: EtatRover, nbCycles: number) => Sortie;
}

const implementations: readonly Implementation[] = [
    {
        nom: "Fermeture",
        scenarioA: fermeture.scenarioA,
        scenarioB: fermeture.scenarioB,
        scenarioC: fermeture.scenarioC,
    },
    {
        nom: "Passage d'état",
        scenarioA: pe.scenarioA,
        scenarioB: pe.scenarioB,
        scenarioC: pe.scenarioC,
    },
    {
        nom: "Monade d'état",
        scenarioA: (etat) => me.scenarioA().run(etat),
        scenarioB: (etat) => me.scenarioB().run(etat),
        scenarioC: (etat, nbCycles) => me.scenarioC(nbCycles).run(etat),
    },
];

function nbBytes(message: unknown): number {
    return new TextEncoder().encode(JSON.stringify(message)).length;
}

// ---------------------------------------------------------------------------
// Tests des scénarios, pour chaque implémentation
// ---------------------------------------------------------------------------

function testsScenarios(impl: Implementation): readonly Test[] {
    const nom = (scenario: string) => `${impl.nom} - ${scenario}`;

    return [
        {
            nom: nom("Scénario A"),
            executer: () => {
                const { etat, messages } = contextePret(100);
                const [etatFinal, comm] = impl.scenarioA(etat);

                verifierEtat(etatFinal, {
                    position: [2, 2],
                    charge: 60,
                    statut: "PRET",
                    echantillons: [],
                    analyses: ["regolithe"],
                });
                const attendu = { message: "Mission accomplie", restants: [], analyses: ["regolithe"] };
                egal(messages, [attendu], "messages communiqués");
                egal(comm.nbBytes, nbBytes(attendu), "nbBytes");
            },
        },
        {
            nom: nom("Scénario B - succès complet"),
            executer: () => {
                const { etat, messages } = contextePret(100);
                const [etatFinal] = impl.scenarioB(etat);

                verifierEtat(etatFinal, {
                    position: [10, 0],
                    charge: 40,
                    statut: "PRET",
                    echantillons: ["glace"],
                    analyses: [],
                });
                egal(messages, [{ statut: "Sur site" }, { position: [10, 0], charge: 40 }], "messages communiqués");
            },
        },
        {
            nom: nom("Scénario B - déplacement partiel (arrêt prématuré)"),
            executer: () => {
                const { etat, messages } = contextePret(30);
                const [etatFinal] = impl.scenarioB(etat);

                verifierEtat(etatFinal, {
                    position: [6, 0],
                    charge: 50,
                    statut: "EN_CHARGE",
                    echantillons: [],
                    analyses: [],
                });
                egal(messages, [{ statut: "Arrêt prématuré" }, { position: [6, 0], charge: 50 }], "messages communiqués");
            },
        },
        {
            nom: nom("Scénario B - batterie insuffisante pour se déplacer"),
            executer: () => {
                const { etat, messages } = contextePret(3);
                const [etatFinal] = impl.scenarioB(etat);

                verifierEtat(etatFinal, {
                    position: [0, 0],
                    charge: 53,
                    statut: "EN_CHARGE",
                    echantillons: [],
                    analyses: [],
                });
                egal(messages, [{ statut: "Arrêt prématuré" }, { position: [0, 0], charge: 53 }], "messages communiqués");
            },
        },
        {
            nom: nom("Scénario C - 3 cycles"),
            executer: () => {
                const { etat, messages } = contextePret(100);
                const [etatFinal] = impl.scenarioC(etat, 3);

                verifierEtat(etatFinal, {
                    position: [3, 0],
                    charge: 70,
                    statut: "PRET",
                    echantillons: [],
                    analyses: ["roche", "roche", "roche"],
                });
                egal(messages, [{ totalAnalyses: 3, chargeFinale: 70 }], "messages communiqués");
            },
        },
        {
            nom: nom("Scénario C - 0 cycle"),
            executer: () => {
                const { etat, messages } = contextePret(100);
                const [etatFinal] = impl.scenarioC(etat, 0);

                verifierEtat(etatFinal, {
                    position: [0, 0],
                    charge: 100,
                    statut: "PRET",
                    echantillons: [],
                    analyses: [],
                });
                egal(messages, [{ totalAnalyses: 0, chargeFinale: 100 }], "messages communiqués");
            },
        },
        {
            nom: nom("Scénario C - batterie faible au départ (rover en charge, aucune analyse)"),
            executer: () => {
                const { etat, messages } = contextePret(8);
                const [etatFinal] = impl.scenarioC(etat, 3);

                verifierEtat(etatFinal, {
                    position: [1, 0],
                    charge: 63,
                    statut: "EN_CHARGE",
                    echantillons: [],
                    analyses: [],
                });
                egal(messages, [{ totalAnalyses: 0, chargeFinale: 63 }], "messages communiqués");
            },
        },
    ];
}

// ---------------------------------------------------------------------------
// Les trois implémentations doivent donner exactement les mêmes résultats
// ---------------------------------------------------------------------------

interface Observation {
    readonly etatFinal: unknown;
    readonly messages: readonly unknown[];
    readonly nbBytes: number;
}

function observer(charge: number, executer: (etat: EtatRover) => Sortie): string {
    const { etat, messages } = contextePret(charge);
    const [etatFinal, comm] = executer(etat);
    const observation: Observation = { etatFinal, messages, nbBytes: comm.nbBytes };
    return JSON.stringify(observation); // canalComms (fonction) est ignoré par JSON
}

const chargesInitiales: readonly number[] = [100, 60, 30, 8, 3];

const testsEquivalence: readonly Test[] = chargesInitiales.flatMap((charge) => [
    {
        nom: `Équivalence des 3 implémentations - Scénario A (charge ${charge}%)`,
        executer: () => {
            const [ref, ...autres] = implementations.map((impl) => observer(charge, impl.scenarioA));
            autres.forEach((obs) => egal(obs, ref, "résultat différent de l'implémentation par fermeture"));
        },
    },
    {
        nom: `Équivalence des 3 implémentations - Scénario B (charge ${charge}%)`,
        executer: () => {
            const [ref, ...autres] = implementations.map((impl) => observer(charge, impl.scenarioB));
            autres.forEach((obs) => egal(obs, ref, "résultat différent de l'implémentation par fermeture"));
        },
    },
    {
        nom: `Équivalence des 3 implémentations - Scénario C, 4 cycles (charge ${charge}%)`,
        executer: () => {
            const [ref, ...autres] = implementations.map((impl) => observer(charge, (e) => impl.scenarioC(e, 4)));
            autres.forEach((obs) => egal(obs, ref, "résultat différent de l'implémentation par fermeture"));
        },
    },
]);

// ---------------------------------------------------------------------------
// Tests unitaires des actions (règles du MER-359)
// ---------------------------------------------------------------------------

const dixEchantillons: readonly string[] = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"];

const testsActions: readonly Test[] = [
    {
        nom: "Actions - déplacement complet (3, 4) coûte 25%",
        executer: () => {
            const [etat, res] = pe.deplacer(contextePret(100).etat, 3, 4);
            verifierEtat(etat, { position: [3, 4], charge: 75, statut: "PRET", echantillons: [], analyses: [] });
            egal(res, {
                succes: true, complet: true, nouvellePosition: [3, 4], distanceParcourue: 5, energieDepensee: 25,
            }, "résultat");
        },
    },
    {
        nom: "Actions - déplacement partiel : le rover va le plus loin possible et passe EN_CHARGE",
        executer: () => {
            const [etat, res] = pe.deplacer(contextePret(20).etat, 10, 0);
            verifierEtat(etat, { position: [4, 0], charge: 0, statut: "EN_CHARGE", echantillons: [], analyses: [] });
            egal(res, {
                succes: true, complet: false, nouvellePosition: [4, 0], distanceParcourue: 4, energieDepensee: 20,
            }, "résultat");
        },
    },
    {
        nom: "Actions - déplacement refusé sous 5% de charge",
        executer: () => {
            const [etat, res] = pe.deplacer(contextePret(4).etat, 1, 0);
            verifierEtat(etat, { position: [0, 0], charge: 4, statut: "PRET", echantillons: [], analyses: [] });
            egal(res, { succes: false, raison: "Batterie insuffisante" }, "résultat");
        },
    },
    {
        nom: "Actions - déplacement refusé si le rover est en charge",
        executer: () => {
            const [, res] = pe.deplacer(contexteEnCharge(50).etat, 1, 0);
            egal(res, { succes: false, raison: "Rover en charge" }, "résultat");
        },
    },
    {
        nom: "Actions - collecte : coûte 10%, l'échantillon est ajouté à la soute",
        executer: () => {
            const [etat, res] = pe.collecter(contextePret(50).etat, "glace");
            verifierEtat(etat, { position: [0, 0], charge: 40, statut: "PRET", echantillons: ["glace"], analyses: [] });
            egal(res, { succes: true, echantillons: ["glace"], energieDepense: 10 }, "résultat");
        },
    },
    {
        nom: "Actions - collecte refusée : soute pleine",
        executer: () => {
            const [, res] = pe.collecter(contextePret(100, dixEchantillons).etat, "de_trop");
            egal(res, { succes: false, raison: "Soute pleine" }, "résultat");
        },
    },
    {
        nom: "Actions - collecte refusée : batterie sous 10%",
        executer: () => {
            const [, res] = pe.collecter(contextePret(9).etat, "roche");
            egal(res, { succes: false, raison: "Batterie insuffisante" }, "résultat");
        },
    },
    {
        nom: "Actions - collecte qui vide la batterie : le rover passe EN_CHARGE",
        executer: () => {
            const [etat] = pe.collecter(contextePret(10).etat, "roche");
            verifierEtat(etat, { position: [0, 0], charge: 0, statut: "EN_CHARGE", echantillons: ["roche"], analyses: [] });
        },
    },
    {
        nom: "Actions - collecte refusée si le rover est en charge",
        executer: () => {
            const [, res] = pe.collecter(contexteEnCharge(50).etat, "roche");
            egal(res, { succes: false, raison: "Rover en charge" }, "résultat");
        },
    },
    {
        nom: "Actions - analyse complète : les échantillons sont détruits, seuls les noms sont conservés",
        executer: () => {
            const [etat, res] = pe.analyser(contextePret(50, ["a", "b"]).etat);
            verifierEtat(etat, { position: [0, 0], charge: 30, statut: "PRET", echantillons: [], analyses: ["a", "b"] });
            egal(res, { succes: true, complet: true, echantillonsAnalyses: ["a", "b"], energieDepense: 20 }, "résultat");
        },
    },
    {
        nom: "Actions - analyse partielle : les plus vieux échantillons d'abord",
        executer: () => {
            const [etat, res] = pe.analyser(contextePret(25, ["a", "b", "c"]).etat);
            verifierEtat(etat, { position: [0, 0], charge: 5, statut: "PRET", echantillons: ["c"], analyses: ["a", "b"] });
            egal(res, { succes: true, complet: false, echantillonsAnalyses: ["a", "b"], energieDepense: 20 }, "résultat");
        },
    },
    {
        nom: "Actions - analyse refusée : batterie sous 10% avec des échantillons",
        executer: () => {
            const [, res] = pe.analyser(contextePret(9, ["a"]).etat);
            egal(res, { succes: false, raison: "Batterie insuffisante" }, "résultat");
        },
    },
    {
        nom: "Actions - analyse refusée si le rover est en charge",
        executer: () => {
            const [, res] = pe.analyser(contexteEnCharge(50).etat);
            egal(res, { succes: false, raison: "Rover en charge" }, "résultat");
        },
    },
    {
        nom: "Actions - recharge : ajoute le gain et le rover est EN_CHARGE",
        executer: () => {
            const [etat, res] = pe.recharger(contextePret(60).etat, 20);
            verifierEtat(etat, { position: [0, 0], charge: 80, statut: "EN_CHARGE", echantillons: [], analyses: [] });
            egal(res, { chargeApres: 80, completementCharge: false }, "résultat");
        },
    },
    {
        nom: "Actions - recharge plafonnée à 100% : le rover redevient PRET",
        executer: () => {
            const [etat, res] = pe.recharger(contexteEnCharge(80).etat, 50);
            verifierEtat(etat, { position: [0, 0], charge: 100, statut: "PRET", echantillons: [], analyses: [] });
            egal(res, { chargeApres: 100, completementCharge: true }, "résultat");
        },
    },
    {
        nom: "Actions - communication : envoie les données dans le canal, même en charge",
        executer: () => {
            const { etat, messages } = contexteEnCharge(10);
            const [etatApres, res] = pe.communiquer(etat, { bonjour: "Terre" });
            egal(messages, [{ bonjour: "Terre" }], "messages communiqués");
            egal(res.nbBytes, nbBytes({ bonjour: "Terre" }), "nbBytes");
            egal(getChargeBatterie(etatApres), 10, "charge inchangée");
        },
    },
    {
        nom: "Actions - fermeture : le rover garde son état entre les appels",
        executer: () => {
            const rover = fermeture.creerRover(contextePret(100).etat);
            rover.deplacer(2, 0);
            rover.collecter("regolithe");
            verifierEtat(rover.obtenirEtat(), {
                position: [2, 0], charge: 80, statut: "PRET", echantillons: ["regolithe"], analyses: [],
            });
        },
    },
    {
        nom: "Actions - monade : les actions curryfiées retournent des fonctions d'état",
        executer: () => {
            const [etat, res] = me.deplacer(2, 0)(contextePret(100).etat);
            verifierEtat(etat, { position: [2, 0], charge: 90, statut: "PRET", echantillons: [], analyses: [] });
            egal(res, {
                succes: true, complet: true, nouvellePosition: [2, 0], distanceParcourue: 2, energieDepensee: 10,
            }, "résultat");
        },
    },
];

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

const tousLesTests: readonly Test[] = [
    ...testsActions,
    ...implementations.flatMap(testsScenarios),
    ...testsEquivalence,
];

interface ResultatTest {
    readonly nom: string;
    readonly erreur: string | null;
}

function lancer(test: Test): ResultatTest {
    try {
        test.executer();
        return { nom: test.nom, erreur: null };
    } catch (e) {
        return { nom: test.nom, erreur: e instanceof Error ? e.message : String(e) };
    }
}

const resultats = tousLesTests.map(lancer);

resultats.forEach((r) =>
    console.log(r.erreur === null ? `  ✓ ${r.nom}` : `  ✗ ${r.nom}\n      → ${r.erreur}`)
);

const echecs = resultats.filter((r) => r.erreur !== null);
console.log(`\n${resultats.length - echecs.length} / ${resultats.length} tests réussis`);

if (echecs.length > 0) {
    throw new Error(`${echecs.length} test(s) en échec`);
}
