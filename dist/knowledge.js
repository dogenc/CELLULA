// CELLULA – Lerntexte. Eigene, frei formulierte deutsche Zusammenfassungen auf Grundlage von
// OpenStax Biology 2e (Clark, Douglas, Choi; Rice University; CC BY 4.0). Keine wörtlichen Übernahmen.
// Jeder Eintrag nennt die verwendeten Kapitel unter `src`.

const OS = 'https://openstax.org/books/biology-2e/pages/';
export const sources = {
  'os-3-4': [OS + '3-4-proteins', 'OpenStax Biology 2e · 3.4 Proteine'],
  'os-3-5': [OS + '3-5-nucleic-acids', 'OpenStax Biology 2e · 3.5 Nukleinsäuren'],
  'os-4-2': [OS + '4-2-prokaryotic-cells', 'OpenStax Biology 2e · 4.2 Prokaryotische Zellen'],
  'os-4-3': [OS + '4-3-eukaryotic-cells', 'OpenStax Biology 2e · 4.3 Eukaryotische Zellen'],
  'os-4-4': [OS + '4-4-the-endomembrane-system-and-proteins', 'OpenStax Biology 2e · 4.4 Endomembransystem und Proteine'],
  'os-4-5': [OS + '4-5-the-cytoskeleton', 'OpenStax Biology 2e · 4.5 Zytoskelett'],
  'os-4-6': [OS + '4-6-connections-between-cells-and-cellular-activities', 'OpenStax Biology 2e · 4.6 Verbindungen zwischen Zellen'],
  'os-5-1': [OS + '5-1-components-and-structure', 'OpenStax Biology 2e · 5.1 Aufbau der Biomembran'],
  'os-6-4': [OS + '6-4-atp-adenosine-triphosphate', 'OpenStax Biology 2e · 6.4 ATP'],
  'os-7-2': [OS + '7-2-glycolysis', 'OpenStax Biology 2e · 7.2 Glykolyse'],
  'os-7-3': [OS + '7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle', 'OpenStax Biology 2e · 7.3 Pyruvatoxidation und Citratzyklus'],
  'os-7-4': [OS + '7-4-oxidative-phosphorylation', 'OpenStax Biology 2e · 7.4 Oxidative Phosphorylierung'],
  'os-8-1': [OS + '8-1-overview-of-photosynthesis', 'OpenStax Biology 2e · 8.1 Überblick Fotosynthese'],
  'os-8-2': [OS + '8-2-the-light-dependent-reactions-of-photosynthesis', 'OpenStax Biology 2e · 8.2 Lichtabhängige Reaktionen'],
  'os-8-3': [OS + '8-3-using-light-energy-to-make-organic-molecules', 'OpenStax Biology 2e · 8.3 Calvin-Zyklus'],
  'os-10-1': [OS + '10-1-cell-division', 'OpenStax Biology 2e · 10.1 Zellteilung'],
  'os-10-2': [OS + '10-2-the-cell-cycle', 'OpenStax Biology 2e · 10.2 Zellzyklus'],
  'os-11-1': [OS + '11-1-the-process-of-meiosis', 'OpenStax Biology 2e · 11.1 Ablauf der Meiose'],
  'os-14-2': [OS + '14-2-dna-structure-and-sequencing', 'OpenStax Biology 2e · 14.2 DNA-Struktur'],
  'os-15-1': [OS + '15-1-the-genetic-code', 'OpenStax Biology 2e · 15.1 Der genetische Code'],
  'os-15-3': [OS + '15-3-eukaryotic-transcription', 'OpenStax Biology 2e · 15.3 Transkription bei Eukaryoten'],
  'os-15-4': [OS + '15-4-rna-processing-in-eukaryotes', 'OpenStax Biology 2e · 15.4 RNA-Prozessierung'],
  'os-15-5': [OS + '15-5-ribosomes-and-protein-synthesis', 'OpenStax Biology 2e · 15.5 Ribosomen und Proteinsynthese'],
  'os-37-3': [OS + '37-3-regulation-of-body-processes', 'OpenStax Biology 2e · 37.3 Hormonelle Regulation'],
  'os-40-2': [OS + '40-2-components-of-the-blood', 'OpenStax Biology 2e · 40.2 Bestandteile des Blutes'],
  'os-42-3': [OS + '42-3-antibodies', 'OpenStax Biology 2e · 42.3 Antikörper'],
  'pdb': ['https://www.rcsb.org', 'RCSB Protein Data Bank'],
  'pdb-101': ['https://pdb101.rcsb.org/motm/motm-by-date', 'PDB-101 · Molecule of the Month']
};

// ── Zellbestandteile ────────────────────────────────────────────────────────────
// cells: in welcher Zelle der Teil vorkommt. color: Anzeigefarbe (schematisch).
export const organelles = {
  membran: {
    name: 'Zellmembran', term: 'Plasmamembran · Plasmalemma', color: '#d9a35f', cells: ['tier', 'pflanze'], src: ['os-5-1', 'os-4-3'],
    text: 'Die Zellmembran grenzt die Zelle von ihrer Umgebung ab. Sie besteht aus einer Doppelschicht aus Phospholipiden: Die wasserliebenden Köpfe zeigen nach außen und innen, die wassermeidenden Fettsäureschwänze liegen in der Mitte. Eingelagerte Proteine dienen als Kanäle, Pumpen, Rezeptoren oder Erkennungsmerkmale. Weil sich Lipide und viele Proteine seitlich bewegen können, spricht man vom Flüssig-Mosaik-Modell.',
    facts: ['Phospholipid-Doppelschicht mit Proteinen, Cholesterin und Kohlenhydratketten (Glykokalyx)', 'Selektiv permeabel: kleine unpolare Moleküle passieren leicht, Ionen brauchen Kanäle oder Pumpen', 'Flüssig-Mosaik-Modell nach Singer und Nicolson (1972)']
  },
  zellkern: {
    name: 'Zellkern', term: 'Nucleus', color: '#7b6fb0', cells: ['tier', 'pflanze'], src: ['os-4-3'],
    text: 'Der Zellkern enthält den größten Teil der DNA und steuert damit, welche Proteine die Zelle herstellt. Er ist von einer doppelten Membran umgeben, der Kernhülle. Kernporen lassen RNA und Proteine kontrolliert hinein und hinaus. Im Inneren liegt die DNA als Chromatin vor, also mit Proteinen verpackt. Erst vor einer Zellteilung verdichtet sie sich zu sichtbaren Chromosomen.',
    facts: ['Doppelmembran (Kernhülle) mit Kernporen', 'Chromatin = DNA + Histonproteine', 'Die äußere Kernmembran geht direkt in das raue ER über']
  },
  nukleolus: {
    name: 'Kernkörperchen', term: 'Nucleolus', color: '#4b3f86', cells: ['tier', 'pflanze'], src: ['os-4-3'],
    text: 'Das Kernkörperchen ist ein dichter Bereich im Zellkern ohne eigene Membran. Hier wird ribosomale RNA (rRNA) hergestellt und mit Proteinen zu den Untereinheiten der Ribosomen zusammengesetzt. Diese verlassen den Kern durch die Kernporen und bilden im Zytoplasma funktionsfähige Ribosomen.',
    facts: ['Keine Membran', 'Ort der rRNA-Synthese und Ribosomen-Montage', 'Zellen mit hoher Proteinsynthese haben oft große Nukleoli']
  },
  rer: {
    name: 'Raues ER', term: 'Raues endoplasmatisches Retikulum', color: '#5f9fb0', cells: ['tier', 'pflanze'], src: ['os-4-4'],
    text: 'Das raue endoplasmatische Retikulum ist ein Netz aus abgeflachten Membransäcken, das direkt an die Kernhülle anschließt. „Rau“ wirkt es durch die Ribosomen auf seiner Außenseite. Sie bauen Proteine, die in das ER-Innere (Lumen) hineinwachsen. Dort werden sie gefaltet und oft mit Zuckerresten versehen. Bläschen (Vesikel) bringen die Proteine anschließend zum Golgi-Apparat.',
    facts: ['Ribosomen auf der Außenseite', 'Herstellung von Membran- und Exportproteinen', 'Teil des Endomembransystems']
  },
  ser: {
    name: 'Glattes ER', term: 'Glattes endoplasmatisches Retikulum', color: '#8fc3cf', cells: ['tier', 'pflanze'], src: ['os-4-4'],
    text: 'Dem glatten ER fehlen die Ribosomen. Es besteht eher aus Röhren als aus Säcken. Hier werden Lipide wie Phospholipide und Steroidhormone hergestellt, Kohlenhydrate umgebaut und Giftstoffe abgebaut, besonders in Leberzellen. In Muskelzellen speichert eine Sonderform, das sarkoplasmatische Retikulum, Calcium-Ionen.',
    facts: ['Keine Ribosomen', 'Lipid- und Steroidsynthese, Entgiftung', 'Calciumspeicher (sarkoplasmatisches Retikulum im Muskel)']
  },
  golgi: {
    name: 'Golgi-Apparat', term: 'Golgi-Apparat · Dictyosom', color: '#e0b04f', cells: ['tier', 'pflanze'], src: ['os-4-4'],
    text: 'Der Golgi-Apparat ist ein Stapel flacher, gebogener Membransäcke. Er arbeitet wie eine Versandstation: An der Eingangsseite (cis) kommen Vesikel aus dem ER an. Beim Durchlaufen des Stapels werden die Proteine weiter verändert, sortiert und mit einer „Adresse“ versehen. An der Ausgangsseite (trans) schnüren sich neue Vesikel ab. Sie wandern zur Zellmembran, zu Lysosomen oder werden aus der Zelle ausgeschüttet (Exozytose).',
    facts: ['cis-Seite = Eingang, trans-Seite = Ausgang', 'Modifizieren, Sortieren und Verpacken von Proteinen', 'In Pflanzenzellen werden hier auch Bausteine der Zellwand gebildet']
  },
  mitochondrium: {
    name: 'Mitochondrium', term: 'Mitochondrion · Plural: Mitochondrien', color: '#d0674f', cells: ['tier', 'pflanze'], src: ['os-4-3', 'os-7-4'],
    text: 'Mitochondrien sind die Kraftwerke der Zelle. In der Zellatmung gewinnen sie aus Nährstoffen und Sauerstoff den Energieträger ATP. Sie besitzen zwei Membranen: Die innere ist zu Falten (Cristae) aufgefaltet und trägt die Atmungskette und die ATP-Synthase. Im Innenraum, der Matrix, läuft der Citratzyklus ab. Mitochondrien haben eigene ringförmige DNA und eigene Ribosomen – ein Hinweis auf ihre Herkunft aus einst freilebenden Bakterien (Endosymbiontentheorie).',
    facts: ['Doppelmembran, innere Membran mit Cristae', 'Matrix: Citratzyklus · innere Membran: Atmungskette und ATP-Synthase', 'Eigene DNA und 70S-Ribosomen → Endosymbiontentheorie']
  },
  ribosom: {
    name: 'Ribosomen', term: 'Ribosom', color: '#3d5a80', cells: ['tier', 'pflanze'], src: ['os-4-3', 'os-15-5'],
    text: 'Ribosomen sind die Proteinfabriken der Zelle. Sie lesen die Basenfolge der mRNA und verknüpfen die passenden Aminosäuren zu einer Kette (Translation). Ein Ribosom besteht aus einer großen und einer kleinen Untereinheit aus rRNA und Proteinen. Es ist kein Organell im engeren Sinn, weil es keine Membran hat. Freie Ribosomen im Zytoplasma bilden Proteine für die Zelle selbst, Ribosomen am rauen ER Proteine für Membranen und den Export.',
    facts: ['Zwei Untereinheiten aus rRNA und Proteinen, keine Membran', 'Eukaryoten: 80S im Zytoplasma · Prokaryoten, Mitochondrien, Chloroplasten: 70S', 'Frei im Zytoplasma oder gebunden am rauen ER']
  },
  lysosom: {
    name: 'Lysosomen', term: 'Lysosom', color: '#9c5fa8', cells: ['tier'], src: ['os-4-3', 'os-4-4'],
    text: 'Lysosomen sind die Verdauungsbläschen tierischer Zellen. Sie enthalten Enzyme, die Proteine, Fette, Kohlenhydrate und Nukleinsäuren zerlegen. Diese Enzyme arbeiten nur bei saurem pH-Wert um 5, wie er im Lysosom herrscht. Lysosomen bauen aufgenommene Partikel, Krankheitserreger und verbrauchte Organellen ab (Autophagie). In Pflanzenzellen übernimmt die Vakuole viele dieser Aufgaben.',
    facts: ['Saurer pH-Wert um 5', 'Verdauungsenzyme (Hydrolasen)', 'Abbau von Fremdstoffen und alten Organellen (Autophagie)']
  },
  zentrosom: {
    name: 'Zentrosom', term: 'Zentrosom mit Zentriolen', color: '#6a8f4e', cells: ['tier'], src: ['os-4-3', 'os-4-5'],
    text: 'Das Zentrosom liegt nahe dem Zellkern und organisiert die Mikrotubuli der Zelle. In tierischen Zellen enthält es zwei rechtwinklig zueinander stehende Zentriolen. Jede Zentriole besteht aus neun Dreiergruppen von Mikrotubuli. Vor der Zellteilung verdoppelt sich das Zentrosom. Die beiden Zentrosomen wandern zu den Zellpolen und bauen den Spindelapparat auf, der die Chromosomen trennt.',
    facts: ['Zwei Zentriolen im rechten Winkel, je 9 × 3 Mikrotubuli', 'Mikrotubuli-organisierendes Zentrum', 'Höhere Pflanzen haben keine Zentriolen']
  },
  zytoskelett: {
    name: 'Zytoskelett', term: 'Mikrotubuli, Aktin- und Intermediärfilamente', color: '#9aa9ad', cells: ['tier', 'pflanze'], src: ['os-4-5'],
    text: 'Das Zytoskelett ist ein Netz aus Proteinfasern, das der Zelle Form und Halt gibt. Es dient zugleich als Schienennetz für den Transport von Vesikeln und Organellen. Es gibt drei Fasertypen: dünne Aktinfilamente (Mikrofilamente), Intermediärfilamente und hohle Mikrotubuli. Mikrotubuli bilden auch die Spindelfasern bei der Zellteilung sowie Geißeln und Wimpern.',
    facts: ['Mikrofilamente (Aktin, ca. 7 nm)', 'Intermediärfilamente (ca. 8–10 nm)', 'Mikrotubuli (Tubulin, ca. 25 nm, hohl)']
  },
  vesikel: {
    name: 'Vesikel', term: 'Transportbläschen', color: '#e8c977', cells: ['tier', 'pflanze'], src: ['os-4-4'],
    text: 'Vesikel sind kleine, von einer Membran umhüllte Bläschen. Sie transportieren Stoffe zwischen ER, Golgi-Apparat und Zellmembran. Verschmilzt ein Vesikel mit der Zellmembran, gibt es seinen Inhalt nach außen ab (Exozytose). Umgekehrt nimmt die Zelle Stoffe auf, indem sich die Membran einstülpt und ein Vesikel abschnürt (Endozytose).',
    facts: ['Exozytose: Abgabe nach außen', 'Endozytose: Aufnahme von außen', 'Bewegen sich entlang des Zytoskeletts']
  },
  zellwand: {
    name: 'Zellwand', term: 'Zellwand aus Cellulose', color: '#8fae5a', cells: ['pflanze'], src: ['os-4-3', 'os-4-6'],
    text: 'Pflanzenzellen sind zusätzlich von einer festen Zellwand umgeben, die außerhalb der Zellmembran liegt. Sie besteht vor allem aus Cellulose, einem langkettigen Kohlenhydrat. Die Zellwand gibt Form und Stabilität und verhindert, dass die Zelle bei Wasseraufnahme platzt. Durch feine Kanäle, die Plasmodesmen, bleiben benachbarte Zellen miteinander verbunden.',
    facts: ['Hauptbestandteil Cellulose', 'Stützt die Zelle und hält dem Turgordruck stand', 'Plasmodesmen verbinden benachbarte Zellen']
  },
  vakuole: {
    name: 'Zentralvakuole', term: 'Vakuole mit Tonoplast', color: '#7fb6d8', cells: ['pflanze'], src: ['os-4-3'],
    text: 'Die große Zentralvakuole kann den größten Teil des Volumens einer Pflanzenzelle einnehmen. Sie ist von einer eigenen Membran umgeben, dem Tonoplasten. In ihr sind Wasser, Ionen, Farbstoffe und Abfallstoffe gelöst. Nimmt die Vakuole Wasser auf, drückt sie das Zytoplasma gegen die Zellwand. Dieser Innendruck heißt Turgor und hält krautige Pflanzen aufrecht. Fehlt Wasser, sinkt der Turgor und die Pflanze welkt.',
    facts: ['Membran: Tonoplast', 'Speicher für Wasser, Ionen, Farbstoffe und Abfallstoffe', 'Erzeugt den Turgordruck']
  },
  chloroplast: {
    name: 'Chloroplast', term: 'Chloroplast · Plastide', color: '#4f9a4a', cells: ['pflanze'], src: ['os-4-3', 'os-8-1'],
    text: 'In den Chloroplasten findet die Fotosynthese statt. Sie sind von zwei Membranen umgeben. Im Inneren liegen gestapelte, scheibenförmige Membransäckchen, die Thylakoide. Ein Stapel heißt Granum. In den Thylakoidmembranen sitzt der grüne Farbstoff Chlorophyll, hier laufen die lichtabhängigen Reaktionen ab. Im umgebenden Stroma wird im Calvin-Zyklus Kohlenstoffdioxid zu Zucker aufgebaut. Wie Mitochondrien haben Chloroplasten eigene DNA und stammen wahrscheinlich von Cyanobakterien ab.',
    facts: ['Doppelmembran, innen Thylakoide (gestapelt zu Grana)', 'Thylakoidmembran: Lichtreaktion · Stroma: Calvin-Zyklus', 'Eigene DNA → Endosymbiontentheorie']
  },
  plasmodesmen: {
    name: 'Plasmodesmen', term: 'Plasmodesma · Plural: Plasmodesmen', color: '#b3854e', cells: ['pflanze'], src: ['os-4-6'],
    text: 'Plasmodesmen sind feine Kanäle durch die Zellwand. Durch sie hängen das Zytoplasma und die Membranen benachbarter Pflanzenzellen zusammen. Wasser, Ionen, kleine Moleküle und sogar einige RNA-Moleküle und Proteine können so von Zelle zu Zelle gelangen. In tierischen Geweben erfüllen Gap Junctions eine ähnliche Aufgabe.',
    facts: ['Kanäle durch die Zellwand', 'Verbinden die Zytoplasmen benachbarter Zellen', 'Entsprechung bei Tieren: Gap Junctions']
  }
};

export const cellInfo = {
  tier: {
    name: 'Tierzelle', term: 'Eukaryotische Zelle · Tier', src: ['os-4-3'],
    text: 'Tierische Zellen sind eukaryotisch: Ihre DNA liegt in einem Zellkern, und sie besitzen viele von Membranen umgebene Organellen. Anders als Pflanzenzellen haben sie keine Zellwand, keine Chloroplasten und keine große Zentralvakuole. Dafür kommen Lysosomen und Zentrosomen mit Zentriolen vor. Ohne starre Wand sind Tierzellen sehr vielgestaltig – von der runden Eizelle bis zur verzweigten Nervenzelle.',
    facts: ['Typische Größe 10–30 µm', 'Keine Zellwand, keine Chloroplasten', 'Lysosomen und Zentriolen']
  },
  pflanze: {
    name: 'Pflanzenzelle', term: 'Eukaryotische Zelle · Pflanze', src: ['os-4-3'],
    text: 'Pflanzenzellen besitzen alle typischen Organellen eukaryotischer Zellen und zusätzlich drei Kennzeichen: eine feste Zellwand aus Cellulose, Chloroplasten für die Fotosynthese und eine große Zentralvakuole. Weil die Vakuole so viel Raum einnimmt, liegen Zellkern und Organellen meist in einem schmalen Saum am Rand. Lysosomen und Zentriolen fehlen in der Regel.',
    facts: ['Typische Größe 10–100 µm', 'Zellwand, Chloroplasten, Zentralvakuole', 'Zellen über Plasmodesmen verbunden']
  }
};

// ── Abläufe ─────────────────────────────────────────────────────────────────────
// Die Anzahl der Schritte muss zur Animation in processes.js passen.
export const processes = {
  mitose: {
    name: 'Mitose', term: 'Kernteilung · Zellzyklus', src: ['os-10-2', 'os-10-1'],
    intro: 'Bei der Mitose entstehen aus einer Zelle zwei erbgleiche Tochterzellen mit vollständigem Chromosomensatz. Gezeigt ist eine Zelle mit 2n = 4 Chromosomen: rot von der Mutter, blau vom Vater.',
    steps: [
      {name: 'Interphase', text: 'Die Zelle wächst und verdoppelt in der S-Phase ihre DNA. Die Chromosomen liegen noch als lockeres Chromatin im Zellkern vor. Neben dem Kern hat sich das Zentrosom verdoppelt.'},
      {name: 'Prophase', text: 'Das Chromatin verdichtet sich zu sichtbaren Chromosomen. Jedes Chromosom besteht aus zwei identischen Schwesterchromatiden, die am Zentromer zusammenhängen. Die Zentrosomen wandern auseinander, und zwischen ihnen wächst der Spindelapparat aus Mikrotubuli.'},
      {name: 'Prometaphase', text: 'Die Kernhülle zerfällt. Spindelfasern heften sich an die Kinetochore, das sind Proteinkomplexe am Zentromer. Jedes Schwesterchromatid wird mit einem anderen Pol verbunden.'},
      {name: 'Metaphase', text: 'Die Chromosomen ordnen sich in der Mitte der Zelle in der Äquatorialebene (Metaphaseplatte) an. In diesem Stadium sind sie am stärksten verdichtet und unter dem Mikroskop am besten zu erkennen.'},
      {name: 'Anaphase', text: 'Die Schwesterchromatiden trennen sich und werden von den verkürzten Spindelfasern zu den entgegengesetzten Polen gezogen. Ab jetzt zählt jedes Chromatid als eigenes Chromosom. Die Zelle streckt sich.'},
      {name: 'Telophase & Zytokinese', text: 'An beiden Polen bilden sich neue Kernhüllen, die Chromosomen entspiralisieren sich wieder. Gleichzeitig schnürt ein Ring aus Aktin die Zelle in der Mitte ein (Zytokinese). Es entstehen zwei genetisch identische Tochterzellen mit je 2n = 4 Chromosomen.'}
    ],
    facts: ['Ergebnis: 2 erbgleiche, diploide Tochterzellen', 'Merkhilfe: Prophase – Metaphase – Anaphase – Telophase (PMAT)', 'Dient Wachstum, Regeneration und ungeschlechtlicher Fortpflanzung']
  },
  meiose: {
    name: 'Meiose', term: 'Reifeteilung · Keimzellbildung', src: ['os-11-1'],
    intro: 'In der Meiose entstehen aus einer diploiden Zelle vier haploide Keimzellen. Zwei Teilungen folgen direkt aufeinander. Gezeigt ist 2n = 4: rot mütterlich, blau väterlich.',
    steps: [
      {name: 'Interphase', text: 'Wie vor der Mitose wird die DNA verdoppelt. Jedes Chromosom besteht danach aus zwei Schwesterchromatiden.'},
      {name: 'Prophase I · Crossing-over', text: 'Homologe Chromosomen – das mütterliche und das väterliche Exemplar – legen sich genau aneinander (Synapse). So entstehen Tetraden aus vier Chromatiden. Zwischen Nicht-Schwesterchromatiden werden Abschnitte ausgetauscht. Dieses Crossing-over mischt mütterliche und väterliche Gene neu.'},
      {name: 'Metaphase I', text: 'Die Paare homologer Chromosomen ordnen sich in der Äquatorialebene an. Welcher Partner zu welchem Pol zeigt, ist zufällig. Diese unabhängige Verteilung erzeugt bei 23 Paaren über 8 Millionen Kombinationen.'},
      {name: 'Anaphase I', text: 'Die homologen Chromosomen werden getrennt und zu den Polen gezogen. Die Schwesterchromatiden bleiben dabei noch zusammen. Hier wird der Chromosomensatz halbiert.'},
      {name: 'Telophase I', text: 'Die Zelle teilt sich. Jede der zwei Tochterzellen ist haploid (n = 2), jedes Chromosom besteht aber noch aus zwei Chromatiden. Durch das Crossing-over sind die Chromatiden gemischt gefärbt.'},
      {name: 'Metaphase II', text: 'Ohne erneute DNA-Verdopplung beginnt die zweite Teilung. In beiden Zellen ordnen sich die Chromosomen in einer neuen Äquatorialebene an.'},
      {name: 'Anaphase II', text: 'Jetzt trennen sich die Schwesterchromatiden, wie bei einer Mitose, und wandern zu den Polen.'},
      {name: 'Telophase II', text: 'Beide Zellen teilen sich erneut. Ergebnis sind vier haploide Zellen mit je einem Chromosom jeder Sorte. Sie sind genetisch alle verschieden.'}
    ],
    facts: ['Ergebnis: 4 haploide, genetisch verschiedene Zellen', 'Meiose I trennt homologe Chromosomen, Meiose II die Schwesterchromatiden', 'Vielfalt durch Crossing-over und zufällige Verteilung der Homologen']
  },
  proteinbiosynthese: {
    name: 'DNA → RNA → Protein', term: 'Proteinbiosynthese · Genexpression', src: ['os-15-1', 'os-15-3', 'os-15-4', 'os-15-5'],
    intro: 'Der Weg vom Gen zum Protein: Im Zellkern wird ein DNA-Abschnitt in mRNA umgeschrieben (Transkription), am Ribosom wird die mRNA in eine Aminosäurekette übersetzt (Translation).',
    steps: [
      {name: 'Das Gen', text: 'Die Information für ein Protein steckt in der Basenfolge eines DNA-Abschnitts. Die DNA ist eine Doppelhelix, deren Stränge über die Basenpaare A–T und G–C zusammengehalten werden.'},
      {name: 'Transkription', text: 'Die RNA-Polymerase öffnet die Doppelhelix und liest den codogenen Strang (Matrizenstrang) in 3′→5′-Richtung. Dabei baut sie eine komplementäre mRNA in 5′→3′-Richtung. In der RNA steht Uracil (U) anstelle von Thymin (T).'},
      {name: 'RNA-Prozessierung', text: 'Bei Eukaryoten wird die Vorläufer-RNA noch im Kern bearbeitet: Sie bekommt am 5′-Ende eine Kappe und am 3′-Ende einen Poly-A-Schwanz. Nicht codierende Abschnitte (Introns) werden herausgeschnitten, die Exons werden verbunden. Dieses Spleißen ergibt die reife mRNA.'},
      {name: 'Export', text: 'Die reife mRNA verlässt den Zellkern durch eine Kernpore und gelangt ins Zytoplasma zu den Ribosomen.'},
      {name: 'Initiation', text: 'Die kleine Ribosomen-Untereinheit bindet an die mRNA und sucht das Startcodon AUG. Dort lagert sich die Start-tRNA mit Methionin an, danach kommt die große Untereinheit dazu.'},
      {name: 'Elongation', text: 'Das Ribosom rückt Codon für Codon weiter. Zu jedem Codon passt eine tRNA mit dem komplementären Anticodon, die die passende Aminosäure mitbringt. Das Ribosom verknüpft die Aminosäuren über Peptidbindungen zu einer wachsenden Kette.'},
      {name: 'Termination', text: 'Erreicht das Ribosom ein Stoppcodon (hier UAA), bindet ein Freisetzungsfaktor statt einer tRNA. Das fertige Polypeptid wird abgelöst und faltet sich zu seiner räumlichen Struktur. Das Ribosom zerfällt in seine Untereinheiten.'}
    ],
    facts: ['Transkription im Zellkern, Translation am Ribosom im Zytoplasma', 'Ein Codon = 3 Basen = 1 Aminosäure; 64 Codons für 20 Aminosäuren', 'Start: AUG (Methionin) · Stopp: UAA, UAG, UGA']
  },
  zellatmung: {
    name: 'Zellatmung', term: 'Aerobe Dissimilation', src: ['os-7-2', 'os-7-3', 'os-7-4', 'os-6-4'],
    intro: 'Bei der Zellatmung wird Glucose schrittweise zu CO₂ und Wasser abgebaut. Die frei werdende Energie wird im Energieträger ATP gespeichert.',
    steps: [
      {name: 'Überblick', text: 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + Energie (ATP). Die Glykolyse läuft im Zytoplasma ab, alle weiteren Schritte im Mitochondrium.'},
      {name: 'Glykolyse', text: 'Im Zytoplasma wird ein Glucose-Molekül (6 C-Atome) in zwei Moleküle Pyruvat (je 3 C) gespalten. Netto entstehen dabei 2 ATP und 2 NADH. Sauerstoff wird dafür nicht gebraucht.'},
      {name: 'Oxidative Decarboxylierung', text: 'Pyruvat gelangt in die Mitochondrienmatrix. Dort wird je ein CO₂ abgespalten, der Rest wird als Acetylgruppe an Coenzym A gebunden (Acetyl-CoA). Dabei entsteht pro Pyruvat ein NADH.'},
      {name: 'Citratzyklus', text: 'Die Acetylgruppe wird an Oxalacetat gebunden, es entsteht Citrat. In einem Kreislauf aus acht Schritten werden zwei CO₂ abgespalten. Pro Umlauf entstehen 3 NADH, 1 FADH₂ und 1 ATP (bzw. GTP). Am Ende liegt wieder Oxalacetat vor. Pro Glucose läuft der Zyklus zweimal.'},
      {name: 'Atmungskette', text: 'NADH und FADH₂ geben ihre Elektronen an Proteinkomplexe in der inneren Mitochondrienmembran ab. Die Elektronen wandern von Komplex zu Komplex. Die frei werdende Energie wird genutzt, um Protonen (H⁺) in den Intermembranraum zu pumpen. Am Ende nimmt Sauerstoff die Elektronen auf und bildet mit H⁺ Wasser.'},
      {name: 'ATP-Synthase', text: 'Der Protonengradient treibt die ATP-Synthase an: Protonen strömen durch sie zurück in die Matrix und versetzen ihren Rotor in Drehung. Die Drehung verbindet ADP und Phosphat zu ATP. Diese Kopplung heißt Chemiosmose.'},
      {name: 'Bilanz', text: 'Pro Glucose entstehen insgesamt etwa 30 bis 32 ATP, den größten Teil liefert die oxidative Phosphorylierung. Ältere Lehrbücher nennen 36 bis 38 ATP. Die genaue Zahl hängt davon ab, wie die Elektronen des NADH aus der Glykolyse ins Mitochondrium gelangen.'}
    ],
    facts: ['Glykolyse: Zytoplasma · Citratzyklus: Matrix · Atmungskette: innere Mitochondrienmembran', 'O₂ ist der letzte Elektronenakzeptor', 'Rund 30–32 ATP pro Glucose']
  },
  fotosynthese: {
    name: 'Fotosynthese', term: 'Assimilation · Chloroplast', src: ['os-8-1', 'os-8-2', 'os-8-3'],
    intro: 'Pflanzen, Algen und Cyanobakterien nutzen Lichtenergie, um aus CO₂ und Wasser Zucker aufzubauen. Dabei wird Sauerstoff frei.',
    steps: [
      {name: 'Überblick', text: '6 CO₂ + 6 H₂O + Lichtenergie → C₆H₁₂O₆ + 6 O₂. Die lichtabhängigen Reaktionen laufen an der Thylakoidmembran ab, der Calvin-Zyklus im Stroma des Chloroplasten.'},
      {name: 'Licht & Fotosystem II', text: 'Chlorophyll-Moleküle im Fotosystem II nehmen Lichtenergie auf. Ein Elektron im Reaktionszentrum wird dadurch auf ein höheres Energieniveau angehoben und an eine Transportkette weitergegeben.'},
      {name: 'Fotolyse des Wassers', text: 'Das fehlende Elektron wird aus Wasser ersetzt: 2 H₂O → 4 H⁺ + 4 e⁻ + O₂. Der Sauerstoff entweicht als Nebenprodukt, die Protonen bleiben im Thylakoidinnenraum (Lumen).'},
      {name: 'Elektronentransport', text: 'Die Elektronen wandern über Plastochinon und den Cytochrom-b₆f-Komplex zum Fotosystem I. Dabei werden weitere Protonen ins Lumen gepumpt. Im Fotosystem I werden die Elektronen durch Licht erneut angeregt und schließlich auf NADP⁺ übertragen: Es entsteht NADPH.'},
      {name: 'ATP-Synthase', text: 'Im Lumen sammeln sich viele Protonen. Sie strömen durch die ATP-Synthase zurück ins Stroma und treiben dabei die ATP-Bildung an – das gleiche Prinzip wie in den Mitochondrien (Fotophosphorylierung).'},
      {name: 'Calvin-Zyklus', text: 'Im Stroma bindet das Enzym RuBisCO CO₂ an Ribulose-1,5-bisphosphat (Fixierung). Mit ATP und NADPH aus der Lichtreaktion wird daraus Glycerinaldehyd-3-phosphat (G3P) gebildet (Reduktion). Ein Teil davon wird zu Glucose und anderen Stoffen, der Rest regeneriert unter ATP-Verbrauch den CO₂-Akzeptor (Regeneration).'}
    ],
    facts: ['Lichtreaktion: Thylakoidmembran · Calvin-Zyklus: Stroma', 'Der freigesetzte Sauerstoff stammt aus dem Wasser', 'RuBisCO gilt als häufigstes Protein der Erde']
  }
};

// ── Moleküle ────────────────────────────────────────────────────────────────────
export const molecules = {
  dna: {
    name: 'DNA-Doppelhelix', term: 'B-DNA · Dickerson-Dodekamer', src: ['os-14-2', 'os-3-5'],
    cite: 'Drew, H.R., Wing, R.M., Takano, T., Broka, C., Tanaka, S., Itakura, K., Dickerson, R.E. (1981): Structure of a B-DNA dodecamer: conformation and dynamics. PNAS 78, 2179–2183.', doi: '10.1073/pnas.78.4.2179',
    text: 'Diese Struktur von 1981 gilt als erste Einkristall-Röntgenstruktur einer B-DNA über eine volle Helixwindung: zwölf Basenpaare mit der Sequenz CGCGAATTCGCG, nach ihrem Entdecker „Dickerson-Dodekamer“ genannt. Zwei Stränge aus Zucker (Desoxyribose) und Phosphat bilden das Rückgrat, die Basen zeigen nach innen und paaren sich: Adenin mit Thymin (zwei Wasserstoffbrücken), Guanin mit Cytosin (drei). Die Stränge laufen antiparallel. Zwischen ihnen entstehen eine große und eine kleine Furche, an die Proteine binden können.',
    facts: ['Basenpaarung A–T und G–C (Chargaff-Regel)', 'Rechtsgängige Helix, rund 10 Basenpaare pro Windung, Durchmesser ca. 2 nm', 'Stränge antiparallel (5′→3′ und 3′→5′)']
  },
  haemoglobin: {
    name: 'Hämoglobin', term: 'Roter Blutfarbstoff · Desoxy-Form', src: ['os-40-2', 'os-3-4'],
    cite: 'Fermi, G., Perutz, M.F., Shaanan, B., Fourme, R. (1984): The crystal structure of human deoxyhaemoglobin at 1.74 Å resolution. J. Mol. Biol. 175, 159–174.', doi: '10.1016/0022-2836(84)90472-8',
    text: 'Hämoglobin transportiert Sauerstoff in den roten Blutkörperchen. Es besteht aus vier Proteinketten, zwei α- und zwei β-Globinen. Jede Kette trägt eine Häm-Gruppe mit einem Eisen-Ion, an das ein Sauerstoffmolekül binden kann. Bindet ein O₂, verändert sich die Form des ganzen Moleküls, sodass die übrigen Häm-Gruppen leichter Sauerstoff aufnehmen. Diese Kooperativität erzeugt die S-förmige Sauerstoffbindungskurve. Die Struktur zeigt die sauerstofffreie (Desoxy-)Form. Max Perutz erhielt 1962 für die Strukturaufklärung des Hämoglobins den Nobelpreis.',
    facts: ['Quartärstruktur: 2 α- + 2 β-Ketten', '4 Häm-Gruppen mit Fe²⁺ → bis zu 4 O₂', 'Kooperative Bindung → sigmoide Bindungskurve'],
    highlight: 'Häm-Gruppen'
  },
  insulin: {
    name: 'Insulin', term: 'Peptidhormon · Mensch', src: ['os-37-3', 'os-3-4'],
    cite: 'Timofeev, V.I., Chuprov-Netochin, R.N., Samigina, V.R., Bezuglov, V.V., Miroshnikov, K.A., Kuranova, I.P. (2010): X-ray investigation of gene-engineered human insulin crystallized from a solution containing polysialic acid. Acta Cryst. F66, 259–263.', doi: '10.1107/S1744309110000461',
    text: 'Insulin wird in den β-Zellen der Bauchspeicheldrüse gebildet und senkt den Blutzuckerspiegel: Es sorgt dafür, dass Muskel-, Fett- und Leberzellen Glucose aufnehmen und speichern. Das Hormon besteht aus nur 51 Aminosäuren in zwei Ketten. Die A-Kette (21 Aminosäuren) und die B-Kette (30 Aminosäuren) sind über zwei Disulfidbrücken verbunden, eine dritte liegt innerhalb der A-Kette. Insulin war das erste Protein, dessen Aminosäuresequenz bestimmt wurde (Frederick Sanger, Nobelpreis 1958). Die hier gezeigte Struktur stammt von gentechnisch hergestelltem Humaninsulin.',
    facts: ['51 Aminosäuren: A-Kette 21, B-Kette 30', '3 Disulfidbrücken (Schwefel gelb in der Element-Färbung)', 'Gegenspieler: Glukagon']
  },
  antikoerper: {
    name: 'Antikörper', term: 'Immunglobulin G (IgG2a, Maus)', src: ['os-42-3'],
    cite: 'Harris, L.J., Larson, S.B., Hasel, K.W., McPherson, A. (1997): Refined structure of an intact IgG2a monoclonal antibody. Biochemistry 36, 1581–1597.', doi: '10.1021/bi962514+',
    text: 'Antikörper sind Y-förmige Proteine des Immunsystems, die von B-Zellen (Plasmazellen) gebildet werden. Ein IgG besteht aus zwei schweren und zwei leichten Ketten, die über Disulfidbrücken verbunden sind. Die Spitzen der beiden Arme (Fab-Teile) tragen variable Bereiche. Sie bilden die Antigen-Bindungsstelle, die genau zu einem bestimmten Molekül eines Erregers passt. Der Stamm (Fc-Teil) bestimmt, welche Abwehrzellen oder Proteine angelockt werden. Am Fc-Teil hängen Zuckerketten. Dies ist eine der ersten Röntgenstrukturen eines vollständigen Antikörpers.',
    facts: ['2 schwere + 2 leichte Ketten, Y-Form', 'Fab-Arme binden das Antigen, Fc-Teil aktiviert die Abwehr', 'Schlüssel-Schloss-Prinzip zwischen Antigen und Bindungsstelle']
  },
  'atp-synthase': {
    name: 'ATP-Synthase', term: 'F₁F₀-ATP-Synthase · E. coli', src: ['os-7-4', 'os-6-4', 'pdb-101'],
    cite: 'Sobti, M., Walshe, J.L., Wu, D., Ishmukhametov, R., Zeng, Y.C., Robinson, C.V., Berry, R.M., Stewart, A.G. (2020): Cryo-EM structures provide insight into how E. coli F1Fo ATP synthase accommodates symmetry mismatch. Nat. Commun. 11, 2615.', doi: '10.1038/s41467-020-16387-2',
    text: 'Die ATP-Synthase ist ein molekularer Motor in der Membran von Bakterien, Mitochondrien und Chloroplasten. Protonen strömen entlang ihres Konzentrationsgefälles durch den F₀-Teil in der Membran und versetzen dabei den c-Ring in Drehung. Die Drehung überträgt die γ-Achse auf den F₁-Kopf aus drei α- und drei β-Untereinheiten. Die β-Untereinheiten ändern dabei nacheinander ihre Form und verknüpfen ADP und Phosphat zu ATP. Ein seitlicher Stator (b-Untereinheiten, δ) verhindert, dass sich der Kopf mitdreht. Paul Boyer und John Walker erhielten für die Aufklärung dieses Mechanismus 1997 den Nobelpreis.',
    facts: ['F₀ (Membran, Rotor) + F₁ (Kopf, katalytisch)', 'Rotor: c-Ring, γ und ε · Stator: a, b₂, δ', 'Pro voller Umdrehung entstehen 3 ATP'],
    rotor: [4, 5, 7]
  }
};

// Aminosäuren und Nukleotide (Dreibuchstabencode → deutscher Name)
export const residueNames = {
  ALA: 'Alanin', ARG: 'Arginin', ASN: 'Asparagin', ASP: 'Asparaginsäure', CYS: 'Cystein', GLN: 'Glutamin', GLU: 'Glutaminsäure', GLY: 'Glycin', HIS: 'Histidin', ILE: 'Isoleucin', LEU: 'Leucin', LYS: 'Lysin', MET: 'Methionin', PHE: 'Phenylalanin', PRO: 'Prolin', SER: 'Serin', THR: 'Threonin', TRP: 'Tryptophan', TYR: 'Tyrosin', VAL: 'Valin',
  DA: 'Adenin (Desoxyadenosin)', DT: 'Thymin (Desoxythymidin)', DG: 'Guanin (Desoxyguanosin)', DC: 'Cytosin (Desoxycytidin)',
  HEM: 'Häm (Protoporphyrin IX mit Eisen)', ATP: 'Adenosintriphosphat', ADP: 'Adenosindiphosphat', MG: 'Magnesium-Ion', PO4: 'Phosphat-Ion', ZN: 'Zink-Ion',
  NAG: 'N-Acetylglucosamin (Zucker)', MAN: 'Mannose (Zucker)', BMA: 'Mannose (Zucker)', GAL: 'Galactose (Zucker)', FUC: 'Fucose (Zucker)', FUL: 'Fucose (Zucker)'
};

export const elementNames = {C: 'Kohlenstoff', N: 'Stickstoff', O: 'Sauerstoff', S: 'Schwefel', P: 'Phosphor', FE: 'Eisen', ZN: 'Zink', MG: 'Magnesium', X: 'anderes Element'};
