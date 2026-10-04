# Hinweise zu Drittkomponenten (NOTICE)

CELLULA besteht aus eigenem Code, eigenen 3D-Modellen und eigenen Texten unter der [MIT-Lizenz](LICENSE) sowie aus den folgenden Drittkomponenten. Wer CELLULA weitergibt, verändert oder selbst veröffentlicht, muss die jeweiligen Bedingungen einhalten.

## 1. Protein Data Bank – Moleküldaten

| | |
|---|---|
| **Dateien** | `dist/assets/molecules.json`, `dist/assets/molecules/*.bin.gz` |
| **Quelle** | Worldwide Protein Data Bank (wwPDB) über [RCSB PDB](https://www.rcsb.org) |
| **Lizenz** | [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/deed.de) – gemeinfrei, siehe [wwPDB Usage Policies](https://www.wwpdb.org/about/usage-policies) |
| **Änderungen** | nur erstes Modell, ohne Wasser, Wasserstoff und alternative Positionen; zentriert, gedreht, auf 0,05 Å gerundet, binär gepackt, gzip |

| PDB | Molekül | Original-Veröffentlichung |
|---|---|---|
| [1BNA](https://www.rcsb.org/structure/1BNA) | DNA-Doppelhelix (B-DNA) | Drew, H.R. et al. (1981) *PNAS* 78, 2179–2183. [doi:10.1073/pnas.78.4.2179](https://doi.org/10.1073/pnas.78.4.2179) |
| [4HHB](https://www.rcsb.org/structure/4HHB) | Hämoglobin (Mensch, Desoxy-Form) | Fermi, G. et al. (1984) *J. Mol. Biol.* 175, 159–174. [doi:10.1016/0022-2836(84)90472-8](https://doi.org/10.1016/0022-2836(84)90472-8) |
| [3I40](https://www.rcsb.org/structure/3I40) | Insulin (Mensch) | Timofeev, V.I. et al. (2010) *Acta Cryst.* F66, 259–263. [doi:10.1107/S1744309110000461](https://doi.org/10.1107/S1744309110000461) |
| [1IGT](https://www.rcsb.org/structure/1IGT) | Antikörper (IgG2a, Maus) | Harris, L.J. et al. (1997) *Biochemistry* 36, 1581–1597. [doi:10.1021/bi962514+](https://doi.org/10.1021/bi962514+) |
| [6OQR](https://www.rcsb.org/structure/6OQR) | ATP-Synthase (*E. coli*) | Sobti, M. et al. (2020) *Nat. Commun.* 11, 2615. [doi:10.1038/s41467-020-16387-2](https://doi.org/10.1038/s41467-020-16387-2) |

CC0 verlangt keine Namensnennung. Die Quellen werden trotzdem genannt – in der App unter „Quellen“, in jedem gespeicherten Bild und hier. `scripts/prepare_molecules.mjs` erzeugt die Dateien reproduzierbar aus den Originalen.

## 2. OpenStax Biology 2e – Grundlage der Texte

| | |
|---|---|
| **Dateien** | `dist/knowledge.js` (Erklärtexte, Schrittbeschreibungen, Merksätze) |
| **Werk** | *Biology 2e* von Mary Ann Clark, Matthew Douglas und Jung Choi, OpenStax, Rice University (2018) |
| **Quelle** | <https://openstax.org/details/books/biology-2e> – kostenlos verfügbar unter openstax.org |
| **Lizenz** | [Creative Commons Namensnennung 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.de) |
| **Änderungen** | ins Deutsche übertragen, stark gekürzt, frei neu formuliert, ergänzt und neu gegliedert. Keine wörtlichen Übernahmen, keine Abbildungen. |

Jeder Eintrag verlinkt in der App unter „Quellen“ die verwendeten Kapitel. OpenStax und Rice University sind nicht mit CELLULA verbunden und billigen diese Bearbeitung nicht ausdrücklich. „OpenStax“ ist eine Marke der Rice University.

## 3. three.js – 3D-Bibliothek

| | |
|---|---|
| **Dateien** | `dist/vendor/three.module.js`, `three.core.js`, `OrbitControls.js` |
| **Version** | 0.180.0 (unverändert) |
| **Urheber** | © 2010–2025 three.js authors |
| **Quelle** | <https://github.com/mrdoob/three.js> |
| **Lizenz** | MIT, siehe [`dist/vendor/LICENSE`](dist/vendor/LICENSE) |

## 4. Electron (nur Desktop-Apps)

Die Desktop-Versionen für Windows und macOS enthalten [Electron](https://www.electronjs.org) (MIT-Lizenz) mit Chromium. Deren Lizenzhinweise liegen den Programmen bei (`LICENSE.electron.txt`, `LICENSES.chromium.html`).

## 5. Eigene Modelle

Die 3D-Modelle der Tier- und Pflanzenzelle sowie alle Animationen (Mitose, Meiose, Proteinbiosynthese, Zellatmung, Fotosynthese) werden zur Laufzeit aus eigenem Code erzeugt (`dist/cells.js`, `dist/division.js`, `dist/synthesis.js`, `dist/energy.js`). Es werden keine fremden Modelle, Bilder oder Schriftarten verwendet.

Genannte Marken und Namen gehören ihren jeweiligen Inhabern. Eine Verbindung zu oder Billigung durch diese Organisationen besteht nicht.
