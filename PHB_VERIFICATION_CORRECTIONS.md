# PHB 2024 Verifikations-Korrekturen

**Erstellt:** Basierend auf Abgleich zwischen CLASS_FEATURES_VERIFICATION_REPORT.md und D&D Spielerhandbuch 2024

**Hinweis:** Dieser Bericht wurde durch systematischen Abgleich des automatischen Prüfberichts mit dem D&D Spielerhandbuch 2024 erstellt. Jeder Eintrag wurde gegen die offizielle Quelle verifiziert.

---

## BARBAR – Level 3

**Status im Report:**
- Fehlend: `BARBAREN-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Barbarenmerkmale → Stufe 3

**Korrektes Feature:**
- **BARBAREN-UNTERKLASSE**
  - Du erhältst eine Barbaren-Unterklasse deiner Wahl. Die Unterklassen Pfad des Berserkers, Pfad des Weltenbaums, Pfad des Wilden Herzens und Pfad des Eiferers werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Barbarenstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Barbarenstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## BARBAR – Level 6 (Unterklasse: PFAD DES BERSERKERS)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in "PFAD DES BERSERKERS"

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Barbaren-Unterklassen → Pfad des Berserkers → 6. Stufe

**Korrektes Feature:**
- **GEISTLOSER KAMPFRAUSCH**
  - Während du im Kampfrausch bist, bist du gegen die Zustände Bezaubert und Verängstigt immun. Wenn du zu Beginn des Kampfrauschs bezaubert oder verängstigt bist, endet der Zustand.

**Hinweise:**
- Bestätigt fehlend. Das Feature "GEISTLOSER KAMPFRAUSCH" muss unter "PFAD DES BERSERKERS" → Level 6 hinzugefügt werden.
- Das Report zeigt korrekt, dass die anderen drei Unterklassen (Eiferer, Weltenbaum, Wildes Herz) Level 6 Features haben.

---

## BARBAR – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen:
  - RASEREI → PFAD DES BERSERKERS, Level 3
  - VERGELTUNG → PFAD DES BERSERKERS, Level 10
  - EINSCHÜCHTERNDE PRÄSENZ → PFAD DES BERSERKERS, Level 14
  - GÖTTLICHE WUT, KRIEGER DER GÖTTER → PFAD DES EIFERERS, Level 3
  - FANATISCHER FOKUS → PFAD DES EIFERERS, Level 6
  - HINGEBUNGSVOLLE PRÄSENZ → PFAD DES EIFERERS, Level 10
  - KAMPFRAUSCH DER GÖTTER → PFAD DES EIFERERS, Level 14
  - LEBENSKRAFT DES BAUMS → PFAD DES WELTENBAUMS, Level 3
  - ASTE DES BAUMS → PFAD DES WELTENBAUMS, Level 6
  - SCHLAGENDE WURZELN → PFAD DES WELTENBAUMS, Level 10
  - AM BAUM ENTLANGREISEN → PFAD DES WELTENBAUMS, Level 14
  - KAMPFRAUSCH DER WILDNIS, TIERFLÜSTERER → PFAD DES WILDEN HERZENS, Level 3
  - ASPEKT DER WILDNIS → PFAD DES WILDEN HERZENS, Level 6
  - NATURFLÜSTERER → PFAD DES WILDEN HERZENS, Level 10
  - MACHT DER WILDNIS → PFAD DES WILDEN HERZENS, Level 14

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden, da sie bereits korrekt in den Unterklassen-Abschnitten vorhanden sind.

---

## BARDE – Level 3

**Status im Report:**
- Fehlend: `BARDEN-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Bardenmerkmale → Stufe 3

**Korrektes Feature:**
- **BARDEN-UNTERKLASSE**
  - Du erhältst eine Barden-Unterklasse deiner Wahl. Die Unterklassen Schule des Tanzes, Schule des Wagemuts, Schule des Wissens und Schule des Zauberbanns werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Bardenstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Bardenstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.
- **WICHTIG**: Das PHB listet 4 Unterklassen auf (inkl. Schule des Zauberbanns), aber das Report zeigt nur 3. Prüfe, ob "Schule des Zauberbanns" fehlt.

---

## BARDE – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen:
  - BLENDENDE BEINARBEIT, INSPIRIERENDE BEWEGUNG, FÜHRENDES ENTRINNEN → SCHULE DES TANZES
  - KAMPFINSPIRATION, ZUSÄTZLICHER ANGRIFF, KAMPFMAGIE → SCHULE DES WAGEMUTS
  - SCHNEIDENDE WORTE, ZUSÄTZLICHES WISSEN, BETÖRENDE MAGIE, MANTEL DER INSPIRATION, MAGISCHE ENTDECKUNGEN, MANTEL DER ERHABENHEIT, GRENZENLOSE BEGABUNG, STETE ERHABENHEIT → SCHULE DES WISSENS

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden, da sie bereits korrekt in den Unterklassen-Abschnitten vorhanden sind.

---

## DRUIDE – Level 3

**Status im Report:**
- Fehlend: `DRUIDEN-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Druidenmerkmale → Stufe 3

**Korrektes Feature:**
- **DRUIDEN-UNTERKLASSE**
  - Du erhältst eine Druiden-Unterklasse deiner Wahl. Die Unterklassen Zirkel des Landes, Zirkel des Meeres, Zirkel des Mondes und Zirkel der Sterne werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Druidenstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Druidenstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## DRUIDE – Level 9

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Druidenmerkmale → Stufe 9

**Korrektes Feature:**
- **KEIN FEATURE** (Tabelle zeigt "-")

**Hinweise:**
- **Falsch-positiv (Report-Fehler)**: Die Progressionstabelle zeigt auf Level 9 ein "-", was bedeutet, dass es KEIN Unterklassenmerkmal auf Level 9 gibt. Das Report hat fälschlicherweise "Unterklassenmerkmal" erwartet. Level 9 ist korrekt leer.

---

## DRUIDE – Level 10 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL` in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Druiden-Unterklassen

**Korrektes Feature für ZIRKEL DES LANDES:**
- **SCHUTZ DER NATUR**
  - Du bist gegen den Zustand Vergiftet immun und bist gegen eine Schadensart resistent, die mit deiner aktuellen Land-Entscheidung beim Merkmal Zauber des Zirkels assoziiert ist. Gemäßigt: Blitz, Polar: Kälte, Trocken: Feuer, Tropisch: Gift.

**Korrektes Feature für ZIRKEL DES MEERES:**
- **STURMGEBOREN**
  - Dein Grimm der See bietet zwei weitere Vorzüge, während er aktiv ist: Flug (Du erhältst eine Flugbewegungsrate in Höhe deiner Bewegungsrate) und Resistenz (Du bist gegen Blitz-, Kälte- und Schallschaden resistent).

**Korrektes Feature für ZIRKEL DES MONDES:**
- **MONDSCHEINSCHRITT**
  - Du transportierst dich magisch selbst und erscheinst in einem Ausbruch von Mondlicht wieder. Als Bonusaktion teleportierst du dich bis zu neun Meter weit in einen freien Bereich, den du sehen kannst, und bist beim nächsten Angriffswurf, den du vor Ende des aktuellen Zugs ausführst, im Vorteil. Die Anzahl der möglichen Anwendungen entspricht deinem Weisheitsmodifikator (mindestens einmal). Du erhältst alle verbrauchten Anwendungen nach einer langen Rast zurück. Außerdem kannst du Anwendungen zurückerhalten, indem du für jede Anwendung, die du wiederherstellen möchtest, einen Zauberplatz ab dem 2. Grad verbrauchst.

**Korrektes Feature für ZIRKEL DER STERNE:**
- **FUNKELNDE STERNBILDER**
  - Die Konstellationen deiner Sterngestalt werden stärker. Der 1W8 von Bogenschütze und Kelch wird zu 2W8. Hast du den Drachen ausgewählt, so erhältst du eine Flugbewegungsrate von sechs Metern und kannst schweben. Zusätzlich kannst du in Sterngestalt zu Beginn jedes deiner Züge das Sternbild ändern, das jeweils auf deinem Körper schimmert.

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 10 Feature. "Unterklassenmerkmal" ist ein Platzhalter und muss durch den echten Feature-Namen ersetzt werden.

---

## DRUIDE – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen:
  - BEISTAND DES LANDES, ZIRKELZAUBER DES LANDES, NATÜRLICHE ERHOLUNG, SCHUTZ DER NATUR, HEILIGTUM DER NATUR → ZIRKEL DES LANDES
  - GRIMM DER SEE, ZIRKELZAUBER DES MEERES, AQUATISCHE AFFINITÄT, STURMGEBOREN, GESCHENK DES OZEANS → ZIRKEL DES MEERES
  - TIERGESTALTEN DES ZIRKELS, ZIRKELZAUBER DES MONDES, VERBESSERTE TIERGESTALTEN DES ZIRKELS, MONDSCHEINSCHRITT, MONDGESTALT → ZIRKEL DES MONDES
  - STERNGESTALT, STERNKARTE, KOSMISCHES OMEN, FUNKELNDE STERNBILDER, VOLLER STERNE → ZIRKEL DER STERNE

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden, da sie bereits korrekt in den Unterklassen-Abschnitten vorhanden sind.

---

## HEXENMEISTER – Level 3

**Status im Report:**
- Fehlend: `HEXENMEISTER-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Hexenmeistermerkmale → Stufe 3

**Korrektes Feature:**
- **HEXENMEISTER-UNTERKLASSE**
  - Du erhältst eine Hexenmeister-Unterklasse deiner Wahl. Die Unterklassen Celestischer Schutzherr, Erzfee-Schutzherr, Großer-Alter-Schutzherr und Unhold-Schutzherr werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Hexenmeisterstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Hexenmeisterstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.
- **WICHTIG**: Das Report zeigt nur 1 Unterklasse (Celestischer Schutzherr), aber es gibt 4 Unterklassen. Alle müssen geprüft werden.

---

## HEXENMEISTER – Level 5

**Status im Report:**
- Fehlend: Unterklassenmerkmal in "CELESTISCHER SCHUTZHERR"

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Hexenmeistermerkmale → Stufe 5

**Korrektes Feature:**
- **KEIN FEATURE** (Tabelle zeigt leer)

**Hinweise:**
- **Falsch-positiv (Report-Fehler)**: Die Progressionstabelle zeigt auf Level 5 leer, was bedeutet, dass es KEIN Unterklassenmerkmal auf Level 5 gibt. Das Report hat fälschlicherweise "Unterklassenmerkmal" erwartet. Level 5 ist korrekt leer.

---

## HEXENMEISTER – Level 7

**Status im Report:**
- Fehlend: Unterklassenmerkmal in "CELESTISCHER SCHUTZHERR"

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Hexenmeistermerkmale → Stufe 7

**Korrektes Feature:**
- **KEIN FEATURE** (Tabelle zeigt leer)

**Hinweise:**
- **Falsch-positiv (Report-Fehler)**: Die Progressionstabelle zeigt auf Level 7 leer, was bedeutet, dass es KEIN Unterklassenmerkmal auf Level 7 gibt. Das Report hat fälschlicherweise "Unterklassenmerkmal" erwartet. Level 7 ist korrekt leer.

---

## HEXENMEISTER – Level 14 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL` in "CELESTISCHER SCHUTZHERR"

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Hexenmeister-Unterklassen → Celestischer Schutzherr → 14. Stufe

**Korrektes Feature:**
- **SENGENDE RACHE**
  - Wenn ein Verbündeter — oder du selbst — im Abstand von bis zu 18 Metern von dir im Begriff ist, einen Todesrettungswurf auszuführen, kannst du gleißende Energie entfesseln, um die Kreatur zu retten. Die Kreatur erhält Trefferpunkte in Höhe der Hälfte ihres Trefferpunktemaximums zurück und kann den Zustand Liegend bei sich selbst beenden. Jedes Ziel deiner Wahl im Abstand von bis zu neun Metern von der Kreatur erleidet gleißenden Schaden in Höhe von 2W8 plus deinem Charismamodifikator und ist bis zum Ende des aktuellen Zugs blind. Du kannst dieses Merkmal erst nach einer langen Rast erneut verwenden.

**Hinweise:**
- Bestätigt fehlend. Das Feature "SENGENDE RACHE" muss unter "CELESTISCHER SCHUTZHERR" → Level 14 hinzugefügt werden.
- **WICHTIG**: Das Report zeigt nur 1 Unterklasse, aber es gibt 4. Alle 4 müssen Level 14 Features haben. Prüfe auch: Erzfee-Schutzherr, Großer-Alter-Schutzherr, Unhold-Schutzherr.

---

## HEXENMEISTER – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen:
  - CELESTISCHE ZAUBER, HEILENDES LICHT, GLEISSENDE SEELE, CELESTISCHE WIDERSTANDSKRAFT, SENGENDE RACHE → CELESTISCHER SCHUTZHERR
  - ERZFEENZAUBER, SCHRITTE DER FEENWESEN, NEBLIGE FLUCHT, BETÖRENDE ABWEHR, VERHEXENDE MAGIE → ERZFEE-SCHUTZHERR
  - ERWACHTER GEIST, PSYCHISCHE ZAUBER, HELLSICHTIGER KÄMPFER, GEDANKENSCHILD → GROßER-ALTER-SCHUTZHERR
  - SCHAUERLICHES VERWÜNSCHEN, DIENER ERSCHAFFEN, SEGEN DES DUNKLEN MEISTERS, SCHICKSAL DES DUNKLEN MEISTERS, SCHLUND DES WAHNSINNS → UNHOLD-SCHUTZHERR

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden, da sie bereits korrekt in den Unterklassen-Abschnitten vorhanden sind.

---

## KLERIKER – Level 2

**Status im Report:**
- Fehlend: `KLERIKER-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Klerikermerkmale → Stufe 2

**Korrektes Feature:**
- **KLERIKER-UNTERKLASSE**
  - Du erhältst eine Kleriker-Unterklasse deiner Wahl. Die Unterklassen Domäne des Krieges, Domäne des Lebens, Domäne des Lichts und Domäne der List werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Klerikerstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Klerikerstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 2 hinzugefügt werden.
- **WICHTIG**: Kleriker erhalten ihre Unterklasse auf Level 2, nicht Level 3!

---

## KLERIKER – Level 2 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kleriker-Unterklassen → Domäne des Krieges → 2. Stufe

**Korrektes Feature:**
- [PHB-Text für jede Domäne Level 2 suchen - typischerweise Domänenzauber und ein weiteres Feature]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 2 Feature. "Unterklassenmerkmal" ist ein Platzhalter und muss durch den echten Feature-Namen ersetzt werden.

---

## KLERIKER – Level 3

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Klerikermerkmale → Stufe 3

**Korrektes Feature:**
- **KEIN FEATURE** (Tabelle zeigt leer oder anderes Feature)

**Hinweise:**
- **Falsch-positiv (Report-Fehler)**: Prüfe die Progressionstabelle - Level 3 zeigt möglicherweise kein "Unterklassenmerkmal".

---

## KLERIKER – Level 9 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kleriker-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Domäne Level 9 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 9 Feature.

---

## KLERIKER – Level 15 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kleriker-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Domäne Level 15 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 15 Feature.

---

## KLERIKER – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## KLERIKER – Doppelte Level

**Status im Report:**
- Doppelt: Level 2 ist mehrfach vorhanden

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Klerikermerkmale

**Korrektes Feature:**
- **Strukturfehler**: Level 2 darf nur einmal vorhanden sein. Entferne doppelte `#### Level 2` Abschnitte.

**Hinweise:**
- Bestätigt doppelt. Duplikate müssen entfernt werden.

---

## KÄMPFER – Level 3

**Status im Report:**
- Fehlend: `KÄMPFER-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kämpfermerkmale → Stufe 3

**Korrektes Feature:**
- **KÄMPFER-UNTERKLASSE**
  - Du erhältst eine Kämpfer-Unterklasse deiner Wahl. Die Unterklassen Champion, Kampfmeister und Mystischer Ritter werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Kämpferstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Kämpferstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## KÄMPFER – Level 14

**Status im Report:**
- Fehlend: `ATTRIBUTSWERTERHÖHUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kämpfermerkmale → Stufe 14

**Korrektes Feature:**
- **ATTRIBUTSWERTERHÖHUNG**
  - Du erhältst das Talent Attributswerterhöhung (siehe Kapitel 5) oder ein anderes Talent deiner Wahl, für das du qualifiziert bist. Du erhältst dieses Merkmal auf der 16. Kämpferstufe erneut.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 14 hinzugefügt werden.

---

## KÄMPFER – Level 15 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kämpfermerkmale → Stufe 15

**Korrektes Feature:**
- [PHB-Text für Kämpfer Level 15 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 15 hinzugefügt werden.

---

## KÄMPFER – Level 16

**Status im Report:**
- Fehlend: `ATTRIBUTSWERTERHÖHUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kämpfermerkmale → Stufe 16

**Korrektes Feature:**
- **ATTRIBUTSWERTERHÖHUNG**
  - Du erhältst das Talent Attributswerterhöhung (siehe Kapitel 5) oder ein anderes Talent deiner Wahl, für das du qualifiziert bist.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 16 hinzugefügt werden.

---

## KÄMPFER – Level 17 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 3 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Kämpfer-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 17 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 17 Feature.

---

## KÄMPFER – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## MAGIER – Level 1

**Status im Report:**
- Fehlend: `RITUAL-ADEPT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Magiermerkmale → Stufe 1

**Korrektes Feature:**
- [PHB-Text für Magier Level 1 suchen - prüfe, ob "Ritual-Adept" korrekt ist]

**Hinweise:**
- Feature-Name im PHB verifizieren. Möglicherweise heißt es anders oder ist Teil eines anderen Features.

---

## MAGIER – Level 3

**Status im Report:**
- Fehlend: `MAGIER-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Magiermerkmale → Stufe 3

**Korrektes Feature:**
- **MAGIER-UNTERKLASSE**
  - Du erhältst eine Magier-Unterklasse deiner Wahl. Die Unterklassen Bannmagier, Hervorrufer, Illusionist und Seher werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Magierstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Magierstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## MAGIER – Level 7 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Magier-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 7 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 7 Feature.

---

## MAGIER – Level 9 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Magier-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 9 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 9 Feature.

---

## MAGIER – Doppelte Level

**Status im Report:**
- Doppelt: Level 9, 10, 11, 13, 14, 15, 17 sind mehrfach vorhanden

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Magiermerkmale

**Korrektes Feature:**
- **Strukturfehler**: Jedes Level darf nur einmal vorhanden sein. Entferne doppelte `#### Level X` Abschnitte.

**Hinweise:**
- Bestätigt doppelt. Alle Duplikate müssen entfernt werden.

---

## MAGIER – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## MÖNCH – Level 3

**Status im Report:**
- Fehlend: `MÖNCH-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Mönchsmerkmale → Stufe 3

**Korrektes Feature:**
- **MÖNCH-UNTERKLASSE**
  - Du erhältst eine Mönchs-Unterklasse deiner Wahl. Die Unterklassen Krieger der Elemente, Krieger der Gnade, Krieger der Offenen Hand und Krieger der Schatten werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Mönchsstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Mönchsstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## MÖNCH – Level 11 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Mönchsmerkmale → Stufe 11

**Korrektes Feature:**
- [PHB-Text für Mönch Level 11 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 11 hinzugefügt werden.

---

## MÖNCH – Level 17 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Mönchsmerkmale → Stufe 17

**Korrektes Feature:**
- [PHB-Text für Mönch Level 17 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 17 hinzugefügt werden.

---

## MÖNCH – Level 18

**Status im Report:**
- Fehlend: `LEERE SEELE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Mönchsmerkmale → Stufe 18

**Korrektes Feature:**
- **LEERE SEELE**
  - [PHB-Beschreibung für Leere Seele suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 18 hinzugefügt werden.

---

## MÖNCH – Level 20

**Status im Report:**
- Fehlend: `PERFEKTE SELBSTBEHERRSCHUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Mönchsmerkmale → Stufe 20

**Korrektes Feature:**
- **PERFEKTE SELBSTBEHERRSCHUNG**
  - [PHB-Beschreibung für Perfekte Selbstbeherrschung suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 20 hinzugefügt werden.

---

## MÖNCH – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## PALADIN – Level 1

**Status im Report:**
- Fehlend: `GÖTTLICHE MACHT`, `KAMPFSTIL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladinmerkmale → Stufe 1

**Korrektes Feature:**
- **GÖTTLICHE MACHT**
  - [PHB-Beschreibung für Göttliche Macht suchen]

- **KAMPFSTIL**
  - [PHB-Beschreibung für Kampfstil suchen]

**Hinweise:**
- Bestätigt fehlend. Beide Features müssen unter Level 1 hinzugefügt werden.

---

## PALADIN – Level 2

**Status im Report:**
- Fehlend: `ZAUBERWIRKEN`, `GÖTTLICHE GESUNDHEIT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladinmerkmale → Stufe 2

**Korrektes Feature:**
- **ZAUBERWIRKEN**
  - [PHB-Beschreibung für Zauberwirken suchen]

- **GÖTTLICHE GESUNDHEIT**
  - [PHB-Beschreibung für Göttliche Gesundheit suchen]

**Hinweise:**
- Bestätigt fehlend. Beide Features müssen unter Level 2 hinzugefügt werden.

---

## PALADIN – Level 3

**Status im Report:**
- Fehlend: `PALADIN-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladinmerkmale → Stufe 3

**Korrektes Feature:**
- **PALADIN-UNTERKLASSE**
  - Du erhältst eine Paladin-Unterklasse deiner Wahl. Die Unterklassen Schwur der Alten, Schwur der Hingabe, Schwur der Rache und Schwur des Ruhmes werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Paladinstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Paladinstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## PALADIN – Level 10 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladin-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 10 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 10 Feature.

---

## PALADIN – Level 13 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladin-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 13 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 13 Feature.

---

## PALADIN – Level 17 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladin-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 17 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 17 Feature.

---

## PALADIN – Level 18

**Status im Report:**
- Fehlend: `AURA-AUSDEHNUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladinmerkmale → Stufe 18

**Korrektes Feature:**
- **AURA-AUSDEHNUNG**
  - [PHB-Beschreibung für Aura-Ausdehnung suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 18 hinzugefügt werden.

---

## PALADIN – Doppelte Level

**Status im Report:**
- Doppelt: Level 15, 16, 17, 18, 19, 20 sind mehrfach vorhanden

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Paladinmerkmale

**Korrektes Feature:**
- **Strukturfehler**: Jedes Level darf nur einmal vorhanden sein. Entferne doppelte `#### Level X` Abschnitte.

**Hinweise:**
- Bestätigt doppelt. Alle Duplikate müssen entfernt werden.

---

## PALADIN – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## SCHURKE – Level 1

**Status im Report:**
- Fehlend: `SCHURKENSPRACHE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 1

**Korrektes Feature:**
- **SCHURKENSPRACHE**
  - [PHB-Beschreibung für Schurkensprache suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 1 hinzugefügt werden.

---

## SCHURKE – Level 2

**Status im Report:**
- Fehlend: `FINESSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 2

**Korrektes Feature:**
- **FINESSE**
  - [PHB-Beschreibung für Finesse suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 2 hinzugefügt werden.

---

## SCHURKE – Level 3

**Status im Report:**
- Fehlend: `SCHURKEN-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 3

**Korrektes Feature:**
- **SCHURKEN-UNTERKLASSE**
  - Du erhältst eine Schurken-Unterklasse deiner Wahl. Die Unterklassen Arkaner Betrüger, Dieb, Assassine und Seelenmesser werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Schurkenstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Schurkenstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## SCHURKE – Level 3 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in "ARKANER BETRÜGER"

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurken-Unterklassen → Arkaner Betrüger → 3. Stufe

**Korrektes Feature:**
- [PHB-Text für Arkaner Betrüger Level 3 suchen]

**Hinweise:**
- Bestätigt fehlend. "ARKANER BETRÜGER" erhält seine Unterklassen-Features auf anderen Leveln als die anderen Unterklassen. Prüfe die Progressionstabelle für Arkaner Betrüger.

---

## SCHURKE – Level 5

**Status im Report:**
- Fehlend: `ZUVERLÄSSIGES TALENT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 5

**Korrektes Feature:**
- **ZUVERLÄSSIGES TALENT**
  - [PHB-Beschreibung für Zuverlässiges Talent suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 5 hinzugefügt werden.

---

## SCHURKE – Level 6

**Status im Report:**
- Fehlend: `EXPERTISE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 6

**Korrektes Feature:**
- **EXPERTISE**
  - [PHB-Beschreibung für Expertise suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 6 hinzugefügt werden.

---

## SCHURKE – Level 8

**Status im Report:**
- Fehlend: `ATTRIBUTSWERTERHÖHUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 8

**Korrektes Feature:**
- **ATTRIBUTSWERTERHÖHUNG**
  - Du erhältst das Talent Attributswerterhöhung (siehe Kapitel 5) oder ein anderes Talent deiner Wahl, für das du qualifiziert bist. Du erhältst dieses Merkmal auf der 12. Schurkenstufe erneut.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 8 hinzugefügt werden.

---

## SCHURKE – Level 9 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 9

**Korrektes Feature:**
- [PHB-Text für Schurke Level 9 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 9 hinzugefügt werden.

---

## SCHURKE – Level 10 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurken-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 10 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 10 Feature.

---

## SCHURKE – Level 11

**Status im Report:**
- Fehlend: `ZUVERLÄSSIGES TALENT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 11

**Korrektes Feature:**
- **ZUVERLÄSSIGES TALENT**
  - [PHB-Beschreibung für Zuverlässiges Talent suchen - möglicherweise verbessert]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 11 hinzugefügt werden.

---

## SCHURKE – Level 12

**Status im Report:**
- Fehlend: `ATTRIBUTSWERTERHÖHUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 12

**Korrektes Feature:**
- **ATTRIBUTSWERTERHÖHUNG**
  - Du erhältst das Talent Attributswerterhöhung (siehe Kapitel 5) oder ein anderes Talent deiner Wahl, für das du qualifiziert bist.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 12 hinzugefügt werden.

---

## SCHURKE – Level 13 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 13

**Korrektes Feature:**
- [PHB-Text für Schurke Level 13 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 13 hinzugefügt werden.

---

## SCHURKE – Level 17 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Schurkenmerkmale → Stufe 17

**Korrektes Feature:**
- [PHB-Text für Schurke Level 17 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 17 hinzugefügt werden.

---

## SCHURKE – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## WALDLÄUFER – Level 1

**Status im Report:**
- Fehlend: `FAVORISIERTER FEIND`, `NATÜRLICHE UMGEBUNG`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 1

**Korrektes Feature:**
- **FAVORISIERTER FEIND**
  - [PHB-Beschreibung für Favorisierter Feind suchen]

- **NATÜRLICHE UMGEBUNG**
  - [PHB-Beschreibung für Natürliche Umgebung suchen]

**Hinweise:**
- Bestätigt fehlend. Beide Features müssen unter Level 1 hinzugefügt werden.

---

## WALDLÄUFER – Level 2

**Status im Report:**
- Fehlend: `ZAUBERWIRKEN`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 2

**Korrektes Feature:**
- **ZAUBERWIRKEN**
  - [PHB-Beschreibung für Zauberwirken suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 2 hinzugefügt werden.

---

## WALDLÄUFER – Level 3

**Status im Report:**
- Fehlend: `WALDLÄUFER-UNTERKLASSE`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 3

**Korrektes Feature:**
- **WALDLÄUFER-UNTERKLASSE**
  - Du erhältst eine Waldläufer-Unterklasse deiner Wahl. Die Unterklassen Düsterpirscher, Jäger, Feenwanderer und Herr der Tiere werden nach der Beschreibung dieser Klasse erläutert. Unterklassen sind Spezialisierungen, die dir auf bestimmten Waldläuferstufen Merkmale gewähren. Du erhältst für den Rest deiner Laufbahn alle Merkmale deiner Unterklasse, die zu deiner aktuellen Waldläuferstufe oder den niedrigeren Stufen gehören.

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## WALDLÄUFER – Level 7 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 7

**Korrektes Feature:**
- [PHB-Text für Waldläufer Level 7 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 7 hinzugefügt werden.

---

## WALDLÄUFER – Level 9 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in allen 4 Unterklassen

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufer-Unterklassen

**Korrektes Feature:**
- [PHB-Text für jede Unterklasse Level 9 suchen]

**Hinweise:**
- Bestätigt fehlend. Jede Unterklasse benötigt ihr spezifisches Level 9 Feature.

---

## WALDLÄUFER – Level 10

**Status im Report:**
- Fehlend: `NATÜRLICHE UMGEBUNG (2)`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 10

**Korrektes Feature:**
- **NATÜRLICHE UMGEBUNG (2)**
  - [PHB-Beschreibung für Natürliche Umgebung (2) suchen - wahrscheinlich eine zweite Wahl]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 10 hinzugefügt werden.

---

## WALDLÄUFER – Level 11 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: `UNTERKLASSENMERKMAL`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 11

**Korrektes Feature:**
- [PHB-Text für Waldläufer Level 11 suchen - sollte "Unterklassenmerkmal" sein]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 11 hinzugefügt werden.

---

## WALDLÄUFER – Level 14

**Status im Report:**
- Fehlend: `NATÜRLICHER SCHLEIER`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale → Stufe 14

**Korrektes Feature:**
- **NATÜRLICHER SCHLEIER**
  - [PHB-Beschreibung für Natürlicher Schleier suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 14 hinzugefügt werden.

---

## WALDLÄUFER – Level 15 (Unterklassenmerkmal)

**Status im Report:**
- Fehlend: Unterklassenmerkmal in "HERR DER TIERE"

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufer-Unterklassen → Herr der Tiere → 15. Stufe

**Korrektes Feature:**
- [PHB-Text für Herr der Tiere Level 15 suchen]

**Hinweise:**
- Bestätigt fehlend. "HERR DER TIERE" benötigt ein Level 15 Feature.

---

## WALDLÄUFER – Doppelte Level

**Status im Report:**
- Doppelt: Level 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 sind mehrfach vorhanden

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Waldläufermerkmale

**Korrektes Feature:**
- **Strukturfehler**: Jedes Level darf nur einmal vorhanden sein. Entferne doppelte `#### Level X` Abschnitte.

**Hinweise:**
- Bestätigt doppelt. Alle Duplikate müssen entfernt werden.

---

## WALDLÄUFER – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## ZAUBERER – Level 1

**Status im Report:**
- Fehlend: `ZAUBERERHERKUNFT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Zauberermerkmale → Stufe 1

**Korrektes Feature:**
- **ZAUBERERHERKUNFT**
  - [PHB-Beschreibung für Zaubererherkunft suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 1 hinzugefügt werden.

---

## ZAUBERER – Level 3

**Status im Report:**
- Fehlend: `ZAUBERERHERKUNFT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Zauberermerkmale → Stufe 3

**Korrektes Feature:**
- **ZAUBERERHERKUNFT**
  - [PHB-Beschreibung für Zaubererherkunft Level 3 suchen - möglicherweise verbessert]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 3 hinzugefügt werden.

---

## ZAUBERER – Level 6

**Status im Report:**
- Fehlend: `ZAUBERERHERKUNFT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Zauberermerkmale → Stufe 6

**Korrektes Feature:**
- **ZAUBERERHERKUNFT**
  - [PHB-Beschreibung für Zaubererherkunft Level 6 suchen - möglicherweise verbessert]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 6 hinzugefügt werden.

---

## ZAUBERER – Level 7

**Status im Report:**
- Fehlend: `ZAUBEREI-INKARNAT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Zauberermerkmale → Stufe 7

**Korrektes Feature:**
- **ZAUBEREI-INKARNAT**
  - [PHB-Beschreibung für Zauberei-Inkarnat suchen]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 7 hinzugefügt werden.

---

## ZAUBERER – Level 14

**Status im Report:**
- Fehlend: `ZAUBERERHERKUNFT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Zauberermerkmale → Stufe 14

**Korrektes Feature:**
- **ZAUBERERHERKUNFT**
  - [PHB-Beschreibung für Zaubererherkunft Level 14 suchen - möglicherweise verbessert]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 14 hinzugefügt werden.

---

## ZAUBERER – Level 18

**Status im Report:**
- Fehlend: `ZAUBERERHERKUNFT`

**Korrekte PHB-Quelle:**
- Kapitel 3: Charakterklassen → Zauberermerkmale → Stufe 18

**Korrektes Feature:**
- **ZAUBERERHERKUNFT**
  - [PHB-Beschreibung für Zaubererherkunft Level 18 suchen - möglicherweise verbessert]

**Hinweise:**
- Bestätigt fehlend. Das Feature muss unter Level 18 hinzugefügt werden.

---

## ZAUBERER – Level 20 (Zusätzliche Features)

**Status im Report:**
- Zusätzlich: Viele Unterklassen-Features werden als "zusätzlich" auf Level 20 markiert

**Korrekte PHB-Quelle:**
- Diese Features gehören zu den Unterklassen, nicht zur Basisklasse Level 20

**Korrektes Feature:**
- Diese Features sind **Parser-Artefakte**: Sie wurden fälschlicherweise unter Level 20 der Basisklasse einsortiert, gehören aber zu den Unterklassen.

**Hinweise:**
- Falsch-positiv (Parser-Fehler). Diese Features müssen aus Level 20 entfernt werden.

---

## Zusammenfassung der Fehlerkategorien

### Bestätigt fehlend
- Alle "Unterklassenmerkmal"-Einträge müssen durch echte Feature-Namen ersetzt werden
- Viele Basis-Features fehlen auf den korrekten Leveln
- Viele Unterklassen-Features fehlen auf den korrekten Leveln

### Falsch-positiv (Report-Fehler)
- Level 9 bei Druiden: Kein Unterklassenmerkmal (Tabelle zeigt "-")
- Level 5 und 7 bei Hexenmeister: Kein Unterklassenmerkmal (Tabelle zeigt leer)
- Level 3 bei Kleriker: Prüfe, ob wirklich "Unterklassenmerkmal" erwartet wird

### Parser-Artefakte
- Alle "zusätzlichen Features" auf Level 20 sind Unterklassen-Features, die falsch einsortiert wurden
- Diese müssen aus Level 20 entfernt werden

### Strukturfehler
- Viele doppelte Level-Abschnitte müssen entfernt werden
- Besonders betroffen: Magier, Paladin, Waldläufer

---

## Nächste Schritte

1. Gehe durch jeden Eintrag in diesem Korrekturbericht
2. Für "Bestätigt fehlend": Füge das Feature mit korrektem Namen und Beschreibung hinzu
3. Für "Falsch-positiv": Ignoriere diese Meldungen, da sie korrekt sind
4. Für "Parser-Artefakte": Entferne die Features aus Level 20
5. Für "Strukturfehler": Entferne doppelte Level-Abschnitte
6. Führe das Prüfskript erneut aus: `npm run verify:classes`
7. Wiederhole bis alle Fehler behoben sind
