// Instrukcje ćwiczeń: kroki po polsku (pisane ręcznie) + 2 zdjęcia z free-exercise-db
// (github.com/yuhonas/free-exercise-db) - zdjęcie 1 to pozycja wyjściowa,
// zdjęcie 2 to ruch. Zdjęcia przypisuje js/guide-images.js (tools/make_guides.py).
//
// Klucz: id ćwiczenia wbudowanego albo "partia|nazwa małymi literami" dla własnych (te mają
// losowe id). Wariant typu ("Plank (Ciężar / Powtórzenia)") dostaje instrukcję oryginału.

import { DEFAULT_EXERCISES, baseName } from './data.js';
import { GUIDE_IMAGES } from './guide-images.js';

export const GUIDE_SOURCE = 'Zdjęcia: free-exercise-db';

const STEPS = {
  // ---------- Abs ----------
  'abs:brzuszki': [
    'Połóż się na plecach, nogi ugięte, stopy na podłodze, dłonie przy skroniach.',
    'Napnij brzuch i unieś łopatki od podłoża, zbliżając żebra do miednicy. Nie ciągnij głowy rękami.',
    'Zatrzymaj się na chwilę na górze z wydechem.',
    'Opuść się powoli i od razu zacznij kolejne powtórzenie.',
  ],
  'abs:spiecia-brzucha-na-maszynie': [
    'Ustaw siedzisko tak, by uchwyty były na wysokości klatki, i chwyć je.',
    'Z wydechem zwiń tułów w dół - ruch wychodzi z brzucha, nie z rąk.',
    'Zatrzymaj się sekundę w pełnym spięciu.',
    'Wróć powoli, nie odkładając ciężaru do końca.',
  ],
  'abs:spiecia-brzucha-na-wyciagu': [
    'Uklęknij przed wyciągiem górnym, końce liny trzymaj przy głowie.',
    'Biodra nieruchome - zwiń tułów w dół, kierując łokcie do ud.',
    'Spinaj brzuch na dole z wydechem.',
    'Wróć powoli do wyprostu.',
  ],
  'abs:plank': [
    'Oprzyj się na przedramionach (łokcie pod barkami) i palcach stóp.',
    'Ciało w jednej linii od głowy do pięt - napnij brzuch i pośladki, nie unoś ani nie opuszczaj bioder.',
    'Oddychaj spokojnie i utrzymaj pozycję przez zadany czas.',
  ],
  'abs:plank-boczny': [
    'Połóż się na boku, oprzyj na przedramieniu (łokieć pod barkiem), nogi wyprostowane jedna na drugiej.',
    'Unieś biodra, aż ciało utworzy prostą linię.',
    'Utrzymaj pozycję, nie pozwalając biodrom opaść, potem zmień stronę.',
  ],
  'abs:unoszenie-nog-w-zwisie': [
    'Zawiśnij na drążku nachwytem, ręce proste, nogi razem.',
    'Napnij brzuch i unieś nogi do poziomu lub wyżej - bez bujania.',
    'Zatrzymaj się na chwilę.',
    'Opuść nogi powoli, kontrolując ruch.',
  ],
  'abs:unoszenie-nog-lezac': [
    'Połóż się na ławce, chwyć ją dłońmi za głową, nogi proste.',
    'Z wydechem unieś proste nogi do pionu.',
    'Opuść je powoli prawie do poziomu, nie wyginając lędźwi.',
  ],
  'abs:russian-twist': [
    'Usiądź, kolana ugięte, odchyl tułów do tyłu ok. 45°, ciężar trzymaj przed sobą.',
    'Skręć tułów w jedną stronę, przenosząc ciężar obok biodra.',
    'Wróć przez środek i skręć w drugą stronę. Uniesione stopy utrudniają ćwiczenie.',
  ],
  'abs:kolko-do-cwiczen-brzucha-ab-wheel': [
    'Uklęknij, chwyć kółko i postaw je przed kolanami.',
    'Tocz kółko powoli do przodu, wydłużając ciało - brzuch napięty, plecy proste.',
    'Zatrzymaj się, zanim lędźwie zaczną się wyginać.',
    'Przyciągnij kółko z powrotem siłą brzucha.',
  ],
  'abs:nozyce': [
    'Połóż się na plecach, dłonie pod pośladkami, unieś proste nogi kilkanaście cm nad podłogę.',
    'Krzyżuj nogi albo unoś je naprzemiennie małymi ruchami.',
    'Lędźwie przyciśnięte do podłogi, oddychaj równo przez całą serię.',
  ],
  'abs:mountain-climbers': [
    'Przyjmij podpór przodem, dłonie pod barkami.',
    'Przyciągnij jedno kolano do klatki.',
    'Szybko zmieniaj nogi jak w biegu - biodra nisko, brzuch napięty.',
  ],
  'abs:rowerek': [
    'Połóż się na plecach, dłonie przy głowie, nogi uniesione i ugięte.',
    'Przyciągnij łokieć do przeciwnego kolana, prostując drugą nogę.',
    'Zmieniaj strony płynnie, jak przy pedałowaniu.',
  ],

  // ---------- Plecy ----------
  'plecy:martwy-ciag': [
    'Stań ze stopami na szerokość bioder, gryf nad środkiem stopy.',
    'Chwyć gryf tuż za kolanami - plecy proste, klatka do przodu, biodra niżej niż barki.',
    'Wypchnij podłogę nogami i prostuj biodra, prowadząc gryf blisko nóg.',
    'Na górze stań prosto, bez odchylania. Opuść gryf tą samą drogą - najpierw biodra do tyłu.',
  ],
  'plecy:podciaganie-nachwytem': [
    'Chwyć drążek nachwytem nieco szerzej niż barki i zawiśnij na prostych rękach.',
    'Ściągnij łopatki i podciągnij się, aż broda minie drążek - łokcie prowadź w dół.',
    'Opuść się powoli do pełnego wyprostu, bez bujania.',
  ],
  'plecy:podciaganie-podchwytem': [
    'Chwyć drążek podchwytem na szerokość barków.',
    'Podciągnij się, prowadząc łokcie wzdłuż tułowia, aż broda minie drążek.',
    'Opuść się powoli do wyprostu rąk.',
  ],
  'plecy:podciaganie-z-obciazeniem': [
    'Załóż pas z obciążeniem albo trzymaj hantel między stopami.',
    'Zawiśnij nachwytem - brzuch napięty, żeby ciężar się nie bujał.',
    'Podciągnij się, aż broda minie drążek.',
    'Opuść się powoli do pełnego wyprostu.',
  ],
  'plecy:wioslowanie-sztanga-w-opadzie': [
    'Chwyć sztangę nachwytem, pochyl tułów do ok. 45°, kolana lekko ugięte, plecy proste.',
    'Przyciągnij sztangę do dolnej części brzucha, łokcie blisko tułowia, łopatki ściągnij.',
    'Zatrzymaj się na chwilę.',
    'Opuść powoli do wyprostu rąk, nie zaokrąglając pleców.',
  ],
  'plecy:wioslowanie-hantlem': [
    'Oprzyj kolano i dłoń jednej strony na ławce, plecy równolegle do podłogi.',
    'Drugą ręką przyciągnij hantel do biodra, łokieć wzdłuż tułowia.',
    'Ściągnij łopatkę na górze.',
    'Opuść hantel powoli; po serii zmień stronę.',
  ],
  'plecy:sciaganie-drazka-wyciagu-gornego': [
    'Usiądź, zablokuj uda pod wałkami, chwyć drążek szeroko nachwytem.',
    'Lekko odchyl tułów, ściągnij łopatki i przyciągnij drążek do górnej części klatki.',
    'Zatrzymaj się, ściskając plecy.',
    'Puść drążek powoli do pełnego wyprostu rąk.',
  ],
  'plecy:wioslowanie-na-wyciagu-dolnym': [
    'Usiądź, stopy na podestach, kolana lekko ugięte, chwyć uchwyt.',
    'Tułów wyprostowany - przyciągnij uchwyt do brzucha, łokcie blisko ciała.',
    'Ściągnij łopatki na końcu ruchu.',
    'Wróć powoli, prostując ręce, bez kołysania tułowiem.',
  ],
  'plecy:wioslowanie-t-sztanga': [
    'Stań nad gryfem, pochyl tułów, plecy proste, chwyć uchwyt.',
    'Przyciągnij ciężar do klatki, łokcie wzdłuż tułowia.',
    'Ściągnij łopatki na górze.',
    'Opuść powoli, utrzymując pochylenie.',
  ],
  'plecy:hiperekstensje': [
    'Ustaw ławkę rzymską tak, by biodra opierały się o poduszkę, a stopy były zablokowane.',
    'Ręce skrzyżowane na klatce - opuść tułów w dół z prostymi plecami.',
    'Unieś tułów do linii prostej z nogami, bez przeprostu.',
  ],
  'plecy:pullover-na-wyciagu': [
    'Stań przed wyciągiem górnym, chwyć drążek prostymi rękami na wysokości oczu.',
    'Lekko pochyl tułów, łokcie minimalnie ugięte i nieruchome.',
    'Ściągnij drążek łukiem do ud, pracując plecami.',
    'Wróć powoli do góry.',
  ],

  // ---------- Biceps ----------
  'biceps:uginanie-ramion-ze-sztanga': [
    'Stań prosto, chwyć sztangę podchwytem na szerokość barków, ręce wyprostowane.',
    'Łokcie przy tułowiu - ugnij ręce, unosząc sztangę do barków.',
    'Spinaj biceps na górze.',
    'Opuść powoli, nie bujając tułowiem.',
  ],
  'biceps:uginanie-ramion-ze-sztanga-lamana': [
    'Stań prosto, chwyć sztangę łamaną podchwytem na wewnętrznych wygięciach gryfu.',
    'Łokcie przy tułowiu - ugnij ręce do barków.',
    'Spinaj biceps na górze.',
    'Opuść powoli do wyprostu, bez bujania.',
  ],
  'biceps:uginanie-ramion-z-hantlami': [
    'Stań z hantlami wzdłuż tułowia, dłonie zwrócone do przodu.',
    'Ugnij ręce, łokcie nieruchome przy bokach.',
    'Spinaj biceps na górze.',
    'Opuść powoli do wyprostu.',
  ],
  'biceps:uginanie-mlotkowe': [
    'Stań z hantlami, dłonie zwrócone do siebie (chwyt młotkowy).',
    'Ugnij ręce, nie obracając nadgarstków, łokcie przy tułowiu.',
    'Opuść powoli.',
  ],
  'biceps:uginanie-na-modlitewniku': [
    'Usiądź przy modlitewniku, oprzyj ramiona na poduszce, chwyć gryf podchwytem.',
    'Ugnij ręce, unosząc gryf do barków.',
    'Opuść powoli prawie do wyprostu, bez odbijania na dole.',
  ],
  'biceps:uginanie-na-wyciagu': [
    'Stań przed wyciągiem dolnym, chwyć drążek podchwytem.',
    'Łokcie przy tułowiu - ugnij ręce do barków.',
    'Spinaj na górze i opuść powoli.',
  ],
  'biceps:uginanie-koncentryczne': [
    'Usiądź na ławce, łokieć ręki z hantlem oprzyj o wewnętrzną stronę uda.',
    'Ugnij rękę, unosząc hantel do barku.',
    'Opuść powoli; po serii zmień rękę.',
  ],
  'biceps:uginanie-na-lawce-skosnej': [
    'Usiądź na ławce skośnej (ok. 45°), ręce z hantlami opuszczone swobodnie.',
    'Ugnij ręce, łokcie nieruchome.',
    'Opuść powoli do pełnego wyprostu - poczujesz rozciągnięcie bicepsa.',
  ],

  // ---------- Cardio ----------
  'cardio:bieg': [
    'Rozgrzej się kilka minut marszem lub truchtem.',
    'Biegnij wyprostowany, wzrok przed siebie, ramiona luźno, ręce zgięte ok. 90°.',
    'Stawiaj stopy pod biodrami, krótszym krokiem; oddychaj rytmicznie.',
    'Na koniec zwolnij do marszu.',
  ],
  'cardio:bieznia': [
    'Stań na bocznych listwach i uruchom taśmę na niskiej prędkości.',
    'Wejdź na taśmę i zwiększaj tempo stopniowo.',
    'Biegnij na środku taśmy, nie trzymając się poręczy.',
    'Zwolnij przed zatrzymaniem.',
  ],
  'cardio:rower': [
    'Ustaw siodło: przy dolnym położeniu pedału noga jest prawie wyprostowana.',
    'Pedałuj płynnie, plecy proste, łokcie lekko ugięte.',
    'Dobieraj przełożenie tak, by utrzymać równe tempo pedałowania.',
  ],
  'cardio:rower-stacjonarny': [
    'Ustaw wysokość siodła: przy dolnym położeniu pedału noga prawie wyprostowana.',
    'Ustaw opór i pedałuj płynnie, plecy proste.',
    'Utrzymuj równe tempo przez zadany czas.',
  ],
  'cardio:orbitrek': [
    'Stań na pedałach i chwyć ruchome uchwyty.',
    'Poruszaj płynnie nogami i rękami, tułów wyprostowany.',
    'Reguluj opór i tempo; nie opieraj ciężaru ciała na uchwytach.',
  ],
  'cardio:wioslarz': [
    'Usiądź, zapnij stopy, chwyć uchwyt prostymi rękami, kolana ugięte.',
    'Odepchnij się nogami, potem lekko odchyl tułów i przyciągnij uchwyt do brzucha.',
    'Wracaj w odwrotnej kolejności: ręce, tułów, nogi.',
  ],
  'cardio:plywanie': [
    'Rozgrzej się: kilka spokojnych długości basenu.',
    'Utrzymuj ciało poziomo przy powierzchni, głowa w linii tułowia.',
    'Wydychaj powietrze do wody, wdech bierz w rytmie ruchów rąk.',
    'Na koniec przepłyń kilka długości spokojnym tempem.',
  ],
  'cardio:spacer': [
    'Idź wyprostowany, ramiona luźno.',
    'Stawiaj stopę od pięty i odbijaj się palcami.',
    'Utrzymuj tempo, przy którym możesz mówić, ale czujesz wysiłek.',
  ],
  'cardio:skakanka': [
    'Trzymaj uchwyty na wysokości bioder, łokcie przy tułowiu.',
    'Kręć skakanką nadgarstkami, nie całymi rękami.',
    'Skacz nisko na przodzie stóp, lądując miękko.',
  ],
  'cardio:stepper-schody': [
    'Stań prosto, dłonie lekko na poręczach - nie opieraj na nich ciężaru.',
    'Wchodź pełnym krokiem, całą stopą na stopniu.',
    'Utrzymuj równe tempo i wyprostowaną sylwetkę.',
  ],
  'cardio:burpees': [
    'Z pozycji stojącej zrób przysiad i oprzyj dłonie na podłodze.',
    'Wyrzuć nogi do tyłu do podporu przodem (możesz dodać pompkę).',
    'Przyciągnij nogi z powrotem do przysiadu.',
    'Wyskocz w górę z rękami nad głową i wyląduj miękko.',
  ],

  // ---------- Klatka ----------
  'klatka:wyciskanie-sztangi-na-lawce-plaskiej': [
    'Połóż się na ławce, oczy pod gryfem, stopy na podłodze, łopatki ściągnięte.',
    'Chwyć gryf nieco szerzej niż barki i zdejmij go nad klatkę.',
    'Opuść powoli do środka klatki, łokcie ok. 45° od tułowia.',
    'Wyciśnij w górę do wyprostu rąk z wydechem.',
  ],
  'klatka:wyciskanie-sztangi-na-lawce-skosnej': [
    'Ustaw ławkę na 30-45°, połóż się, łopatki ściągnięte.',
    'Zdejmij sztangę nad górną część klatki.',
    'Opuść ją powoli do górnej części klatki.',
    'Wyciśnij do wyprostu rąk.',
  ],
  'klatka:wyciskanie-hantli-na-lawce-plaskiej': [
    'Usiądź z hantlami na udach i połóż się, unosząc je nad klatkę.',
    'Hantle nad barkami, łopatki ściągnięte.',
    'Opuść hantle powoli do boków klatki.',
    'Wyciśnij w górę, zbliżając hantle do siebie.',
  ],
  'klatka:wyciskanie-hantli-na-lawce-skosnej': [
    'Ustaw ławkę na 30-45° i połóż się z hantlami nad klatką.',
    'Łopatki ściągnięte, stopy na podłodze.',
    'Opuść hantle powoli do górnej części klatki.',
    'Wyciśnij w górę.',
  ],
  'klatka:rozpietki-z-hantlami': [
    'Połóż się na ławce, hantle nad klatką, dłonie do siebie, łokcie lekko ugięte.',
    'Rozłóż ręce łukiem na boki, aż poczujesz rozciągnięcie klatki.',
    'Wróć tym samym łukiem, ściskając klatkę - jakbyś obejmował beczkę.',
  ],
  'klatka:krzyzowanie-linek-wyciagu': [
    'Stań między wyciągami górnymi, chwyć uchwyty, zrób krok do przodu i lekko się pochyl.',
    'Łokcie lekko ugięte - sprowadź dłonie łukiem przed siebie w dół.',
    'Ściśnij klatkę, gdy dłonie się spotykają.',
    'Wróć powoli do rozciągnięcia.',
  ],
  'klatka:butterfly-maszyna': [
    'Usiądź, plecy przy oparciu, uchwyty na wysokości klatki.',
    'Złącz ramiona przed sobą, spinając klatkę.',
    'Wróć powoli do rozciągnięcia.',
  ],
  'klatka:wyciskanie-na-maszynie': [
    'Ustaw siedzisko tak, by uchwyty były na wysokości środka klatki.',
    'Wyciśnij uchwyty do przodu do wyprostu rąk.',
    'Wróć powoli, nie odkładając ciężaru.',
  ],
  'klatka:pompki': [
    'Przyjmij podpór przodem, dłonie nieco szerzej niż barki, ciało w jednej linii.',
    'Opuść klatkę prawie do podłogi, łokcie ok. 45° od tułowia.',
    'Wypchnij się do wyprostu rąk, brzuch napięty.',
  ],
  'klatka:pompki-na-poreczach-klatka': [
    'Chwyć poręcze i wyprostuj ręce.',
    'Pochyl tułów do przodu, łokcie lekko na boki.',
    'Opuść się, aż barki będą nieco poniżej łokci.',
    'Wypchnij się w górę.',
  ],

  // ---------- Nogi ----------
  'nogi:przysiad-ze-sztanga': [
    'Ułóż sztangę na górnej części pleców, stopy na szerokość barków, palce lekko na zewnątrz.',
    'Weź wdech, napnij brzuch, zejdź biodrami w dół i do tyłu - kolana w linii stóp.',
    'Zejdź co najmniej do poziomu ud, plecy proste.',
    'Wstań, wypychając podłogę, wydech na górze.',
  ],
  'nogi:przysiad-przedni': [
    'Ułóż sztangę na przedniej części barków, łokcie wysoko.',
    'Tułów wyprostowany - zejdź w przysiad.',
    'Wstań, utrzymując łokcie w górze.',
  ],
  'nogi:przysiad-bulgarski': [
    'Stań tyłem do ławki, jedną stopę połóż na ławce, hantle w dłoniach.',
    'Opuść się na przedniej nodze, aż udo będzie poziomo.',
    'Wypchnij się z pięty przedniej nogi.',
    'Po serii zmień nogę.',
  ],
  'nogi:wypychanie-na-suwnicy': [
    'Usiądź, stopy na platformie na szerokość barków.',
    'Zwolnij blokadę i opuść platformę, aż kolana ugną się do ok. 90°.',
    'Wypchnij platformę piętami, nie blokując kolan na górze.',
    'Po serii załóż blokadę.',
  ],
  'nogi:wykroki': [
    'Stań z hantlami w dłoniach.',
    'Zrób duży krok do przodu i opuść się, aż tylne kolano prawie dotknie podłogi.',
    'Wypchnij się przednią nogą do pozycji wyjściowej.',
    'Zmieniaj nogi.',
  ],
  'nogi:martwy-ciag-rumunski': [
    'Stań z gryfem w dłoniach, kolana lekko ugięte.',
    'Przesuń biodra do tyłu, opuszczając gryf blisko nóg - plecy proste.',
    'Zejdź do wyraźnego rozciągnięcia z tyłu ud (zwykle do połowy piszczeli).',
    'Wróć, wypychając biodra do przodu.',
  ],
  'nogi:prostowanie-nog-na-maszynie': [
    'Usiądź, wałek na dole piszczeli, kolana w osi obrotu maszyny.',
    'Wyprostuj nogi do góry.',
    'Spinaj uda na górze.',
    'Opuść powoli.',
  ],
  'nogi:uginanie-nog-na-maszynie': [
    'Połóż się przodem, wałek nad piętami, kolana tuż za krawędzią ławki.',
    'Ugnij nogi, przyciągając wałek do pośladków.',
    'Opuść powoli, biodra przyciśnięte do ławki.',
  ],
  'nogi:hip-thrust': [
    'Oprzyj łopatki o ławkę, sztangę ułóż na biodrach (z podkładką).',
    'Stopy na szerokość bioder.',
    'Wypchnij biodra w górę do linii prostej, spinając pośladki.',
    'Opuść powoli.',
  ],
  'nogi:wspiecia-na-palce': [
    'Stań przodem stóp na podwyższeniu (maszyna albo stopień).',
    'Opuść pięty w dół, czując rozciągnięcie łydek.',
    'Wspinaj się na palce jak najwyżej.',
    'Zatrzymaj się na chwilę i opuść powoli.',
  ],
  'nogi:przysiad-bez-obciazenia': [
    'Stań, stopy na szerokość barków, ręce przed sobą.',
    'Zejdź biodrami w dół i do tyłu, plecy proste, kolana w linii stóp.',
    'Wstań do wyprostu.',
  ],
  'nogi:krzeselko-przy-scianie': [
    'Oprzyj plecy o ścianę.',
    'Zsuń się, aż uda będą poziomo, a kolana nad kostkami.',
    'Utrzymaj pozycję przez zadany czas.',
  ],
  'nogi:spacer-farmera': [
    'Podnieś ciężkie hantle lub kettle z ziemi jak w martwym ciągu.',
    'Stań prosto, łopatki ściągnięte, brzuch napięty.',
    'Idź krótkimi, szybkimi krokami przez zadany czas.',
    'Odłóż ciężar, kucając z prostymi plecami.',
  ],

  // ---------- Ramiona ----------
  'ramiona:wyciskanie-zolnierskie': [
    'Sztanga na górnej części klatki, chwyt nieco szerszy niż barki.',
    'Napnij brzuch i pośladki, wyciśnij sztangę nad głowę, cofając lekko głowę.',
    'Na górze sztanga nad środkiem stopy, ręce proste.',
    'Opuść powoli do klatki.',
  ],
  'ramiona:wyciskanie-hantli-nad-glowe': [
    'Usiądź na ławce z oparciem, hantle na wysokości barków.',
    'Wyciśnij hantle nad głowę.',
    'Opuść powoli do barków.',
  ],
  'ramiona:arnoldki': [
    'Usiądź, hantle przed sobą na wysokości barków, dłonie zwrócone do siebie.',
    'Wyciskając w górę, obracaj dłonie na zewnątrz.',
    'Na górze dłonie zwrócone do przodu.',
    'Wracaj z odwrotnym obrotem.',
  ],
  'ramiona:wznosy-hantli-bokiem': [
    'Stań z hantlami po bokach, łokcie lekko ugięte.',
    'Unieś ręce bokiem do wysokości barków - prowadzą łokcie.',
    'Opuść powoli, nie bujając tułowiem.',
  ],
  'ramiona:wznosy-hantli-przodem': [
    'Stań z hantlami przed udami.',
    'Unieś hantel przed siebie do wysokości barku, łokieć lekko ugięty.',
    'Opuść powoli; ręce naprzemiennie albo razem.',
  ],
  'ramiona:odwrotne-rozpietki': [
    'Pochyl tułów prawie do poziomu, hantle zwisają pod klatką.',
    'Unieś ręce bokami do linii barków, łokcie lekko ugięte.',
    'Ściągnij łopatki na górze i opuść powoli.',
  ],
  'ramiona:face-pull': [
    'Ustaw linę na wyciągu na wysokości twarzy i chwyć oba końce.',
    'Cofnij się o krok, ręce wyprostowane.',
    'Przyciągnij linę do twarzy, rozchylając dłonie i łokcie na boki.',
    'Wróć powoli.',
  ],
  'ramiona:szrugsy': [
    'Stań ze sztangą w dłoniach, ręce proste.',
    'Unieś barki prosto w górę do uszu - bez krążenia barkami.',
    'Zatrzymaj się na chwilę i opuść powoli.',
  ],
  'ramiona:podciaganie-sztangi-wzdluz-tulowia': [
    'Stań, sztanga przed udami, chwyt na szerokość barków.',
    'Przyciągnij sztangę wzdłuż tułowia do wysokości klatki, łokcie wyżej niż dłonie.',
    'Opuść powoli.',
  ],
  'ramiona:wyciskanie-na-maszynie-barkowej': [
    'Ustaw siedzisko tak, by uchwyty były na wysokości barków.',
    'Wyciśnij uchwyty w górę.',
    'Opuść powoli.',
  ],

  // ---------- Triceps ----------
  'triceps:wyciskanie-francuskie': [
    'Połóż się na ławce, sztangę (najlepiej łamaną) trzymaj nad klatką na prostych rękach.',
    'Ugnij łokcie, opuszczając sztangę w stronę czoła - ramiona nieruchome.',
    'Wyprostuj ręce, wracając do góry.',
  ],
  'triceps:prostowanie-ramion-na-wyciagu': [
    'Stań przed wyciągiem górnym, chwyć drążek, łokcie przy tułowiu.',
    'Wyprostuj ręce w dół.',
    'Wróć powoli do kąta ok. 90° - łokcie przez cały czas nieruchome.',
  ],
  'triceps:prostowanie-ramion-zza-glowy': [
    'Stań lub usiądź, hantel trzymaj oburącz nad głową.',
    'Opuść hantel za głowę, uginając łokcie skierowane w górę.',
    'Wyprostuj ręce.',
  ],
  'triceps:wyciskanie-sztangi-waskim-chwytem': [
    'Połóż się na ławce, chwyć sztangę na szerokość barków.',
    'Opuść ją do dolnej części klatki, łokcie blisko tułowia.',
    'Wyciśnij w górę.',
  ],
  'triceps:prostowanie-ramienia-w-opadzie-kickback': [
    'Pochyl tułów i oprzyj się o ławkę; ramię z hantlem wzdłuż tułowia, łokieć ugięty 90°.',
    'Wyprostuj rękę do tyłu - ramię nieruchome.',
    'Wróć powoli.',
  ],
  'triceps:pompki-na-poreczach-triceps': [
    'Chwyć poręcze i wyprostuj ręce, tułów pionowo.',
    'Opuść się, łokcie do tyłu blisko ciała, do kąta ok. 90°.',
    'Wypchnij się w górę.',
  ],
  'triceps:pompki-diamentowe': [
    'Przyjmij podpór przodem, dłonie blisko siebie pod klatką (kciuki i palce tworzą romb).',
    'Opuść klatkę do dłoni, łokcie przy tułowiu.',
    'Wypchnij się w górę.',
  ],
  'triceps:pompki-w-podporze-tylem': [
    'Usiądź na brzegu ławki, dłonie przy biodrach, zsuń się z ławki.',
    'Ugnij łokcie, opuszczając biodra w dół.',
    'Wyprostuj ręce.',
  ],

  // ---------- Dodane z nieużywanych ćwiczeń FitNotes ----------
  'abs:dragon-flag': [
    'Połóż się na ławce i chwyć ją oburącz za głową.',
    'Unieś całe ciało na łopatkach do pionu - od barków do stóp jedna prosta linia.',
    'Opuszczaj ciało powoli jako sztywną deskę, nie zginając bioder.',
    'Zatrzymaj tuż nad ławką i wróć do góry. Zacznij od samego opuszczania.',
  ],
  'abs:unoszenie-kolan-w-zwisie': [
    'Zawiśnij na drążku nachwytem, ręce proste.',
    'Napnij brzuch i przyciągnij ugięte kolana do klatki, lekko podwijając miednicę.',
    'Opuść nogi powoli, bez bujania.',
  ],
  'plecy:podciaganie-chwytem-neutralnym': [
    'Chwyć uchwyty równoległe (dłonie zwrócone do siebie) i zawiśnij na prostych rękach.',
    'Ściągnij łopatki i podciągnij się, aż broda minie uchwyty.',
    'Opuść się powoli do pełnego wyprostu.',
  ],
  'plecy:wioslowanie-pendlaya': [
    'Stań nad sztangą leżącą na podłodze, pochyl tułów prawie równolegle do podłogi, plecy proste.',
    'Chwyć gryf nachwytem nieco szerzej niż barki.',
    'Dynamicznie przyciągnij sztangę do dolnej części klatki - tułów nieruchomy.',
    'Odłóż sztangę na podłogę i zacznij każde powtórzenie od zera.',
  ],
  'plecy:wioslowanie-na-maszynie': [
    'Usiądź, oprzyj klatkę o poduszkę, chwyć uchwyty.',
    'Przyciągnij uchwyty do siebie, łokcie blisko tułowia, łopatki ściągnij.',
    'Wróć powoli do wyprostu rąk.',
  ],
  'plecy:martwy-ciag-z-podwyzszenia-rack-pull': [
    'Ustaw gryf na hakach lub podestach na wysokości tuż pod lub nad kolanami.',
    'Chwyć gryf, plecy proste, łopatki ściągnięte.',
    'Wyprostuj biodra, prowadząc gryf blisko ud, do pełnego wyprostu.',
    'Opuść gryf kontrolowanie z powrotem na haki.',
  ],
  'plecy:sklony-ze-sztanga-na-karku-good-morning': [
    'Ułóż sztangę na plecach jak do przysiadu, kolana lekko ugięte.',
    'Przesuń biodra do tyłu i pochyl tułów prawie do poziomu - plecy proste.',
    'Wróć do wyprostu, wypychając biodra do przodu. Zacznij od małego ciężaru.',
  ],
  'biceps:uginanie-na-maszynie': [
    'Usiądź, ramiona oparte na poduszce, chwyć uchwyty podchwytem.',
    'Ugnij ręce, przyciągając uchwyty do barków.',
    'Opuść powoli prawie do wyprostu.',
  ],
  'biceps:uginanie-na-modlitewniku-hantlem': [
    'Usiądź przy modlitewniku, oprzyj ramię z hantlem na poduszce.',
    'Ugnij rękę, unosząc hantel do barku.',
    'Opuść powoli prawie do wyprostu; po serii zmień rękę.',
  ],
  'klatka:wyciskanie-sztangi-na-lawce-ujemnej': [
    'Połóż się na ławce ujemnej (głowa niżej), zablokuj nogi.',
    'Zdejmij sztangę nad klatkę, chwyt nieco szerszy niż barki.',
    'Opuść sztangę powoli do dolnej części klatki.',
    'Wyciśnij w górę do wyprostu rąk.',
  ],
  'klatka:rozpietki-na-lawce-skosnej': [
    'Połóż się na ławce skośnej (30-45°), hantle nad klatką, łokcie lekko ugięte.',
    'Rozłóż ręce łukiem na boki do rozciągnięcia górnej części klatki.',
    'Wróć tym samym łukiem, ściskając klatkę.',
  ],
  'klatka:wyciskanie-na-maszynie-na-lawce-skosnej': [
    'Ustaw siedzisko tak, by uchwyty były na wysokości górnej części klatki.',
    'Wyciśnij uchwyty skośnie w górę do wyprostu rąk.',
    'Wróć powoli, nie odkładając ciężaru.',
  ],
  'klatka:wyciskanie-na-maszynie-na-lawce-ujemnej': [
    'Ustaw siedzisko tak, by uchwyty były na wysokości dolnej części klatki.',
    'Wyciśnij uchwyty skośnie w dół do wyprostu rąk.',
    'Wróć powoli, nie odkładając ciężaru.',
  ],
  'nogi:wspiecia-na-palce-w-opadzie-donkey': [
    'Pochyl tułów do poziomu, oprzyj się o maszynę lub ławkę; ciężar na biodrach.',
    'Przód stóp na podwyższeniu - opuść pięty w dół.',
    'Wspinaj się na palce jak najwyżej i opuść powoli.',
  ],
  'nogi:mostek-biodrowy-ze-sztanga': [
    'Połóż się na plecach, sztanga na biodrach (z podkładką), stopy blisko pośladków.',
    'Wypchnij biodra w górę, spinając pośladki, do linii prostej od barków do kolan.',
    'Opuść powoli, nie kładąc bioder całkiem na podłodze.',
  ],
  'nogi:glute-ham-raise': [
    'Ustaw się na ławce GHR: stopy zablokowane, kolana na poduszce, tułów pionowo.',
    'Pochyl się do przodu z prostymi biodrami, prostując kolana.',
    'Wróć do pionu, uginając kolana siłą tylnej części ud.',
  ],
  'nogi:martwy-ciag-sumo': [
    'Stań szeroko, palce na zewnątrz, gryf nad śródstopiem.',
    'Chwyć gryf wąsko, między nogami - plecy proste, biodra nisko.',
    'Wypchnij podłogę nogami, rozpychając kolana na boki, i stań prosto.',
    'Opuść gryf tą samą drogą.',
  ],
  'ramiona:wyciskanie-z-podrzutem-push-press': [
    'Sztanga na górnej części klatki, chwyt nieco szerszy niż barki.',
    'Lekko ugnij kolana, nie przenosząc ciężaru na palce.',
    'Dynamicznie wyprostuj nogi i wykorzystaj ten impuls, by wycisnąć sztangę nad głowę.',
    'Opuść sztangę powoli do klatki.',
  ],
  'ramiona:wyciskanie-sztangi-zza-karku': [
    'Sztanga na karku, chwyt szeroki, tułów wyprostowany.',
    'Wyciśnij sztangę nad głowę do wyprostu rąk.',
    'Opuść powoli do wysokości uszu - tylko na tyle, na ile pozwalają barki.',
  ],
  'ramiona:wznosy-hantli-bokiem-siedzac': [
    'Usiądź na brzegu ławki, hantle po bokach, łokcie lekko ugięte.',
    'Unieś ręce bokiem do wysokości barków.',
    'Opuść powoli - siedząc nie da się oszukiwać bujaniem.',
  ],
  'ramiona:wznosy-bokiem-na-maszynie': [
    'Usiądź w maszynie, ramiona oparte o poduszki po bokach.',
    'Unieś ramiona bokiem do wysokości barków.',
    'Opuść powoli, nie odkładając ciężaru.',
  ],
  'ramiona:odwrotne-rozpietki-na-maszynie': [
    'Usiądź przodem do oparcia maszyny do rozpiętek, chwyć uchwyty na wysokości barków.',
    'Rozłóż ramiona do tyłu łukiem, ściągając łopatki.',
    'Wróć powoli.',
  ],
  'ramiona:wyciskanie-hantla-jednoracz-stojac': [
    'Stań prosto, hantel jedną ręką na wysokości barku, dłoń zwrócona do środka.',
    'Napnij brzuch i wyciśnij hantel nad głowę, bez odchylania tułowia.',
    'Opuść powoli; po serii zmień rękę.',
  ],
  'ramiona:wyciskanie-klody-log-press': [
    'Przetocz kłodę na uda, potem dynamicznie wrzuć ją na klatkę.',
    'Chwyt neutralny, łokcie wysoko, brzuch napięty.',
    'Wyciśnij kłodę nad głowę, cofając lekko głowę.',
    'Opuść kontrolowanie na klatkę, a potem na ziemię.',
  ],
  'ramiona:wyciskanie-nad-glowe-na-maszynie-smitha': [
    'Ustaw ławkę z oparciem pod gryfem maszyny Smitha, gryf na wysokości brody.',
    'Odblokuj gryf i wyciśnij go nad głowę.',
    'Opuść powoli do wysokości brody; po serii zablokuj gryf.',
  ],
  'ramiona:szrugsy-na-maszynie': [
    'Stań w maszynie, chwyć uchwyty, ręce proste.',
    'Unieś barki prosto w górę do uszu.',
    'Zatrzymaj na chwilę i opuść powoli.',
  ],
  'triceps:prostowanie-ramion-zza-glowy-na-wyciagu': [
    'Odwróć się tyłem do wyciągu, linę trzymaj za głową, łokcie skierowane w górę.',
    'Pochyl się lekko i wyprostuj ręce do przodu nad głową.',
    'Wróć powoli - łokcie nieruchome.',
  ],
  'triceps:wyciskanie-francuskie-sztanga-lamana': [
    'Połóż się na ławce, sztangę łamaną trzymaj nad klatką na prostych rękach.',
    'Ugnij łokcie, opuszczając sztangę w stronę czoła - ramiona nieruchome.',
    'Wyprostuj ręce, wracając do góry.',
  ],
  'triceps:dipy-na-kolkach': [
    'Chwyć kółka gimnastyczne i wyprostuj ręce - kółka blisko ciała, nie pozwól im się rozjechać.',
    'Opuść się, łokcie do tyłu, do kąta ok. 90°.',
    'Wypchnij się w górę i na górze obróć dłonie lekko na zewnątrz.',
  ],
  'triceps:wyciskanie-waskim-chwytem-na-maszynie-smitha': [
    'Połóż się na ławce pod gryfem maszyny Smitha, chwyć gryf na szerokość barków.',
    'Odblokuj gryf i opuść go do dolnej części klatki, łokcie blisko tułowia.',
    'Wyciśnij w górę; po serii zablokuj gryf.',
  ],

  // ---------- Własne ćwiczenia z FitNotes ----------
  'abs|brzuszki na ławce skośnej': [
    'Zablokuj stopy na ławce skośnej (głowa niżej niż nogi).',
    'Unieś tułów, zwijając plecy, aż do pionu.',
    'Opuść się powoli.',
  ],
  'abs|brzuszki z kettlebell': [
    'Połóż się na plecach, kettlebell trzymaj oburącz na klatce lub nad nią.',
    'Unieś łopatki, spinając brzuch.',
    'Opuść się powoli.',
  ],
  'abs|nogi do drążka (toes to bar)': [
    'Zawiśnij na drążku nachwytem.',
    'Napnij brzuch i unieś nogi, aż palce dotkną drążka.',
    'Opuść nogi powoli, bez bujania.',
  ],
  'nogi|martwy ciąg na prostych nogach': [
    'Stań z gryfem w dłoniach, nogi prawie proste.',
    'Pochyl się w biodrach, opuszczając gryf wzdłuż nóg - plecy proste.',
    'Wróć do wyprostu.',
  ],
  'nogi|wspięcia na palce siedząc (maszyna)': [
    'Usiądź, wałek na udach przy kolanach, przód stóp na podeście.',
    'Opuść pięty w dół.',
    'Wspinaj się na palce jak najwyżej.',
    'Opuść powoli.',
  ],
  'nogi|wspięcia na palce ze sztangą': [
    'Sztanga na plecach, przód stóp na podwyższeniu.',
    'Opuść pięty w dół.',
    'Wspinaj się na palce jak najwyżej i opuść powoli.',
  ],
  'nogi|uginanie nóg siedząc (maszyna)': [
    'Usiądź, wałek pod łydkami nad piętami, drugi wałek blokuje uda.',
    'Ugnij nogi w dół i do tyłu.',
    'Wróć powoli.',
  ],
  'nogi|uginanie nóg stojąc': [
    'Stań przy maszynie, wałek nad piętą jednej nogi.',
    'Ugnij nogę, przyciągając piętę do pośladka.',
    'Opuść powoli; po serii zmień nogę.',
  ],
  'nogi|wejścia na skrzynię ze sztangą': [
    'Sztanga na plecach, stań przed skrzynią lub ławką.',
    'Postaw całą stopę na skrzyni i wejdź, prostując nogę.',
    'Zejdź tą samą nogą; zmieniaj nogi.',
  ],
  'triceps|prostowanie ramion na wyciągu (lina)': [
    'Chwyć linę na wyciągu górnym, łokcie przy tułowiu.',
    'Wyprostuj ręce w dół, na końcu rozchylając końce liny na boki.',
    'Wróć powoli - łokcie nieruchome.',
  ],
  'triceps|dipy siedząc (maszyna)': [
    'Usiądź i chwyć uchwyty po bokach.',
    'Wyprostuj ręce w dół, łokcie blisko tułowia.',
    'Wróć powoli.',
  ],
  'klatka|pompki na paraletkach': [
    'Ustaw paraletki na szerokość barków, chwyć je i przyjmij podpór przodem.',
    'Opuść klatkę poniżej poziomu dłoni - większy zakres niż w zwykłej pompce.',
    'Wypchnij się w górę.',
  ],
  'ramiona|wznosy y (y raise)': [
    'Połóż się przodem na ławce skośnej albo pochyl tułów; lekkie hantle w dłoniach, kciuki w górę.',
    'Unieś proste ręce w przód i na boki, tworząc literę „Y”.',
    'Ściągnij łopatki na górze i opuść powoli.',
  ],
};

// Te same kroki co ćwiczenie wbudowane - zdjęcia mogą być własne (guide-images.js).
const ALIAS = {
  'nogi|wspięcia na palce stojąc (maszyna)': 'nogi:wspiecia-na-palce',
  'nogi|uginanie nóg leżąc (maszyna)': 'nogi:uginanie-nog-na-maszynie',
  'triceps|prostowanie ramion na wyciągu (drążek v)': 'triceps:prostowanie-ramion-na-wyciagu',
};

function keysFor(ex) {
  const keys = [ex.id, `${ex.category}|${ex.name.toLowerCase()}`];
  const base = baseName(ex);
  if (base !== ex.name) {
    const original = DEFAULT_EXERCISES.find((e) => e.category === ex.category && e.name.toLowerCase() === base.toLowerCase());
    if (original) keys.push(original.id);
    keys.push(`${ex.category}|${base.toLowerCase()}`);
  }
  return keys;
}

// { steps: [...], images: ['guides/.../0.jpg', 'guides/.../1.jpg'] } albo null.
export function guideFor(ex) {
  for (const k of keysFor(ex)) {
    const steps = STEPS[k] || STEPS[ALIAS[k]];
    if (!steps) continue;
    const img = GUIDE_IMAGES[k] || GUIDE_IMAGES[ALIAS[k]];
    return { steps, images: img ? [`guides/${img}/0.jpg`, `guides/${img}/1.jpg`] : [] };
  }
  return null;
}

// Do testów: klucze opisów i zdjęć muszą do siebie pasować.
export const GUIDE_KEYS = { steps: Object.keys(STEPS), alias: ALIAS };
