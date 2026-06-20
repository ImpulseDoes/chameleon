# Wymagania – Framework do budowy botów Discord (TypeScript, Bun)

## 0. Kontekst

- **Cel:** open-source biblioteka publikowana na npm.
- **Co już istnieje (poza zakresem tego dokumentu):** REST client, Gateway client, Sharding. Bez voice.
- **Co jest przedmiotem tego dokumentu:** warstwa frameworka budowana NAD istniejącym transportem — store/cache, system eventów, command handling, plugin/middleware, error model, component builders.
- **Runtime:** Bun (patrz pkt 5.1 — to wymaga jawnej decyzji, nie założenia).

---

## 1. Wymagania funkcjonalne (wg priorytetu ustalonego przez Ciebie)

### P0 — Type-safety i codegen

- **FR-1.1:** Typy Discord API (REST payloads, Gateway events, Interaction payloads) generowane automatycznie z oficjalnego źródła (discord-api-docs / OpenAPI spec), nie pisane ręcznie. Build step + CI check, który wykrywa rozjazd między wygenerowanymi typami a aktualną specyfikacją Discorda.
- **FR-1.2:** `Client<TIntents extends readonly Intent[]>` — dostęp do danych zależnych od intentu (np. presence, member list) jest błędem kompilacji, jeśli intent nie został zadeklarowany w generic param przy tworzeniu klienta.
- **FR-1.3:** Eventy Gateway jako discriminated union po polu `t` (typ eventu).
- **Ryzyko do zaadresowania:** generics na poziomie całego klienta (intenty + store + eventy) mogą znacząco spowolnić `tsc`. Wymóg: benchmark czasu kompilacji w CI na repo testowym z ≥50 plikami handlerów, ustalony budżet czasowy (np. cold build < 10s), zanim to się rozrośnie.
- **Rekomendacja architektoniczna (do potwierdzenia):** użyj generycznego `EventEmitter<EventMap>` z przeciążonymi sygnaturami `.on()` zamiast pojedynczego route'a-switcha — patrz P3, to bezpośrednio wpływa na architekturę pluginów.

### P1 — Cache / Store layer

- **FR-2.1:** Płaski POJO store per typ encji (`users`, `guilds`, `channels`, `messages`, `members`, `roles`, `emojis`...).
- **FR-2.2 (brakujące w Twojej specyfikacji, wymagane):** indeksy wtórne dla zapytań relacyjnych, np. `store.indexes.channelsByGuild: Map<Snowflake, Set<Snowflake>>`. Bez tego "kanały tej gildii" to skan O(n) po całym store — nie do zaakceptowania przy dużej skali (po to jest sharding).
- **FR-2.3:** LRU per typ encji, z konfigurowalnym limitem **per-type**, nie globalnym (inny budżet dla `messages` niż dla `guilds`).
- **FR-2.4:** Jawnie zdefiniowany kontrakt leniwych getterów: zwracają `T | undefined` synchronicznie (bez auto-fetch) — i to musi być udokumentowane wprost, bo inaczej userzy założą, że `message.channel` zawsze istnieje.
- **Otwarte pytanie (patrz pkt 5.2):** store wyłącznie in-memory per proces, czy pluggable backend (np. Redis) dla deploymentów multi-proces?

### P2 — Command handling

- **FR-3.1:** Slash commands, prefix commands, context menu commands w jednym, spójnym API rejestracji.
- **FR-3.2:** Typed command builder z inferencją typu argumentów z deklaracji opcji (analogicznie do Typed Modal DSL).
- **FR-3.3:** Bulk vs incremental registration komend z osobnym guardem na rate limit — Discord ma odrębny, bardzo restrykcyjny limit na rejestrację komend (global command creation), inny niż standardowy REST rate limit. Musi być uwzględniony osobno w warstwie rate-limit queue.
- **FR-3.4:** Autocomplete jako osobny, typowany callback, nie wrzucony do generycznego command handlera.

### P3 — Plugin / middleware system

- **Kluczowa decyzja do podjęcia przed implementacją:** czy `client.use()` (middleware) i plugin system to jeden mechanizm, czy dwa osobne? Twoja notatka sugeruje pojedynczy dispatcher ("jeden handler z uniami"), a plugin system z natury wymaga wielu niezależnych subskrybentów tego samego eventu (logger, moderacja, ekonomia rejestrowane niezależnie, w różnych plikach/paczkach). To są sprzeczne wymagania, jeśli nie doprecyzowane.
- **FR-4.1:** Plugin jako jednostka rejestrująca: (a) command handlers, (b) event listeners/middleware, (c) lifecycle hooks (`onLoad` / `onUnload`), (d) własny namespace w store, jeśli potrzebny.
- **FR-4.2:** Kolejność wykonania middleware deterministyczna i konfigurowalna (pole `priority`/`order`).
- **FR-4.3:** Middleware musi móc przerwać propagację (klasyczne `next()`), ale wielu niezależnych listenerów tego samego eventu (różne pluginy) musi działać bez wzajemnej blokady, chyba że świadomie tego chcą.

### P4 — Error handling / resilience

- **FR-5.1:** REST calls zwracają `Result<T, E>` (`{ ok: true, data }` / `{ ok: false, error, message, status, raw? }`), bez throw.
- **FR-5.2 (luka do domknięcia):** rozgraniczenie błędów operacyjnych (np. 403, unknown message — Result) od błędów programistycznych (zły typ argumentu, bug w handlerze). Result-wszędzie bez tego rozróżnienia ułatwia ignorowanie bugów (brak `.ok` checku = silent fail).
- **FR-5.3:** Wyjątek rzucony przez **user-defined handler** (event/command) musi być złapany na granicy dispatchera i wyemitowany jako structured error event — nigdy nie może crashować Gateway connection ani procesu.
- **FR-5.4:** Rate-limit queue z **dynamicznym** odkrywaniem bucket hash z nagłówków (`X-RateLimit-Bucket`), nie statyczną tabelą endpoint→bucket — Discord dzieli buckety między endpointami w sposób nieudokumentowany i zmienny w czasie.
- **FR-5.5:** Obsługa global rate limit (429 ze `scope: global`) jako osobna ścieżka od per-route limitów.
- **FR-5.6 (bezpieczeństwo, nie było w notatce):** tryb `debug: true` musi redagować/maskować token bota i nagłówek `Authorization` w logach. Nigdy nie logować surowych credentiali, nawet w trybie debug.

---

## 2. Components (V1/V2) — potwierdzone ograniczenia API (zweryfikowane na żywo, czerwiec 2026)

- `IS_COMPONENTS_V2` to flaga bitowa `1 << 15` (32768), ustawiana per wiadomość/modal.
- **Po ustawieniu na danej wiadomości nie da się jej cofnąć** — brak downgrade'u do legacy.
- V2 wyklucza jednoczesne użycie `content`, `embeds`, `stickers`, `poll` w tej samej wiadomości.
- Limit komponentów: 40 (V2, zagnieżdżone też się liczą) vs 25 (legacy, max 5 action rows top-level).
- **W modalach:** `Checkbox`, `CheckboxGroup`, `RadioGroup` oraz wszystkie select menu (User/Role/Mentionable/Channel) **muszą być opakowane w komponent `Label` (type 18)** — to wymóg strukturalny pominięty w Twojej notatce. Bez tego payload zostanie odrzucony przez API.
- `FileUpload` w modalach istnieje i jest potwierdzony — przy implementacji zweryfikuj aktualne limity rozmiaru/typu pliku bezpośrednio z dokumentacji w momencie pisania kodu (ta część API zmienia się szybko).

**FR-6.1:** "Unified Components API" musi walidować na etapie budowania payloadu, że nie miesza się semantyki V1-only z V2-only w jednej wiadomości, i musi automatycznie ustawiać flagę. W przeciwnym razie DX będzie gorszy niż gołe payloady Discorda — zamiast type errora dostaniesz runtime 400.

---

## 3. Wymagania niefunkcjonalne

- **NFR-1 (Packaging):** ESM, z mapą `exports` w `package.json`. Do ustalenia: jeden pakiet z subpath importami (`yourlib/cache`, `yourlib/commands`) vs monorepo z osobnymi pakietami — patrz pkt 5.4.
- **NFR-2 (Wersjonowanie):** semver + changesets, automatyczny changelog. Polityka breaking changes wymuszonych przez Discorda (np. nowy komponent, zmiana w intentach) musi być jasno opisana (patch? minor?).
- **NFR-3 (Testy):** testy jednostkowe dla warstwy store (indeksy, LRU eviction), testy kontraktowe dla command buildera (czy generowany payload jest zgodny ze spec Discorda), testy typów (np. `tsd` / `expect-type`) dla generic Client/Intents.
- **NFR-4 (Dokumentacja):** TypeDoc lub równoważne, generowane z JSDoc-first podejścia, które już zakładasz w builderach — to jest spójne, dopilnuj żeby było wymagane w CI (build fails on missing docs dla publicznego API).
- **NFR-5 (Wydajność):** zdefiniowany budżet pamięci na 10k/100k gildii w cache przy domyślnych limitach LRU — bez tego "POJO + LRU dla wydajności" to deklaracja bez miary.
- **NFR-6 (CI):** matrix testów na wspieranych wersjach Bun (i ewentualnie Node, jeśli decyzja z pkt 5.1 pójdzie w tę stronę).

---

## 4. Poza zakresem (potwierdzone)

- Voice (UDP, Opus encoding, encryption).

---

## 5. Otwarte pytania / ryzyka wymagające Twojej decyzji

Nie zgaduję tych punktów — brak odpowiedzi blokuje sensowne napisanie reszty dokumentu/architektury.

1. **Bun-only czy Bun+Node/Deno?** Publikując jako framework do bota na npm, Bun-only zamyka Cię na zdecydowaną większość developerów piszących boty na Node. Świadoma decyzja (np. celowo węższa nisza, wykorzystanie Bun-specific API) czy domyślne założenie, które warto zrewidować?
2. **Store: czysto in-memory czy pluggable backend?** Bez odpowiedzi bot jest ograniczony do jednego procesu — co może kłócić się z tym, że budujesz sharding (sharding zwykle ma sens przy skali, gdzie pojedynczy proces i tak przestaje wystarczać).
3. **Middleware vs plugin system — jeden mechanizm dispatch czy dwa?** Patrz P3. To determinuje całą architekturę rozszerzalności.
4. **Czy "jeden handler z uniami" oznacza realnie jeden punkt wejścia, czy router obsługujący wielu zarejestrowanych słuchaczy z zachowanym narrowing?** To diametralnie różne API publiczne.
5. **Modularny pakiet (osobne `@yourlib/core`, `@yourlib/cache`, `@yourlib/commands`) czy monolityczny z subpath exports?** Wpływa na strategię wersjonowania i na to, czy ktoś może użyć samego REST clienta bez całego frameworka (a "Niezależny klient REST" sugeruje, że tego chcesz).

---

## 6. Co jest mocne i warto zostawić bez zmian

- Result-type zamiast throw dla REST (z zastrzeżeniem FR-5.2).
- Płaski store + leniwe relacje (z zastrzeżeniem FR-2.2 i FR-2.4).
- Compile-time intents (z zastrzeżeniem budżetu czasu kompilacji).
- Dynamiczne odkrywanie rate-limit bucketów zamiast statycznej tabeli — to jest dokładnie to, co odróżnia działającą bibliotekę od takiej, która dostaje API bana po 3 miesiącach produkcji.
- JSDoc-first builders — spójne z wymogiem NFR-4.