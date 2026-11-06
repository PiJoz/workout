// Polityka prywatności: jeden tekst dla okna w aplikacji i dla strony publicznej, której wymaga Google
// (tools/store_assets.py zapisuje z niego store/polityka-prywatnosci.html). Każde zdanie ma być prawdą
// o tej aplikacji: nowe uprawnienie albo wysyłanie danych = zmiana tego tekstu w tym samym commicie.

export const PRIVACY_DATE = '6 listopada 2026';

export const PRIVACY_HTML = `
<p><strong>Workout nie zbiera Twoich danych i niczego nie wysyła autorowi.</strong> Nie ma kont, reklam
ani statystyk użycia.</p>
<h3>Twoje dane</h3>
<p>Treningi, ćwiczenia, gotowe treningi i ustawienia są zapisane tylko na tym urządzeniu. Autor
aplikacji nie ma do nich dostępu.</p>
<h3>Strona aplikacji</h3>
<p>W przeglądarce aplikację podaje serwis GitHub Pages. Przy pobieraniu plików GitHub, jak każdy serwer,
widzi Twój adres IP i obowiązują tu zasady prywatności GitHuba. Treningi nie są tam wysyłane. Po pierwszym
otwarciu aplikacja działa także bez internetu; zdjęcia w instrukcjach pobierają się przy pierwszym
wyświetleniu. Wersja instalowana z pliku APK nie ma uprawnienia dostępu do internetu.</p>
<h3>Pliki</h3>
<p>Pliki (.txt, .csv, .fit) powstają tylko wtedy, gdy sam je utworzysz. Trafiają do folderu Pobrane
albo do aplikacji, którą sam wybierzesz, i od tej chwili obowiązują zasady tej aplikacji lub usługi.</p>
<h3>Kopia zapasowa Androida</h3>
<p>Jeśli używasz wersji APK i masz w telefonie włączoną kopię zapasową, Android może zapisać dane aplikacji
na Twoim koncie Google. To funkcja systemu - autor aplikacji nie ma dostępu do tej kopii.</p>
<h3>Linki</h3>
<p>Niektóre przyciski otwierają inne strony (np. film z ćwiczeniem albo import w Garmin Connect).
Na tych stronach obowiązują ich własne zasady prywatności.</p>
<h3>Uprawnienia</h3>
<p>Aplikacja używa tylko wibracji: krótkiego sygnału przy przytrzymaniu ćwiczenia lub dnia.</p>
<h3>Usuwanie danych</h3>
<p>Odinstalowanie aplikacji albo wyczyszczenie danych witryny w przeglądarce usuwa wszystkie treningi
z urządzenia. Przed usunięciem zrób kopię: Ustawienia, „Eksportuj wszystko”.</p>
<h3>Zdrowie</h3>
<p>Workout to dziennik treningowy. Nie jest wyrobem medycznym i nie diagnozuje, nie leczy ani nie
zapobiega żadnym chorobom. W sprawach zdrowia skonsultuj się z lekarzem, także przed rozpoczęciem
nowego planu treningowego.</p>
<h3>Dzieci</h3>
<p>Aplikacja nie jest przeznaczona dla dzieci.</p>
<h3>Zmiany</h3>
<p>Zmiany tej polityki pojawią się w aplikacji razem z datą poniżej.</p>
<h3>Kontakt</h3>
<p>Pytania i zgłoszenia: github.com/PiJoz/workout/issues.</p>
`;
