# metro

Interactive 3D layout viewer of Hong Kong MTR stations, built with Three.js.

Schematic multi-level models with concourses, exits, gates, escalators,
rideable lifts, animated passengers, trains on live timetables, and a
procedural Hong Kong skyline around each station.

## Stations

| Code | Station | Lines |
|------|---------|-------|
| KET  | Kennedy Town 堅尼地城 | Island Line (west terminus) |
| HKU  | HKU 香港大學 | Island Line |
| SYP  | Sai Ying Pun 西營盤 | Island Line |
| SHW  | Sheung Wan 上環 | Island Line |
| CEN  | Central 中環 | Island + Tsuen Wan Lines |
| ADM  | Admiralty 金鐘 | Island + Tsuen Wan + East Rail + South Island Lines |
| WAC  | Wan Chai 灣仔 | Island Line |
| CAB  | Causeway Bay 銅鑼灣 | Island Line |
| TIH  | Tin Hau 天后 | Island Line |
| FOH  | Fortress Hill 炮台山 | Island Line |
| NOP  | North Point 北角 | Island + Tseung Kwan O Lines |
| QUB  | Quarry Bay 鰂魚涌 | Island + Tseung Kwan O Lines |
| TAK  | Tai Koo 太古 | Island Line |
| SWH  | Sai Wan Ho 西灣河 | Island Line |
| SKW  | Shau Kei Wan 筲箕灣 | Island Line |
| HFC  | Heng Fa Chuen 杏花邨 | Island Line |
| CHW  | Chai Wan 柴灣 | Island Line (east terminus) |
| TST  | Tsim Sha Tsui 尖沙咀 | Tsuen Wan Line (across the harbour) |
| JOR  | Jordan 佐敦 | Tsuen Wan Line |
| YMT  | Yau Ma Tei 油麻地 | Tsuen Wan + Kwun Tong Lines |
| MOK  | Mong Kok 旺角 | Tsuen Wan + Kwun Tong Lines (cross-platform interchange) |
| PRE  | Prince Edward 太子 | Tsuen Wan + Kwun Tong Lines (mirrored cross-platform) |
| SSP  | Sham Shui Po 深水埗 | Tsuen Wan Line |
| CSW  | Cheung Sha Wan 長沙灣 | Tsuen Wan Line |
| LCK  | Lai Chi Kok 荔枝角 | Tsuen Wan Line |
| MEF  | Mei Foo 美孚 | Tsuen Wan + Tuen Ma Lines (split-site interchange, L1 subway link) |
| LAK  | Lai King 荔景 | Tsuen Wan + Tung Chung Lines (stacked cross-platform pair) |
| KWF  | Kwai Fong 葵芳 | Tsuen Wan Line (elevated side platforms, Metroplaza footbridge) |
| KWH  | Kwai Hing 葵興 | Tsuen Wan Line (elevated side platforms, Kowloon Commerce Centre footbridge) |
| TWH  | Tai Wo Hau 大窩口 | Tsuen Wan Line (underground island, lime green) |
| TSW  | Tsuen Wan 荃灣 | Tsuen Wan Line (north terminus; at-grade side platforms, U1 gallery concourse) |
| HOK  | Hong Kong 香港 | Tung Chung Line + Airport Express |
| KOW  | Kowloon 九龍 | Tung Chung Line + Airport Express (stacked islands under Elements/Union Square) |
| OLY  | Olympic 奧運 | Tung Chung Line (at-grade side platforms, U1 gallery concourse) |
| OCP  | Ocean Park 海洋公園 | South Island Line (elevated side platforms, park entrance) |
| WCH  | Wong Chuk Hang 黃竹坑 | South Island Line (elevated side platforms, depot alongside) |
| LET  | Lei Tung 利東 | South Island Line (underground island beneath Ap Lei Chau) |
| SOH  | South Horizons 海怡半島 | South Island Line (south terminus; elevated side platforms) |
| EXC  | Exhibition Centre 會展 | East Rail Line (underground island, Wan Chai North reclamation) |
| HUH  | Hung Hom 紅磡 | East Rail + Tuen Ma Lines (at-grade EAL sides over the TML island, Coliseum/PolyU) |
| MKE  | Mong Kok East 旺角東 | East Rail Line (at-grade side platforms, Grand Century Place) |
| KOT  | Kowloon Tong 九龍塘 | East Rail + Kwun Tong Lines (at-grade EAL sides over the KTL island) |
| TAW  | Tai Wai 大圍 | East Rail + Tuen Ma Lines (EAL viaduct sides over the L1 TML island) |
| SKM  | Shek Kip Mei 石硤尾 | Kwun Tong Line (underground island) |
| LOF  | Lok Fu 樂富 | Kwun Tong Line (underground island, Lok Fu Plaza) |
| WTS  | Wong Tai Sin 黃大仙 | Kwun Tong Line (underground island, temple at the hill foot) |
| DIH  | Diamond Hill 鑽石山 | Kwun Tong + Tuen Ma Lines (underground islands, Plaza Hollywood) |
| CHH  | Choi Hung 彩虹 | Kwun Tong Line (underground island, rainbow estate) |
| KOB  | Kowloon Bay 九龍灣 | Kwun Tong Line (viaduct side platforms, Telford/depot) |
| NTK  | Ngau Tau Kok 牛頭角 | Kwun Tong Line (viaduct side platforms) |
| KWT  | Kwun Tong 觀塘 | Kwun Tong Line (viaduct side platforms, town centre) |
| LAT  | Lam Tin 藍田 | Kwun Tong Line (hillside cutting, gallery concourse) |
| YAT  | Yau Tong 油塘 | Kwun Tong + Tseung Kwan O Lines (at-grade KTL sides, TKO island below) |
| TKL  | Tiu Keng Leng 調景嶺 | Kwun Tong Line east terminus + Tseung Kwan O Line (TKO island at L1, LOHAS shuttle) |
| HOM  | Ho Man Tin 何文田 | Kwun Tong + Tuen Ma Lines (underground islands on the uplands) |
| WHA  | Whampoa 黃埔 | Kwun Tong Line (west terminus; waterfront side platforms, The Whampoa ship mall) |
| TKW  | Tseung Kwan O 將軍澳 | Tseung Kwan O Line (underground island, PopCorn/Park Central) |
| HAH  | Hang Hau 坑口 | Tseung Kwan O Line (underground island, East Point City) |
| POL  | Po Lam 寶琳 | Tseung Kwan O Line (north terminus; underground island under Metro City) |
| LHP  | LOHAS Park 康城 | Tseung Kwan O Line (branch terminus; at-grade side platforms by the depot) |
| SHS  | Sha Tin 沙田 | East Rail Line (at-grade side platforms, New Town Plaza) |
| FOT  | Fo Tan 火炭 | East Rail Line (at-grade side platforms, Ho Tung Lau depot) |
| UNI  | University 大學 | East Rail Line (at-grade side platforms, CUHK waterfront) |
| TPM  | Tai Po Market 大埔墟 | East Rail Line (at-grade side platforms, market town) |
| TAO  | Tai Wo 太和 | East Rail Line (viaduct side platforms, Tai Wo Estate) |
| FAN  | Fanling 粉嶺 | East Rail Line (at-grade side platforms, Fanling Centre) |
| SHU  | Sheung Shui 上水 | East Rail Line (at-grade side platforms; LMC spur junction) |
| LOW  | Lo Wu 羅湖 | East Rail Line (boundary terminus; frontier control point) |
| LMC  | Lok Ma Chau 落馬洲 | East Rail Line (spur terminus; wetlands, Futian crossing) |
| TSY  | Tsing Yi 青衣 | Tung Chung + Airport Express Lines (TCL sides at grade, AEX island below; Maritime Square) |
| SUN  | Sunny Bay 欣澳 | Tung Chung + Disneyland Resort Lines (open shore interchange, DRL shuttle) |
| TUC  | Tung Chung 東涌 | Tung Chung Line (west terminus; underground island under Citygate) |
| AIR  | Airport 機場 | Airport Express (at-grade side platforms beside Terminal 1) |
| AWE  | AsiaWorld-Expo 博覽館 | Airport Express (west terminus; expo halls) |
| DIS  | Disneyland Resort 迪士尼 | Disneyland Resort Line (terminus; parkland, castle keep) |
| TUM  | Tuen Mun 屯門 | Tuen Ma Line (west terminus; viaduct over V City) |
| SIH  | Siu Hong 兆康 | Tuen Ma Line (viaduct beside the depot) |
| TIS  | Tin Shui Wai 天水圍 | Tuen Ma Line (viaduct, Kingswood slabs) |
| LOP  | Long Ping 朗屏 | Tuen Ma Line (viaduct, Yuen Long edge) |
| YUL  | Yuen Long 元朗 | Tuen Ma Line (viaduct over YOHO Mall) |
| KSR  | Kam Sheung Road 錦上路 | Tuen Ma Line (viaduct, Kam Tin valley) |
| TWW  | Tsuen Wan West 荃灣西 | Tuen Ma Line (underground island, waterfront) |
| NAC  | Nam Cheong 南昌 | Tuen Ma Line (at-grade sides, V·Walk/Cullinan) |
| AUS  | Austin 柯士甸 | Tuen Ma Line (underground island, Xiqu Centre) |
| ETS  | East Tsim Sha Tsui 尖東 | Tuen Ma Line (underground island, TST East) |
| TOS  | To Kwa Wan 土瓜灣 | Tuen Ma Line (underground island, old town) |
| SUW  | Sung Wong Toi 宋皇臺 | Tuen Ma Line (underground island, garden) |
| KAT  | Kai Tak 啟德 | Tuen Ma Line (underground island, AIRSIDE) |
| HIK  | Hin Keng 顯徑 | Tuen Ma Line (underground island, hill saddle) |
| CKT  | Che Kung Temple 車公廟 | Tuen Ma Line (viaduct, Shing Mun bank) |
| STW  | Sha Tin Wai 沙田圍 | Tuen Ma Line (viaduct, estate rows) |
| CIO  | City One 第一城 | Tuen Ma Line (viaduct, mega-estate) |
| SHM  | Shek Mun 石門 | Tuen Ma Line (viaduct, business fringe) |
| TSH  | Tai Shui Hang 大水坑 | Tuen Ma Line (viaduct, foothill) |
| HEO  | Heng On 恆安 | Tuen Ma Line (viaduct, estate edge) |
| MOS  | Ma On Shan 馬鞍山 | Tuen Ma Line (viaduct over MOSTown) |
| WKS  | Wu Kai Sha 烏溪沙 | Tuen Ma Line (east terminus; at-grade, shore) |

The Tuen Ma Line interchanges splice into the existing stations: Hung
Hom (TML island at L2 below the EAL trench), Ho Man Tin and Diamond
Hill (TML islands at L3 below the KTL platforms), Tai Wai (TML island
at L1 below the viaduct concourse), and Mei Foo's TML box was built
with the station.

## Run

```sh
npm install
npm run dev
```

## Controls

- **Orbit**: drag to rotate, scroll to zoom
- **Walk**: WASD + move mouse to look (click captures the cursor, Esc releases)
- **E**: tap Octopus at gates, call/ride lifts
- Section cuts, labels, sound, and passenger toggles in the left panel
