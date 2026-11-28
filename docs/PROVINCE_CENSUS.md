# Historical Province Census & 1.0 Plan (HP1 #147)

Ledger: `B61`, `B47` · Source data: `data/provinces/census.csv` (2,164 historical first-level units, 1836–1936) and `data/provinces/plan.csv` (400 playable 1.0 provinces).

## 1. Purpose and owner decision (B61)

1. **Historical census (`data/provinces/census.csv`):** Inventories first-level administrative units for every 1836 state and major border/reorganisation changes through 1936 (French *départements*, Prussian *Regierungsbezirke*, Russian *guberniyas* and *oblasts*, Ottoman *eyalets* and *vilayets*, Republic of Turkey provinces, US states and territories, Habsburg crown lands and post-1918 successors, British Indian districts and salute princely states, Qing/ROC provinces, Tokugawa *han* domains and 47 Meiji prefectures, and Latin American provinces/departments).
2. **Playable 1.0 province plan (`data/provinces/plan.csv`):** Following the owner's 28 November 2026 decision (`B61`), version 1.0 groups those historical units into **400 provinces** (target range 350–450, up from 184) so historical borders and war goals hold without micro-slivers that cannot be tapped on a phone screen.

## 2. Rule for colonies and unadministered land

- **Overseas colonies (1836–1936):** Pre-1884 coastal colonies with formal local districts/residencies (e.g. British India, Cape Colony, New South Wales, French Algeria, Dutch East Indies, Cuba, Philippines) use their own first-level units in `census.csv`. Post-1884 Scramble territories without dense internal division lists are counted at their colonial-federation or protectorate level (French West Africa, French Equatorial Africa, Belgian Congo, British East/West/Central Africa, German African colonies, Italian East Africa).
- **Unadministered land (1836):** Stateless or sparsely governed frontier zones (`Sahara`, `Libyan Desert`, `Empty Quarter`, `Kalahari`, `Australian Outback`, `Amazonia`, `Patagonia`, `Great Plains`, `Rupert's Land`, `Canadian Arctic`, `Oregon Country`, `Greenland`, `Siberian North`, `Borneo`, `Malaya`, `New Zealand` pre-1840) are kept as broad historical geographic regions (1 row per macro-zone) rather than fragmented.
- **British India micro-estates:** Direct British provinces (228 non-Burma districts + 37 Burma districts) and **all 118 salute princely states** (plus Burma Shan salute states) are listed individually; ~445 minor non-salute agency talukas/estates (Kathiawar, Gujarat, Simla Hills, Eastern States) are grouped under one explicit agency rule row.

## 3. Totals for 1.0 Playable Plan (`data/provinces/plan.csv`)

| Region | Current (184) | Planned 1.0 (B61) | Direct tap (>=44 px) | Flagged for search |
|---|---:|---:|---:|---:|
| Europe | 54 | **150** | 80 | 70 |
| Ottoman lands and the Middle East | 17 | **45** | 39 | 6 |
| South Asia | 13 | **50** | 48 | 2 |
| East and South-East Asia | 31 | **55** | 53 | 2 |
| Americas | 38 | **60** | 57 | 3 |
| Africa | 25 | **25** | 25 | 0 |
| Russia in Asia and Central Asia | 6 | **15** | 15 | 0 |
| **Total** | **184** | **400** | **317** | **83** |

### Hero nations (1836 snapshot)

| Hero nation (1836 tag) | Current provinces | Planned 1.0 provinces | Direct tap | Flagged for search | Notes |
|---|---:|---:|---:|---:|---|
| Britain (`GBR`) | 17 | **60** | 46 | 14 | 13 British Isles, 38 India/Ceylon (incl. Cis-Sutlej), 4 Canada (incl. Rupert's Land, company rule), 1 Malaya & Singapore, 2 Australia, 1 West Indies, 1 Cape Colony |
| Ottoman Empire (`OTT`) | 9 | **26** | 20 | 6 | 10 Balkans, 11 Anatolia & Cyprus, 4 Mesopotamia/Diyarbekir, 1 Tripolitania |
| Sikh Empire (`PUN`) | 3 | **8** | 8 | 0 | Lahore, Jullundur, Rawalpindi, Multan, Derajat, Peshawar, Kashmir, Jammu (Cis-Sutlej under GBR per 1809 treaty) |
| Prussia (`PRU`) | 5 | **10** | 10 | 0 | Brandenburg, Prussian Saxony, Pomerania, Posen, East & West Prussia, Lower & Upper Silesia, Westphalia, Rhine Province |
| United States (`USA`) | 6 | **14** | 14 | 0 | 14 states/territories in 1836 (Great Plains, Oregon, Texas, California & New Mexico adjacent) |

## 4. Historical First-Level Unit Census Totals (`data/provinces/census.csv`)

| Parent region | Historical unit rows (1836–1936) | Share of census |
|---|---:|---:|
| Europe | 856 | 39.6% |
| Ottoman lands and the Middle East | 169 | 7.8% |
| South Asia | 355 | 16.4% |
| East and South-East Asia | 499 | 23.1% |
| Americas | 217 | 10.0% |
| Africa | 29 | 1.3% |
| Russia in Asia and Central Asia | 39 | 1.8% |
| **Total** | **2,164** | **100.0%** |

### Totals by state / polity grouping

| State / polity grouping | Parent region(s) | Units listed | Primary span |
|---|---|---:|---|
| Arabia (Nejd, Hejaz, Yemen, Oman, Gulf) | Ottoman lands and the Middle East | 6 | 1836–1936 |
| Argentina | Americas | 15 | 1836–1936 |
| Australia | East and South-East Asia | 9 | 1836–1936 |
| Austrian Empire / Cisleithania | Europe | 17 | 1836–1918 |
| Belgium | Europe | 9 | 1836–1936 |
| Bolivia | Americas | 10 | 1836–1936 |
| British Burma (Province of British India until 1937) | East and South-East Asia | 37 | 1836–1936 |
| British Ceylon | South Asia | 9 | 1836–1936 |
| British India (Assam province) | South Asia | 14 | 1836–1936 |
| British India (Baluchistan Province) | South Asia | 6 | 1836–1936 |
| British India (Bengal Presidency) | South Asia | 28 | 1836–1936 |
| British India (Bihar Province) | South Asia | 16 | 1836–1936 |
| British India (Bombay Presidency) | South Asia | 21 | 1836–1936 |
| British India (Central Provinces and Berar) | South Asia | 19 | 1836–1936 |
| British India (Chief Commissioner's Provinces) | South Asia | 4 | 1836–1936 |
| British India (Madras Presidency) | South Asia | 23 | 1836–1936 |
| British India (Non-Salute Princely Estates) | South Asia | 1 | 1836–1936 |
| British India (North-West Frontier province) | South Asia | 6 | 1836–1936 |
| British India (Orissa province) | South Asia | 6 | 1836–1936 |
| British India (Punjab province) | South Asia | 29 | 1836–1936 |
| British India (Salute Princely States) | South Asia | 101 | 1836–1936 |
| British India (Sind province) | South Asia | 8 | 1836–1936 |
| British India (United Provinces) | South Asia | 52 | 1836–1936 |
| British Malaya & Borneo | East and South-East Asia | 4 | 1836–1936 |
| British Mediterranean Territories | Europe | 3 | 1836–1936 |
| British North America / Canada | Americas | 11 | 1836–1936 |
| Central America & Caribbean | Americas | 10 | 1836–1936 |
| Central Asian Khanates | Russia in Asia and Central Asia | 3 | 1836–1920 |
| Chile | Americas | 9 | 1836–1936 |
| Colonial Africa (1884–1936 Partition Rule) | Africa | 8 | 1836–1936 |
| Czechoslovakia | Europe | 4 | 1918–1936 |
| Denmark | Europe | 23 | 1836–1936 |
| Duchies of Parma & Modena | Europe | 3 | 1836–1859 |
| Dutch East Indies | East and South-East Asia | 4 | 1836–1936 |
| Ecuador | Americas | 9 | 1836–1936 |
| Egypt & Sudan | Africa | 4 | 1836–1936 |
| Electorate of Hesse | Europe | 4 | 1836–1866 |
| Emirate / Kingdom of Afghanistan | Ottoman lands and the Middle East | 7 | 1836–1936 |
| Empire / Republic of Brazil | Americas | 21 | 1836–1936 |
| Empire of Japan (47 Prefectures & Colonies) | East and South-East Asia | 51 | 1871–1936 |
| Estonia, Latvia & Lithuania | Europe | 3 | 1918–1936 |
| France | Europe | 91 | 1836–1936 |
| German Confederation (Minor Sovereign States) | Europe | 27 | 1836–1866 |
| German Empire | Europe | 1 | 1871–1918 |
| Grand Duchy of Baden | Europe | 4 | 1836–1864 |
| Grand Duchy of Hesse | Europe | 3 | 1836–1936 |
| Grand Duchy of Tuscany | Europe | 7 | 1836–1860 |
| Hungary (Post-Trianon 25 Counties) | Europe | 25 | 1920–1936 |
| Irish Free State | Europe | 26 | 1922–1936 |
| Joseon Korea (Eight Provinces) | East and South-East Asia | 8 | 1836–1896 |
| Kingdom of Bavaria | Europe | 8 | 1836–1936 |
| Kingdom of Greece | Europe | 14 | 1836–1936 |
| Kingdom of Hanover | Europe | 6 | 1836–1866 |
| Kingdom of Italy (Grouped Compartimenti; 59–94 Provinces) | Europe | 18 | 1861–1936 |
| Kingdom of Lombardy–Venetia (Austria) | Europe | 2 | 1836–1866 |
| Kingdom of Nepal | South Asia | 1 | 1836–1936 |
| Kingdom of Prussia | Europe | 38 | 1836–1936 |
| Kingdom of Sardinia | Europe | 10 | 1836–1859 |
| Kingdom of Saxony | Europe | 5 | 1836–1936 |
| Kingdom of Württemberg | Europe | 4 | 1836–1924 |
| Kingdom of Yugoslavia | Europe | 10 | 1929–1936 |
| Kingdom of the Two Sicilies | Europe | 22 | 1836–1861 |
| Korean Empire / Chōsen (Thirteen Provinces) | East and South-East Asia | 13 | 1896–1936 |
| Lands of the Crown of Saint Stephen (Transleithania) | Europe | 5 | 1836–1918 |
| Luxembourg | Europe | 3 | 1839–1936 |
| Mexico | Americas | 31 | 1836–1936 |
| Netherlands | Europe | 11 | 1836–1936 |
| New Granada / Colombia | Americas | 17 | 1836–1936 |
| New Zealand | East and South-East Asia | 9 | 1853–1936 |
| North Africa (Morocco, Tunis, Algeria, Libya) | Africa | 4 | 1836–1936 |
| Norway | Europe | 20 | 1836–1936 |
| Ottoman Empire (Eyalets) | Ottoman lands and the Middle East | 33 | 1826–1867 |
| Ottoman Empire (Vilayets & Autonomous Units) | Ottoman lands and the Middle East | 37 | 1836–1922 |
| Papal States | Europe | 20 | 1836–1870 |
| Paraguay & Uruguay | Americas | 2 | 1836–1936 |
| Peru | Americas | 11 | 1836–1936 |
| Philippines (Spanish / US) | East and South-East Asia | 8 | 1836–1936 |
| Portugal | Europe | 22 | 1836–1936 |
| Post-Ottoman Mandates (Iraq, Syria, Palestine, Transjordan) | Ottoman lands and the Middle East | 8 | 1920–1936 |
| Principality / Kingdom of Albania | Europe | 10 | 1912–1936 |
| Principality / Kingdom of Bulgaria | Europe | 12 | 1878–1936 |
| Principality / Kingdom of Serbia | Europe | 18 | 1836–1918 |
| Qajar / Pahlavi Persia (Iran) | Ottoman lands and the Middle East | 13 | 1836–1936 |
| Qing Empire (1836–1912) | East and South-East Asia | 26 | 1836–1912 |
| Republic of Austria | Europe | 9 | 1918–1936 |
| Republic of China (1912–1936) | East and South-East Asia | 29 | 1912–1936 |
| Republic of Texas | Americas | 1 | 1836–1845 |
| Republic of Turkey | Ottoman lands and the Middle East | 64 | 1923–1936 |
| Russian Empire (Governorates) | Europe, Russia in Asia and Central Asia | 86 | 1836–1917 |
| Russian Empire (Oblasts) | Europe, Russia in Asia and Central Asia | 38 | 1836–1917 |
| Second Polish Republic | Europe | 17 | 1919–1936 |
| Siam (Thailand) | East and South-East Asia | 18 | 1893–1932 |
| Sikh Empire (1836–1849) | South Asia | 8 | 1836–1849 |
| Sindh (Talpur Amirs to 1843) | South Asia | 3 | 1836–1843 |
| Southern Africa | Africa | 5 | 1836–1936 |
| Soviet Union (Union Republics) | Europe, Russia in Asia and Central Asia | 10 | 1922–1936 |
| Spain | Europe | 49 | 1836–1936 |
| Sweden | Europe | 25 | 1836–1936 |
| Switzerland | Europe | 25 | 1836–1936 |
| Tokugawa Shogunate (Han Domains) | East and South-East Asia | 275 | 1836–1879 |
| Tokugawa Shogunate (Shogunal Demesne) | East and South-East Asia | 1 | 1836–1868 |
| Unadministered Land (Africa) | Africa | 4 | 1836–1900 |
| Unadministered Land (Americas) | Americas | 1 | 1836–1884 |
| Unadministered Land (East & SE Asia) | East and South-East Asia | 2 | 1836–1874 |
| Unadministered Land (Middle East) | Ottoman lands and the Middle East | 1 | 1836–1932 |
| Unadministered Land (Russia in Asia) | Russia in Asia and Central Asia | 1 | 1836–1922 |
| United Kingdom (England) | Europe | 39 | 1836–1936 |
| United Kingdom (Ireland / Northern Ireland) | Europe | 32 | 1836–1936 |
| United Kingdom (Scotland) | Europe | 33 | 1836–1936 |
| United Kingdom (Wales) | Europe | 13 | 1836–1936 |
| United States (States) | Americas | 48 | 1836–1936 |
| United States (Territories) | Americas | 8 | 1836–1936 |
| Venezuela | Americas | 13 | 1836–1936 |
| Wallachia, Moldavia & Romania | Europe | 7 | 1836–1936 |
| West & Central African Polities | Africa | 4 | 1836–1936 |
| Đại Nam / French Indochina | East and South-East Asia | 5 | 1836–1936 |

## Owner review, 28 Nov 2026

Approved with three fixes (review on PR #181): Kamchatka & Siberian North owner RUS; Malaya & Singapore owner GBR (Straits Settlements from 1826); Rupert's Land owner GBR (Hudson's Bay Company rule). Unowned provinces at 1836: 20.
