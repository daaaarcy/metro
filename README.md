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
| HOK  | Hong Kong 香港 | Tung Chung Line + Airport Express |

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
