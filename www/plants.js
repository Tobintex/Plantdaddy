/* plants.js – Pflanzendatenbank + Gießmodell (klassisches Script, offline, deterministisch)
 * Setzt window.PLANTS und window.computeWater gemäß CONTRACT.md.
 */
(function () {
  "use strict";

  var PLANTS = [
    { id: "monstera", name: "Monstera", latin: "Monstera deliciosa", waterNeed: "medium", lightNeed: "medium", emoji: "🌿", color: "#2f6b3a", shape: "bush", minTempC: 12,
      note: "Gießen, wenn die oberen 2–3 cm Erde trocken sind; hell ohne pralle Mittagssonne stellen." },
    { id: "geigenfeige", name: "Geigenfeige", latin: "Ficus lyrata", waterNeed: "medium", lightNeed: "high", emoji: "🌳", color: "#3b6e2e", shape: "tree", minTempC: 12,
      note: "Sehr hell stellen und den Standort möglichst nicht wechseln, sonst wirft sie Blätter ab." },
    { id: "birkenfeige", name: "Birkenfeige", latin: "Ficus benjamina", waterNeed: "medium", lightNeed: "high", emoji: "🌳", color: "#4f8a3c", shape: "tree", minTempC: 12,
      note: "Hell und zugfrei stellen, Erde gleichmäßig leicht feucht halten, keine Staunässe." },
    { id: "gummibaum", name: "Gummibaum", latin: "Ficus elastica", waterNeed: "medium", lightNeed: "medium", emoji: "🌱", color: "#1f4d2b", shape: "tall", minTempC: 10,
      note: "Erst gießen, wenn die Erde oben angetrocknet ist; Blätter gelegentlich abstauben." },
    { id: "bogenhanf", name: "Bogenhanf (Sansevieria)", latin: "Dracaena trifasciata (syn. Sansevieria trifasciata)", waterNeed: "low", lightNeed: "low", emoji: "🪴", color: "#4f7a3a", shape: "tall", minTempC: 12,
      note: "Erde zwischen den Wassergaben komplett austrocknen lassen; im Winter nur sehr sparsam gießen." },
    { id: "gluecksfeder", name: "Glücksfeder (Zamioculcas)", latin: "Zamioculcas zamiifolia", waterNeed: "low", lightNeed: "low", emoji: "🪴", color: "#2e6b2f", shape: "bush", minTempC: 12,
      note: "Speichert Wasser in den Rhizomen – lieber zu wenig als zu viel gießen." },
    { id: "efeutute", name: "Efeutute", latin: "Epipremnum aureum", waterNeed: "medium", lightNeed: "low", emoji: "🍃", color: "#5c9a3a", shape: "hanging", minTempC: 12,
      note: "Verträgt Halbschatten gut; gießen, wenn die oberste Erdschicht trocken ist." },
    { id: "philodendron", name: "Baumfreund (Philodendron scandens)", latin: "Philodendron hederaceum", waterNeed: "medium", lightNeed: "low", emoji: "🍃", color: "#3d7d34", shape: "hanging", minTempC: 12,
      note: "Hell bis halbschattig ohne direkte Sonne, Erde leicht feucht halten." },
    { id: "gruenlilie", name: "Grünlilie", latin: "Chlorophytum comosum", waterNeed: "medium", lightNeed: "medium", emoji: "🌾", color: "#8fbf5a", shape: "hanging", minTempC: 8,
      note: "Im Sommer reichlich, im Winter mäßig gießen; braune Spitzen deuten auf kalkhaltiges Wasser oder Trockenheit." },
    { id: "einblatt", name: "Einblatt", latin: "Spathiphyllum wallisii", waterNeed: "high", lightNeed: "low", emoji: "🌸", color: "#2b6a3a", shape: "bush", minTempC: 13,
      note: "Erde stets leicht feucht halten; hängende Blätter zeigen Durst an." },
    { id: "calathea", name: "Calathea (Korbmarante)", latin: "Goeppertia spp. (syn. Calathea)", waterNeed: "high", lightNeed: "medium", emoji: "🌿", color: "#4a7d4f", shape: "bush", minTempC: 15,
      note: "Mit kalkarmem, zimmerwarmem Wasser gleichmäßig feucht halten und hohe Luftfeuchte bieten, keine direkte Sonne." },
    { id: "strelitzie", name: "Strelitzie (Paradiesvogelblume)", latin: "Strelitzia reginae", waterNeed: "medium", lightNeed: "high", emoji: "🌴", color: "#4c7a5a", shape: "tall", minTempC: 8,
      note: "Sehr hell bis sonnig stellen; im Sommer reichlich, im Winter sparsamer gießen." },
    { id: "kentia", name: "Kentia-Palme", latin: "Howea forsteriana", waterNeed: "medium", lightNeed: "low", emoji: "🌴", color: "#3a6b3f", shape: "palm", minTempC: 10,
      note: "Verträgt auch hellen Schatten; Erde leicht feucht halten, Staunässe vermeiden." },
    { id: "areca", name: "Goldfruchtpalme (Areca)", latin: "Dypsis lutescens", waterNeed: "high", lightNeed: "medium", emoji: "🌴", color: "#7aa84a", shape: "palm", minTempC: 12,
      note: "Hell ohne Mittagssonne stellen, Erde gleichmäßig feucht halten und öfter besprühen." },
    { id: "yucca", name: "Yucca-Palme", latin: "Yucca elephantipes", waterNeed: "low", lightNeed: "high", emoji: "🌵", color: "#4d7f4a", shape: "tall", minTempC: 5,
      note: "Möglichst sonnig stellen; zwischen den Wassergaben gut abtrocknen lassen." },
    { id: "drachenbaum", name: "Drachenbaum", latin: "Dracaena marginata", waterNeed: "low", lightNeed: "medium", emoji: "🌱", color: "#5b7a3c", shape: "tall", minTempC: 12,
      note: "Hell ohne pralle Sonne; erst gießen, wenn die Erde zur Hälfte abgetrocknet ist." },
    { id: "elefantenfuss", name: "Elefantenfuß", latin: "Beaucarnea recurvata", waterNeed: "low", lightNeed: "high", emoji: "🌴", color: "#6b8f4a", shape: "tall", minTempC: 8,
      note: "Speichert Wasser im verdickten Stamm – sonnig stellen und selten gießen." },
    { id: "aloe", name: "Aloe vera", latin: "Aloe vera", waterNeed: "low", lightNeed: "high", emoji: "🌵", color: "#7fa37a", shape: "succulent", minTempC: 8,
      note: "Sonnig stellen, durchdringend gießen und dann vollständig austrocknen lassen." },
    { id: "echeverie", name: "Echeverie (Sukkulente)", latin: "Echeveria spp.", waterNeed: "low", lightNeed: "high", emoji: "🪷", color: "#8fb3a0", shape: "succulent", minTempC: 5,
      note: "Vollsonnig stellen, nur auf die Erde gießen – Wasser in der Rosette führt zu Fäulnis." },
    { id: "kaktus", name: "Kaktus", latin: "Cactaceae (z. B. Mammillaria)", waterNeed: "low", lightNeed: "high", emoji: "🌵", color: "#5f8f4e", shape: "succulent", minTempC: 5,
      note: "Im Sommer selten, im Winter kühl und fast trocken halten – das fördert die Blüte." },
    { id: "orchidee", name: "Orchidee (Phalaenopsis)", latin: "Phalaenopsis-Hybriden", waterNeed: "medium", lightNeed: "medium", emoji: "🌺", color: "#6c8f4e", shape: "bush", minTempC: 15,
      note: "Etwa wöchentlich 10 Minuten tauchen und gut abtropfen lassen; hell, aber ohne Mittagssonne." },
    { id: "pilea", name: "Ufopflanze (Pilea)", latin: "Pilea peperomioides", waterNeed: "medium", lightNeed: "medium", emoji: "🪙", color: "#6fae4a", shape: "bush", minTempC: 10,
      note: "Hell ohne pralle Sonne; gießen, wenn die obere Erdschicht trocken ist, und regelmäßig drehen." },
    { id: "farn", name: "Schwertfarn (Nephrolepis)", latin: "Nephrolepis exaltata", waterNeed: "high", lightNeed: "medium", emoji: "🌿", color: "#4f9a3f", shape: "hanging", minTempC: 12,
      note: "Ballen nie austrocknen lassen und für hohe Luftfeuchte sorgen; keine direkte Sonne." },
    { id: "schefflera", name: "Strahlenaralie (Schefflera)", latin: "Schefflera arboricola", waterNeed: "medium", lightNeed: "medium", emoji: "🌳", color: "#4a8a3a", shape: "tall", minTempC: 10,
      note: "Hell stellen, mäßig gießen und die Erde zwischendurch antrocknen lassen." },
    { id: "basilikum", name: "Basilikum (Kräuter)", latin: "Ocimum basilicum", waterNeed: "high", lightNeed: "high", emoji: "🌿", color: "#5fae3c", shape: "bush", minTempC: 10,
      note: "Sonnig stellen und täglich prüfen – morgens von unten gießen, Erde nie ganz austrocknen lassen." },
    { id: "olivenbaum", name: "Olivenbaum", latin: "Olea europaea", waterNeed: "medium", lightNeed: "high", emoji: "🫒", color: "#8a9a6b", shape: "tree", minTempC: -5,
      note: "So sonnig wie möglich; obere Erdschicht abtrocknen lassen, im Winter kühl und sparsam gießen." }
  ];

  /* Interne Modellparameter (nicht Teil des Vertrags)
   * Wassermodell (Paket 2): Tagesverbrauch der Pflanze (ml/Tag) aus Wasserbedarf × Blattmasse (Höhe)
   * × Licht × Jahreszeit; je Gießen wird ein Anteil des Erdvolumens gegeben, höchstens so viel, wie die
   * Pflanze in einem sinnvollen Zeitraum verbraucht. Intervall = Wassermenge / Tagesverbrauch. */
  var USE_K = { high: 135, medium: 105, low: 28 };                 // ml/Tag für 50 cm Pflanze, volles Licht, Sommer
  var WATER_FRACTION = { high: 0.15, medium: 0.12, low: 0.09 };   // Anteil des Erdvolumens je Gießen
  // Längster sinnvoller Abstand (Tage) Sommer → Winter; begrenzt die Menge bei großen Töpfen
  var CAP_DAYS = { high: [3, 6], medium: [8, 10], low: [18, 28], xeric: [25, 55] };
  // Pflanzenspezifische Abweichungen: use = Faktor auf Tagesverbrauch
  var OVERRIDE = {
    kaktus:       { use: 0.55, fraction: 0.07, xeric: true },
    echeverie:    { use: 0.6, fraction: 0.07, xeric: true },
    aloe:         { use: 0.7, fraction: 0.07, xeric: true },
    elefantenfuss:{ use: 0.7, fraction: 0.07, xeric: true },
    bogenhanf:    { use: 0.8, xeric: true, cap: "low" },
    gluecksfeder: { use: 0.85, xeric: true, cap: "low" },
    yucca:        { use: 1.3, xeric: true, cap: "low" },
    drachenbaum:  { use: 1.4 },
    gummibaum:    { use: 0.85 },   // ledrige Blätter, verdunstet weniger
    efeutute:     { use: 0.85 },
    philodendron: { use: 0.85 },
    kentia:       { use: 0.85 },
    pilea:        { use: 0.8 },
    gruenlilie:   { use: 1.1 },
    strelitzie:   { use: 1.1 },
    basilikum:    { use: 1.2 },
    olivenbaum:   { use: 0.9 },
    orchidee:     { use: 0.6, dip: true }
  };
  var SUN_SENSITIVE = { calathea: 1, farn: 1, einblatt: 1, efeutute: 1, philodendron: 1, kentia: 1, orchidee: 1, areca: 1 };
  var HUMIDITY_LOVERS = { calathea: 1, farn: 1, einblatt: 1, areca: 1, kentia: 1 };
  var RANK = { low: 0, medium: 1, high: 2 };
  // Lichtstufen (Licht-Index = Richtung × Fensteranteil × Jahreszeit)
  var LIGHT_HIGH = 0.5, LIGHT_MED = 0.06;
  var LIGHT_BRIGHT = 0.25;      // innerhalb "medium": ab hier "hell" statt "halbschattig"
  var NO_WINDOW_SCORE = 0.02;   // Raum ohne Fenster
  var LIGHT_CAP = 1;            // Obergrenze bei mehreren Fenstern (= Pflanze direkt am Südfenster im Juni)
  // Fenster-Standardmaße, falls unbekannt
  var DEF_SILL = 0.9, DEF_TOP = 2.3, DEF_WIDTH = 1.3;
  // minTempC je Pflanze: dauerhaft verträgliche Nachttemperatur draußen (≤ 0 = frosthart)
  // Typische Nachttiefstwerte Hamburg (°C), Jan … Dez
  var HH_NIGHT_LOW = [0, 0, 2, 4, 8, 11, 13, 13, 10, 7, 4, 1];
  var MONTH_NAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  function degC(t) { return (t < 0 ? "−" : "") + Math.abs(t) + " °C"; }
  function isSunMonth(m) { return m >= 3 && m <= 8; } // Apr–Sep: Sonne hoch genug, um Blätter zu verbrennen

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(v, fallback) { if (v === null || v === undefined || v === "") return fallback; v = Number(v); return isFinite(v) ? v : fallback; }
  function de(v, digits) { return v.toFixed(digits == null ? 1 : digits).replace(".", ","); }
  function pct(f) { var p = Math.round((f - 1) * 100); return (p > 0 ? "+" : p < 0 ? "−" : "±") + Math.abs(p) + " %"; }
  function round10(v) { return Math.round(v / 10) * 10; }

  function compassName(deg) {
    var names = ["Nord", "Nordost", "Ost", "Südost", "Süd", "Südwest", "West", "Nordwest"];
    return names[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  }

  /* Balkon/draußen: Licht nach Ausrichtung, stark jahreszeitabhängig (Abstand spielt keine Rolle) */
  function outdoorLightModel(deg, S) {
    deg = (deg == null || !isFinite(Number(deg))) ? 270 : Number(deg);
    var rad = deg * Math.PI / 180;
    var south = (1 - Math.cos(rad)) / 2;
    var dirFactor = 0.7 + 0.3 * south;                 // N 0,7 … W 0,85 … S 1,0
    var seasonLight = 0.75 - 0.25 * S.c;               // Sommer 1,0 · Winter 0,5
    var score = dirFactor * seasonLight;
    var level = score >= 0.55 ? "high" : score >= 0.25 ? "medium" : "low";
    var sunPart;
    if (south >= 0.75) sunPart = "Sonne fast ganztags";
    else if (south < 0.25) sunPart = "ohne direkte Sonne";
    else sunPart = Math.sin(rad) > 0 ? "Morgensonne" : "Nachmittagssonne";
    var label = "draußen, " + sunPart + (S.c > 0.5 ? " (im Winter schwach)" : "");
    return { score: score, level: level, label: label, directSun: south >= 0.25, noWindow: false, south: south, deg: deg, outdoor: true };
  }

  /* Anteil des Fensters, den die Krone "sieht": vertikaler Winkel (Brüstung … Sturz) × horizontaler
   * Winkel (Fensterbreite) im Abstand d; normiert auf eine kleine Pflanze direkt auf der Fensterbank.
   * Dazu ein kleiner Anteil Streulicht aus dem Raum (Wände/Decke), der langsam abnimmt. */
  function viewRaw(d, z, sill, top, w) {
    var th = Math.atan2(top - z, d) - Math.atan2(sill - z, d);
    var ph = 2 * Math.atan2(w / 2, d);
    return Math.max(0, th) * ph;
  }
  function windowShare(d, z, sill, top, w) {
    var ref = viewRaw(0.2, sill + 0.18, sill, top, w);
    var geo = ref > 0 ? viewRaw(Math.max(0.15, d), z, sill, top, w) / ref : 0;
    var bounce = 0.04 * Math.exp(-d / 4);
    return clamp(geo + bounce, 0, 1);
  }

  /* Seitlicher Versatz (Lichtkarte): Punkt liegt um lat m neben der Fenstermitte, d m tief im Raum.
   * Horizontaler Winkel = Fensterbreite aus diesem Blickwinkel, vertikaler Winkel mit dem Abstand zur
   * nächsten Fensterkante. lat = 0/fehlend → exakt windowShare (wie computeWater). */
  function viewRawLat(d, lat, z, sill, top, w) {
    var a = Math.abs(lat);
    var dv = Math.sqrt(d * d + Math.pow(Math.max(0, a - w / 2), 2));
    var th = Math.atan2(top - z, dv) - Math.atan2(sill - z, dv);
    var ph = Math.atan2(a + w / 2, d) - Math.atan2(a - w / 2, d);
    return Math.max(0, th) * ph;
  }
  function windowShareLat(d, lat, z, sill, top, w) {
    if (!lat) return windowShare(d, z, sill, top, w);
    var ref = viewRaw(0.2, sill + 0.18, sill, top, w);
    var geo = ref > 0 ? viewRawLat(Math.max(0.15, d), lat, z, sill, top, w) / ref : 0;
    var bounce = 0.04 * Math.exp(-Math.sqrt(d * d + lat * lat) / 4);
    return clamp(geo + bounce, 0, 1);
  }

  /* Gemeinsamer Kern (computeWater + estimateLight): Richtung × Fensteranteil × Jahreszeit für EIN Fenster */
  function windowLight(deg, dist, lat, geom, S) {
    var rad = deg * Math.PI / 180;
    var south = (1 - Math.cos(rad)) / 2;            // N=0, O/W=0,5, S=1
    var dirFactor = 0.45 + 0.55 * south;              // N 0,45 · W/O 0,73 · S 1,0
    var share = windowShareLat(dist, lat, geom.z, geom.sill, geom.top, geom.width);
    var score = dirFactor * share * S.light;
    // Direkte Sonne nur, wenn die Krone über der Brüstung ist und das Fenster O…S…W schaut
    // (seitlich: nur im Sonnenkegel von ca. 45° neben dem Fenster)
    var directSun = south >= 0.35 && geom.z > geom.sill && dist < 3 && (!lat || Math.abs(lat) < geom.width / 2 + dist);
    return { score: score, directSun: directSun, south: south, dirFactor: dirFactor, share: share, rad: rad };
  }
  function levelOf(score) { return score >= LIGHT_HIGH ? "high" : score >= LIGHT_MED ? "medium" : "low"; }
  function lightLabel(level, score, directSun, south, rad) {
    var sunWord = south >= 0.75 ? "direkte Sonne" : Math.sin(rad) > 0 ? "Morgensonne" : "Abendsonne";
    if (level === "high") return directSun ? (south >= 0.75 ? "sonnig, direkte Sonne" : "hell, " + sunWord) : "sehr hell, ohne direkte Sonne";
    if (level === "medium") return score >= LIGHT_BRIGHT ? (directSun ? "hell, etwas " + sunWord : "hell, ohne direkte Sonne") : "halbschattig";
    return "schattig";
  }

  /* Licht innen: Richtung × Fensteranteil (Geometrie) × Jahreszeit (Lichtmenge) */
  function lightModel(input, geom, S) {
    var deg = input.windowCompassDeg, dist = input.windowDistanceM;
    if (deg == null || dist == null || !isFinite(Number(deg)) || !isFinite(Number(dist))) {
      var sc0 = NO_WINDOW_SCORE;
      return { score: sc0, level: "low", label: "schattig", directSun: false, noWindow: true, share: 0 };
    }
    deg = Number(deg); dist = Math.max(0, Number(dist));
    var wl = windowLight(deg, dist, 0, geom, S);
    var level = levelOf(wl.score);
    var label = lightLabel(level, wl.score, wl.directSun, wl.south, wl.rad);
    return { score: wl.score, level: level, label: label, directSun: wl.directSun, noWindow: false, south: wl.south, dirFactor: wl.dirFactor, share: wl.share, deg: deg, dist: dist };
  }

  /* Jahreszeit Hamburg (53,5° N)
   * c: Kosinus mit Maximum um den 10. Januar (kalt, +1 Winter … −1 Sommer) → Temperatur/Verdunstung
   * light: Tageslichtmenge, Minimum 21. Dez (0,4), Maximum 21. Juni (1,0) */
  function seasonModel(date) {
    var d = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date(2026, 4, 15);
    var start = Date.UTC(d.getFullYear(), 0, 1);
    var doy = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000) + 1;
    var c = Math.cos(2 * Math.PI * (doy - 10) / 365);
    var light = 0.7 + 0.3 * Math.cos(2 * Math.PI * (doy - 172) / 365);
    var m = d.getMonth();
    var name = (m === 11 || m <= 1) ? "Winter" : (m <= 4) ? "Frühjahr" : (m <= 7) ? "Sommer" : (m === 10 ? "Spätherbst" : "Herbst");
    var heating = (m >= 9 || m <= 3); // Okt–Apr Heizperiode
    return { c: c, w: (c + 1) / 2, light: light, name: name, heating: heating, month: m };
  }

  function computeWater(input) {
    input = input || {};
    var plant = null;
    for (var i = 0; i < PLANTS.length; i++) if (PLANTS[i].id === input.plantId) { plant = PLANTS[i]; break; }
    if (!plant) plant = PLANTS[0];
    var ov = OVERRIDE[plant.id] || {};
    var xeric = !!ov.xeric;
    var dip = !!ov.dip;

    var dCm = clamp(num(input.potDiameterCm, 18), 5, 80);
    var hCm = clamp(num(input.plantHeightCm, dCm * 3), 5, 400);
    var hM = hCm / 100;

    // Erdvolumen: Topfhöhe ≈ 0,9 × Ø, leicht konisch (×0,93), zu 80 % gefüllt
    var r = dCm / 2;
    var litres = Math.PI * r * r * (0.9 * dCm) * 0.93 * 0.8 / 1000;

    var outdoor = input.outdoor === true;
    var S = seasonModel(input.date);
    var m = S.month;

    // Fenster- und Standgeometrie
    var sill = clamp(num(input.windowSillM, DEF_SILL), 0, 2.5);
    var top = clamp(num(input.windowTopM, DEF_TOP), 0, 4);
    if (top < sill + 0.3) top = sill + 0.3;
    var width = clamp(num(input.windowWidthM, DEF_WIDTH), 0.3, 6);
    var stand = clamp(num(input.standHeightM, 0), 0, 3);
    var z = stand + 0.9 * dCm / 100 + 0.6 * hM;          // Höhe der Krone über Boden
    var geom = { sill: sill, top: top, width: width, z: z };

    // Licht
    var L = outdoor ? outdoorLightModel(input.windowCompassDeg, S) : lightModel(input, geom, S);
    var lightUse = clamp(0.2 + 0.8 * Math.sqrt(L.score / 0.6), 0.2, 1.15);

    // Steht auf der Fensterbank über dem Heizkörper?
    var dist = num(input.windowDistanceM, null);
    var onSill = !outdoor && !L.noWindow && sill >= 0.3 && Math.abs(stand - sill) <= 0.15 && dist != null && dist <= 0.5;
    var radiator = onSill && S.heating;

    // Jahreszeit (Temperatur/Verdunstung), Sukkulenten mit ausgeprägter Winterruhe
    var seasonUse = xeric ? 1 - 0.7 * S.w : 1 - 0.4 * S.w;      // Sommer 1,0 · Winter 0,6 (Sukkulenten 0,3)

    // Draußen: Sommer Wind + Sonne → häufiger; Winter kaum Verdunstung → viel seltener
    var OUT_F = [1.6, 1.6, 1.2, 0.85, 0.7, 0.7, 0.7, 0.7, 0.85, 1.2, 1.6, 1.6];
    var outdoorF = outdoor ? OUT_F[m] : 1;

    var minT = num(plant.minTempC, 10);
    var hardy = minT <= 0;
    var nightLow = HH_NIGHT_LOW[m];

    // Tagesverbrauch (ml/Tag)
    var hl = Math.max(hM, 0.05);
    var leaf = hl <= 1.5 ? Math.pow(hl / 0.5, 1.5) : Math.pow(3, 1.5) * (hl / 1.5);   // über 1,5 m wächst die Blattmasse nur noch linear
    var baseK = xeric ? USE_K.low : (USE_K[plant.waterNeed] || USE_K.medium);
    var daily = baseK * (ov.use || 1) * leaf * lightUse * seasonUse / outdoorF;
    var heatF = radiator ? 0.8 : 1;
    var dailyEff = Math.max(0.5, daily / heatF);

    // Wassermenge je Gießen: Anteil des Erdvolumens, höchstens Verbrauch über einen sinnvollen Zeitraum
    var fraction = ov.fraction || (xeric ? WATER_FRACTION.low : WATER_FRACTION[plant.waterNeed]) || 0.12;
    var capPair = ov.cap ? CAP_DAYS[ov.cap] : xeric ? CAP_DAYS.xeric : (CAP_DAYS[plant.waterNeed] || CAP_DAYS.medium);
    var capDays = (capPair[0] + (capPair[1] - capPair[0]) * S.w) * heatF;
    var potMl = litres * 1000 * fraction;
    var avail = Math.min(potMl, dailyEff * capDays);
    var maxI = xeric && !ov.cap && S.w > 0.5 ? 60 : 45;
    var intervalDays, ml, method;

    if (dip) {
      // Orchidee: Tauchen statt Gießen – Sommer ~7 Tage, Winter 10–14 Tage
      method = "tauchen";
      intervalDays = Math.max(5, Math.round((7 + 6 * S.w) * heatF));
      ml = Math.max(20, round10(potMl * 0.8));          // Wasser, das das Substrat beim Tauchen aufnimmt (Schätzung)
    } else {
      intervalDays = clamp(Math.round(avail / dailyEff), 1, maxI);
      ml = Math.min(dailyEff * intervalDays, potMl);
      ml = Math.max(20, round10(ml));
    }
    var mlPerWeek = Math.max(10, round10(ml * 7 / intervalDays));
    var potTooBig = !dip && dailyEff * capDays < 0.25 * potMl;

    // Warnungen
    var warnings = [];
    var need = RANK[plant.lightNeed], have = RANK[L.level];
    // Standortbewertung innen nach Sommerlicht: dass es im Winter dunkler ist, ist normal und kein Standortfehler
    var placeScore = (!outdoor && !L.noWindow) ? L.score / S.light : L.score;
    var placeHave = outdoor ? have : RANK[placeScore >= LIGHT_HIGH ? "high" : placeScore >= LIGHT_MED ? "medium" : "low"];
    var ratio = hCm / (dCm * 3);                         // 1 = typisch (Höhe ≈ 3 × Ø)
    if (outdoor) {
      // Kälte zuerst (wichtigste Warnung)
      var coldMonth = (m >= 9 || m <= 3); // Okt–Apr
      if (!hardy && coldMonth && nightLow <= minT + 2) {
        warnings.push("Achtung: Nachts unter " + minT + " °C – bitte reinholen! In Hamburg wird es im " + MONTH_NAME[m] + " nachts ca. " + nightLow + " °C kalt, " + plant.name + " verträgt dauerhaft nicht weniger als " + minT + " °C.");
      } else if (!hardy && nightLow < minT - 2) {
        warnings.push("Nächte noch kühl (Hamburg im " + MONTH_NAME[m] + " ca. " + nightLow + " °C) – " + plant.name + " erst bei Nächten über " + minT + " °C dauerhaft draußen lassen.");
      } else if (hardy && (m === 11 || m <= 1)) {
        warnings.push("Winterschutz: Topf mit Vlies/Jute einpacken und auf Holz oder Styropor stellen; bei strengem Frost unter " + degC(minT) + " hell und kühl reinholen.");
      }
      if (need - have >= 1 && isSunMonth(m)) warnings.push("Balkon ist zu schattig für " + plant.name + " – einen sonnigeren Platz wählen.");
      if (L.directSun && SUN_SENSITIVE[plant.id] && isSunMonth(m)) warnings.push("Direkte Sonne auf dem Balkon kann die Blätter von " + plant.name + " verbrennen – in den Halbschatten stellen.");
      if (m >= 3 && m <= 8) warnings.push("Regen zählt mit: nach Regentagen erst die Erde prüfen, bevor du gießt.");
      else if (hardy || !coldMonth) warnings.push("Draußen im Winter kaum Verdunstung – nur bei trockener Erde und frostfreiem Wetter gießen.");
    } else {
      if (L.noWindow) warnings.push("Kein Fenster im Raum – auf Dauer zu dunkel für fast jede Pflanze, Pflanzenlampe erwägen.");
      if (need - placeHave >= 2) warnings.push("Deutlich zu dunkel für " + plant.name + " – näher ans Fenster oder höher stellen (z. B. auf die Fensterbank).");
      else if (need - placeHave === 1 && !L.noWindow) warnings.push("Etwas zu dunkel für " + plant.name + " – ein hellerer Platz näher am Fenster wäre besser.");
      if (L.directSun && SUN_SENSITIVE[plant.id] && L.score >= 0.3 && isSunMonth(m)) warnings.push("Direkte Sonne kann die Blätter von " + plant.name + " verbrennen – etwas vom Fenster abrücken oder Gardine nutzen.");
      if (plant.id === "olivenbaum" && (m >= 10 || m <= 2)) warnings.push("Tipp: Olivenbaum hell und kühl bei 5–10 °C überwintern (z. B. Treppenhaus) – im warmen Wohnzimmer drohen Blattfall und Schädlinge.");
    }
    if (ratio > 2) warnings.push("Topf wirkt sehr klein für die Pflanzenhöhe – Umtopfen in einen größeren Topf empfohlen.");
    else if (potTooBig || ratio < 0.35) warnings.push("Topf ist sehr groß für die Pflanze – nur ca. " + ml + " ml gießen, sonst bleibt die Erde lange nass (Staunässe, Wurzelfäule).");
    if (!outdoor && S.heating && HUMIDITY_LOVERS[plant.id]) warnings.push("Heizungsluft ist trocken – Blätter besprühen oder Luftbefeuchter nutzen, Erde nicht austrocknen lassen.");

    // Erklärung (3–6 kurze Zeilen)
    var explanation = [];
    if (dip) explanation.push("Topf " + de(dCm, 0) + " cm ≈ " + de(litres, 1) + " l Substrat (Rinde), Pflanze " + de(hCm, 0) + " cm → Orchideen tauchen statt gießen");
    else explanation.push("Topf " + de(dCm, 0) + " cm ≈ " + de(litres, 1) + " l Erde, Pflanze " + de(hCm, 0) + " cm → Verbrauch ≈ " + Math.round(dailyEff) + " ml/Tag");
    if (outdoor) {
      explanation.push("Balkon (" + compassName(L.deg) + "), draußen → " + L.label + " (Licht-Index " + de(L.score, 2) + ")");
    } else if (L.noWindow) {
      explanation.push("Kein Fenster im Raum → wenig Licht (Licht-Index " + de(L.score, 2) + ")");
    } else {
      explanation.push("Standhöhe " + Math.round(stand * 100) + " cm, Fensterbrüstung " + Math.round(sill * 100) + " cm, " + de(L.dist, 1) + " m vom Fenster → Krone sieht " + Math.round(L.share * 100) + " % des Fensters" + (L.directSun ? "" : (z <= sill && L.south >= 0.35 ? " (unter der Brüstung: keine direkte Sonne)" : "")));
      explanation.push(compassName(L.deg) + "-Fenster, " + MONTH_NAME[m] + " (Tageslicht " + Math.round(S.light * 100) + " % vom Juni) → Licht-Index " + de(L.score, 2) + ": " + L.label);
    }
    var sLine = S.name + " in Hamburg: Verbrauch " + pct(seasonUse / outdoorF);
    if (outdoor) sLine += "; draußen im " + MONTH_NAME[m] + (outdoorF < 1 ? " trocknen Sonne und Wind schneller aus" : " kaum Verdunstung") + ", Nachttief ≈ " + nightLow + " °C (" + plant.name + " verträgt " + (hardy ? "bis " + degC(minT) : "mind. " + degC(minT)) + ")";
    explanation.push(sLine);
    if (radiator) explanation.push("Heizkörper unter Fensterbank trocknet Erde schneller (Intervall −20 %)");
    if (dip) {
      explanation.push("Ergebnis: alle " + intervalDays + " Tage tauchen – Topf 10 min in zimmerwarmes Wasser, dann gut abtropfen lassen (nimmt ca. " + ml + " ml auf)");
    } else {
      explanation.push("Ergebnis: " + (intervalDays === 1 ? "täglich" : "alle " + intervalDays + " Tage") + " ca. " + ml + " ml (" + Math.round(ml / litres / 10) + " % des Erdvolumens, ≈ " + mlPerWeek + " ml/Woche)");
    }
    if (explanation.length > 6) explanation.length = 6;

    var result = {
      mlPerWatering: ml,
      intervalDays: intervalDays,
      mlPerWeek: mlPerWeek,
      lightLevel: L.level,
      lightLabel: L.label,
      warnings: warnings,
      explanation: explanation
    };
    if (method) result.method = method;
    return result;
  }

  /* Lichtkarte: Licht an einem Punkt aus allen Fenstern eines Raums (gleiches Modell wie computeWater).
   * input = { windows:[{distanceM, compassDeg, sillM, topM, widthM, lateralM?}], standHeightM, canopyHeightM,
   *           date, outdoor, plantId? }
   * distanceM = Tiefe vor der Fensterebene (mit lateralM) bzw. Abstand zum Fenster (ohne lateralM, wie computeWater).
   * Mehrere Fenster addieren sich (gedeckelt auf LIGHT_CAP).
   * → { index, level, directSun, label, placeIndex, placeLevel, fit? }
   *   placeIndex/-Level: auf Sommerlicht normiert – so bewertet computeWater den Standort (Warnungen).
   *   fit (nur mit plantId): "good" | "dark" | "sunny" | "cold" (draußen) – nach denselben Regeln wie die Warnungen. */
  function estimateLight(input) {
    input = input || {};
    var S = seasonModel(input.date);
    var stand = clamp(num(input.standHeightM, 0), 0, 3);
    var z = clamp(num(input.canopyHeightM, stand + 0.45), 0, 4);
    var wins = Array.isArray(input.windows) ? input.windows : [];
    var res;
    if (input.outdoor === true) {
      var w0 = wins[0] || {};
      var L = outdoorLightModel(w0.compassDeg, S);
      var Lsum = outdoorLightModel(w0.compassDeg, seasonModel(new Date(2026, 5, 21)));
      res = { index: L.score, level: L.level, directSun: L.directSun, label: L.label, placeIndex: Lsum.score, placeLevel: Lsum.level, outdoor: true };
    } else {
      var sum = 0, sun = false, best = null;
      for (var i = 0; i < wins.length; i++) {
        var w = wins[i] || {};
        var deg = num(w.compassDeg, null), dist = num(w.distanceM, null);
        if (deg == null || dist == null) continue;
        var sill = clamp(num(w.sillM, DEF_SILL), 0, 2.5);
        var top = clamp(num(w.topM, DEF_TOP), 0, 4);
        if (top < sill + 0.3) top = sill + 0.3;
        var width = clamp(num(w.widthM, DEF_WIDTH), 0.3, 6);
        var wl = windowLight(deg, Math.max(0, dist), num(w.lateralM, 0), { sill: sill, top: top, width: width, z: z }, S);
        sum += wl.score;
        if (wl.directSun) sun = true;
        if (!best || wl.score > best.score) best = wl;
      }
      if (!best) {
        res = { index: NO_WINDOW_SCORE, level: "low", directSun: false, label: "schattig", noWindow: true };
      } else {
        var idx = Math.min(LIGHT_CAP, sum);
        var lv = levelOf(idx);
        res = { index: idx, level: lv, directSun: sun, label: lightLabel(lv, idx, sun, best.south, best.rad) };
      }
      res.placeIndex = res.noWindow ? res.index : res.index / S.light;
      res.placeLevel = levelOf(res.placeIndex);
    }
    if (input.plantId) {
      var plant = null;
      for (var k = 0; k < PLANTS.length; k++) if (PLANTS[k].id === input.plantId) { plant = PLANTS[k]; break; }
      if (plant) {
        var gap = RANK[plant.lightNeed] - RANK[res.placeLevel];
        var sunny = res.directSun && ((SUN_SENSITIVE[plant.id] && res.placeIndex >= 0.3) || (plant.lightNeed === "low" && res.placeIndex >= LIGHT_HIGH));
        // draußen zu kalt? (gleiche Regel wie die Kälte-Warnungen in computeWater)
        var cold = false;
        if (res.outdoor) {
          var mm = S.month, minT = num(plant.minTempC, 10), nl = HH_NIGHT_LOW[mm];
          cold = minT > 0 && (((mm >= 9 || mm <= 3) && nl <= minT + 2) || nl < minT - 2);
        }
        res.fit = cold ? "cold" : gap >= 1 ? "dark" : sunny ? "sunny" : "good";
      }
    }
    return res;
  }

  window.PLANTS = PLANTS;
  window.computeWater = computeWater;
  window.estimateLight = estimateLight;
  // Licht-Index-Schwellen: < medium schattig · medium…bright halbschattig · bright…high hell · ≥ high sehr hell/sonnig
  window.LIGHT_THRESHOLDS = { medium: LIGHT_MED, bright: LIGHT_BRIGHT, high: LIGHT_HIGH, noWindow: NO_WINDOW_SCORE, cap: LIGHT_CAP };
})();
