// Pflanzen-Wohnung 3D – App (Agent 3)
// Erwartet window.FLOORPLAN, window.PLANTS, window.computeWater (siehe CONTRACT.md).
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import * as PM from './plantModels.js';

const STORAGE_KEY = 'plantflat.v1';
const FP = window.FLOORPLAN;
const PLANTS = Array.isArray(window.PLANTS) ? window.PLANTS : [];
const root = document.getElementById('app') || document.body;

/* ------------------------------------------------------------------ */
/* Styles + DOM                                                        */
/* ------------------------------------------------------------------ */
const CSS = `
:root{
  --bg:#f6eee3; --ink:#22231f; --ink2:#5e605a; --ink3:#8d8f88; --line:#dcd9d2;
  --card:#ffffff; --green:#4f7a5a; --green-d:#3c6247; --green-l:#e3ece4;
  --amber:#a8741a; --amber-l:#fbf1dc; --red:#b5483a; --red-l:#f8e4e0;
  --blue:#2f74d0; --blue-d:#1f55a8; --blue-l:#e4eefb;
  --sat:env(safe-area-inset-top,0px); --sab:env(safe-area-inset-bottom,0px);
  --sal:env(safe-area-inset-left,0px); --sar:env(safe-area-inset-right,0px);
  --shadow:0 6px 24px rgba(40,38,30,.12),0 1px 3px rgba(40,38,30,.08);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:var(--bg);overflow:hidden;overscroll-behavior:none}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink);-webkit-font-smoothing:antialiased;font-size:15px;line-height:1.35;
  user-select:none;-webkit-user-select:none}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
#pf{position:fixed;inset:0;overflow:hidden;overflow:clip;background:#E9DFCE}
/* Leinen-/Papierstruktur: feststehend über den ganzen Bildschirm, hinter der 3D-Szene, ohne Einfluss auf Touch */
#pf::before{content:"";position:fixed;inset:0;pointer-events:none;background:url(textures/linen.png) repeat;background-size:256px 256px;transition:opacity .4s}
#pf.pf-night::before{opacity:.06}
#pf.pf-night{background:radial-gradient(130% 85% at 50% 42%,#3a4656 0%,#2a3442 55%,#1f2833 100%)}
#pf.pf-night .pf-title b{color:#f3e7d3}
#pf.pf-night .pf-title span{color:#a9b6c4}
#pf canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none;outline:none}
.pf-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.pf-room{position:absolute;left:0;top:0;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;
  font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(34,35,31,.62);
  text-shadow:0 0 6px rgba(255,255,255,.9);transition:opacity .2s}
.pf-room small{display:block;font-weight:500;letter-spacing:0;text-transform:none;font-size:10.5px;color:rgba(34,35,31,.45)}
.pf-badge{position:absolute;left:0;top:0;transform:translate(-50%,-100%);background:var(--ink);color:#fff;
  font-size:12px;font-weight:600;padding:5px 9px;border-radius:999px;white-space:nowrap;box-shadow:var(--shadow)}
.pf-badge:after{content:"";position:absolute;left:calc(50% + var(--ax,0px));bottom:-4px;margin-left:-4px;border:4px solid transparent;border-bottom:0;border-top-color:var(--ink)}
.pf-badge.mini{background:rgba(255,255,255,.95);color:var(--ink);font-weight:600;font-size:11.5px;padding:3px 8px 3px 4px;box-shadow:0 1px 5px rgba(0,0,0,.16);
  pointer-events:auto;cursor:pointer;display:none;align-items:center;gap:4px;line-height:16px}
.pf-badge.mini:after{border-top-color:rgba(255,255,255,.95)}
.pf-badge.mini .e{font-size:13px;width:18px;height:18px;border-radius:50%;background:var(--green-l);display:inline-flex;align-items:center;justify-content:center}
.pf-badge.mini .s{color:var(--ink3);font-weight:600}
.pf-badge.mini.due{background:var(--blue);color:#fff}
.pf-badge.mini.due:after{border-top-color:var(--blue)}
.pf-badge.mini.due .e{background:rgba(255,255,255,.22)}
.pf-badge.mini.due .s{color:#dce9ff}
.pf-badge.mini.over{background:var(--blue-d)}
.pf-badge.mini.over:after{border-top-color:var(--blue-d)}
.pf-nonames .pf-badge.mini{padding:3px}
.pf-nonames .pf-badge.mini b,.pf-nonames .pf-badge.mini .s{display:none}
.pf-segs{display:inline-flex;flex:none;background:#efede9;border-radius:999px;padding:3px}
.pf-segs button{height:30px;padding:0 12px;border-radius:999px;font-weight:600;font-size:13px;color:var(--ink2)}
.pf-segs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.14)}
.pf-dist{position:absolute;left:0;top:0;background:rgba(34,35,31,.82);color:#fff;font-size:11.5px;font-weight:700;padding:2px 7px;border-radius:999px;white-space:nowrap;display:none}

.pf-top{position:absolute;left:0;right:0;top:0;padding:calc(var(--sat) + 10px) calc(var(--sar) + 12px) 0 calc(var(--sal) + 12px);
  display:flex;align-items:center;gap:10px;pointer-events:none}
.pf-top > *{pointer-events:auto}
.pf-title{flex:1;min-width:0;pointer-events:none}
.pf-title b{display:block;font-size:15px;font-weight:650;letter-spacing:-.01em}
.pf-title span{display:block;font-size:11.5px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-btn{height:40px;min-width:40px;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.94);
  box-shadow:var(--shadow);display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:600;font-size:14px;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:transform .12s}
.pf-btn:active{transform:scale(.95)}
.pf-btn .cnt.due{background:var(--blue)}
.pf-btn .cnt{background:var(--green);color:#fff;border-radius:999px;min-width:20px;height:20px;font-size:12px;
  display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.pf-compass{width:44px;height:44px;padding:0;border-radius:50%;position:relative}
.pf-compass svg{width:34px;height:34px;transition:transform .08s linear}
.pf-bottom{position:absolute;left:0;right:0;bottom:0;padding:0 calc(var(--sar) + 12px) calc(var(--sab) + 14px) calc(var(--sal) + 12px);
  display:flex;align-items:flex-end;justify-content:space-between;pointer-events:none;transition:opacity .2s,transform .25s}
.pf-bottom > *{pointer-events:auto}
.pf-seg{display:inline-flex;background:rgba(255,255,255,.94);border-radius:999px;padding:4px;box-shadow:var(--shadow)}
.pf-seg button{height:34px;padding:0 14px;border-radius:999px;font-weight:600;font-size:13.5px;color:var(--ink2);transition:background .2s,color .2s}
.pf-seg button.on{background:var(--ink);color:#fff}
.pf-hint{position:absolute;left:50%;bottom:calc(var(--sab) + 72px);transform:translateX(-50%);
  background:rgba(34,35,31,.86);color:#fff;font-size:13.5px;font-weight:500;padding:10px 16px;border-radius:999px;
  white-space:nowrap;pointer-events:none;box-shadow:var(--shadow);transition:opacity .3s, transform .3s;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}
.pf-hint.hide{opacity:0;transform:translateX(-50%) translateY(8px)}
.pf-hint .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#9fd0a8;margin-right:8px;vertical-align:1px;
  animation:pfpulse 1.6s ease-in-out infinite}
@keyframes pfpulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
.pf-banner{position:absolute;left:12px;right:12px;top:calc(var(--sat) + 62px);margin:0 auto;max-width:420px;background:var(--ink);color:#fff;
  border-radius:14px;padding:11px 12px 11px 16px;display:flex;align-items:center;gap:10px;font-size:14px;box-shadow:var(--shadow);
  transition:opacity .2s,transform .2s}
.pf-banner.hide{opacity:0;transform:translateY(-8px);pointer-events:none}
.pf-banner span{flex:1;font-size:13.5px;line-height:1.25}
.pf-banner button{background:rgba(255,255,255,.16);padding:7px 12px;border-radius:999px;font-weight:600;font-size:13px}
.pf-toast{position:absolute;left:50%;top:calc(var(--sat) + 64px);transform:translateX(-50%);background:var(--green-d);color:#fff;
  padding:9px 16px;border-radius:999px;font-size:13.5px;font-weight:600;box-shadow:var(--shadow);transition:opacity .25s,transform .25s;pointer-events:none;white-space:nowrap}
.pf-toast.hide{opacity:0;transform:translateX(-50%) translateY(-6px)}
.pf-toast.act{pointer-events:auto;padding:5px 5px 5px 16px;display:flex;align-items:center;gap:10px}
.pf-toast.act.hide{pointer-events:none}
.pf-toast button{background:rgba(255,255,255,.2);color:#fff;padding:7px 12px;border-radius:999px;font-weight:650;font-size:13px}
.pf-bottom.off{opacity:0;pointer-events:none}
.pf-bottom.off > *{pointer-events:none}

/* sheets */
.pf-scrim{position:absolute;inset:0;background:rgba(30,30,25,.18);opacity:0;pointer-events:none;transition:opacity .25s}
.pf-scrim.show{opacity:1;pointer-events:auto}
.pf-sheet{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:560px;background:var(--card);border-radius:22px 22px 0 0;
  box-shadow:0 -8px 30px rgba(40,38,30,.16);transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.8,.2,1);
  display:flex;flex-direction:column;max-height:calc(100% - var(--sat) - 70px);user-select:auto;-webkit-user-select:auto}
.pf-sheet.open{transform:translateY(0)}
.pf-grab{flex:none;padding:8px 0 2px;display:flex;justify-content:center;touch-action:none}
.pf-grab i{width:38px;height:5px;border-radius:3px;background:var(--line)}
.pf-sheet-body{min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:4px 18px calc(var(--sab) + 18px)}
.pf-head{display:flex;align-items:center;gap:12px;padding:4px 0 12px}
.pf-emoji{width:48px;height:48px;border-radius:14px;background:var(--green-l);display:flex;align-items:center;justify-content:center;font-size:27px;flex:none}
.pf-head h2{margin:0;font-size:19px;font-weight:700;letter-spacing:-.015em;line-height:1.15}
.pf-head p{margin:2px 0 0;color:var(--ink3);font-size:13px;font-style:italic}
.pf-x{margin-left:auto;width:34px;height:34px;border-radius:50%;background:#f1efeb;display:flex;align-items:center;justify-content:center;flex:none;color:var(--ink2)}
.pf-result{background:linear-gradient(160deg,#eef4ee,#e2ece3);border-radius:18px;padding:14px 16px 12px;margin-bottom:6px}
.pf-result .big{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.pf-result .ml{font-size:36px;font-weight:750;letter-spacing:-.03em;color:var(--green-d);line-height:1}
.pf-result .ml small{font-size:20px;font-weight:650;margin-left:2px}
.pf-result .ival{font-size:18px;font-weight:600;color:var(--ink)}
.pf-result .sub{margin-top:6px;font-size:13px;color:var(--ink2);display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.pf-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.75);border-radius:999px;padding:3px 9px;font-size:12.5px;font-weight:600;color:var(--ink2)}
.pf-warn{margin-top:10px;background:var(--amber-l);color:#7a5413;border-radius:12px;padding:9px 11px;font-size:13px;display:flex;gap:8px}
.pf-warn + .pf-warn{margin-top:6px}
.pf-why{margin-top:10px;font-size:13px;color:var(--ink2)}
.pf-why summary{cursor:pointer;font-weight:600;color:var(--green-d);list-style:none;display:inline-flex;align-items:center;gap:4px}
.pf-why summary::-webkit-details-marker{display:none}
.pf-why summary:after{content:"›";display:inline-block;transition:transform .2s;font-size:16px;line-height:1}
.pf-why[open] summary:after{transform:rotate(90deg)}
.pf-why ul{margin:6px 0 0;padding-left:18px}
.pf-why li{margin:2px 0}
.pf-field{padding:9px 0;border-top:1px solid #efede9}
.pf-field label,.pf-field .lbl{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:600;color:var(--ink2);margin-bottom:8px}
.pf-field .val{color:var(--ink);font-weight:700;font-size:14px;font-variant-numeric:tabular-nums}
.pf-select{position:relative}
.pf-select select{width:100%;appearance:none;-webkit-appearance:none;font:inherit;font-size:16px;font-weight:600;color:var(--ink);
  background:#f6f5f2;border:1px solid var(--line);border-radius:12px;padding:11px 38px 11px 12px}
.pf-select:after{content:"";position:absolute;right:14px;top:50%;width:8px;height:8px;border-right:2px solid var(--ink2);border-bottom:2px solid var(--ink2);transform:translateY(-70%) rotate(45deg);pointer-events:none}
.pf-note{margin-top:7px;font-size:12.5px;color:var(--ink3)}
.pf-field label .hint{font-weight:500;color:var(--ink3);margin-left:4px}
.pf-stand{display:flex;gap:6px;margin-bottom:2px}
.pf-stand button{font:inherit;font-size:13px;font-weight:600;color:var(--ink2);background:#f3f1ed;border:1px solid transparent;border-radius:999px;padding:6px 8px;min-height:32px;flex:1 1 auto;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pf-stand button small{font-weight:500;color:var(--ink3);margin-left:3px;font-size:11.5px}
.pf-stand button.on{background:#e2ece3;border-color:var(--green);color:var(--green-d)}
.pf-stand button.on small{color:var(--green-d)}
input[type=range].compact{height:26px}
.pf-result .dip{font-size:30px}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:30px;background:transparent;margin:0}
input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:linear-gradient(to right,var(--green) 0,var(--green) var(--p,50%),#e4e1db var(--p,50%))}
input[type=range]::-moz-range-track{height:6px;border-radius:3px;background:#e4e1db}
input[type=range]::-moz-range-progress{height:6px;border-radius:3px;background:var(--green)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#fff;margin-top:-10px;
  box-shadow:0 1px 4px rgba(0,0,0,.25),0 0 0 1px rgba(0,0,0,.04)}
input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:#fff;border:0;box-shadow:0 1px 4px rgba(0,0,0,.25)}
.pf-info{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:14px;align-items:center}
.pf-info dt{color:var(--ink3);font-size:13px}
.pf-info dd{margin:0;font-weight:600}
.pf-actions{display:flex;gap:8px;padding-top:14px;border-top:1px solid #efede9;margin-top:4px}
.pf-actions.sticky{flex:none;margin:0;padding:10px 16px calc(var(--sab) + 12px);background:var(--card);border-top:1px solid #ecebe6}
#pf-sheet{max-height:min(64%, calc(100% - var(--sat) - 150px))}
#pf-sheet .pf-sheet-body{padding-bottom:6px}
.pf-act{flex:1;min-width:0;height:46px;padding:0 8px;white-space:nowrap;border-radius:14px;font-weight:650;font-size:14px;background:#f1efeb;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:6px;transition:background .2s,color .2s,transform .1s}
.pf-act:active{transform:scale(.97)}
.pf-act.primary{background:var(--green);color:#fff;flex:1.4}
.pf-act.danger{color:var(--red)}
.pf-act.danger.armed{background:var(--red);color:#fff}
.pf-act.ghost{flex:.8}
.pf-list-empty{padding:28px 6px 34px;text-align:center;color:var(--ink3);font-size:14px}
.pf-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid #efede9;width:100%;text-align:left}
.pf-row:first-child{border-top:0}
.pf-row .pf-emoji{width:42px;height:42px;font-size:23px;border-radius:12px}
.pf-row .t{flex:1;min-width:0}
.pf-row .t b{display:block;font-size:15px;font-weight:650}
.pf-row .t span{display:block;font-size:12.5px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-row .w{text-align:right;flex:none}
.pf-row .w b{display:block;font-size:15px;color:var(--green-d);font-weight:700}
.pf-row .w span{display:block;font-size:12px;color:var(--ink2)}
.pf-row .w .warn{color:var(--amber)}
.pf-sum{display:flex;gap:8px;margin:2px 0 10px}
.pf-sum div{flex:1;background:#f6f5f2;border-radius:12px;padding:9px 11px}
.pf-sum b{display:block;font-size:17px;font-weight:700}
.pf-sum span{font-size:12px;color:var(--ink3)}
.pf-settings p{margin:0 0 10px;color:var(--ink2);font-size:13.5px}
.pf-err{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:30px;text-align:center;color:var(--ink2)}

/* kompaktes Pflanzen-Sheet */
#pf-sheet{max-height:min(68%, calc(100% - var(--sat) - 150px))}
#pf-sheet .pf-head{padding:0 0 8px;gap:10px}
#pf-sheet .pf-emoji{width:42px;height:42px;font-size:24px;border-radius:12px}
#pf-sheet .pf-head h2{font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pf-sheet .pf-head p{font-style:normal;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pf-sheet .pf-head p i{font-style:italic}
#pf-sheet .pf-result{padding:11px 14px 10px;margin-bottom:2px}
#pf-sheet .pf-result .ml{font-size:32px}
#pf-sheet .pf-result .sub{margin-top:5px;gap:5px 8px}
#pf-sheet .pf-warn{margin-top:8px;padding:6px 9px;font-size:12.5px;align-items:center}
#pf-sheet .pf-warn span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.pf-due{display:flex;align-items:center;gap:10px;margin-top:9px;padding-top:9px;border-top:1px solid rgba(60,98,71,.14)}
.pf-due .d{flex:1;min-width:0}
.pf-due .d b{display:block;font-size:14.5px;font-weight:700;color:var(--ink)}
.pf-due .d b.due{color:var(--blue)} .pf-due .d b.over{color:var(--red)}
.pf-due .d span{display:block;font-size:12px;color:var(--ink2)}
.pf-water{flex:none;height:40px;padding:0 15px;border-radius:999px;background:var(--blue);color:#fff;font-weight:700;font-size:14.5px;
  display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(47,116,208,.3);transition:transform .1s,background .2s}
.pf-water:active{transform:scale(.96)}
.pf-water.done{background:#fff;color:var(--green-d);box-shadow:none;border:1px solid rgba(60,98,71,.25)}
#pf-sheet .pf-field{padding:7px 0}
.pf-fb{margin-top:9px;padding-top:9px;border-top:1px solid rgba(60,98,71,.14)}
.pf-fb .q{font-size:13px;font-weight:650;color:var(--ink);display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.pf-fb .q small{font-weight:500;color:var(--ink2);font-size:11.5px;white-space:nowrap}
.pf-fb .r{display:flex;gap:6px;margin-top:6px;align-items:center}
.pf-fb .r button{height:34px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.85);font-weight:650;font-size:13px;color:var(--ink2);flex:none}
.pf-fb .r button.ok{background:var(--green);color:#fff}
.pf-fb .r label{flex:1;min-width:0;display:flex;align-items:center;background:#fff;border-radius:999px;padding:0 12px;height:34px;border:1px solid var(--line)}
.pf-fb .r input{flex:1;min-width:0;width:100%;border:0;outline:0;background:none;font:inherit;font-size:15px;font-weight:650;color:var(--ink);user-select:text;-webkit-user-select:text}
.pf-fb .r label span{color:var(--ink3);font-size:13px;font-weight:600}
.pf-chip.adj{background:#fff;color:var(--green-d)}
.pf-why .pf-mini{margin-top:6px;height:30px;padding:0 12px;border-radius:999px;background:#f1efeb;font-weight:650;font-size:12.5px;color:var(--ink2)}
#pf-sheet .pf-field label,#pf-sheet .pf-field .lbl{margin-bottom:5px}
.pf-two{display:grid;grid-template-columns:1.35fr 1fr;gap:8px}
.pf-two select{padding:10px 32px 10px 10px;font-size:15px}
.pf-two .pf-select:after{right:12px}
.pf-input{width:100%;font:inherit;font-size:15px;color:var(--ink);background:#f6f5f2;border:1px solid var(--line);border-radius:12px;padding:10px 10px;min-width:0;user-select:text;-webkit-user-select:text}
.pf-input::placeholder{color:var(--ink3);font-weight:500}
.pf-sl{display:grid;grid-template-columns:118px 1fr;align-items:center;gap:10px}
.pf-sl label{margin:0!important;flex-direction:column;align-items:flex-start!important;gap:0}
.pf-sl label .val{font-size:14px;margin-left:4px}
.pf-sl label .ln{white-space:nowrap}
.pf-sl label .hint{margin:0!important;font-size:11.5px;line-height:1.1}
.pf-sl input[type=range]{height:28px}
#pf-sheet .pf-stand button{min-height:30px;padding:5px 6px}
#pf-sheet .pf-why{margin:6px 0 2px}
#pf-sheet .pf-why .pf-note{margin-top:6px}
#pf-sheet .pf-why .pf-warn{white-space:normal}

/* Liste „Heute gießen“ */
.pf-grp{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 2px;padding:6px 0}
.pf-grp h3{margin:0;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink2)}
.pf-grp h3.due{color:var(--blue)}
.pf-grp button{height:32px;padding:0 12px;border-radius:999px;background:var(--blue);color:#fff;font-weight:700;font-size:13px;flex:none}
.pf-lrow{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #efede9}
.pf-lrow .open{flex:1;min-width:0;display:flex;align-items:center;gap:11px;text-align:left}
.pf-lrow .pf-emoji{width:42px;height:42px;font-size:23px;border-radius:12px}
.pf-lrow .t{flex:1;min-width:0}
.pf-lrow .t b{display:block;font-size:15px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-lrow .t b small{font-weight:500;color:var(--ink3);font-size:12.5px;margin-left:4px}
.pf-lrow .t span{display:block;font-size:12.5px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-lrow .t .wn{color:var(--amber)}
.pf-lrow .w{text-align:right;flex:none}
.pf-lrow .w b{display:block;font-size:15px;color:var(--green-d);font-weight:700}
.pf-lrow .w span{display:block;font-size:12px;color:var(--ink2);font-weight:600}
.pf-lrow .w span.due{color:var(--blue)} .pf-lrow .w span.over{color:var(--red)}
.pf-ck{flex:none;width:40px;height:40px;border-radius:50%;border:1.5px solid var(--line);color:var(--ink3);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800}
.pf-ck.due{background:var(--blue);border-color:var(--blue);color:#fff}

/* Erinnerung */
.pf-hbtn{width:34px;height:34px;border-radius:50%;background:#f1efeb;display:flex;align-items:center;justify-content:center;flex:none;color:var(--ink2)}
.pf-hbtn.on{background:var(--green-l);color:var(--green-d)}
.pf-hbtn + .pf-x{margin-left:6px}
.pf-head .pf-hbtn{margin-left:auto}
.pf-rlink{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 0;border-top:1px solid #efede9}
.pf-rlink .ic{width:36px;height:36px;border-radius:11px;background:var(--green-l);color:var(--green-d);display:flex;align-items:center;justify-content:center;flex:none}
.pf-rlink .t{flex:1;min-width:0}
.pf-rlink .t b{display:block;font-size:15px;font-weight:650}
.pf-rlink .t span{display:block;font-size:12.5px;color:var(--ink3)}
.pf-rlink:after{content:"›";font-size:22px;color:var(--ink3);line-height:1}
.pf-tg{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0}
.pf-tg b{font-size:15px;font-weight:650}
.pf-switch{flex:none;width:52px;height:32px;border-radius:999px;background:#d9d6cf;position:relative;transition:background .2s}
.pf-switch:after{content:"";position:absolute;left:3px;top:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}
.pf-switch[aria-checked=true]{background:var(--green)}
.pf-switch[aria-checked=true]:after{transform:translateX(20px)}
.pf-time{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.pf-time > span{font-weight:700;font-size:18px;color:var(--ink2)}
.pf-time.off{opacity:.45}
.pf-rmsg{margin:8px 0 0;padding:9px 11px;border-radius:12px;font-size:13px;background:#f6f5f2;color:var(--ink2)}
.pf-rmsg.err{background:var(--red-l);color:#8a3328}
.pf-rmsg.ok{background:var(--green-l);color:var(--green-d)}
.pf-rmsg:empty{display:none}
.pf-rnote{margin:10px 0 0;font-size:12.5px;color:var(--ink3)}
.pf-dbn{position:absolute;left:12px;right:12px;top:calc(var(--sat) + 62px);margin:0 auto;max-width:420px;background:var(--blue);color:#fff;
  border-radius:14px;padding:6px 6px 6px 14px;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;box-shadow:var(--shadow);
  transition:opacity .25s,transform .25s}
.pf-dbn.hide{opacity:0;transform:translateY(-8px);pointer-events:none}
.pf-dbn span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-dbn #pf-dbn-go{background:rgba(255,255,255,.2);padding:7px 12px;border-radius:999px;font-weight:700;font-size:13px;flex:none}
.pf-dbn #pf-dbn-x{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;color:#dce9ff}
/* Lichtkarte */
.pf-bl{display:flex;align-items:center;gap:8px}
.pf-lbtn{height:42px;padding:0 14px 0 12px;gap:6px;font-size:13.5px}
.pf-lbtn svg{width:16px;height:16px}
.pf-lbtn.on{background:var(--ink);color:#fff}
.pf-lp{position:absolute;left:12px;right:12px;bottom:calc(var(--sab) + 66px);margin:0 auto;max-width:420px;background:rgba(255,255,255,.96);
  border-radius:16px;box-shadow:var(--shadow);padding:8px 10px 7px;display:flex;flex-direction:column;gap:6px;
  transition:opacity .2s,transform .2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.pf-lp.hide,.pf-bb.hide{opacity:0;transform:translateY(8px);pointer-events:none}
.pf-lr{display:flex;align-items:center;gap:8px}
.pf-sbtn{width:42px;height:42px;padding:0;justify-content:center}
.pf-sbtn svg{width:20px;height:20px}
.pf-sbtn.on{background:#e9a43c;color:#fff}
.pf-sp .tm{display:flex;align-items:center;gap:8px}
.pf-sp .tm b{font-size:20px;font-weight:750;font-variant-numeric:tabular-nums;min-width:56px}
.pf-sp .tm span{flex:1;font-size:12px;color:var(--ink2);line-height:1.3}
.pf-sp .tm button{width:36px;height:36px;border-radius:50%;background:#f1efeb;font-size:15px;flex:none}
.pf-sp .tm button.on{background:var(--ink);color:#fff}
.pf-sp input[type=range]{width:100%;accent-color:#e9a43c;margin:2px 0}
.pf-vig{display:none}
.pf-lr > span{flex:none;width:46px;font-size:10.5px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em}
.pf-ms{flex:1;display:flex;background:#f1efeb;border-radius:999px;padding:3px;min-width:0}
.pf-ms button{flex:1 1 0;min-width:0;height:28px;border-radius:999px;font-size:13px;font-weight:600;color:var(--ink2);white-space:nowrap;transition:background .15s,color .15s}
.pf-ms button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.14)}
.pf-leg{display:flex;flex-wrap:wrap;justify-content:center;gap:3px 9px;font-size:11.5px;color:var(--ink2);font-weight:600;padding:1px 0 0}
.pf-leg span{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.pf-leg i{display:inline-block;width:12px;height:12px;border-radius:4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
.pf-leg i.out{background:repeating-linear-gradient(135deg,var(--hell,#a9c45f) 0 3px,#f4f1e6 3px 5px)}
.pf-bb{position:absolute;left:12px;right:12px;bottom:calc(var(--sab) + 12px);margin:0 auto;max-width:420px;background:var(--card);border-radius:18px;
  box-shadow:var(--shadow);padding:9px 8px 9px 10px;display:flex;align-items:center;gap:10px;transition:opacity .2s,transform .2s}
.pf-bb .pf-emoji{width:40px;height:40px;font-size:22px;border-radius:12px}
.pf-bb .t{flex:1;min-width:0}
.pf-bb .t b{display:block;font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-bb .t > span{display:block;font-size:12px;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-bb .pf-leg{justify-content:flex-start;margin-top:3px;font-size:11px;gap:2px 7px;flex-wrap:nowrap;overflow:hidden}
.pf-bb .pf-leg i{width:10px;height:10px;border-radius:3px}
.pf-bb .pf-x{margin:0}
.pf-sthead{align-items:center!important}
.pf-sthead label{margin:0!important;display:inline!important}
.pf-bp{display:inline-flex;align-items:center;gap:5px;height:28px;margin:-5px 0 -3px;padding:0 11px 0 9px;border-radius:999px;
  background:#f7f2e2;color:#6b5514;font-weight:650;font-size:12.5px;border:1px solid #ebe0bd;white-space:nowrap}
.pf-bp:active{transform:scale(.98)}
/* Ausrichtung: Kompassring um die Wohnung */
.pf-or{position:absolute;inset:0;touch-action:none;cursor:grab}
.pf-or.hide,.pf-orb.hide,.pf-orc.hide{display:none}
.pf-or svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.pf-or text{font-family:inherit;font-weight:700;user-select:none}
.pf-orb{position:absolute;left:12px;right:12px;top:calc(var(--sat) + 10px);margin:0 auto;max-width:440px;background:var(--ink);color:#fff;border-radius:16px;
  padding:10px 10px 10px 14px;display:flex;align-items:center;gap:10px;box-shadow:var(--shadow)}
.pf-orb .t{flex:1;min-width:0}
.pf-orb .t b{display:block;font-size:15px;font-weight:700}
.pf-orb .t span{display:block;font-size:12px;color:#d6d4cc;line-height:1.3}
.pf-orb button{flex:none;height:36px;padding:0 13px;border-radius:999px;font-weight:700;font-size:13.5px;background:rgba(255,255,255,.16);color:#fff}
.pf-orb button.ok{background:#fff;color:var(--ink)}
.pf-orc{position:absolute;left:12px;right:12px;bottom:calc(var(--sab) + 12px);margin:0 auto;max-width:440px;background:var(--card);border-radius:18px;
  box-shadow:var(--shadow);padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.pf-orc .v{display:flex;align-items:baseline;gap:8px}
.pf-orc .v b{font-size:24px;font-weight:750;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.pf-orc .v span{font-size:13px;color:var(--ink2);font-weight:600}
.pf-orc p{margin:0;font-size:12.5px;color:var(--ink2);line-height:1.35}
.pf-orc .a{display:flex;gap:8px}
.pf-orc .a button{flex:1;height:38px;border-radius:12px;background:#f1efeb;font-weight:650;font-size:13.5px}
.pf-orc .a button.sens{background:var(--blue-l);color:var(--blue-d)}
.pf-orc .a button.sens.on{background:var(--blue);color:#fff}
.pf-orc .msg{font-size:12px;color:var(--blue-d);font-weight:600}
.pf-orc .msg:empty{display:none}
.pf-orient .pf-top,.pf-orient .pf-bottom,.pf-orient .pf-lp,.pf-orient .pf-dbn{opacity:0;pointer-events:none!important}
.pf-orient .pf-top > *,.pf-orient .pf-bottom > *{pointer-events:none!important}
.pf-orient .pf-badge.mini{visibility:hidden}
.pf-set-or{display:flex;align-items:center;gap:10px;padding:4px 0 12px}
.pf-set-or .v{flex:1;min-width:0}
.pf-set-or .v b{display:block;font-size:20px;font-weight:750;font-variant-numeric:tabular-nums}
.pf-set-or .v span{font-size:12.5px;color:var(--ink3)}
.pf-set-or button{height:40px;padding:0 14px;border-radius:12px;background:var(--green);color:#fff;font-weight:700;font-size:14px;flex:none}
.pf-step{display:flex;align-items:center;gap:4px;flex:none}
.pf-step button{width:30px;height:30px;border-radius:50%;background:#f1efeb;font-size:17px;font-weight:700;color:var(--ink2)}
.pf-step b{min-width:20px;text-align:center;font-size:15px;font-variant-numeric:tabular-nums}
.pf-step span{font-size:12px;color:var(--ink3);margin:0 3px}
/* Gießplan teilen */
.pf-shf{display:flex;flex-direction:column;gap:10px;padding:4px 0 6px}
.pf-shf label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em}
.pf-shf input,.pf-shf textarea{font:inherit;font-size:15px;font-weight:500;color:var(--ink);background:#f7f5f1;border:1px solid var(--line);border-radius:12px;padding:10px 12px;text-transform:none;letter-spacing:0;user-select:text;-webkit-user-select:text;resize:none}
.pf-shf .row2{display:flex;gap:10px}
.pf-shf .row2 label{flex:1;min-width:0}
.pf-shf .chips{display:flex;gap:6px}
.pf-shf .chips button{flex:1;height:32px;border-radius:999px;background:#f1efeb;font-weight:650;font-size:13px;color:var(--ink2)}
.pf-shf .sum{font-size:13px;color:var(--green-d);font-weight:650}
/* Wohnung gestalten */
.pf-dsb{position:absolute;left:12px;right:12px;top:calc(var(--sat) + 10px);margin:0 auto;max-width:440px;background:var(--ink);color:#fff;border-radius:16px;
  padding:10px 10px 10px 14px;display:flex;align-items:center;gap:10px;box-shadow:var(--shadow)}
.pf-dsb.hide,.pf-ds.hide{display:none}
.pf-dsb .t{flex:1;min-width:0}
.pf-dsb .t b{display:block;font-size:15px;font-weight:700}
.pf-dsb .t span{display:block;font-size:12px;color:#d6d4cc;line-height:1.3}
.pf-dsb button{flex:none;height:36px;padding:0 15px;border-radius:999px;font-weight:700;font-size:13.5px;background:#fff;color:var(--ink)}
.pf-ds{position:absolute;left:10px;right:10px;bottom:calc(var(--sab) + 10px);margin:0 auto;max-width:520px;background:var(--card);border-radius:18px;box-shadow:var(--shadow);padding:10px 12px 12px}
.pf-ds .seg{display:flex;background:#f1efeb;border-radius:999px;padding:3px;margin-bottom:9px}
.pf-ds .seg button{flex:1;height:32px;border-radius:999px;font-weight:650;font-size:13.5px;color:var(--ink2)}
.pf-ds .seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.pf-ds .hint{font-size:12.5px;color:var(--ink2);margin:2px 2px 8px;line-height:1.35}
.pf-ds .types{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.pf-ds .types::-webkit-scrollbar{display:none}
.pf-ds .types button{flex:none;width:72px;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px 7px;border-radius:12px;background:#f7f5f1;border:2px solid transparent;font-size:11.5px;font-weight:650;color:var(--ink2)}
.pf-ds .types button.on{border-color:var(--green);background:var(--green-l);color:var(--green-d)}
.pf-ds .types img{width:52px;height:36px;object-fit:contain}
.pf-ds .row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:7px}
.pf-ds .row .lab{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);width:100%}
.pf-ds .chip{height:32px;padding:0 12px;border-radius:999px;background:#f1efeb;font-weight:650;font-size:13px;color:var(--ink2)}
.pf-ds .chip.on{background:var(--green);color:#fff}
.pf-ds .sw{width:30px;height:30px;border-radius:50%;border:2px solid rgba(0,0,0,.08);flex:none}
.pf-ds .sw.on{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--green)}
.pf-ds .fl{width:54px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:650;color:var(--ink2)}
.pf-ds .fl i{width:46px;height:30px;border-radius:8px;display:block;background-size:cover;border:2px solid rgba(0,0,0,.06)}
.pf-ds .fl.on i{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--green)}
.pf-ds .acts{display:flex;gap:8px;margin-top:9px}
.pf-ds .acts button{flex:1;height:38px;border-radius:12px;background:#f1efeb;font-weight:650;font-size:13.5px}
.pf-ds .acts button.del{color:var(--red,#b5483a)}
.pf-ds .ttl{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:15px;margin:0 2px}
.pf-ds .ttl small{font-weight:600;font-size:12px;color:var(--ink3)}
.pf-design .pf-top,.pf-design .pf-bottom,.pf-design .pf-lp,.pf-design .pf-dbn,.pf-design .pf-hint{opacity:0;pointer-events:none!important}
.pf-design .pf-top > *,.pf-design .pf-bottom > *{pointer-events:none!important}
.pf-design .pf-badge.mini{visibility:hidden}
/* Pflanzenbilder + Auswahl */
.pf-th{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
.pf-emoji .pf-th{width:118%;height:118%;margin:-9%}
.pf-badge.mini .e .pf-th{width:150%;height:150%}
.pf-badge .bi{display:inline-block;width:20px;height:20px;vertical-align:-5px;margin:-2px 2px -2px -4px}
.pf-badge .bi .pf-th{width:130%;height:130%;margin:-15%}
.pf-pickbtn{width:100%;display:flex;align-items:center;gap:8px;height:48px;padding:0 30px 0 6px;border-radius:12px;background:#f7f5f1;border:1px solid var(--line);font-size:16px;font-weight:600;color:var(--ink);text-align:left}
.pf-pickbtn .ic{width:36px;height:36px;border-radius:9px;background:var(--green-l);display:flex;align-items:center;justify-content:center;font-size:20px;flex:none;overflow:hidden}
.pf-pickbtn .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-pick{position:absolute;inset:0;z-index:60}
.pf-pick.hide{display:none}
.pf-pick-bg{position:absolute;inset:0;background:rgba(30,32,28,.32);opacity:0;transition:opacity .2s}
.pf-pick.open .pf-pick-bg{opacity:1}
.pf-pick-p{position:absolute;left:0;right:0;bottom:0;max-height:86%;background:var(--card);border-radius:22px 22px 0 0;box-shadow:var(--shadow);display:flex;flex-direction:column;
  padding:14px 16px 0;transform:translateY(100%);transition:transform .22s ease-out;max-width:560px;margin:0 auto}
.pf-pick.open .pf-pick-p{transform:none}
.pf-pq{display:flex;align-items:center;background:#f1efeb;border-radius:12px;padding:0 12px;height:42px;margin:4px 0 6px}
.pf-pq input{flex:1;border:0;outline:0;background:none;font:inherit;font-size:16px;color:var(--ink);user-select:text;-webkit-user-select:text}
.pf-pick-b{overflow:auto;padding-bottom:calc(var(--sab) + 16px);-webkit-overflow-scrolling:touch}
.pf-pg{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3);margin:12px 2px 6px}
.pf-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.pf-pt{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px 9px;border-radius:14px;background:#f7f5f1;border:2px solid transparent}
.pf-pt.on{border-color:var(--green);background:var(--green-l)}
.pf-pt .im{width:66px;height:66px;display:flex;align-items:center;justify-content:center;font-size:38px}
.pf-pt b{font-size:12.5px;font-weight:650;line-height:1.2;text-align:center;color:var(--ink)}
.pf-rp button .pf-th{width:22px;height:22px;margin:-3px 0}
/* Was passt wohin? */
.pf-lpb{height:30px;border-radius:999px;background:#f1efeb;font-weight:650;font-size:12.5px;color:var(--green-d);display:flex;align-items:center;justify-content:center;gap:6px}
.pf-rc{border-top:1px solid #efede9;padding:12px 0 10px}
.pf-rc:first-of-type{border-top:0}
.pf-rc h3{margin:0;font-size:15.5px;font-weight:700;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.pf-rc h3 small{font-size:12px;font-weight:600;color:var(--ink3);white-space:nowrap}
.pf-rc .m{font-size:12.5px;color:var(--ink2);margin-top:2px}
.pf-rbar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 0 4px;background:#eee}
.pf-rbar i{display:block;height:100%}
.pf-rleg{display:flex;flex-wrap:wrap;gap:2px 10px;font-size:11.5px;color:var(--ink2);font-weight:600}
.pf-rleg span{display:inline-flex;align-items:center;gap:4px}
.pf-rleg i{width:9px;height:9px;border-radius:3px;display:inline-block}
.pf-rp{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pf-rg{margin-top:9px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink3)}
.pf-rp button{display:inline-flex;align-items:center;gap:5px;background:var(--green-l);color:var(--green-d);border-radius:999px;padding:5px 10px 5px 7px;font-size:13px;font-weight:650;max-width:100%}
.pf-rp button small{font-weight:600;color:#5d7c66;font-size:11.5px}
.pf-rp button.more{background:#f1efeb;color:var(--ink2);padding:5px 10px}
.pf-rnone{font-size:12.5px;color:var(--ink3);margin-top:8px}
.pf-lit .pf-room{color:rgba(255,255,255,.95);text-shadow:0 0 3px rgba(20,24,30,.75),0 0 8px rgba(20,24,30,.45)}
.pf-lit .pf-room small{color:rgba(255,255,255,.8)}
`;

const ICONS = {
  close: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  list: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 21c-4-2-7-5.5-7-10 3 0 5.5 1.5 7 4 1.5-2.5 4-4 7-4 0 4.5-3 8-7 10z"/><path d="M12 15V5M12 5c-1.5-1.5-3.5-2-5-2M12 5c1.5-1.5 3.5-2 5-2"/></svg>',
  dropW: '<svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.5s-7 7.6-7 12.5a7 7 0 0014 0c0-4.9-7-12.5-7-12.5z"/></svg>',
  drop: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5s-7 7.6-7 12.5a7 7 0 0014 0c0-4.9-7-12.5-7-12.5z"/></svg>',
  sun: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:1px"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.6v.1"/></svg>',
  focus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  bell: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0112 0v5l1.6 2H4.4z"/><path d="M10 20.5a2.2 2.2 0 004 0"/></svg>',
};

const styleEl = document.createElement('style');
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

root.innerHTML = `
<div id="pf">
  <div class="pf-vig"></div>
  <div class="pf-overlay" id="pf-labels"></div>
  <div class="pf-top">
    <button class="pf-btn pf-compass" id="pf-compass" aria-label="Nordausrichtung einstellen">
      <svg viewBox="0 0 40 40" id="pf-compass-svg"><circle cx="20" cy="20" r="17" fill="none" stroke="#dcd9d2" stroke-width="1.5"/>
        <path d="M20 6l5 14h-10z" fill="#b5483a"/><path d="M20 34l5-14h-10z" fill="#c9c6bf"/>
        <text x="20" y="5.2" text-anchor="middle" font-size="0" fill="#b5483a">N</text></svg>
    </button>
    <div class="pf-title"><b>Meine Wohnung</b><span id="pf-addr"></span></div>
    <button class="pf-btn" id="pf-list-btn">${ICONS.list}<span>Meine Pflanzen</span><span class="cnt" id="pf-count">0</span></button>
  </div>
  <div class="pf-hint hide" id="pf-hint"><span class="dot"></span>Tippe auf Boden oder Fenster, um zu pflanzen</div>
  <div class="pf-banner hide" id="pf-banner"><span>Tippe auf die neue Stelle – oder ein Fenster für die Fensterbank</span><button id="pf-move-cancel">Abbrechen</button></div>
  <div class="pf-dbn hide" id="pf-dbn" role="status"><span id="pf-dbn-t"></span><button id="pf-dbn-go">Ansehen</button><button id="pf-dbn-x" aria-label="Hinweis schließen">${ICONS.close}</button></div>
  <div class="pf-toast hide" id="pf-toast"></div>
  <div class="pf-lp hide" id="pf-lp" aria-label="Lichtkarte">
    <div class="pf-lr"><span>Monat</span><div class="pf-ms" id="pf-lm"></div></div>
    <div class="pf-lr"><span>Höhe</span><div class="pf-ms" id="pf-lh"></div></div>
    <div class="pf-leg" id="pf-leg"></div>
    <button class="pf-lpb" id="pf-recs-btn" type="button">🪴 Was passt wohin? · Ideen je Raum</button>
  </div>
  <div class="pf-lp pf-sp hide" id="pf-sp" aria-label="Sonnenlauf">
    <div class="tm"><b id="sp-t"></b><span id="sp-s"></span><button id="sp-play" aria-label="Tag abspielen">▶</button></div>
    <input type="range" id="sp-h" min="4" max="22" step="0.25">
    <div class="pf-lr"><span>Monat</span><div class="pf-ms" id="sp-m"></div></div>
  </div>
  <div class="pf-bottom" id="pf-bottom">
    <div class="pf-bl">
      <div class="pf-seg" id="pf-viewseg"><button data-v="3d" class="on">3D</button><button data-v="top">Draufsicht</button></div>
      <button class="pf-btn pf-lbtn" id="pf-light" aria-pressed="false" aria-label="Lichtkarte">${ICONS.sun}<span>Licht</span></button>
      <button class="pf-btn pf-sbtn" id="pf-sun" aria-pressed="false" aria-label="Sonnenlauf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 6v2M5.6 9.6l1.4 1.4M18.4 9.6 17 11M2 14h2M20 14h2"/></svg></button>
    </div>
    <button class="pf-btn" id="pf-reset" aria-label="Ansicht zurücksetzen" style="padding:0 12px">${ICONS.focus}</button>
  </div>
  <div class="pf-bb hide" id="pf-bb" role="status"><div class="pf-emoji" id="pf-bb-e"></div>
    <div class="t"><b id="pf-bb-t"></b><span id="pf-bb-s"></span><div class="pf-leg" id="pf-bb-leg"></div></div>
    <button class="pf-x" id="pf-bb-x" aria-label="Beste Plätze beenden">${ICONS.close}</button></div>
  <div class="pf-or hide" id="pf-or" aria-label="Kompassring – zum Drehen ziehen"><svg id="pf-or-svg"></svg></div>
  <div class="pf-orb hide" id="pf-orb"><div class="t"><b>Ausrichtung einstellen</b><span>Ring drehen, bis die Himmelsrichtungen zur echten Wohnung passen</span></div>
    <button id="or-cancel">Abbrechen</button><button class="ok" id="or-done">Fertig</button></div>
  <div class="pf-orc hide" id="pf-orc">
    <div class="v"><b id="or-top"></b><span id="or-sub"></span></div>
    <p>Halte das Handy flach und dreh dich, bis der Grundriss so liegt wie deine echte Wohnung. Dann sollte oben am Ring dieselbe Gradzahl stehen wie in deiner Kompass-App.</p>
    <div class="msg" id="or-msg"></div>
    <div class="a"><button id="or-reset">Zurücksetzen</button><button class="sens" id="or-sens">📱 Handy-Kompass</button></div>
  </div>
  <div class="pf-dsb hide" id="pf-dsb"><div class="t"><b>Wohnung gestalten</b><span id="ds-sub">Möbel antippen und ziehen zum Verschieben</span></div><button id="ds-done">Fertig</button></div>
  <div class="pf-ds hide" id="pf-ds"></div>
  <div class="pf-scrim" id="pf-scrim"></div>
  <div class="pf-pick hide" id="pf-pick" role="dialog" aria-label="Pflanze wählen">
    <div class="pf-pick-bg" id="pk-bg"></div>
    <div class="pf-pick-p">
      <div class="pf-head"><div><h2>Pflanze wählen</h2></div><button class="pf-x" id="pk-close" aria-label="Schließen">${ICONS.close}</button></div>
      <label class="pf-pq"><input id="pk-q" type="search" placeholder="Suchen … z. B. Minze" autocomplete="off"></label>
      <div class="pf-pick-b" id="pk-body"></div>
    </div>
  </div>
  <section class="pf-sheet" id="pf-sheet" aria-label="Pflanze"></section>
  <section class="pf-sheet" id="pf-list" aria-label="Meine Pflanzen"><div class="pf-grab"><i></i></div><div class="pf-sheet-body" id="pf-list-body"></div></section>
  <section class="pf-sheet" id="pf-set" aria-label="Einstellungen"><div class="pf-grab"><i></i></div><div class="pf-sheet-body" id="pf-set-body"></div></section>
</div>`;

const $ = (id) => document.getElementById(id);
const appEl = $('pf');
// Container darf nie scrollen (Fokus/scrollIntoView in ausgeblendeten Sheets)
appEl.addEventListener('scroll', () => { if (appEl.scrollTop || appEl.scrollLeft) { appEl.scrollTop = 0; appEl.scrollLeft = 0; } });

if (!FP || !Array.isArray(FP.rooms)) {
  appEl.insertAdjacentHTML('beforeend', '<div class="pf-err">Grundriss konnte nicht geladen werden (window.FLOORPLAN fehlt).</div>');
  throw new Error('FLOORPLAN missing');
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const DIRS = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
const compassName = (deg) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distToSeg(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L2, 0, 1);
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}
function distToPolyEdge(px, py, poly) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, distToSeg(px, py, poly[i], poly[(i + 1) % poly.length]));
  return d;
}
function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    a += f; cx += (poly[j][0] + poly[i][0]) * f; cy += (poly[j][1] + poly[i][1]) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const n = poly.length; return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
  }
  a *= 0.5; return [cx / (6 * a), cy / (6 * a)];
}
function polyArea(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return Math.abs(a / 2);
}

/* ------------------------------------------------------------------ */
/* State + persistence                                                 */
/* ------------------------------------------------------------------ */
const state = {
  plants: [],           // {uid, plantId, x, y, potDiameterCm, plantHeightCm, standCm, lastWateredAt, waterLog[], nick}
  northDeg: null,       // override for planUpCompassDeg
  seenHint: false,
  lastPlantId: null,
  reminder: { on: false, h: 8, m: 0 }, // tägliche Gieß-Erinnerung (nur Android-App als Push)
  showRoomNames: false, // Raumnamen im Grundriss (Einstellungen)
  motion: true, // Pflanzen wiegen sich leicht (Einstellungen)
  lamps: 'auto', // Lampen: 'auto' (ab Sonnenuntergang) | 'on' | 'off'
  wallMode: 'diorama', // 'diorama' = hintere Außenwände in voller Höhe, 'cut' = alle Wände auf Schnitthöhe (Grundriss-Schnitt)
  showPlantNames: true, // Namen an den Pflanzen-Markern (aus: nur Symbol)
  design: null, // Wohnung gestalten: { rooms: {id: {floor, wall}}, items: [...] }
  building: { floor: 7, total: 9 }, // Stockwerk der Wohnung / Geschosse des Hauses
};
// Gießen: lastWateredAt (ISO) + kurze Historie (max. 10 Einträge)
const nowDate = () => new Date();
const cleanNick = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 30) : '');
function validIso(v, maxMs) {
  if (typeof v !== 'string' || v.length > 40) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t) || t < Date.UTC(2000, 0, 1) || t > maxMs) return null;
  return new Date(t).toISOString();
}
function wateringFields(p) {
  const maxMs = nowDate().getTime() + 86400000; // keine Zukunftsdaten
  const last = validIso(p.lastWateredAt, maxMs) || nowDate().toISOString();
  let log = Array.isArray(p.waterLog) ? p.waterLog.map((v) => validIso(v, maxMs)).filter(Boolean) : [];
  log = [...new Set(log)].sort();
  if (!log.length || log[log.length - 1] < last) log.push(last);
  return { lastWateredAt: last, waterLog: log.slice(-10) };
}
const dayNum = (d) => Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
// Fälligkeit: { days (negativ = überfällig), due, text, cls }
function dueInfo(p, r) {
  if (!r || !Number.isFinite(+r.intervalDays)) return { days: Infinity, due: false, text: '–', cls: '' };
  const iv = Math.max(1, Math.round(+r.intervalDays));
  const last = new Date(p.lastWateredAt || nowDate().toISOString());
  const days = dayNum(last) + iv - dayNum(nowDate());
  let text;
  if (days < 0) text = `${-days} T. überfällig`;
  else if (days === 0) text = 'heute fällig';
  else if (days === 1) text = 'morgen';
  else text = `in ${days} T.`;
  return { days, due: days <= 0, text, cls: days < 0 ? 'over' : days === 0 ? 'due' : '', iv };
}
function agoText(iso) {
  const d = dayNum(nowDate()) - dayNum(new Date(iso));
  if (d <= 0) return 'heute';
  if (d === 1) return 'gestern';
  return `vor ${d} Tagen`;
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object' || Array.isArray(d)) return;
    const num = (v, def, a, b) => { const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? +v : NaN); return Number.isFinite(n) ? clamp(n, a, b) : def; };
    const known = (id) => typeof id === 'string' && PLANTS.some((q) => q.id === id);
    const fallbackId = PLANTS[0] ? PLANTS[0].id : 'x';
    const M = 3; // Rand um den Grundriss (m)
    if (Array.isArray(d.plants)) {
      const seen = new Set();
      state.plants = d.plants
        .filter((p) => p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y))
        .map((p) => {
          let id = typeof p.uid === 'string' && p.uid ? p.uid.slice(0, 40) : '';
          while (!id || seen.has(id)) id = uid();
          seen.add(id);
          return {
            uid: id, plantId: known(p.plantId) ? p.plantId : fallbackId,
            x: clamp(p.x, bbox.minX - M, bbox.maxX + M), y: clamp(p.y, bbox.minY - M, bbox.maxY + M),
            potDiameterCm: Math.round(num(p.potDiameterCm, 18, 6, 50)), plantHeightCm: Math.round(num(p.plantHeightCm, 50, 10, 250)),
            standCm: Math.round(num(p.standCm, 0, 0, 150)),
            ...wateringFields(p),
            nick: cleanNick(p.nick),
            onItem: typeof p.onItem === 'string' ? p.onItem.slice(0, 40) : undefined,
            waterAdj: Math.round(num(p.waterAdj, 1, ADJ_MIN, ADJ_MAX) * 100) / 100,
            fbAt: validIso(p.fbAt, Date.now() + 86400000),
          };
        });
    }
    if (Number.isFinite(d.northDeg)) state.northDeg = ((Math.round(d.northDeg) % 360) + 360) % 360;
    if (known(d.lastPlantId)) state.lastPlantId = d.lastPlantId;
    state.seenHint = d.seenHint === true;
    state.showRoomNames = d.showRoomNames === true;
    state.motion = d.motion !== false;
    state.wallMode = d.wallMode === 'cut' ? 'cut' : 'diorama';
    state.lamps = ['on', 'off'].includes(d.lamps) ? d.lamps : 'auto';
    state.showPlantNames = d.showPlantNames !== false;
    state.design = cleanDesign(d.design);
    if (d.building && typeof d.building === 'object') {
      const tot = Math.round(num(d.building.total, 9, 1, 30));
      state.building = { total: tot, floor: Math.round(num(d.building.floor, Math.min(7, tot), 1, tot)) };
    }
    if (d.reminder && typeof d.reminder === 'object') {
      state.reminder = { on: d.reminder.on === true, h: Math.round(num(d.reminder.h, 8, 0, 23)), m: Math.round(num(d.reminder.m, 0, 0, 59)) };
    }
  } catch (e) { /* storage unavailable */ }
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1, plants: state.plants, northDeg: state.northDeg, lastPlantId: state.lastPlantId, seenHint: state.seenHint,
      reminder: state.reminder, showRoomNames: state.showRoomNames, showPlantNames: state.showPlantNames, wallMode: state.wallMode, lamps: state.lamps, motion: state.motion, design: state.design, building: state.building,
    }));
  } catch (e) { /* ignore */ }
  queueReminderSync();
}
const planUpDeg = () => (state.northDeg != null ? state.northDeg : (+FP.planUpCompassDeg || 0));
// Kompassrichtung eines Plan-Vektors (x rechts, y unten). Plan-oben = (0,-1) → planUpDeg, im Uhrzeigersinn.
function vecCompass(nx, ny) {
  const ang = (Math.atan2(nx, -ny) * 180) / Math.PI; // 0 = plan-oben, 90 = plan-rechts
  return (((planUpDeg() + ang) % 360) + 360) % 360;
}
const plantDef = (id) => PLANTS.find((p) => p.id === id) || PLANTS[0] || { id: 'x', name: 'Pflanze', emoji: '🪴', color: '#4f7a5a', shape: 'bush' };
const CATS = Array.isArray(window.PLANT_CATEGORIES) ? window.PLANT_CATEGORIES : [];
/* Pflanzenbilder: aus den eigenen 3D-Modellen gerendert (statt Emojis), im Gerät zwischengespeichert */
const THUMB_KEY = 'plantflat.thumbs', THUMB_VER = 'v1-' + PLANTS.length;
const thumbs = new Map();
loadThumbs();
function plantIcon(def) {
  const u = thumbs.get(def.id);
  return u ? `<img class="pf-th" src="${u}" alt="">` : esc(def.emoji || '🪴');
}
// Pflanzenauswahl nach Kategorien gruppiert (innerhalb alphabetisch)
function plantOptionsHTML(cur) {
  const opt = (d) => `<option value="${esc(d.id)}"${d.id === cur ? ' selected' : ''}>${d.emoji || '🪴'}  ${esc(d.name)}</option>`;
  const byName = (a, b) => a.name.localeCompare(b.name, 'de');
  const known = new Set(CATS.map((c) => c.id));
  const groups = CATS.map((c) => ({ name: c.name, list: PLANTS.filter((d) => d.cat === c.id).sort(byName) })).filter((g) => g.list.length);
  const rest = PLANTS.filter((d) => !known.has(d.cat));
  if (rest.length) groups.push({ name: 'Weitere', list: rest.sort(byName) });
  return groups.map((g) => `<optgroup label="${esc(g.name)}">${g.list.map(opt).join('')}</optgroup>`).join('');
}

/* ------------------------------------------------------------------ */
/* Floorplan analysis                                                  */
/* ------------------------------------------------------------------ */
const rooms = FP.rooms.filter((r) => Array.isArray(r.polygon) && r.polygon.length >= 3);
const openings = Array.isArray(FP.openings) ? FP.openings : [];
const lightOpenings = openings.filter((o) => o.type === 'window' || o.type === 'balcony-door');
const balcony = FP.balcony && Array.isArray(FP.balcony.polygon) && FP.balcony.polygon.length >= 3 ? FP.balcony : null;
const WH = +FP.wallHeight || 2.6;

const allPts = [];
rooms.forEach((r) => allPts.push(...r.polygon));
(FP.walls || []).forEach((w) => { allPts.push(w.a, w.b); });
if (balcony) allPts.push(...balcony.polygon);
const bbox = allPts.reduce((b, p) => ({
  minX: Math.min(b.minX, p[0]), maxX: Math.max(b.maxX, p[0]), minY: Math.min(b.minY, p[1]), maxY: Math.max(b.maxY, p[1]),
}), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
const cx0 = (bbox.minX + bbox.maxX) / 2, cy0 = (bbox.minY + bbox.maxY) / 2;
const span = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY, 4);

function windowsOfRoom(room) {
  return lightOpenings.filter((o) => {
    if (o.roomId) return o.roomId === room.id;
    const m = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
    return distToPolyEdge(m[0], m[1], room.polygon) < 0.4;
  });
}
function openingNormal(o) {
  if (Array.isArray(o.outwardNormal)) return o.outwardNormal;
  const dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.hypot(dx, dy) || 1;
  let n = [dy / L, -dx / L];
  const m = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
  if ((m[0] - cx0) * n[0] + (m[1] - cy0) * n[1] < 0) n = [-n[0], -n[1]];
  return n;
}
const segLen = (o) => Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
// halbe Dicke der Wand, auf deren Achse die Öffnung liegt
const halfWallCache = new Map();
function openingHalfWall(o) {
  if (!halfWallCache.has(o)) {
    const m = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
    let best = null;
    for (const w of FP.walls || []) {
      const d = distToSeg(m[0], m[1], w.a, w.b);
      if (!best || d < best.d) best = { d, t: w.thickness || 0.2 };
    }
    halfWallCache.set(o, best && best.d < 0.3 ? best.t / 2 : 0.1);
  }
  return halfWallCache.get(o);
}
function nearestOpening(x, y, list) {
  let best = null;
  for (const o of list) {
    const d = distToSeg(x, y, o.a, o.b);
    if (!best || d < best.d) best = { o, d };
  }
  return best;
}
// nächstes echtes Fenster (keine Balkontür) im Raum des Punktes – für „Fensterbank“
function sillWindowAt(x, y) {
  const room = rooms.find((r) => pointInPoly(x, y, r.polygon));
  if (!room) return null;
  const best = nearestOpening(x, y, windowsOfRoom(room).filter((o) => o.type === 'window'));
  return best ? { ...best, room } : null;
}
// Steht die Pflanze auf der Fensterbank? (Standhöhe = Brüstung und direkt am Fenster)
function sillOf(p) {
  if (!p.standCm) return null;
  const w = sillWindowAt(p.x, p.y);
  if (!w) return null;
  if (Math.abs(p.standCm - Math.round((+w.o.sill || 0) * 100)) > 2) return null;
  if (w.d > openingHalfWall(w.o) + 0.3) return null;
  return w;
}
// Raum + nächstes Fenster für einen Punkt
function analyze(x, y) {
  const room = rooms.find((r) => pointInPoly(x, y, r.polygon));
  if (room) {
    const best = nearestOpening(x, y, windowsOfRoom(room));
    const sill = best ? +best.o.sill || 0 : null;
    return {
      roomId: room.id, roomName: room.name, outdoor: false,
      windowDistanceM: best ? Math.round(best.d * 10) / 10 : null,
      windowCompassDeg: best ? Math.round(vecCompass(...openingNormal(best.o))) : null,
      windowType: best ? best.o.type : null,
      windowSillM: best ? sill : null,
      windowTopM: best ? Math.round((sill + (+best.o.height || 0)) * 100) / 100 : null,
      windowWidthM: best ? Math.round(segLen(best.o) * 100) / 100 : null,
    };
  }
  if (balcony && pointInPoly(x, y, balcony.polygon)) {
    // Balkon: Licht aus der Richtung, in die die Balkontür schaut
    const bd = lightOpenings.filter((o) => o.type === 'balcony-door');
    let best = null;
    for (const o of (bd.length ? bd : lightOpenings)) {
      const d = distToSeg(x, y, o.a, o.b);
      if (!best || d < best.d) best = { o, d };
    }
    return {
      roomId: 'balkon', roomName: 'Balkon (draußen)', outdoor: true, windowDistanceM: best ? 0 : null,
      windowSillM: null, windowTopM: null, windowWidthM: null,
      windowCompassDeg: best ? Math.round(vecCompass(...openingNormal(best.o))) : null, windowType: 'outdoor',
    };
  }
  return null;
}
function compute(p) {
  const a = analyze(p.x, p.y) || { roomId: null, roomName: '–', outdoor: false, windowDistanceM: null, windowCompassDeg: null };
  let r = null;
  try {
    if (typeof window.computeWater === 'function') {
      r = window.computeWater({
        plantId: p.plantId, potDiameterCm: p.potDiameterCm, plantHeightCm: p.plantHeightCm,
        roomId: a.roomId, roomName: a.roomName, windowDistanceM: a.windowDistanceM, windowCompassDeg: a.windowCompassDeg,
        date: new Date(), outdoor: !!a.outdoor,
        windowSillM: a.windowSillM ?? null, windowTopM: a.windowTopM ?? null, windowWidthM: a.windowWidthM ?? null,
        standHeightM: (p.standCm || 0) / 100,
      });
    }
  } catch (e) { console.warn('computeWater failed', e); }
  if (r) applyAdj(p, r);
  return { a, r };
}
/* Rückmeldung „Wasser lief unten raus“: Faktor je Pflanze auf die Gießmenge.
 * Ziel: ca. 15 % Ablauf – dann ist der ganze Wurzelballen nass, aber nicht zu viel. */
const ADJ_MIN = 0.4, ADJ_MAX = 1.8, RUNOFF_TARGET = 0.15;
const round10 = (v) => Math.round(v / 10) * 10;
function applyAdj(p, r) {
  const k = +p.waterAdj || 1;
  r.mlBase = r.mlPerWatering;
  if (isDip(r) || Math.abs(k - 1) < 0.005) { r.adj = 1; return r; }
  r.adj = k;
  r.mlPerWatering = Math.max(20, round10(r.mlBase * k));
  r.mlPerWeek = Math.max(10, round10(r.mlPerWatering * 7 / Math.max(1, r.intervalDays)));
  return r;
}
// neuer Faktor aus gemessenem Ablauf (ml); 0 = nichts kam raus
function adjFromRunoff(k, poured, runoff) {
  let f;
  if (!(runoff > 0)) f = 1.1; // nichts kam unten an → etwas mehr
  else {
    const ro = Math.min(runoff, poured * 0.9);
    const ideal = (poured - ro) / (1 - RUNOFF_TARGET); // aufgenommen + 15 % Ablauf
    f = 1 + 0.7 * (clamp(ideal / poured, 0.5, 1.3) - 1); // gedämpft: eine Messung ist nur ein Hinweis
  }
  return Math.round(clamp(k * f, ADJ_MIN, ADJ_MAX) * 100) / 100;
}
const pctTxt = (k) => { const v = Math.round((k - 1) * 100); return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v) + ' %'; };
function windowText(a) {
  if (!a) return '–';
  if (a.outdoor) return a.windowCompassDeg != null ? `Draußen · Ausrichtung ${compassName(a.windowCompassDeg)}` : 'Draußen';
  if (a.windowDistanceM == null) return 'Kein Fenster im Raum';
  const kind = a.windowType === 'balcony-door' ? 'Balkontür' : 'Fenster';
  return `${kind} ${compassName(a.windowCompassDeg)} · ${fmt1(a.windowDistanceM)} m`;
}
const isDip = (r) => !!r && r.method === 'tauchen';
const shortDays = (d) => (Math.round(d) <= 1 ? 'täglich' : `${Math.round(d)} T.`);
// Kurztext für Badges: „250 ml · 7 Tage“ bzw. „Tauchen · 7 T.“
function shortWater(r) {
  if (isDip(r)) return `Tauchen · ${shortDays(r.intervalDays)}`;
  return `${fmtInt(r.mlPerWatering)} ml · ${intervalText(r.intervalDays).replace('alle ', '')}`;
}
function intervalText(d) {
  if (!d && d !== 0) return '';
  d = Math.round(d);
  if (d <= 1) return 'täglich';
  return `alle ${d} Tage`;
}

/* ------------------------------------------------------------------ */
/* three.js scene                                                      */
/* ------------------------------------------------------------------ */
// Transparente Leinwand: Hintergrund ist ein CSS-Verlauf hinter dem Canvas (#pf)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
// PCF mit Radius = weiche Schattenkanten zum Preis von PCF (PCFSoft ignoriert den Radius)
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false; // nur bei Szenenänderung neu berechnen (s. shadowsDirty)
renderer.shadowMap.needsUpdate = true;
function shadowsDirty() { renderer.shadowMap.needsUpdate = true; dirty = true; }
renderer.setClearColor(0x000000, 0);
appEl.insertBefore(renderer.domElement, appEl.firstChild);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);

// „Cozy“-Licht: warme Himmelsfüllung, warmer Bodenreflex, warmes Grundlicht hebt die Schatten (nicht grau)
const hemi = new THREE.HemisphereLight(0xeef3f8, 0x8a6a4e, 0.82); // kühler Himmel → warme Sonne hebt sich ab
const amb = new THREE.AmbientLight(0xf1ece6, 0.4);
/* Lampen: je Raum eine warme Pendelleuchte; die Lichter bleiben immer in der Szene (Intensität 0 = aus),
 * damit beim Umschalten keine Shader neu kompiliert werden */
const lamps = [];
let lampsReady = false, lampsLit = null;
const lampShadeMat = new THREE.MeshStandardMaterial({ color: 0xfff3dc, emissive: 0xffb866, emissiveIntensity: 2.2, roughness: 0.6 });
function applyLamps(on) {
  if (!lampsReady || on === lampsLit) return;
  lampsLit = on;
  for (const l of lamps) { l.light.intensity = on ? l.power : 0; l.shade.visible = on; }
  const glow = on ? 0.55 : 0;
  for (const wg of wallGroups) if (wg.glass) { wg.glass.emissive.set(0xffb15e); wg.glass.emissiveIntensity = glow; }
  glassMat.emissive.set(0xffb15e); glassMat.emissiveIntensity = glow;
  for (const m of facadeWinMats) m.emissiveIntensity = on ? 0.35 : 0;
  appEl.classList.toggle('pf-night', isNight());
  dirty = true;
}
scene.add(hemi, amb);
// Nachmittagssonne aus Westen (kompassrichtig über planUpDeg), golden, eher flach
const sun = new THREE.DirectionalLight(0xffd9a8, 2.2);
const SUN_COMPASS = 250, SUN_ELEV = 33; // flachere Nachmittagssonne → längere, sichtbare Schatten
/* Sonnenstand Hamburg (53,55° N, 9,99° O) für ein Datum – vereinfachte NOAA-Formeln, auf ~1° genau */
function solarPos(date) {
  const rad = Math.PI / 180, lat = 53.55 * rad, lon = 9.99;
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 864e5;
  const g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
  const H = (gmst * 15 + lon) * rad - RA;
  const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(H));
  return { az: ((az / rad) % 360 + 360) % 360, el: el / rad };
}
const sunMode = { on: false, month: new Date().getMonth(), hour: 17, play: false, last: 0 };
let realSunEl = 30; // aktueller echter Sonnenstand (für die automatische Nacht im Normalmodus)
// Nacht = Sonne unter dem Horizont: im Sonnenlauf zur gewählten Uhrzeit, sonst jetzt gerade
function isNight() { return sunMode.on ? solarPos(sunDate()).el < -0.8 : realSunEl < -0.8; }
function lampsOn() { const m = state.lamps || 'auto'; return m === 'on' || (m === 'auto' && isNight()); }
function sunDate() { const n = new Date(); const h = Math.floor(sunMode.hour), mi = Math.round((sunMode.hour - h) * 60); return new Date(n.getFullYear(), sunMode.month, 15, h, mi); }
function placeSun() {
  let az = SUN_COMPASS, elev = SUN_ELEV;
  if (sunMode.on) { const sp = solarPos(sunDate()); az = sp.az; elev = sp.el; }
  if (!sunMode.on) { const now = solarPos(new Date()); realSunEl = now.el; }
  const night = isNight();
  // Sonnenmodus: Licht kommt nur durch die Fenster → Grundlicht etwas zurücknehmen; Dämmerung wärmer, Nacht kühl
  const low = clamp(elev / 12, 0, 1);
  sun.intensity = night ? 0.35 : sunMode.on ? 3.1 * (0.35 + 0.65 * low) : 3.6;
  if (night) sun.color.set(0x9fb4d8); else sun.color.setHSL(0.085, 1, sunMode.on ? 0.62 + 0.18 * low : 0.74); // nachts: kühles Mondlicht
  hemi.intensity = night ? 0.32 : sunMode.on ? 0.85 : 0.62;
  hemi.color.set(night ? 0xa9b8d4 : 0xeef3f8);
  amb.intensity = night ? 0.12 : sunMode.on ? 0.3 : 0.3;
  applyLamps(lampsOn());
  const d = THREE.MathUtils.degToRad(az - planUpDeg());
  const vx = Math.sin(d), vy = -Math.cos(d); // Plan-Vektor zur Sonne
  const el = THREE.MathUtils.degToRad(Math.max(2, elev)), R = span * 1.6;
  sun.position.set(cx0 + vx * R * Math.cos(el), R * Math.sin(el), cy0 + vy * R * Math.cos(el));
  sun.target.position.set(cx0, 0, cy0);
  sun.target.updateMatrixWorld();
}
placeSun();
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = span * 0.85;
Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.5, far: span * 4 });
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.025;
sun.shadow.radius = 3;
scene.add(sun, sun.target);

/* --- prozedurale Texturen (einmalig erzeugt, gecacht, ≤ 512 px) --- */
const texCache = new Map();
const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy() || 1);
function canvasTex(key, size, metres, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const R = rng(key); draw(cv.getContext('2d'), size, R);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso;
  t.repeat.set(1 / metres, 1 / metres); // UV = Planmeter (Shape-/Extrude-UVs)
  texCache.set(key, t);
  return t;
}
const hsl = (h, s, l) => `hsl(${h.toFixed(1)},${s.toFixed(1)}%,${l.toFixed(1)}%)`;
// helle Eiche: 16 Dielenreihen à 15 cm, versetzte Stöße, feine Maserung
const oakTex = () => canvasTex('oak', 512, 2.4, (c, S, R) => {
  const rows = 16, rh = S / rows;
  for (let j = 0; j < rows; j++) {
    let x = -R() * 300;
    while (x < S) {
      const len = 200 + R() * 170;
      const L = 66 + R() * 7, hue = 31 + R() * 5, sat = 46 + R() * 10;
      for (const ox of [0, S]) {
        const x0 = x - ox; if (x0 + len < 0 || x0 > S) continue;
        c.fillStyle = hsl(hue, sat, L); c.fillRect(x0, j * rh, len, rh);
        // Maserung
        c.globalAlpha = 0.12;
        for (let k = 0; k < 5; k++) {
          c.strokeStyle = hsl(hue - 4, sat + 6, L - 12 - R() * 8); c.lineWidth = 0.6 + R();
          const yy = j * rh + 3 + R() * (rh - 6), ph = R() * 6, am = 0.6 + R() * 1.4;
          c.beginPath(); for (let t = 0; t <= len; t += 12) c.lineTo(x0 + t, yy + Math.sin(t / 40 + ph) * am); c.stroke();
        }
        c.globalAlpha = 1;
        c.fillStyle = 'rgba(110,74,40,.32)'; c.fillRect(x0, j * rh, 1.2, rh); // Stoßfuge
      }
      x += len;
    }
    c.fillStyle = 'rgba(110,74,40,.28)'; c.fillRect(0, j * rh, S, 1.2); // Längsfuge
    c.fillStyle = 'rgba(255,248,236,.25)'; c.fillRect(0, j * rh + 1.2, S, 1);
  }
});
// kleine helle Fliesen (15 cm), warmgraue Fuge
const tileTex = () => canvasTex('tile', 512, 1.2, (c, S, R) => {
  c.fillStyle = '#b9ada0'; c.fillRect(0, 0, S, S);
  const n = 8, ts = S / n, g = 2.5;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    c.fillStyle = hsl(36 + R() * 6, 16 + R() * 6, 89 + R() * 3);
    c.fillRect(i * ts + g / 2, j * ts + g / 2, ts - g, ts - g);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(i * ts + g / 2, j * ts + g / 2, ts - g, 2);
  }
});
// Balkon: Holzdielen, verwittert-warm, mit Fugen
const deckTex = () => canvasTex('deck', 256, 1.12, (c, S, R) => {
  c.fillStyle = '#8f7a63'; c.fillRect(0, 0, S, S);
  const n = 8, bw = S / n;
  for (let j = 0; j < n; j++) {
    c.fillStyle = hsl(30 + R() * 5, 22 + R() * 6, 66 + R() * 5); c.fillRect(0, j * bw + 1.5, S, bw - 3);
    c.globalAlpha = 0.1; c.strokeStyle = '#6d5440';
    for (let k = 0; k < 3; k++) { const yy = j * bw + 4 + R() * (bw - 8); c.beginPath(); c.moveTo(0, yy); c.lineTo(S, yy + R() * 2 - 1); c.stroke(); }
    c.globalAlpha = 1;
  }
});

// Fischgrät-Parkett (typisch Altbau): Stäbe 7 × 42 cm im Zickzack (kachelbar: 4 Spalten × 12 Stäbe)
const herringTex = () => canvasTex('herring', 512, 1.188, (c, S, R) => {
  const k = S / 1.188, cw = 0.297 * k, h = 0.099 * k;
  c.fillStyle = '#7d5a3c'; c.fillRect(0, 0, S, S);
  for (let col = 0; col < 4; col++) {
    const x0 = col * cw, up = col % 2 === 0;
    for (let j = -4; j < 16; j++) {
      const y = j * h;
      c.fillStyle = hsl(29 + R() * 6, 42 + R() * 8, 56 + R() * 10);
      c.beginPath();
      if (up) { c.moveTo(x0, y + cw); c.lineTo(x0 + cw, y); c.lineTo(x0 + cw, y + h); c.lineTo(x0, y + cw + h); }
      else { c.moveTo(x0, y); c.lineTo(x0 + cw, y + cw); c.lineTo(x0 + cw, y + cw + h); c.lineTo(x0, y + h); }
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(92,60,34,.5)'; c.lineWidth = 1.1; c.stroke();
    }
  }
});
const concreteTex = () => canvasTex('concrete', 256, 2.0, (c, S, R) => {
  c.fillStyle = '#c9c4bc'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '90,84,76'},${(0.03 + R() * 0.07).toFixed(3)})`; const r = 1 + R() * 5; c.beginPath(); c.arc(R() * S, R() * S, r, 0, 7); c.fill(); }
});

/* --- Diorama-Insel: schwebende Bodenplatte + vorgerenderter weicher Kontaktschatten --- */
const PLATE_TOP = -0.175, PLATE_H = 0.25, PLATE_PAD = 0.32;
// Umriss als Vereinigung abgerundeter Rechtecke um Räume/Balkon (inkl. Wanddicke + Rand)
const plateRects = [];
{
  const wallPad = Math.max(0.2, ...(FP.walls || []).filter((w) => w.exterior).map((w) => w.thickness || 0.2));
  rooms.forEach((r) => { const b = polyBox(r.polygon); plateRects.push({ x0: b.minX - wallPad - PLATE_PAD, x1: b.maxX + wallPad - 0.05 + PLATE_PAD, y0: b.minY - wallPad - PLATE_PAD, y1: b.maxY + wallPad - 0.05 + PLATE_PAD }); });
  if (balcony) { const b = polyBox(balcony.polygon); plateRects.push({ x0: b.minX - PLATE_PAD, x1: b.maxX + PLATE_PAD, y0: b.minY - PLATE_PAD, y1: b.maxY + PLATE_PAD }); }
}
function roundRectShape(x0, y0, x1, y1, r) {
  // Plan-y → Shape-y gespiegelt (wie shapeFromPoly)
  const s = new THREE.Shape(), Y0 = -y1, Y1 = -y0;
  r = Math.min(r, (x1 - x0) / 2, (Y1 - Y0) / 2);
  s.moveTo(x0 + r, Y0); s.lineTo(x1 - r, Y0); s.quadraticCurveTo(x1, Y0, x1, Y0 + r);
  s.lineTo(x1, Y1 - r); s.quadraticCurveTo(x1, Y1, x1 - r, Y1); s.lineTo(x0 + r, Y1);
  s.quadraticCurveTo(x0, Y1, x0, Y1 - r); s.lineTo(x0, Y0 + r); s.quadraticCurveTo(x0, Y0, x0 + r, Y0);
  return s;
}
// nicht-indizierte Geometrien zusammenführen (optional nur eine Material-Gruppe)
function mergeGeos(list, group = null) {
  const parts = [];
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    const ranges = group == null || !g.groups.length ? [{ start: 0, count: g.attributes.position.count }] : g.groups.filter((q) => q.materialIndex === group);
    for (const rg of ranges) parts.push([P.subarray(rg.start * 3, (rg.start + rg.count) * 3), N.subarray(rg.start * 3, (rg.start + rg.count) * 3)]);
  }
  const n = parts.reduce((a, p) => a + p[0].length, 0);
  const pos = new Float32Array(n), nor = new Float32Array(n);
  let o = 0; for (const [p, q] of parts) { pos.set(p, o); nor.set(q, o); o += p.length; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}
let plateShadow = null;
const plateTopMat = new THREE.MeshStandardMaterial({ color: 0xc9a789, roughness: 1 });
const plateSideMat = new THREE.MeshStandardMaterial({ color: 0x9d7556, roughness: 1 });
{
  const geos = plateRects.map((q) => {
    const g = new THREE.ExtrudeGeometry(roundRectShape(q.x0, q.y0, q.x1, q.y1, 0.45), { depth: PLATE_H - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 5 });
    g.rotateX(-Math.PI / 2); g.translate(0, PLATE_TOP - PLATE_H + 0.04, 0);
    return g;
  });
  // Gruppe 0 = Deckflächen, 1 = Seiten/Fase
  const top = new THREE.Mesh(mergeGeos(geos, 0), plateTopMat), side = new THREE.Mesh(mergeGeos(geos, 1), plateSideMat);
  geos.forEach((g) => g.dispose());
  // Keine Insel-Platte mehr: die Außenwände sind die Grenze, darunter geht die Fassade runter (s. buildBuilding)
  for (const m of [top, side]) { m.receiveShadow = true; m.userData.kind = 'plate'; }
  // Kontaktschatten: weich geblurrte Silhouette, einmal in ein Canvas gerendert
  const pb = plateRects.reduce((b, q) => ({ x0: Math.min(b.x0, q.x0), x1: Math.max(b.x1, q.x1), y0: Math.min(b.y0, q.y0), y1: Math.max(b.y1, q.y1) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
  const M = 1.6, X0 = pb.x0 - M, Y0 = pb.y0 - M, WW = pb.x1 - pb.x0 + 2 * M, HH = pb.y1 - pb.y0 + 2 * M;
  const S = 256, k = S / Math.max(WW, HH), cw = Math.ceil(WW * k), ch = Math.ceil(HH * k);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d'), OFF = 4000;
  c.shadowColor = 'rgba(92,62,38,1)'; c.shadowBlur = 0.9 * k * 1.2; c.shadowOffsetX = OFF;
  c.fillStyle = '#000';
  for (const q of plateRects) { c.beginPath(); c.rect((q.x0 - X0) * k - OFF + 0.15 * k, (q.y0 - Y0) * k + 0.15 * k, (q.x1 - q.x0 - 0.3) * k, (q.y1 - q.y0 - 0.3) * k); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(cw / k, ch / k), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(X0 + cw / k / 2, PLATE_TOP - PLATE_H - 0.4, Y0 + ch / k / 2); sh.renderOrder = -1;
  sh.raycast = () => {};
  scene.add(sh); plateShadow = sh;
}

// Sockel nur unter Räumen und Wänden (nicht unter dem Treppenhaus / Bounding-Box)
const slabMat = new THREE.MeshStandardMaterial({ color: 0xeadfce, roughness: 1 });
function buildSlab() {
  const SL = 0.185; // reicht bis in die Bodenplatte
  rooms.forEach((r) => {
    const s = new THREE.Shape();
    r.polygon.forEach((p, i) => (i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1])));
    const geo = new THREE.ExtrudeGeometry(s, { depth: SL, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, slabMat);
    m.position.y = -SL - 0.004; m.receiveShadow = true;
    scene.add(m);
  });
  (FP.walls || []).forEach((w) => {
    const t = w.thickness || 0.2, L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    if (L < 0.01) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(L + t, SL, t), slabMat);
    m.position.set((w.a[0] + w.b[0]) / 2, -SL / 2 - 0.004, (w.a[1] + w.b[1]) / 2);
    m.rotation.y = -Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
    m.receiveShadow = true;
    scene.add(m);
  });
}
function shapeFromPoly(poly) {
  const s = new THREE.Shape();
  poly.forEach((p, i) => (i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1])));
  s.closePath();
  return s;
}
const floorMeshes = [];
// Bodenbelag: Holz für Wohnräume, Fliesen für Nassräume/Abstellraum; floorColor nur als leichter Farbhinweis
const TILE_ROOMS = /^(kueche|kuche|bad|wc|abst|hwr|dusche)/i, WOOD_ROOMS = /^(wohnen|schlafen|flur|vorraum|kind|arbeit|ess|diele)/i;
function floorKind(r) {
  if (TILE_ROOMS.test(r.id || '') || /Küche|Bad|Abstell|WC/i.test(r.name || '')) return 'tile';
  if (WOOD_ROOMS.test(r.id || '')) return 'wood';
  const c = new THREE.Color(r.floorColor || '#c4a27e'), h = {}; c.getHSL(h);
  return h.s < 0.12 ? 'tile' : 'wood';
}
/* Wohnung gestalten: Böden und Wandfarben je Raum */
const FLOOR_OPTS = [
  { id: 'oak', name: 'Eiche hell', tex: () => oakTex(), color: 0xf6eee4, rough: 0.85 },
  { id: 'oakdark', name: 'Eiche dunkel', tex: () => oakTex(), color: 0x9c7c62, rough: 0.8 },
  { id: 'herring', name: 'Fischgrät', tex: () => herringTex(), color: 0xffffff, rough: 0.75 },
  { id: 'tile', name: 'Fliesen hell', tex: () => tileTex(), color: 0xffffff, rough: 0.7 },
  { id: 'tiledark', name: 'Fliesen grau', tex: () => tileTex(), color: 0x9e9a94, rough: 0.7 },
  { id: 'concrete', name: 'Estrich', tex: () => concreteTex(), color: 0xffffff, rough: 0.9 },
];
const WALL_OPTS = [
  { id: 'alt', name: 'Altweiß', c: '#f6efe4' }, { id: 'kalk', name: 'Kalkweiß', c: '#eeeeea' }, { id: 'grau', name: 'Hellgrau', c: '#d9d6d0' },
  { id: 'sand', name: 'Sand', c: '#ead6b4' }, { id: 'salbei', name: 'Salbei', c: '#c6d0b8' }, { id: 'rose', name: 'Rosé', c: '#ebcfc4' },
  { id: 'blau', name: 'Taubenblau', c: '#c2ccd6' }, { id: 'tanne', name: 'Tannengrün', c: '#8a9c8b' },
];
const floorOptMats = new Map();
function floorOptMat(id) {
  const o = FLOOR_OPTS.find((f) => f.id === id) || FLOOR_OPTS[0];
  if (!floorOptMats.has(o.id)) floorOptMats.set(o.id, new THREE.MeshStandardMaterial({ map: o.tex(), color: o.color, roughness: o.rough }));
  return floorOptMats.get(o.id);
}
const roomDesign = (r) => (state.design && state.design.rooms && state.design.rooms[r.id]) || {};
const defaultFloor = (r) => (floorKind(r) === 'tile' ? 'tile' : 'oak');
const roomWallMats = new Map(); // roomId -> Material (Innenwände, geteilt)
const extRoomMats = [];         // { m, roomId } Kopien für ausblendbare Außenwände
function wallColorOf(roomId) {
  const r = rooms.find((q) => q.id === roomId);
  const id = r ? roomDesign(r).wall : null;
  return (WALL_OPTS.find((w) => w.id === id) || WALL_OPTS[0]).c;
}
function roomWallMat(roomId) {
  if (!roomWallMats.has(roomId)) roomWallMats.set(roomId, new THREE.MeshStandardMaterial({ color: wallColorOf(roomId), roughness: 0.9 }));
  return roomWallMats.get(roomId);
}
function applyRoomLooks() {
  floorMeshes.forEach((m) => { const r = m.userData.room; if (r && r.id !== 'balkon' && rooms.includes(r)) m.material = floorOptMat(roomDesign(r).floor || defaultFloor(r)); });
  roomWallMats.forEach((m, id) => m.color.set(wallColorOf(id)));
  extRoomMats.forEach(({ m, roomId }) => m.color.set(wallColorOf(roomId)));
  shadowsDirty();
}
const floorMatCache = new Map();
function floorMat(r) {
  const kind = floorKind(r);
  const hint = new THREE.Color(r.floorColor || (kind === 'tile' ? '#d8d2c8' : '#c4a27e'));
  const hh = {}; hint.getHSL(hh);
  // leichter Ton aus dem Hinweis (Farbton), Helligkeit kommt aus der Textur
  const tint = new THREE.Color().setHSL(hh.h, Math.min(hh.s, 0.35) * 0.5, 0.93);
  const key = kind + '|' + tint.getHexString();
  if (!floorMatCache.has(key)) floorMatCache.set(key, new THREE.MeshStandardMaterial({ map: kind === 'tile' ? tileTex() : oakTex(), color: tint, roughness: kind === 'tile' ? 0.7 : 0.85 }));
  return floorMatCache.get(key);
}
rooms.forEach((r) => {
  const geo = new THREE.ShapeGeometry(shapeFromPoly(r.polygon));
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, floorMat(r));
  m.position.y = 0.002; m.receiveShadow = true; m.userData.kind = 'floor'; m.userData.room = r;
  scene.add(m); floorMeshes.push(m);
});
if (balcony) {
  const sh = shapeFromPoly(balcony.polygon);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // extrude along +y after rotation? depth along +Z → after rotateX(-90°) along +Y
  const m = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: deckTex(), roughness: 0.9 }), slabMat]);
  m.position.y = -0.19; m.receiveShadow = true; m.castShadow = true; m.userData.kind = 'floor'; m.userData.room = { id: 'balkon', name: 'Balkon' };
  scene.add(m); floorMeshes.push(m);
  // Geländer: dünne Brüstung an den Außenkanten (Kanten, die nicht an der Fassade liegen)
  const railMat = new THREE.MeshStandardMaterial({ color: 0xfbf4e8, roughness: 0.6, transparent: true, opacity: 0.6 });
  const poly = balcony.polygon;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const nearWall = (FP.walls || []).some((w) => w.exterior && distToSeg(mid[0], mid[1], w.a, w.b) < (w.thickness || 0.24) * 1.2);
    if (nearWall) continue;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.9, 0.04), railMat);
    rail.position.set(mid[0], 0.45, mid[1]);
    rail.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    scene.add(rail);
  }
}

buildSlab();
function buildLamps() {
  for (const r of rooms) {
    const b = polyBox(r.polygon), area = (b.maxX - b.minX) * (b.maxY - b.minY);
    if (area < 1.5) continue;
    // Schwerpunkt des Raums (liegt er außerhalb, Mitte der Box)
    let ax = 0, ay = 0, A = 0;
    r.polygon.forEach((p, i) => { const q = r.polygon[(i + 1) % r.polygon.length], c = p[0] * q[1] - q[0] * p[1]; A += c; ax += (p[0] + q[0]) * c; ay += (p[1] + q[1]) * c; });
    let x = A ? ax / (3 * A) : (b.minX + b.maxX) / 2, y = A ? ay / (3 * A) : (b.minY + b.maxY) / 2;
    if (!pointInPoly(x, y, r.polygon)) { x = (b.minX + b.maxX) / 2; y = (b.minY + b.maxY) / 2; }
    const power = clamp(area * 0.9, 3.5, 12);
    const light = new THREE.PointLight(0xffb468, 0, Math.max(4, Math.sqrt(area) * 2.4), 1.6);
    light.position.set(x, 2.0, y); scene.add(light);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), lampShadeMat);
    shade.position.set(x, 2.08, y); shade.visible = false; shade.raycast = () => {}; scene.add(shade);
    lamps.push({ light, shade, power });
  }
}
buildLamps();

// Vorschlag für den Teppich im Wohnzimmer (wird beim ersten Start als Möbel-Element angelegt):
// frei von Fenstern, Balkontür und Türaufschlägen, möglichst mittig
function defaultRug() {
  const room = rooms.find((r) => r.id === 'wohnen') || rooms.filter((r) => floorKind(r) === 'wood').sort((a, b) => polyArea(b.polygon) - polyArea(a.polygon))[0];
  if (!room) return null;
  const b = polyBox(room.polygon), along = (b.maxX - b.minX) >= (b.maxY - b.minY);
  const RL = clamp(Math.min(b.maxX - b.minX, b.maxY - b.minY) * 0.62, 1.2, 2.2), RW = RL * 0.68;
  const hx = (along ? RL : RW) / 2, hy = (along ? RW : RL) / 2;
  const ops = openings.filter((o) => {
    if (o.roomId === room.id) return true;
    const m = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
    return distToPolyEdge(m[0], m[1], room.polygon) < 0.4;
  });
  const c = centroid(room.polygon);
  const ok = (x, y) => {
    const pts = [[x - hx, y - hy], [x + hx, y - hy], [x + hx, y + hy], [x - hx, y + hy], [x, y - hy], [x, y + hy], [x - hx, y], [x + hx, y]];
    if (!pts.every((q) => pointInPoly(q[0], q[1], room.polygon) && distToPolyEdge(q[0], q[1], room.polygon) > 0.3)) return false;
    return ops.every((o) => [o.a, o.b, [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2]].every((q) => Math.hypot(Math.max(0, Math.abs(q[0] - x) - hx), Math.max(0, Math.abs(q[1] - y) - hy)) > (o.type === 'door' ? segLen(o) + 0.1 : 0.9)));
  };
  let best = null;
  for (let dy = -2; dy <= 2.001; dy += 0.1) for (let dx = -2; dx <= 2.001; dx += 0.1) {
    const x = c[0] + dx, y = c[1] + dy, d = Math.hypot(dx, dy);
    if ((!best || d < best.d) && ok(x, y)) best = { x, y, d };
  }
  return best ? { type: 'teppich', style: 'muster', x: +best.x.toFixed(3), y: +best.y.toFixed(3), w: +RL.toFixed(2), d: +RW.toFixed(2), rot: along ? 0 : Math.PI / 2 } : null;
}

/* ------------------------------------------------------------------ */
/* Möbel als Planzeichen + Teppiche (flach auf dem Boden)              */
/* ------------------------------------------------------------------ */
// sizes: [Breite, Tiefe] in m; Rückseite = obere Kante (an die Wand)
const FURN = {
  sofa: { name: 'Sofa', h: 0.8, sizes: [[1.9, 0.9, '2er'], [2.4, 0.95, '3er'], [2.8, 1.65, 'Ecke']] },
  sessel: { name: 'Sessel', h: 0.8, sizes: [[0.85, 0.85, '']] },
  bett: { name: 'Bett', h: 0.5, sizes: [[0.95, 2.05, '90'], [1.45, 2.05, '140'], [1.65, 2.05, '160'], [1.85, 2.05, '180']] },
  tisch: { name: 'Esstisch', h: 0.75, top: 0.75, sizes: [[0.8, 0.8, '2'], [1.4, 0.85, '4'], [1.9, 0.95, '6']] },
  rund: { name: 'Tisch rund', h: 0.75, top: 0.75, sizes: [[0.8, 0.8, 'Ø 80'], [1.1, 1.1, 'Ø 110']] },
  couchtisch: { name: 'Couchtisch', h: 0.42, top: 0.42, sizes: [[0.9, 0.5, ''], [1.2, 0.6, '']] },
  schreib: { name: 'Schreibtisch', h: 0.75, top: 0.75, sizes: [[1.2, 0.65, '120'], [1.6, 0.75, '160']] },
  regal: { name: 'Regal', h: 1.1, top: 1.1, sizes: [[0.8, 0.35, '80'], [1.6, 0.35, '160'], [2.4, 0.35, '240']] },
  schrank: { name: 'Schrank', h: 2.0, sizes: [[1.0, 0.6, '100'], [1.5, 0.6, '150'], [2.0, 0.6, '200']] },
  kommode: { name: 'Kommode', h: 0.85, top: 0.85, sizes: [[0.8, 0.45, '80'], [1.2, 0.45, '120']] },
  teppich: { name: 'Teppich', rug: true, sizes: [[1.6, 1.0, 'S'], [2.0, 1.4, 'M'], [2.4, 1.7, 'L']] },
  teppichrund: { name: 'Teppich rund', rug: true, sizes: [[1.2, 1.2, 'Ø 120'], [1.6, 1.6, 'Ø 160']] },
};
const RUG_STYLES = [
  { id: 'muster', name: 'Muster', c: '#b3bf9f' }, { id: 'salbei', c: '#b3bf9f' }, { id: 'terra', c: '#c99274' }, { id: 'creme', c: '#ecdcc2' },
  { id: 'senf', c: '#d9b26a' }, { id: 'grau', c: '#b9b4ab' }, { id: 'blau', c: '#9fb3c4' }, { id: 'rosa', c: '#e3b9ad' },
];
const ITEM_PX = 120; // Pixel pro Meter in der Zeichnung
const LINE = '#7a6450';
function drawItem(g, it, k) {
  const w = it.w * k, d = it.d * k, lw = Math.max(1.6, k * 0.018);
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  const body = 'rgba(255,252,247,.42)';
  g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = LINE; g.lineWidth = lw;
  const box = (x, y, ww, hh, r = 0.03 * k, fill = body) => { rr(x, y, ww, hh, r); if (fill) { g.fillStyle = fill; g.fill(); } g.stroke(); };
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const chair = (cx, cy, rot) => { g.save(); g.translate(cx, cy); g.rotate(rot); const c = 0.42 * k; box(-c / 2, -c / 2, c, c, 0.06 * k); line(-c / 2 + 0.05 * k, -c / 2 + 0.07 * k, c / 2 - 0.05 * k, -c / 2 + 0.07 * k); g.restore(); };
  const t = it.type;
  if (FURN[t] && FURN[t].rug) {
    const st = RUG_STYLES.find((q) => q.id === it.style) || RUG_STYLES[1];
    const round = t === 'teppichrund';
    const shape = (inset, r) => { if (round) { g.beginPath(); g.ellipse(w / 2, d / 2, w / 2 - inset, d / 2 - inset, 0, 0, 7); } else rr(inset, inset, w - 2 * inset, d - 2 * inset, r); };
    if (st.id === 'muster') {
      shape(0, 0.1 * k); g.fillStyle = '#c99274'; g.fill();
      shape(0.075 * k, 0.07 * k); g.fillStyle = '#f1e4d0'; g.fill();
      shape(0.13 * k, 0.05 * k); g.fillStyle = '#b3bf9f'; g.fill();
      g.save(); g.clip();
      g.strokeStyle = 'rgba(244,234,216,.55)'; g.lineWidth = 2;
      const st2 = 0.18 * k;
      for (let q = -d; q < w + d; q += st2) { g.beginPath(); g.moveTo(q, 0); g.lineTo(q + d, d); g.moveTo(q + d, 0); g.lineTo(q, d); g.stroke(); }
      g.fillStyle = 'rgba(201,146,116,.65)';
      for (let q = -d; q < w + d; q += st2) for (let j = 0; j < d; j += st2) { g.beginPath(); g.arc(q + st2 / 2, j + st2 / 2, 0.018 * k, 0, 7); g.fill(); }
      g.restore();
    } else {
      shape(0, 0.08 * k); g.fillStyle = st.c; g.fill();
      shape(0.07 * k, 0.05 * k); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = Math.max(1.5, 0.012 * k); g.stroke();
    }
    return;
  }
  if (t === 'sofa' || t === 'sessel') {
    const back = 0.2 * k, arm = Math.min(0.2 * k, w * 0.18);
    if (t === 'sofa' && it.sizeIdx === 2) {
      // Ecksofa: Rücken oben, Récamiere rechts
      const dd = 0.95 * k;
      g.beginPath(); g.moveTo(0.04 * k, 0); g.lineTo(w - 0.04 * k, 0); g.arcTo(w, 0, w, 0.04 * k, 0.04 * k); g.lineTo(w, d - 0.04 * k); g.arcTo(w, d, w - 0.04 * k, d, 0.04 * k);
      g.lineTo(w - dd + 0.04 * k, d); g.arcTo(w - dd, d, w - dd, d - 0.04 * k, 0.04 * k); g.lineTo(w - dd, dd); g.lineTo(0.04 * k, dd); g.arcTo(0, dd, 0, dd - 0.04 * k, 0.04 * k); g.lineTo(0, 0.04 * k); g.arcTo(0, 0, 0.04 * k, 0, 0.04 * k); g.closePath();
      g.fillStyle = body; g.fill(); g.stroke();
      line(arm, back, w - back, back); line(arm, back, arm, dd); line(w - back, back, w - back, d - arm);
      const n = 2, sw = (w - dd - arm) / n; for (let i = 1; i <= n; i++) line(arm + sw * i, back, arm + sw * i, dd);
      line(w - dd, d - arm, w - back, d - arm);
      return;
    }
    box(0, 0, w, d, 0.05 * k);
    line(arm, back, w - arm, back); line(arm, back, arm, d); line(w - arm, back, w - arm, d);
    const n = t === 'sessel' ? 1 : Math.max(2, Math.round((w - 2 * arm) / (0.65 * k)));
    for (let i = 1; i < n; i++) { const x = arm + (w - 2 * arm) * i / n; line(x, back + 0.03 * k, x, d - 0.04 * k); }
    return;
  }
  if (t === 'bett') {
    box(0, 0, w, d, 0.04 * k);
    const pw = w > 1.2 * k ? (w - 0.3 * k) / 2 : w - 0.2 * k;
    const np = w > 1.2 * k ? 2 : 1;
    for (let i = 0; i < np; i++) box(0.1 * k + i * (pw + 0.1 * k), 0.08 * k, pw, 0.36 * k, 0.07 * k, 'rgba(255,255,255,.85)');
    line(0, 0.55 * k, w, 0.55 * k);
    // umgeschlagene Decke
    g.beginPath(); g.moveTo(w, d - 0.55 * k); g.lineTo(w - 0.55 * k, d); g.stroke();
    g.beginPath(); g.moveTo(w, d - 0.55 * k); g.lineTo(w - 0.45 * k, d - 0.45 * k); g.lineTo(w - 0.55 * k, d); g.stroke();
    return;
  }
  if (t === 'tisch' || t === 'couchtisch' || t === 'schreib') {
    if (t === 'tisch') {
      const n = Math.max(1, Math.round(w / (0.65 * k)));
      for (let i = 0; i < n; i++) { const x = w * (i + 0.5) / n; chair(x, -0.12 * k, 0); chair(x, d + 0.12 * k, Math.PI); }
      if (w / k < 1.0) { /* klein: nur zwei Stühle */ }
    }
    if (t === 'schreib') chair(w / 2, d + 0.16 * k, Math.PI);
    box(0, 0, w, d, 0.03 * k);
    if (t === 'couchtisch') box(0.06 * k, 0.06 * k, w - 0.12 * k, d - 0.12 * k, 0.02 * k, null);
    return;
  }
  if (t === 'rund') {
    const n = w > 1.0 * k ? 5 : 4, R2 = w / 2;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2; chair(w / 2 + Math.cos(a) * (R2 + 0.14 * k), d / 2 + Math.sin(a) * (R2 + 0.14 * k), a + Math.PI / 2); }
    g.beginPath(); g.ellipse(w / 2, d / 2, w / 2, d / 2, 0, 0, 7); g.fillStyle = body; g.fill(); g.stroke();
    return;
  }
  if (t === 'regal') {
    box(0, 0, w, d, 0.015 * k);
    const n = Math.max(1, Math.round(w / (0.4 * k)));
    for (let i = 1; i < n; i++) line(w * i / n, 0, w * i / n, d);
    return;
  }
  if (t === 'schrank' || t === 'kommode') {
    box(0, 0, w, d, 0.015 * k);
    line(0, d - 0.05 * k, w, d - 0.05 * k);
    if (t === 'schrank') { line(0.04 * k, 0.04 * k, w - 0.04 * k, d - 0.09 * k); }
    else { const n = Math.max(2, Math.round(w / (0.4 * k))); for (let i = 1; i < n; i++) line(w * i / n, d - 0.05 * k, w * i / n, d); }
    return;
  }
  box(0, 0, w, d);
}
const PAD_M = 0.3; // Rand für Stühle über die Tischkante hinaus
function itemCanvas(it, k = ITEM_PX) {
  const pad = FURN[it.type] && FURN[it.type].rug ? 0.02 : PAD_M;
  const cw = Math.ceil((it.w + 2 * pad) * k), ch = Math.ceil((it.d + 2 * pad) * k);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.translate(pad * k, pad * k);
  drawItem(g, it, k);
  return { cv, pad };
}
const itemObjs = new Map(); // id -> mesh (Planzeichen am Boden)
const item3d = new Map();   // id -> Group (weißer, durchscheinender Baukörper wie im Architekturmodell)
const massMat = new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.85, transparent: true, opacity: 0.8 });
const massEdge = new THREE.LineBasicMaterial({ color: 0xa8968a, transparent: true, opacity: 0.55 });
// Teile in lokalen Koordinaten: x = Breite, z = Tiefe (Rückseite bei −d/2), y = Höhe; [x, y, z, w, h, d]
function itemParts(it) {
  const w = it.w, d = it.d, P = [], t = it.type, H = (h) => Math.min(h, CUT - 0.01);
  const leg = (x, z, h) => P.push([x, h / 2, z, 0.045, h, 0.045]);
  const chair = (x, z, a) => { const c = 0.42, ca = Math.cos(a), sa = Math.sin(a); P.push([x, 0.23, z, c, 0.46, c]); P.push([x - sa * 0.19, 0.62, z - ca * 0.19, Math.abs(ca) > 0.5 ? c : 0.05, 0.32, Math.abs(ca) > 0.5 ? 0.05 : c]); };
  if (t === 'sofa' || t === 'sessel') {
    const arm = Math.min(0.2, w * 0.18);
    if (t === 'sofa' && it.sizeIdx === 2) {
      const dd = 0.95;
      P.push([0, 0.21, -d / 2 + dd / 2, w, 0.42, dd]);                 // Sitzfläche oben
      P.push([w / 2 - dd / 2, 0.21, dd / 2, dd, 0.42, d - dd]);          // Récamiere
      P.push([0, 0.4, -d / 2 + 0.1, w, 0.8, 0.2]);
      P.push([-w / 2 + arm / 2, 0.3, -d / 2 + dd / 2, arm, 0.6, dd]);
      return P;
    }
    P.push([0, 0.21, 0, w, 0.42, d]); P.push([0, 0.4, -d / 2 + 0.1, w, 0.8, 0.2]);
    P.push([-w / 2 + arm / 2, 0.3, 0.05, arm, 0.6, d - 0.1]); P.push([w / 2 - arm / 2, 0.3, 0.05, arm, 0.6, d - 0.1]);
    return P;
  }
  if (t === 'bett') {
    P.push([0, 0.15, 0, w, 0.3, d]); P.push([0, 0.38, 0.02, w - 0.06, 0.16, d - 0.1]); P.push([0, 0.48, -d / 2 + 0.03, w, 0.96, 0.06]);
    return P;
  }
  if (t === 'tisch' || t === 'couchtisch' || t === 'schreib') {
    const h = FURN[t].top, i = 0.06;
    P.push([0, h - 0.02, 0, w, 0.04, d]);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) leg(sx * (w / 2 - i), sz * (d / 2 - i), h - 0.04);
    if (t === 'tisch') { const n = Math.max(1, Math.round(w / 0.65)); for (let k = 0; k < n; k++) { const x = -w / 2 + w * (k + 0.5) / n; chair(x, -d / 2 - 0.12, 0); chair(x, d / 2 + 0.12, Math.PI); } }
    if (t === 'schreib') chair(0, d / 2 + 0.16, Math.PI);
    return P;
  }
  if (t === 'rund') {
    P.push(['cyl', 0.73, 0, w / 2, 0.04]); P.push(['cyl', 0.36, 0, 0.06, 0.7]);
    const n = w > 1.0 ? 5 : 4;
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 - Math.PI / 2, r = w / 2 + 0.14, ux = Math.cos(a), uz = Math.sin(a); chair(ux * r, uz * r, Math.atan2(-ux, -uz)); }
    return P;
  }
  // Kastenmöbel (Regal, Schrank, Kommode): bis zur Schnitthöhe
  P.push([0, H(FURN[t].h) / 2, 0, w, H(FURN[t].h), d]);
  return P;
}
function buildItem3d(it) {
  const F = FURN[it.type]; if (!F || F.rug) return null;
  const g = new THREE.Group();
  const geos = [];
  for (const q of itemParts(it)) {
    let geo;
    if (q[0] === 'cyl') { geo = new THREE.CylinderGeometry(q[3], q[3], q[4], 28); geo.translate(0, q[1], 0); }
    else { geo = new THREE.BoxGeometry(q[3], q[4], q[5]); geo.translate(q[0], q[1], q[2]); }
    geos.push(geo);
  }
  for (const geo of geos) {
    const m = new THREE.Mesh(geo, massMat); m.castShadow = true; m.receiveShadow = true; m.userData.kind = 'item3d'; m.userData.itemId = it.id; g.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), massEdge); e.raycast = () => {}; g.add(e);
  }
  g.position.set(it.x, 0.004, it.y); g.rotation.y = -(it.rot || 0);
  g.userData.itemId = it.id;
  return g;
}
// Ablageflächen für Pflanzen (Tische, Regal, Kommode)
const surfaceTop = (it) => (it && FURN[it.type] && FURN[it.type].top) || 0;
function insideItem(it, x, y, m = 0) {
  const c = Math.cos(it.rot || 0), s2 = Math.sin(it.rot || 0), dx = x - it.x, dy = y - it.y;
  const u = dx * c + dy * s2, v = -dx * s2 + dy * c;
  if (it.type === 'rund' || it.type === 'teppichrund') return Math.hypot(u / (it.w / 2 + m), v / (it.d / 2 + m)) <= 1;
  return Math.abs(u) <= it.w / 2 + m && Math.abs(v) <= it.d / 2 + m;
}
// Pflanzen, die auf einem Möbel stehen
const plantsOn = (id) => [...state.plants, ...(draft ? [draft] : [])].filter((p) => p.onItem === id);
function buildItemMesh(it) {
  const k = Math.min(ITEM_PX, 900 / Math.max(it.w, it.d));
  const { cv, pad } = itemCanvas(it, k);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.premultiplyAlpha = true;
  const rug = FURN[it.type] && FURN[it.type].rug;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w + 2 * pad, it.d + 2 * pad), new THREE.MeshStandardMaterial({
    map: t, roughness: 1, transparent: true, premultipliedAlpha: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: rug ? -1 : -2, polygonOffsetUnits: rug ? -1 : -2 }));
  m.geometry.rotateX(-Math.PI / 2);
  m.position.set(it.x, rug ? 0.0028 : 0.0036, it.y);
  m.rotation.y = -(it.rot || 0);
  m.renderOrder = rug ? 0 : 1;
  m.receiveShadow = true; m.userData.kind = 'item'; m.userData.itemId = it.id;
  return m;
}
function syncItem(it) {
  const old = itemObjs.get(it.id);
  if (old) { scene.remove(old); old.geometry.dispose(); old.material.map.dispose(); old.material.dispose(); }
  const o3 = item3d.get(it.id);
  if (o3) { scene.remove(o3); o3.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); item3d.delete(it.id); }
  if (!it._gone) { const g3 = buildItem3d(it); if (g3) { scene.add(g3); item3d.set(it.id, g3); } }
  if (!it._gone) { const m = buildItemMesh(it); m.visible = !light.on; scene.add(m); itemObjs.set(it.id, m); } else itemObjs.delete(it.id);
  shadowsDirty();
}
function syncAllItems() {
  for (const id of [...itemObjs.keys()]) syncItem({ id, _gone: true });
  (state.design ? state.design.items : []).forEach(syncItem);
}
function cleanDesign(d) {
  const out = { rooms: {}, items: [] };
  if (!d || typeof d !== 'object') return null;
  const fl = new Set(['oak', 'oakdark', 'herring', 'tile', 'tiledark', 'concrete']);
  const wl = new Set(['alt', 'kalk', 'grau', 'sand', 'salbei', 'rose', 'blau', 'tanne']);
  if (d.rooms && typeof d.rooms === 'object') for (const [id, v] of Object.entries(d.rooms)) {
    if (!v || typeof v !== 'object') continue;
    out.rooms[String(id).slice(0, 40)] = { floor: fl.has(v.floor) ? v.floor : undefined, wall: wl.has(v.wall) ? v.wall : undefined };
  }
  const types = new Set(['sofa', 'sessel', 'bett', 'tisch', 'rund', 'couchtisch', 'schreib', 'regal', 'schrank', 'kommode', 'teppich', 'teppichrund']);
  if (Array.isArray(d.items)) for (const it of d.items.slice(0, 80)) {
    if (!it || !types.has(it.type)) continue;
    const n = (v, a, b, def) => (Number.isFinite(+v) ? clamp(+v, a, b) : def);
    out.items.push({ id: typeof it.id === 'string' ? it.id.slice(0, 40) : uid(), type: it.type, x: n(it.x, -50, 50, 0), y: n(it.y, -50, 50, 0),
      w: n(it.w, 0.2, 6, 1), d: n(it.d, 0.2, 6, 1), rot: n(it.rot, -7, 7, 0), sizeIdx: Math.round(n(it.sizeIdx, 0, 9, 0)),
      style: typeof it.style === 'string' ? it.style.slice(0, 20) : undefined });
  }
  return out;
}
// Walls with openings
// Spielzeug-Wände: warmes Off-White, Schnittkante als leicht breitere, abgerundete Kappe (keine schwarzen Kanten)
const wallSideMat = new THREE.MeshStandardMaterial({ color: 0xf6efe4, roughness: 0.9 });
const wallTopMat = new THREE.MeshStandardMaterial({ color: 0xfdf8f0, roughness: 0.9 });
const capMat = new THREE.MeshStandardMaterial({ color: 0xfffbf4, roughness: 0.8 });
const CAP_3D = new THREE.Color(0xfffbf4), CAP_TOP = new THREE.Color(0xf4ebdd); // Draufsicht: etwas dunkler, damit der Plan liest
const glassMat = new THREE.MeshStandardMaterial({ color: 0xd6ecf6, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.5, depthWrite: false });
const frameMat = new THREE.MeshStandardMaterial({ color: 0xe6d3b8, roughness: 0.7 });
const CAP_B = 0.012, CAP_OVER = 0.008; // Fase, Überstand je Seite
// Draufsicht: weiche taupe Kante um die Wandkappen (nur dort sichtbar, damit der Plan liest; 3D ohne Konturen)
const edgeMat = new THREE.MeshBasicMaterial({ color: 0xa88f76 });
const edgeMeshes = [];
const CUT = Math.min(1.2, WH); // Schnitthöhe: Wände werden nur bis hier gezeigt (Grundriss-Schnitt)
const wallGroups = []; // {group, mats, nOut:[x,y], mid:[x,y], exterior}
// Schattenwerfer für den Sonnenmodus (Wände oberhalb der Schnitthöhe, Decke, Balkon darüber): unsichtbar, nur im Schatten
const casterMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
const sunCasters = [];
function addCaster(m) { m.castShadow = true; m.receiveShadow = false; m.visible = false; m.raycast = () => {}; m.userData.kind = 'caster'; scene.add(m); sunCasters.push(m); }
// Kontaktschatten-Streifen (Verlauf dunkel → transparent)
const AO_W = 0.28;
const aoGeo = (() => { const g = new THREE.PlaneGeometry(1, AO_W); g.rotateX(-Math.PI / 2); return g; })();
const aoMat = (() => {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(70,48,30,0.26)'); gr.addColorStop(0.35, 'rgba(70,48,30,0.09)'); gr.addColorStop(1, 'rgba(70,48,30,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
})();

function addWall(w) {
  const t = w.thickness || 0.2;
  const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1];
  const L = Math.hypot(dx, dy);
  if (L < 0.01) return;
  const ux = dx / L, uy = dy / L;
  // Öffnungen auf dieser Wand
  const ops = [];
  for (const o of openings) {
    const da = Math.abs((o.a[0] - w.a[0]) * uy - (o.a[1] - w.a[1]) * ux);
    const db = Math.abs((o.b[0] - w.a[0]) * uy - (o.b[1] - w.a[1]) * ux);
    if (da > t * 0.75 + 0.02 || db > t * 0.75 + 0.02) continue;
    let s0 = (o.a[0] - w.a[0]) * ux + (o.a[1] - w.a[1]) * uy;
    let s1 = (o.b[0] - w.a[0]) * ux + (o.b[1] - w.a[1]) * uy;
    if (s0 > s1) [s0, s1] = [s1, s0];
    if (s1 < 0.001 || s0 > L - 0.001) continue;
    ops.push({ o, s0: clamp(s0, 0, L), s1: clamp(s1, 0, L) });
  }
  ops.sort((p, q) => p.s0 - q.s0);
  // Sichtbarkeits-Materialien pro Außenwand (für Ausblenden)
  const ext = !!w.exterior;
  const side = ext ? wallSideMat.clone() : wallSideMat;
  const top = ext ? wallTopMat.clone() : wallTopMat;
  const mats = [side, side, top, side, side, side];
  // Wandseiten je Raum einfärben (Box-Seite +z zeigt nach (-uy, ux), −z entgegengesetzt)
  const roomAt = (x, y) => rooms.find((r) => pointInPoly(x, y, r.polygon));
  const extMat = new Map();
  const faceMat = (room) => {
    if (!room) return side;
    if (!ext) return roomWallMat(room.id);
    if (!extMat.has(room.id)) { const m = roomWallMat(room.id).clone(); extMat.set(room.id, m); extRoomMats.push({ m, roomId: room.id }); }
    return extMat.get(room.id);
  };
  const matsCache = new Map();
  const matsAt = (sm) => {
    const px = w.a[0] + ux * sm, py = w.a[1] + uy * sm, off = t / 2 + 0.1;
    const rp = roomAt(px - uy * off, py + ux * off), rm = roomAt(px + uy * off, py - ux * off);
    const key = (rp ? rp.id : '-') + '|' + (rm ? rm.id : '-');
    if (!matsCache.has(key)) matsCache.set(key, [side, side, top, side, faceMat(rp), faceMat(rm)]);
    return matsCache.get(key);
  };
  const frame = ext ? frameMat.clone() : frameMat;
  const glass = ext ? glassMat.clone() : glassMat;
  const cap = ext ? capMat.clone() : capMat;
  const capGeos = [], edgeGeos = [], upCapGeos = [];
  const group = new THREE.Group();
  // Diorama: Wandteile oberhalb der Schnitthöhe (nur Außenwände) – sichtbar, wenn die Wand hinten liegt
  const upper = ext ? new THREE.Group() : null;
  if (upper) { upper.visible = false; group.add(upper); }
  const ang = -Math.atan2(dy, dx);
  const ext0 = t / 2; // Ecken schließen
  const box = (s0, s1, y0, y1, extend0 = 0, extend1 = 0) => {
    // Sonnenmodus: unsichtbarer Schattenwerfer für den Wandteil über der Schnitthöhe (Licht nur durch Fenster)
    if (y1 > CUT + 0.01) {
      const ya = Math.max(y0, CUT), len2 = s1 - s0 + extend0 + extend1, sm2 = (s0 - extend0 + s1 + extend1) / 2;
      if (len2 > 0.005) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(len2, y1 - ya, t), casterMat);
        c.position.set(w.a[0] + ux * sm2, (ya + y1) / 2, w.a[1] + uy * sm2); c.rotation.y = ang;
        addCaster(c);
      }
    }
    // weicher Kontaktschatten am Boden entlang der Wand (beide Raumseiten)
    if (y0 === 0) {
      const len2 = s1 - s0 + extend0 + extend1, sm2 = (s0 - extend0 + s1 + extend1) / 2;
      for (const sg of [1, -1]) {
        const off = t / 2 + 0.002, px = w.a[0] + ux * sm2 - uy * sg * off, py = w.a[1] + uy * sm2 + ux * sg * off;
        if (!roomAt(px - uy * sg * 0.15, py + ux * sg * 0.15)) continue;
        const a = new THREE.Mesh(aoGeo, aoMat);
        a.scale.set(len2, 1, 1);
        a.position.set(px - uy * sg * AO_W / 2, 0.0031, py + ux * sg * AO_W / 2);
        a.rotation.y = ang + (sg > 0 ? 0 : Math.PI);
        a.raycast = () => {}; a.renderOrder = -1;
        group.add(a);
      }
    }
    if (upper && y1 > CUT + 0.01) {
      const ya = Math.max(y0, CUT), len2 = s1 - s0 + extend0 + extend1, sm2 = (s0 - extend0 + s1 + extend1) / 2;
      if (len2 > 0.005) {
        const um = new THREE.Mesh(new THREE.BoxGeometry(len2, y1 - ya, t), matsAt(sm2));
        um.position.set(w.a[0] + ux * sm2, (ya + y1) / 2, w.a[1] + uy * sm2); um.rotation.y = ang;
        um.castShadow = true; um.receiveShadow = true; um.userData.kind = 'wall';
        upper.add(um);
        if (y1 >= WH - 1e-4) {
          const cl = len2 + 2 * CAP_OVER - 2 * CAP_B, cw = t + 2 * CAP_OVER - 2 * CAP_B;
          const shp = new THREE.Shape(); shp.moveTo(-cl / 2, -cw / 2); shp.lineTo(cl / 2, -cw / 2); shp.lineTo(cl / 2, cw / 2); shp.lineTo(-cl / 2, cw / 2); shp.closePath();
          const g = new THREE.ExtrudeGeometry(shp, { depth: 0.018, bevelEnabled: true, bevelThickness: CAP_B, bevelSize: CAP_B, bevelSegments: 2 });
          g.rotateX(-Math.PI / 2); g.rotateY(ang); g.translate(um.position.x, WH - 0.014, um.position.z);
          upCapGeos.push(g);
        }
      }
    }
    y1 = Math.min(y1, CUT); // oberhalb der Schnitthöhe nichts zeichnen
    const len = s1 - s0 + extend0 + extend1, h = y1 - y0;
    if (len < 0.005 || h < 0.005) return;
    const sm = (s0 - extend0 + s1 + extend1) / 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), matsAt(sm));
    m.position.set(w.a[0] + ux * sm, y0 + h / 2, w.a[1] + uy * sm);
    m.rotation.y = ang; m.castShadow = true; m.receiveShadow = true; m.userData.kind = 'wall';
    group.add(m);
    box.last = m;
    if (y1 >= CUT - 1e-4) {
      // abgerundete Kappe auf der Schnittkante (wird je Wand zu einem Mesh zusammengeführt)
      const cl = len + 2 * CAP_OVER - 2 * CAP_B, cw = t + 2 * CAP_OVER - 2 * CAP_B;
      const shp = new THREE.Shape(); shp.moveTo(-cl / 2, -cw / 2); shp.lineTo(cl / 2, -cw / 2); shp.lineTo(cl / 2, cw / 2); shp.lineTo(-cl / 2, cw / 2); shp.closePath();
      const g = new THREE.ExtrudeGeometry(shp, { depth: 0.018, bevelEnabled: true, bevelThickness: CAP_B, bevelSize: CAP_B, bevelSegments: 2 });
      g.rotateX(-Math.PI / 2); g.rotateY(ang); g.translate(m.position.x, CUT - 0.014, m.position.z);
      capGeos.push(g);
      const e = new THREE.BoxGeometry(len + 0.09, 0.01, t + 0.09);
      e.rotateY(ang); e.translate(m.position.x, CUT - 0.03, m.position.z);
      edgeGeos.push(e);
    }
  };
  let cur = 0;
  ops.forEach(({ o, s0, s1 }, i) => {
    if (s0 > cur) box(cur, s0, 0, WH, cur === 0 ? ext0 : 0, 0);
    const sill = o.type === 'window' ? (+o.sill || 0) : 0;
    const top = Math.min(WH, sill + (+o.height || (o.type === 'window' ? 1.4 : 2.05)));
    box.last = null;
    if (sill > 0) { box(s0, s1, 0, sill); if (box.last && o.type === 'window') box.last.userData.opening = o; }
    if (top < WH) box(s0, s1, top, WH);
    if (o.type === 'window' || o.type === 'balcony-door') {
      const gTop = Math.min(top, CUT);
      const len = s1 - s0, h = Math.max(0.05, gTop - sill), sm = (s0 + s1) / 2;
      const g = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.02), glass);
      g.position.set(w.a[0] + ux * sm, sill + h / 2, w.a[1] + uy * sm); g.rotation.y = ang; g.renderOrder = 2;
      g.userData.kind = 'glass'; g.userData.opening = o;
      group.add(g);
      if (upper && top > CUT + 0.02) {
        // Diorama: oberer Fensterteil + Rahmen oben
        const y0u = Math.max(sill, CUT), hu = top - y0u;
        const gu = new THREE.Mesh(new THREE.BoxGeometry(len, hu, 0.02), glass);
        gu.position.set(w.a[0] + ux * sm, y0u + hu / 2, w.a[1] + uy * sm); gu.rotation.y = ang; gu.renderOrder = 2;
        gu.userData.kind = 'glass'; gu.userData.opening = o; upper.add(gu);
        const fu = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.07), frame);
        fu.position.set(w.a[0] + ux * sm, top - 0.02, w.a[1] + uy * sm); fu.rotation.y = ang; fu.userData.opening = o; upper.add(fu);
        if (len > 1.3 && o.type === 'window') {
          const fm = new THREE.Mesh(new THREE.BoxGeometry(0.04, hu, 0.07), frame);
          fm.position.set(w.a[0] + ux * sm, y0u + hu / 2, w.a[1] + uy * sm); fm.rotation.y = ang; fm.userData.opening = o; upper.add(fm);
        }
      }
      // schlanker Rahmen
      const fr = 0.04;
      [[len, fr, sill + fr / 2], [len, fr, sill + h - fr / 2]].forEach(([l, hh, y]) => {
        const f = new THREE.Mesh(new THREE.BoxGeometry(l, hh, 0.07), frame);
        f.position.set(w.a[0] + ux * sm, y, w.a[1] + uy * sm); f.rotation.y = ang; f.userData.opening = o; group.add(f);
      });
      if (len > 1.3 && o.type === 'window') {
        const f = new THREE.Mesh(new THREE.BoxGeometry(fr, h, 0.07), frame);
        f.position.set(w.a[0] + ux * sm, sill + h / 2, w.a[1] + uy * sm); f.rotation.y = ang; f.userData.opening = o; group.add(f);
      }
    }
    cur = Math.max(cur, s1);
    void i;
  });
  if (cur < L) box(cur, L, 0, WH, cur === 0 ? ext0 : 0, ext0);
  else if (ops.length) { /* Öffnung bis Wandende */ }
  let capMesh = null;
  if (upCapGeos.length) {
    const um = new THREE.Mesh(mergeGeos(upCapGeos), cap);
    upCapGeos.forEach((g) => g.dispose());
    um.castShadow = true; um.receiveShadow = true; um.userData.kind = 'wall'; um.userData.cap = true;
    upper.add(um);
  }
  if (capGeos.length) {
    const cm = new THREE.Mesh(mergeGeos(capGeos), cap); capMesh = cm;
    capGeos.forEach((g) => g.dispose());
    cm.castShadow = true; cm.receiveShadow = true; cm.userData.kind = 'wall'; cm.userData.cap = true;
    group.add(cm);
    const em = new THREE.Mesh(mergeGeos(edgeGeos), edgeMat);
    edgeGeos.forEach((g) => g.dispose());
    em.visible = false; em.userData.kind = 'edge'; em.raycast = () => {};
    group.add(em); edgeMeshes.push(em);
  }
  scene.add(group);
  const mid = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
  let n = [uy, -ux];
  if ((mid[0] - cx0) * n[0] + (mid[1] - cy0) * n[1] < 0) n = [-n[0], -n[1]];
  wallGroups.push({ group, mats: ext ? [side, top, frame, cap, ...extMat.values()] : null, glass: ext ? glass : null, nOut: n, mid, exterior: ext, fade: 1, upper, capMesh, tall: false });
}
(FP.walls || []).forEach(addWall);
{
  // Decke als Schattenwerfer (Licht nur durch die Fenster), dazu der Balkon des Geschosses darüber
  const c = new THREE.Mesh(new THREE.BoxGeometry(bbox.maxX - bbox.minX + 0.6, 0.3, bbox.maxY - bbox.minY + 0.6), casterMat);
  c.position.set(cx0, WH + 0.15, cy0); addCaster(c);
  if (balcony) {
    const b = polyBox(balcony.polygon);
    const bc = new THREE.Mesh(new THREE.BoxGeometry(b.maxX - b.minX, 0.18, b.maxY - b.minY), casterMat);
    bc.position.set((b.minX + b.maxX) / 2, WH + 0.25, (b.minY + b.maxY) / 2); bc.userData.balconyAbove = true; addCaster(bc);
  }
}

// Türaufschlag wie im Plan: Türblatt (Linie) + Viertelkreis auf dem Boden, öffnet in den Raum, Band an der Raumecke
const doorMat = new THREE.LineBasicMaterial({ color: 0x8c7258, transparent: true, opacity: 0.55 });
const doorLeafMat = new THREE.MeshBasicMaterial({ color: 0x8c7258, transparent: true, opacity: 0.7 });
const doorSwings = [];
function addDoorSwing(o) {
  const L = segLen(o); if (L < 0.3) return;
  const ux = (o.b[0] - o.a[0]) / L, uy = (o.b[1] - o.a[1]) / L;
  const hw = openingHalfWall(o);
  const mid = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
  // Seite: in den Raum roomId (sonst in den größeren angrenzenden Raum)
  let n = null;
  const cand = [[-uy, ux], [uy, -ux]];
  const roomAt = (q) => rooms.find((r) => pointInPoly(q[0], q[1], r.polygon));
  const target = o.roomId && rooms.find((r) => r.id === o.roomId);
  for (const c of cand) {
    const q = [mid[0] + c[0] * (hw + 0.25), mid[1] + c[1] * (hw + 0.25)];
    const r = roomAt(q);
    if (target ? r === target : r && (!n || (r.area || polyArea(r.polygon)) > n.area)) n = { v: c, area: r ? (r.area || polyArea(r.polygon)) : 0 };
  }
  if (!n) n = { v: cand[0] };
  const [nx, ny] = n.v;
  // Band: Türende, das näher an einer Raumecke liegt
  const room = roomAt([mid[0] + nx * (hw + 0.25), mid[1] + ny * (hw + 0.25)]);
  const cornerD = (e) => (room ? Math.min(...room.polygon.map((q) => Math.hypot(q[0] - e[0], q[1] - e[1]))) : 0);
  const ea = [o.a[0] + nx * hw, o.a[1] + ny * hw], eb = [o.b[0] + nx * hw, o.b[1] + ny * hw];
  const hingeA = cornerD(ea) <= cornerD(eb);
  const h = hingeA ? ea : eb, f = hingeA ? eb : ea; // Band, freies Ende (geschlossen)
  const w = L, y = 0.012;
  const tip = [h[0] + nx * w, h[1] + ny * w];
  // Bogen vom geschlossenen freien Ende zur offenen Blattspitze
  const a0 = Math.atan2(f[1] - h[1], f[0] - h[0]), a1 = Math.atan2(ny, nx);
  let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = a0 + da * (i / 24); pts.push(new THREE.Vector3(h[0] + Math.cos(t) * w, y, h[1] + Math.sin(t) * w)); }
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), doorMat);
  arc.userData.kind = 'door'; scene.add(arc);
  const leaf = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.035), doorLeafMat);
  leaf.position.set((h[0] + tip[0]) / 2, y, (h[1] + tip[1]) / 2);
  // PlaneGeometry liegt nach rotation.x in XZ; Ausrichtung entlang (nx, ny)
  leaf.rotation.set(-Math.PI / 2, 0, -Math.atan2(ny, nx));
  leaf.userData.kind = 'door'; scene.add(leaf);
  doorSwings.push({ o, hinge: h, tip, free: f });
}
openings.filter((o) => o.type === 'door').forEach(addDoorSwing);

/* ------------------------------------------------------------------ */
/* Plant models                                                        */
/* ------------------------------------------------------------------ */
const potMat = new THREE.MeshStandardMaterial({ color: 0xc26b47, roughness: 0.85 });
const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3e, roughness: 0.9 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0xd8c09a, roughness: 0.8 });
const sillMat = new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.6 });
const leafMats = new Map();
function leafMat(color, k = 0) {
  const key = color + '|' + k;
  if (!leafMats.has(key)) {
    const c = new THREE.Color(color || '#4f7a5a');
    if (k) c.offsetHSL(0, 0, k);
    leafMats.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true }));
  }
  return leafMats.get(key);
}
// deterministischer Zufall pro Pflanze
function rng(seed) {
  let s = 0; for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 10000) / 10000; };
}
const sphereGeo = new THREE.IcosahedronGeometry(1, 1);
const coneGeo = new THREE.ConeGeometry(1, 1, 5, 1);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 7);

// Möbel unter der Pflanze: ab 60 cm Tisch (Platte + 4 Beine), ab 25 cm runder Hocker, darunter ein Holzpodest
const legMat = new THREE.MeshStandardMaterial({ color: 0xa98763, roughness: 0.8 });
const topMat = new THREE.MeshStandardMaterial({ color: 0xd9bf96, roughness: 0.7 });
function buildStand(root, standM, d, R) {
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; m.userData.kind = 'stand';
    root.add(m); return m;
  };
  if (standM >= 0.6) {
    // Tisch: Platte etwas größer als der Topf (mind. 60 × 60 cm), leicht gedreht wirkt wohnlicher
    const sz = Math.max(0.6, d + 0.25), th = 0.035, leg = 0.045, ins = 0.05;
    const grp = new THREE.Group(); root.add(grp);
    grp.rotation.y = (R() - 0.5) * 0.5;
    const tp = new THREE.Mesh(new THREE.BoxGeometry(sz, th, sz * 0.85), topMat);
    tp.position.y = standM - th / 2; grp.add(tp);
    const lg = new THREE.BoxGeometry(leg, standM - th, leg);
    for (const [sx, sz2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const m = new THREE.Mesh(lg, legMat);
      m.position.set(sx * (sz / 2 - ins), (standM - th) / 2, sz2 * (sz * 0.85 / 2 - ins)); grp.add(m);
    }
    // Zarge
    const ap = 0.06;
    for (const [w, dd, x, z] of [[sz - 2 * ins, 0.02, 0, sz * 0.85 / 2 - ins], [sz - 2 * ins, 0.02, 0, -(sz * 0.85 / 2 - ins)], [0.02, sz * 0.85 - 2 * ins, sz / 2 - ins, 0], [0.02, sz * 0.85 - 2 * ins, -(sz / 2 - ins), 0]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, ap, dd), legMat); m.position.set(x, standM - th - ap / 2, z); grp.add(m);
    }
    grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.kind = 'stand'; } });
  } else if (standM >= 0.25) {
    // Hocker: runde Sitzfläche, drei leicht gespreizte Beine
    const r = Math.max(0.17, d * 0.55 + 0.04), th = 0.035;
    add(new THREE.CylinderGeometry(r, r * 0.97, th, 28), topMat, 0, standM - th / 2, 0);
    const lh = standM - th, spread = r * 0.25;
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI * 2 / 3 + 0.4;
      const ix = Math.cos(a) * r * 0.62, iz = Math.sin(a) * r * 0.62;
      const m = add(new THREE.CylinderGeometry(0.016, 0.013, Math.hypot(lh, spread), 8), legMat, ix + Math.cos(a) * spread / 2, lh / 2, iz + Math.sin(a) * spread / 2);
      const phi = Math.atan2(spread, lh); // Fuß nach außen gespreizt
      m.rotation.set(-Math.sin(a) * phi, 0, Math.cos(a) * phi);
    }
    // Querring
    const ring = add(new THREE.TorusGeometry(r * 0.62 + spread * 0.55, 0.008, 6, 24), legMat, 0, lh * 0.45, 0);
    ring.rotation.x = Math.PI / 2;
  } else {
    const pw = d * 1.25 + 0.06;
    add(new THREE.BoxGeometry(pw, standM, pw), woodMat, 0, standM / 2, 0);
  }
}
function buildPlant(p) {
  const def = plantDef(p.plantId);
  const R = rng(p.uid + def.id);
  const root = new THREE.Group();
  const g = new THREE.Group(); // Pflanze inkl. Topf, auf Standhöhe angehoben
  const standM = (p.standCm || 0) / 100;
  g.position.y = standM; root.add(g);
  const d = p.potDiameterCm / 100;
  const model = PM.buildPlant(p.plantId, { potDiameterCm: p.potDiameterCm, plantHeightCm: p.plantHeightCm,
    color: def.color, shape: def.shape, hangBelowM: standM });
  g.add(model);
  applyLive(p, model);
  if (standM > 0) {
    const sw = sillOf(p);
    if (sw) {
      // Fensterbank: dünnes Brett entlang des Fensters, an der Wand-Innenseite
      const o = sw.o, L = segLen(o) || 1, n = openingNormal(o), hw = openingHalfWall(o);
      const dx = (o.b[0] - o.a[0]) / L, dy = (o.b[1] - o.a[1]) / L;
      const depth = 0.25, th = 0.03, len = Math.max(L, d + 0.1);
      const inner = hw - 0.02 + depth / 2; // Abstand Brettmitte zur Fensterachse (nach innen)
      const cxp = o.a[0] + dx * (L / 2) - n[0] * inner, cyp = o.a[1] + dy * (L / 2) - n[1] * inner;
      const board = new THREE.Mesh(new THREE.BoxGeometry(len, th, depth), sillMat);
      board.position.set(cxp - p.x, standM - th / 2, cyp - p.y);
      board.rotation.y = -Math.atan2(dy, dx);
      board.castShadow = true; board.receiveShadow = true; board.userData.kind = 'stand';
      root.add(board);
    } else if (p.onItem && state.design && itemById(p.onItem)) {
      // steht auf einem Möbel aus „Wohnung gestalten“ – kein eigenes Möbel nötig
    } else {
      buildStand(root, standM, d, rng(p.uid));
    }
  }
  root.position.set(p.x, 0.003, p.y);
  if (analyze(p.x, p.y)?.outdoor) root.position.y = 0;
  root.userData.uid = p.uid;
  root.traverse((o) => { o.userData.uid = p.uid; });
  root.userData.standY = standM;
  root.userData.topY = standM + model.userData.topY;
  root.userData.potH = model.userData.potHeight;
  root.userData.potR = model.userData.potRadius;
  return root;
}
/* Lebendige Pflanzen: eigene Materialien je Pflanze (Wind + Durst), bleiben über Neuaufbauten erhalten */
const live = new Map(); // uid -> { u, mats, anim }
function liveOf(uid) {
  let L = live.get(uid);
  if (!L) {
    const h = [...String(uid)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const u = { uDroop: { value: 0 }, uPale: { value: 0 }, uPhase: { value: (h % 1000) / 1000 * 40 }, uRigid: { value: 0 }, uSway: { value: 1 } };
    L = { u, mats: PM.makeLiveMaterials(u), anim: false };
    live.set(uid, L);
  }
  return L;
}
function applyLive(p, model) {
  const L = liveOf(p.uid), rigid = PM.RIGID[p.plantId] || 0;
  L.u.uRigid.value = rigid;
  L.u.uSway.value = 1 - 0.75 * rigid;
  model.traverse((o) => { if (o.isMesh && L.mats[o.userData.part]) o.material = L.mats[o.userData.part]; });
  if (!L.anim) setThirst(p);
}
function dropLive(uid) {
  const L = live.get(uid); if (!L) return;
  Object.values(L.mats).forEach((m) => m.dispose());
  live.delete(uid);
}
// Durst: fällig = leicht hängend, überfällig = deutlich hängend + blass
function thirstOf(p) {
  if (!state.plants.includes(p)) return 0;
  const due = dueInfo(p, compute(p).r);
  if (!due.due) return 0;
  if (due.days === 0) return 0.3;
  return clamp(0.5 + (-due.days) / Math.max(2, due.iv) * 0.9, 0.5, 1);
}
function setThirst(p) {
  const L = live.get(p.uid); if (!L || L.anim) return;
  const t = thirstOf(p);
  L.u.uDroop.value = t;
  L.u.uPale.value = t > 0.4 ? (t - 0.3) * 0.9 : 0;
}
const plantObjs = new Map(); // uid -> group
// Geometrien pro Pflanze freigeben (geteilte Geometrien + Material-Cache bleiben)
const SHARED_GEO = new Set([sphereGeo, coneGeo, cylGeo]);
function disposePlantGroup(g) {
  const models = [];
  g.traverse((o) => { if (o.userData && o.userData.species) models.push(o); });
  models.forEach((m) => { m.parent && m.parent.remove(m); PM.disposePlant(m); });
  g.traverse((o) => { if (o.geometry && !SHARED_GEO.has(o.geometry)) o.geometry.dispose(); });
}
function syncPlantObj(p) {
  const old = plantObjs.get(p.uid);
  if (old) { scene.remove(old); disposePlantGroup(old); }
  const g = buildPlant(p);
  scene.add(g); plantObjs.set(p.uid, g);
  shadowsDirty();
}
function removePlantObj(id) {
  if (!state.plants.some((q) => q.uid === id) && draft?.uid !== id) dropLive(id);
  const old = plantObjs.get(id);
  if (old) { scene.remove(old); disposePlantGroup(old); plantObjs.delete(id); }
  shadowsDirty();
}

// selection ring
const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0x4f7a5a, transparent: true, opacity: 0.9, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 3;
scene.add(ring);
const ringFill = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), new THREE.MeshBasicMaterial({ color: 0x4f7a5a, transparent: true, opacity: 0.14, depthWrite: false }));
ringFill.rotation.x = -Math.PI / 2; ringFill.visible = false; ringFill.renderOrder = 3;
scene.add(ringFill);
// gestrichelte Linie Pflanze → nächstes Fenster (auf dem Boden) + Distanz-Label
const distLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]),
  new THREE.LineDashedMaterial({ color: 0x2f74d0, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.95, depthTest: false }));
distLine.visible = false; distLine.renderOrder = 4; distLine.userData.mid = new THREE.Vector3();
scene.add(distLine);
// nächster Punkt auf dem nächsten Fenster des Raums (Wand-Innenseite)
function windowTarget(p) {
  const room = rooms.find((r) => pointInPoly(p.x, p.y, r.polygon));
  if (!room) return null;
  const best = nearestOpening(p.x, p.y, windowsOfRoom(room));
  if (!best) return null;
  const o = best.o, L = segLen(o) || 1, n = openingNormal(o), hw = openingHalfWall(o);
  const dx = (o.b[0] - o.a[0]) / L, dy = (o.b[1] - o.a[1]) / L;
  const t = clamp((p.x - o.a[0]) * dx + (p.y - o.a[1]) * dy, 0, L);
  return { o, d: best.d, pt: [o.a[0] + dx * t - n[0] * hw, o.a[1] + dy * t - n[1] * hw], mid: [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2] };
}
function updateDistLine(p) {
  const w = p && windowTarget(p);
  if (!w) { distLine.visible = false; distLabel.textContent = ''; requestRender(); return; }
  const y = 0.03;
  const pos = distLine.geometry.attributes.position;
  pos.setXYZ(0, p.x, y, p.y); pos.setXYZ(1, w.pt[0], y, w.pt[1]); pos.needsUpdate = true;
  distLine.geometry.computeBoundingSphere();
  distLine.computeLineDistances();
  distLine.userData.mid.set((p.x + w.pt[0]) / 2, y, (p.y + w.pt[1]) / 2);
  distLine.visible = true;
  distLabel.textContent = `${fmt1(Math.round(w.d * 10) / 10)} m`;
  distLabel._w = null;
  requestRender();
}

/* ------------------------------------------------------------------ */
/* Camera + controls                                                   */
/* ------------------------------------------------------------------ */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.9;
controls.screenSpacePanning = false; // Pan auf der Bodenebene
controls.minDistance = 1.2;
controls.maxDistance = span * 3;
controls.minPolarAngle = 0;
controls.maxPolarAngle = THREE.MathUtils.degToRad(72);
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
const HOME_TARGET = new THREE.Vector3(cx0, 0, cy0 + (balcony ? 0 : 0));
let viewMode = '3d';
// Breiter Grundriss auf Hochformat-Bildschirm: Plan um 90° drehen, damit er den Screen füllt
function baseAzimuthDeg() {
  const pw = bbox.maxX - bbox.minX, pd = bbox.maxY - bbox.minY;
  return (W / H < 0.9 && pw > pd * 1.15) ? -90 : 0;
}
const fitCam = new THREE.PerspectiveCamera();
// Fit-Punkte: Raumecken, Balkon und Wandenden (nicht die Bounding-Box inkl. Treppenhaus), Boden + Schnitthöhe
const fitPts = [];
{
  const P = [];
  rooms.forEach((r) => P.push(...r.polygon));
  if (balcony) P.push(...balcony.polygon);
  // Außenwände: Ecken des Wandkörpers (inkl. Dicke)
  (FP.walls || []).filter((w) => w.exterior).forEach((w) => {
    const t = (w.thickness || 0.2) / 2, L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
    const ux = (w.b[0] - w.a[0]) / L * t, uy = (w.b[1] - w.a[1]) / L * t;
    for (const e of [[w.a, -1], [w.b, 1]]) for (const sg of [-1, 1]) P.push([e[0][0] + ux * e[1] - uy * sg, e[0][1] + uy * e[1] + ux * sg]);
  });
  P.forEach((q) => { fitPts.push(new THREE.Vector3(q[0], 0, q[1]), new THREE.Vector3(q[0], CUT, q[1])); });
}
function poseAt(polarDeg, azDeg, dist, t) {
  const p = THREE.MathUtils.degToRad(polarDeg), a = THREE.MathUtils.degToRad(azDeg);
  return new THREE.Vector3(t.x + dist * Math.sin(p) * Math.sin(a), t.y + dist * Math.cos(p), t.z + dist * Math.sin(p) * Math.cos(a));
}
// Freier Bildbereich (NDC) zwischen Kopfzeile und unterer Leiste bzw. Sheet
function bottomUiTop() {
  let t = $('pf-bottom').getBoundingClientRect().top || H - 60;
  for (const id of ['pf-lp', 'pf-bb', 'pf-sp']) { const e = $(id); if (e && !e.classList.contains('hide')) t = Math.min(t, e.getBoundingClientRect().top); }
  return t;
}
function freeRect(bottomPx) {
  const hb = $('pf-list-btn').getBoundingClientRect().bottom || 54;
  const top = hb + 24; // Platz für Pflanzen-Marker über den Pflanzen
  const bot = bottomPx != null ? bottomPx : (bottomUiTop() - 6);
  const mx = 8;
  return { x0: -1 + 2 * mx / W, x1: 1 - 2 * mx / W, y0: 1 - 2 * bot / H, y1: 1 - 2 * top / H };
}
const vA = new THREE.Vector3();
function projBox(pts) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const c of pts) { vA.copy(c).project(fitCam); if (vA.z > 1) return null; x0 = Math.min(x0, vA.x); x1 = Math.max(x1, vA.x); y0 = Math.min(y0, vA.y); y1 = Math.max(y1, vA.y); }
  return { x0, x1, y0, y1 };
}
const ray = new THREE.Raycaster();
function groundAt(nx, ny, yPlane) {
  ray.setFromCamera(new THREE.Vector2(nx, ny), fitCam);
  const o = ray.ray.origin, d = ray.ray.direction;
  const k = Math.abs(d.y) < 1e-6 ? 0 : (yPlane - o.y) / d.y;
  return new THREE.Vector3(o.x + d.x * k, yPlane, o.z + d.z * k);
}
// Distanz + Ziel so wählen, dass pts den Bereich rect möglichst füllen und darin zentriert sind
function fitPose(polarDeg, azDeg, pts, rect, minDist = 1) {
  fitCam.fov = BASE_FOV; fitCam.aspect = W / H; fitCam.near = 0.05; fitCam.far = 500; fitCam.clearViewOffset(); fitCam.updateProjectionMatrix();
  const t = new THREE.Vector3();
  pts.forEach((c) => t.add(c)); t.multiplyScalar(1 / pts.length); t.y = 0;
  const place = (d) => { fitCam.position.copy(poseAt(polarDeg, azDeg, d, t)); fitCam.up.set(0, 1, 0); fitCam.lookAt(t); fitCam.updateMatrixWorld(); };
  const rw = rect.x1 - rect.x0, rh = rect.y1 - rect.y0;
  let d = span * 2;
  for (let it = 0; it < 6; it++) {
    let lo = 0.5, hi = span * 10;
    for (let i = 0; i < 32; i++) {
      const m = (lo + hi) / 2; place(m);
      const b = projBox(pts);
      if (b && b.x1 - b.x0 <= rw && b.y1 - b.y0 <= rh) hi = m; else lo = m;
    }
    d = Math.max(hi, minDist); place(d);
    const b = projBox(pts); if (!b) break;
    const ca = groundAt((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0), cb = groundAt((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2, 0);
    const dx = ca.x - cb.x, dz = ca.z - cb.z;
    t.x += dx; t.z += dz;
    if (Math.hypot(dx, dz) < 0.005) break;
  }
  place(d);
  return { pos: fitCam.position.clone(), target: t.clone(), dist: d };
}
const POLAR_3D = 44; // ≈ 46° Blickneigung über dem Horizont (Diorama-Schrägsicht)
function camPose(mode) {
  const polar = mode === 'top' ? 0.01 : POLAR_3D;
  const az = baseAzimuthDeg() + (mode === 'top' ? 0 : -34); // über Eck: zwei Rückwände sichtbar
  const r = fitPose(polar, az, fitPts, freeRect());
  controls.maxDistance = Math.max(controls.maxDistance, r.dist * 1.6);
  return { pos: r.pos, target: r.target };
}
let tween = null;
function flyTo(pos, target, ms = 650) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), ms };
  requestRender();
}
// Pflanze + nächstes Fenster gemeinsam zeigen (oberhalb des Sheets), Abstand mind. 6 m
const FOCUS_MIN = 6 * Math.tan(THREE.MathUtils.degToRad(19)) / Math.tan(THREE.MathUtils.degToRad(26 / 2)); // ≈ gleicher Bildausschnitt wie früher mit 38°
function focusPlant(p) {
  const st = (p.standCm || 0) / 100, top = st + clamp(p.plantHeightCm / 100, 0.1, 2.5) + 0.12;
  const pts = [new THREE.Vector3(p.x, 0, p.y), new THREE.Vector3(p.x, top, p.y)];
  const w = windowTarget(p);
  if (w) {
    const o = w.o, sill = o.type === 'window' ? (+o.sill || 0) : 0;
    pts.push(new THREE.Vector3(w.pt[0], 0, w.pt[1]), new THREE.Vector3(w.pt[0], CUT, w.pt[1]));
    pts.push(new THREE.Vector3(w.mid[0], sill, w.mid[1]));
  }
  // aktuelle Blickrichtung (Azimut) beibehalten
  const off = camera.position.clone().sub(controls.target);
  const sph = new THREE.Spherical().setFromVector3(off);
  const az = THREE.MathUtils.radToDeg(sph.theta);
  const polar = viewMode === 'top' ? 0.01 : 40;
  // sichtbarer Bereich über dem Sheet (Sheet-Offset wird über setViewOffset ausgeglichen)
  const hb = $('pf-list-btn').getBoundingClientRect().bottom || 54;
  const sheetTop = sheet.classList.contains('open') ? H - Math.min(sheet.offsetHeight, H * 0.7) : H - 70;
  const half = Math.max(40, (sheetTop - (hb + 8)) / 2 - 30); // Rand für Marker
  const ky = half / (H / 2);
  // fitPose arbeitet ohne Offset; Zentrum entspricht bei Offset der Mitte des freien Bereichs
  const r = fitPose(polar, az, pts, { x0: -0.62, x1: 0.62, y0: -ky, y1: ky }, FOCUS_MIN);
  flyTo(r.pos, r.target);
}
function setViewMode(m) {
  viewMode = m;
  document.querySelectorAll('#pf-viewseg button').forEach((b) => b.classList.toggle('on', b.dataset.v === m));
  const { pos, target } = camPose(m);
  flyTo(pos, target, 750);
  shadowsDirty();
}

/* ------------------------------------------------------------------ */
/* Render loop                                                         */
/* ------------------------------------------------------------------ */
let dirty = true;
function requestRender() { dirty = true; }
// Nur bei echter Kamerabewegung rendern: OrbitControls meldet sonst bei manchen Zielpunkten jedes Frame eine
// „Änderung“ (target.clampLength erzeugt Rundungsrauschen) → Dauer-Rendering.
const lastCam = { p: new THREE.Vector3(Infinity, 0, 0), q: new THREE.Quaternion(), t: new THREE.Vector3() };
function camMoved() {
  const m = lastCam.p.distanceToSquared(camera.position) > 1e-12 || lastCam.t.distanceToSquared(controls.target) > 1e-12 || 1 - Math.abs(lastCam.q.dot(camera.quaternion)) > 1e-12;
  if (m) { lastCam.p.copy(camera.position); lastCam.q.copy(camera.quaternion); lastCam.t.copy(controls.target); }
  return m;
}
controls.addEventListener('change', () => { if (camMoved()) requestRender(); });

let sheetOffset = 0, sheetOffsetTarget = 0;
let W = 1, H = 1;
function resize() {
  const r = appEl.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  renderer.setSize(W, H, false);
  if (selected && !moveMode && sheet.classList.contains('open')) sheetOffsetTarget = sheetHeight();
  applyViewOffset();
  requestRender();
}
const BASE_FOV = 26; // eng = fast isometrischer Diorama-Look
function applyViewOffset() {
  // Bildmitte nach oben schieben, wenn ein Sheet offen ist (Maßstab bleibt gleich)
  if (sheetOffset > 0.5) {
    const fh = H + sheetOffset;
    camera.aspect = W / fh;
    camera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * fh / H));
    camera.setViewOffset(W, fh, 0, sheetOffset, W, H);
  } else {
    camera.aspect = W / H; camera.fov = BASE_FOV;
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const tmpV = new THREE.Vector3();
const camDir = new THREE.Vector3();

function clampTarget() {
  const t = controls.target;
  const m = 1.0;
  const nx = clamp(t.x, bbox.minX - m, bbox.maxX + m), nz = clamp(t.z, bbox.minY - m, bbox.maxY + m), ny = clamp(t.y, 0, 1.5);
  if (nx !== t.x || nz !== t.z || ny !== t.y) {
    const dx = nx - t.x, dy = ny - t.y, dz = nz - t.z;
    t.set(nx, ny, nz); camera.position.x += dx; camera.position.y += dy; camera.position.z += dz;
  }
  if (camera.position.y < 0.4) camera.position.y = 0.4;
}

let topShadowOff = null;
function applyWallShadows() {
  for (const wg of wallGroups) {
    // halbtransparente Vorderwände werfen weiter Schatten – sie existieren ja noch
    const cs = !topShadowOff;
    wg.group.children.forEach((c) => { if (c.userData.kind === 'wall' && c.castShadow !== cs) { c.castShadow = cs; renderer.shadowMap.needsUpdate = true; } });
  }
  dirty = true;
}
function updateWallFade() {
  camera.getWorldDirection(camDir);
  const tilt = Math.acos(clamp(-camDir.y, -1, 1)); // 0 = von oben
  // Draufsicht: Wände werfen keine Schatten (sonst doppelte Wandkanten)
  const off = tilt < 0.3;
  // Geschosse darüber nur im Schnitt-Modus (im Diorama würden sie die hohen Rückwände überdecken)
  const showAbove = !off && state.wallMode === 'cut';
  if (bldg.above && bldg.above.visible !== showAbove) { bldg.above.visible = showAbove; dirty = true; }
  if (off !== topShadowOff) {
    topShadowOff = off; applyWallShadows();
    // Draufsicht: Wandkappen etwas dunkler (Plan liest), 3D: helle Creme
    const cc = off ? CAP_TOP : CAP_3D;
    capMat.color.copy(cc); for (const wg of wallGroups) if (wg.mats) wg.mats[3].color.copy(cc);
    for (const e of edgeMeshes) e.visible = off;
  }
  // Diorama: Außenwände auf der abgewandten Seite in voller Höhe (wie ein aufgeschnittenes Puppenhaus)
  const dio = state.wallMode === 'diorama' && !off && !orient.on;
  let tallCh = false;
  for (const wg of wallGroups) {
    if (!wg.upper) continue;
    let want = false;
    if (dio) {
      const vx = camera.position.x - wg.mid[0], vz = camera.position.z - wg.mid[1];
      const facing = (vx * wg.nOut[0] + vz * wg.nOut[1]) / (Math.hypot(vx, vz) || 1);
      // Hysterese, damit Wände beim Drehen nicht flackern
      want = wg.tall ? facing < -0.12 : facing < -0.22;
    }
    if (want !== wg.tall) {
      wg.tall = want; wg.upper.visible = want;
      if (wg.capMesh) wg.capMesh.visible = !want;
      tallCh = true;
    }
  }
  if (tallCh) shadowsDirty();
  // Flacher Blick: Außenwände zwischen Kamera und Wohnung halbtransparent (Cutaway)
  let changed = false;
  for (const wg of wallGroups) {
    if (!wg.exterior) continue;
    const vx = camera.position.x - wg.mid[0], vz = camera.position.z - wg.mid[1];
    const facing = (vx * wg.nOut[0] + vz * wg.nOut[1]) / (Math.hypot(vx, vz) || 1);
    const want = tilt > 0.95 && facing > 0.25 ? 0.3 : 1;
    if (Math.abs(wg.fade - want) > 0.005) {
      wg.fade += (want - wg.fade) * 0.25;
      if (Math.abs(wg.fade - want) < 0.01) wg.fade = want;
      const tr = wg.fade < 0.999;
      for (const m of wg.mats) {
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        m.opacity = wg.fade; m.depthWrite = !tr;
      }
      wg.glass.opacity = glassMat.opacity * wg.fade;
      changed = true; dirty = true;
    }
  }
  if (changed) applyWallShadows();
}

/* Gebäude: die Wohnung als Teil eines Hauses – Geschosse darunter als weiße, durchscheinende Baukörper,
 * darüber nur als feine Umrisslinien (verdecken nichts) */
const SH = 3.0; // Geschosshöhe
const bldg = { group: null, above: null };
const facadeWinMats = []; // Fensterflächen der Fassade (leuchten nachts)
const bldgMat = new THREE.MeshStandardMaterial({ color: 0xb8c7d6, roughness: 0.95, transparent: true, opacity: 0.5, depthWrite: false });
function buildBuilding() {
  facadeWinMats.length = 0;
  if (bldg.group) { scene.remove(bldg.group); bldg.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== bldgMat) o.material.dispose(); }); }
  const g = new THREE.Group(); g.raycast = () => {};
  const above = new THREE.Group();
  const B = state.building || { floor: 1, total: 1 };
  const nBelow = Math.max(0, B.floor - 1), nAbove = Math.max(0, B.total - B.floor);
  // Hausgrundriss: Rechteck um alle Räume inkl. Außenwände
  const pad = Math.max(0.2, ...(FP.walls || []).filter((w) => w.exterior).map((w) => w.thickness || 0.2)) * 0.5 + 0.02;
  const rb = rooms.reduce((b, r) => { const q = polyBox(r.polygon); return { x0: Math.min(b.x0, q.minX), x1: Math.max(b.x1, q.maxX), y0: Math.min(b.y0, q.minY), y1: Math.max(b.y1, q.maxY) }; }, { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
  const X0 = rb.x0 - pad, X1 = rb.x1 + pad, Y0 = rb.y0 - pad, Y1 = rb.y1 + pad, BW = X1 - X0, BD = Y1 - Y0, CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
  const glassM = (op) => new THREE.MeshBasicMaterial({ color: 0x9fb4bf, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  const lineM = (op) => new THREE.LineBasicMaterial({ color: 0x8fa3b8, transparent: true, opacity: op, depthWrite: false });
  const balB = balcony ? polyBox(balcony.polygon) : null;
  // Fassade nach unten: exakt der Grundriss (Räume + Außenwände), bündig mit der Wandaußenkante.
  // Opak; tiefere Geschosse verschwimmen farblich in den Hintergrund.
  const fpGeo = (h) => {
    const list = rooms.map((r) => {
      const sh = new THREE.Shape(); r.polygon.forEach((q, i) => (i ? sh.lineTo(q[0], -q[1]) : sh.moveTo(q[0], -q[1])));
      const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g;
    });
    (FP.walls || []).filter((w) => w.exterior).forEach((w) => {
      const t = w.thickness || 0.2, L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]); if (L < 0.01) return;
      const g = new THREE.BoxGeometry(L + t, h, t);
      g.rotateY(-Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0])); g.translate((w.a[0] + w.b[0]) / 2, h / 2, (w.a[1] + w.b[1]) / 2);
      list.push(g);
    });
    const m = mergeGeos(list); list.forEach((g) => g.dispose()); return m;
  };
  const facWins2 = lightOpenings.map((o) => {
    const n = openingNormal(o), L = segLen(o), off = openingHalfWall(o) + 0.012;
    const sill = o.type === 'window' ? (+o.sill || 0.9) : 0;
    return { x: (o.a[0] + o.b[0]) / 2 + n[0] * off, y: (o.a[1] + o.b[1]) / 2 + n[1] * off, rot: Math.atan2(n[0], n[1]), w: L, sill, h: Math.min(+o.height || (o.type === 'window' ? 1.4 : 2.1), SH - 0.5 - sill) };
  });
  const FAC = new THREE.Color(0xe6dccb), BGC = new THREE.Color(0xe9dfce); // Fassade läuft ins warme Papier des Hintergrunds aus
  const SLAB_BOT = -0.19, GAP = 0.035; // Unterkante Bodenplatte der Wohnung; feine Geschossfuge
  const floorH = SH - GAP;
  const geoF = nBelow ? fpGeo(floorH) : null;
  for (let k = 1; k <= nBelow; k++) {
    const mix = Math.min(0.9, (k - 1) * 0.2);
    const yTop = SLAB_BOT - (k - 1) * SH, yBot = yTop - floorH;
    const mat = new THREE.MeshStandardMaterial({ color: FAC.clone().lerp(BGC, mix), roughness: 0.95 });
    const box = new THREE.Mesh(geoF, mat);
    box.position.y = yBot; box.receiveShadow = true; box.userData.shared = true; g.add(box);
    const fl = yTop - floorH + 0.2; // Fußboden dieses Geschosses (≈)
    const winM = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x9fb6c6).lerp(BGC, mix * 0.6), roughness: 0.3, emissive: 0xffb15e, emissiveIntensity: 0, side: THREE.DoubleSide });
    facadeWinMats.push(winM);
    for (const wv of facWins2) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(wv.w, wv.h), winM);
      pl.position.set(wv.x, fl + wv.sill + wv.h / 2, wv.y); pl.rotation.y = wv.rot; g.add(pl);
    }
    if (balB) {
      const bm = new THREE.MeshStandardMaterial({ color: FAC.clone().lerp(BGC, mix), roughness: 0.95 });
      const bb = new THREE.Mesh(new THREE.BoxGeometry(balB.maxX - balB.minX, 0.16, balB.maxY - balB.minY), bm);
      bb.position.set((balB.minX + balB.maxX) / 2, fl - 0.08, (balB.minY + balB.maxY) / 2); g.add(bb);
      const be = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(balB.maxX - balB.minX, 0.9, balB.maxY - balB.minY)), lineM(0.4 * (1 - mix)));
      be.position.set(bb.position.x, fl + 0.45, bb.position.z); g.add(be);
    }
  }
  // darüber: nur Umrisse je Geschoss
  // nur die Innenseiten (BackSide): wirken wie eine Kulisse hinter der Wohnung, verdecken nichts
  for (let k = 0; k < nAbove; k++) {
    const y0 = WH + 0.25 + k * SH, y1 = y0 + SH - 0.3;
    const m = new THREE.MeshBasicMaterial({ color: 0xfffaf2, transparent: true, opacity: 0.14 - k * 0.03, depthWrite: false, side: THREE.BackSide });
    const none = new THREE.MeshBasicMaterial({ visible: false });
    const bx = new THREE.Mesh(new THREE.BoxGeometry(BW, y1 - y0, BD), [m, m, none, none, m, m]); // ohne Boden/Decke
    bx.position.set(CX, (y0 + y1) / 2, CY); above.add(bx);
  }
  g.add(above);
  scene.add(g);
  bldg.group = g; bldg.above = above;
  if (plateShadow) plateShadow.visible = nBelow === 0;
  shadowsDirty();
}
function buildingLabel() { const B = state.building; return `${B.floor}. von ${B.total} Geschossen`; }

// overlay labels
const labelLayer = $('pf-labels');
const roomLabels = rooms.map((r) => {
  const el = document.createElement('div');
  el.className = 'pf-room';
  const area = r.area || polyArea(r.polygon);
  el.innerHTML = `${esc(r.name)}<small>${fmt1(area)} m²</small>`;
  labelLayer.appendChild(el);
  const c = centroid(r.polygon);
  return { el, pos: new THREE.Vector3(c[0], 0.05, c[1]), small: area < 3, poly: r.polygon };
});
if (balcony) {
  const el = document.createElement('div'); el.className = 'pf-room'; el.innerHTML = 'Balkon';
  labelLayer.appendChild(el);
  const c = centroid(balcony.polygon);
  roomLabels.push({ el, pos: new THREE.Vector3(c[0], 0.05, c[1]), small: false, poly: balcony.polygon });
}
const badge = document.createElement('div');
badge.className = 'pf-badge'; badge.style.display = 'none';
labelLayer.appendChild(badge);
const distLabel = document.createElement('div');
distLabel.className = 'pf-dist';
labelLayer.appendChild(distLabel);
const miniBadges = new Map(); // uid -> el

function toScreen(v) {
  tmpV.copy(v).project(camera);
  return { x: (tmpV.x * 0.5 + 0.5) * W, y: (-tmpV.y * 0.5 + 0.5) * H, behind: tmpV.z > 1 };
}
// Bildschirm-Rechtecke für Kollisionsprüfung: Größe einmalig messen
function measure(el, disp = 'block') {
  if (el._w == null) { el.style.display = disp; el._w = el.offsetWidth; el._h = el.offsetHeight; }
}
const hideEl = (el) => { if (el.style.display !== 'none') el.style.display = 'none'; };
function updateOverlay() {
  // Priorität: Auswahl (Badge + Distanz) > fällige Pflanzen > übrige Pflanzen > Raumnamen
  const placed = [];
  const free = (r) => !placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0);
  const put = (el, r, x, y, tf, disp = 'block') => {
    placed.push(r);
    if (el.style.display !== disp) el.style.display = disp;
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) ${tf}`;
  };
  const GAP = 3;
  // Pin-Rechteck: Element über dem Ankerpunkt, 8 px Abstand (inkl. Pfeil)
  const pinRect = (s, el) => ({ x0: s.x - el._w / 2 - GAP, x1: s.x + el._w / 2 + GAP, y0: s.y - 8 - el._h - GAP, y1: s.y - 3 });
  const selObj = selected && plantObjs.get(selected.uid);
  if (selObj && !moveMode) {
    const s = toScreen(tmpV.set(selObj.position.x, selObj.userData.topY + 0.08, selObj.position.z).clone());
    if (s.behind) hideEl(badge);
    else {
      badge._w = null; measure(badge);
      const dx = clamp(clamp(s.x, badge._w / 2 + 4, W - badge._w / 2 - 4) - s.x, -badge._w / 2 + 14, badge._w / 2 - 14);
      badge.style.setProperty('--ax', `${(-dx).toFixed(1)}px`);
      put(badge, pinRect({ x: s.x + dx, y: s.y }, badge), s.x + dx, s.y - 8, 'translate(-50%,-100%)');
    }
  } else hideEl(badge);
  if (selObj && !moveMode && distLine.visible && distLabel.textContent) {
    const s = toScreen(distLine.userData.mid);
    measure(distLabel);
    const r = { x0: s.x - distLabel._w / 2 - GAP, x1: s.x + distLabel._w / 2 + GAP, y0: s.y - distLabel._h / 2 - GAP, y1: s.y + distLabel._h / 2 + GAP };
    if (!s.behind && free(r)) put(distLabel, r, s.x, s.y, 'translate(-50%,-50%)'); else hideEl(distLabel);
  } else hideEl(distLabel);
  const items = [];
  for (const [id, el] of miniBadges) {
    const o = plantObjs.get(id);
    if (!o || (selected && selected.uid === id) || moveMode && selected && selected.uid === id) { hideEl(el); continue; }
    const s = toScreen(tmpV.set(o.position.x, o.userData.topY + 0.05, o.position.z).clone());
    items.push({ el, s, prio: +el.dataset.prio || 2 });
  }
  items.sort((a, b) => a.prio - b.prio || b.s.y - a.s.y); // fällig zuerst, dann vordere
  for (const { el, s } of items) {
    if (s.behind || s.x < -4 || s.x > W + 4) { hideEl(el); continue; }
    measure(el, 'flex');
    // Pille im Bild halten; bei Kollision seitlich versetzt probieren (Pfeil zeigt weiter auf die Pflanze)
    const lim = el._w / 2 - 12;
    const base = clamp(s.x, el._w / 2 + 4, W - el._w / 2 - 4) - s.x;
    let ok = false;
    for (const dx of [base, -lim, lim]) {
      if (Math.abs(dx) > lim + 0.5) continue;
      if (s.x + dx - el._w / 2 < 2 || s.x + dx + el._w / 2 > W - 2) continue;
      const r = pinRect({ x: s.x + dx, y: s.y }, el);
      if (!free(r)) continue;
      el.style.setProperty('--ax', `${(-dx).toFixed(1)}px`);
      put(el, r, s.x + dx, s.y - 8, 'translate(-50%,-100%)', 'flex');
      ok = true; break;
    }
    if (!ok) hideEl(el);
  }
  for (const l of roomLabels) {
    if (!state.showRoomNames) { hideEl(l.el); continue; }
    const s = toScreen(l.pos);
    if (s.behind) { hideEl(l.el); continue; }
    measure(l.el);
    if (l.small || l.el._w > 0) {
      // Raum auf dem Bildschirm schmaler als sein Name → ausblenden (kleine Räume < 3 m² nur beim Hineinzoomen)
      let x0 = Infinity, x1 = -Infinity;
      for (const q of l.poly) { const t = toScreen(new THREE.Vector3(q[0], 0, q[1])); x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); }
      const need = l.small ? l.el._w * 1.25 : l.el._w * 0.7;
      if (x1 - x0 < need) { hideEl(l.el); continue; }
    }
    const r = { x0: s.x - l.el._w / 2 - GAP, x1: s.x + l.el._w / 2 + GAP, y0: s.y - l.el._h / 2 - GAP, y1: s.y + l.el._h / 2 + GAP };
    if (r.x0 < 0 || r.x1 > W || !free(r)) { hideEl(l.el); continue; }
    put(l.el, r, s.x, s.y, 'translate(-50%,-50%)');
  }
  // Kompass: Nordrichtung auf dem Bildschirm
  const th = THREE.MathUtils.degToRad(-planUpDeg()); // Winkel (im Uhrzeigersinn ab Plan-oben) zu Nord
  const nx = Math.sin(th), ny = -Math.cos(th);
  const c = controls.target;
  const a = toScreen(new THREE.Vector3(c.x, 0, c.z));
  const b = toScreen(new THREE.Vector3(c.x + nx, 0, c.z + ny));
  const ang = Math.atan2(b.x - a.x, -(b.y - a.y)) * 180 / Math.PI;
  $('pf-compass-svg').style.transform = `rotate(${ang.toFixed(1)}deg)`;
  if (orient.on) drawRing(ang);
}

const PULSE_MS = 1500;
let last = performance.now();
let lastWind = 0;
const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const motionOn = () => state.motion !== false && !(reduceMotion && reduceMotion.matches) && !orient.on && !design.on;
/* Effekte (Gieß-Animation) */
const fx = []; // { t0, dur, step(k, now) }
let fxSlow = 1; // nur für Tests (Zeitlupe)
function runFx(now) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    if (now < f.t0) continue;
    const k = clamp((now - f.t0) / (f.dur * fxSlow), 0, 1);
    f.step(k, now);
    if (k >= 1) { fx.splice(i, 1); f.end && f.end(); }
  }
}
const dropGeo = new THREE.SphereGeometry(1, 10, 8);
const dropMat = new THREE.MeshStandardMaterial({ color: 0x7cc0f0, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.88 });
const rippleGeo = new THREE.RingGeometry(0.82, 1, 40);
const easeOutBack = (k) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
// Wassertropfen fallen in den Topf, Ringe auf der Erde, die Pflanze richtet sich auf
function waterFx(p, delay = 0) {
  const g = plantObjs.get(p.uid); if (!g) return;
  const t0 = performance.now() + delay;
  const standY = g.userData.standY || 0, potH = g.userData.potH || 0.15, potR = g.userData.potR || 0.1;
  const soilY = g.position.y + standY + potH * 0.86;
  const startY = Math.max(g.position.y + g.userData.topY + 0.1, soilY + 0.3);
  const sc = clamp(potR / 0.1, 0.8, 1.5);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * potR * 0.6;
    const x = g.position.x + Math.cos(a) * r, z = g.position.z + Math.sin(a) * r;
    const y0 = startY + Math.random() * 0.12;
    const m = new THREE.Mesh(dropGeo, dropMat);
    m.scale.set(0.011 * sc, 0.02 * sc, 0.011 * sc); m.visible = false;
    m.position.set(x, y0, z);
    scene.add(m);
    const fall = Math.sqrt(2 * (y0 - soilY) / 3) * 1000; // langsamer als echte Schwerkraft, damit man es sieht
    fx.push({ t0: t0 + i * 55 + Math.random() * 40, dur: fall,
      step: (k) => { m.visible = true; m.position.y = y0 - (y0 - soilY) * k * k; },
      end: () => {
        scene.remove(m);
        if (i % 2) return;
        const rp = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color: 0x8ccaff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
        rp.rotation.x = -Math.PI / 2; rp.position.set(x, soilY + 0.004, z); rp.scale.setScalar(potR * 0.12);
        scene.add(rp);
        fx.push({ t0: performance.now(), dur: 650, step: (q) => { const s2 = potR * (0.12 + 0.55 * q); rp.scale.set(s2, s2, s2); rp.material.opacity = 0.8 * (1 - q); },
          end: () => { scene.remove(rp); rp.material.dispose(); } });
      } });
  }
  // Pflanze richtet sich auf (mit kleinem Überschwingen), Farbe kommt zurück
  const L = liveOf(p.uid);
  const d0 = L.u.uDroop.value, p0 = L.u.uPale.value;
  L.anim = true;
  fx.push({ t0: t0 + 380, dur: 1300,
    step: (k) => { const e = easeOutBack(k); L.u.uDroop.value = d0 + (0 - d0 - 0.18) * e + 0.18 * (k * k); L.u.uPale.value = p0 * (1 - k); },
    end: () => { L.anim = false; setThirst(p); } });
  requestRender();
}
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(64, now - last); last = now;
  if (tween) {
    const k = clamp((now - tween.start) / tween.ms, 0, 1), e = ease(k);
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k >= 1) tween = null;
    dirty = true;
  }
  if (Math.abs(sheetOffset - sheetOffsetTarget) > 0.5) {
    sheetOffset += (sheetOffsetTarget - sheetOffset) * Math.min(1, dt / 90);
    if (Math.abs(sheetOffset - sheetOffsetTarget) <= 0.5) sheetOffset = sheetOffsetTarget;
    applyViewOffset(); dirty = true;
  }
  if (controls.update() && camMoved()) dirty = true;
  clampTarget();
  updateWallFade();
  if (selected && ring.visible && ring.userData.t0 != null) {
    // kurzer Puls nach Auswahl, danach statisch (Render-on-Demand kann ruhen)
    const t = now - ring.userData.t0;
    if (t < PULSE_MS) ring.scale.setScalar(ring.userData.r * (1 + Math.sin((t / PULSE_MS) * Math.PI * 3) * 0.06 * (1 - t / PULSE_MS)));
    else { ring.scale.setScalar(ring.userData.r); ring.userData.t0 = null; }
    dirty = true;
  }
  if (fx.length) { runFx(now); dirty = true; }
  stepSun(now);
  // Wind: ~30 Bilder/s, nur wenn Pflanzen da sind und Bewegung an ist
  if (motionOn() && (state.plants.length || draft) && now - lastWind >= 33) {
    lastWind = now;
    PM.windUniforms.uTime.value = now / 1000;
    dirty = true;
  }
  if (dirty) {
    renderer.render(scene, camera);
    updateOverlay();
    dirty = false;
  }
}

/* ------------------------------------------------------------------ */
/* Interaction: tap vs drag                                            */
/* ------------------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const downs = new Map();
let multi = false;
const cvs = renderer.domElement;
cvs.addEventListener('pointerdown', (e) => {
  downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
  if (downs.size > 1) multi = true;
  if (tween) tween = null; // Nutzer übernimmt
});
const endPointer = (e, cancelled) => {
  const d = downs.get(e.pointerId);
  downs.delete(e.pointerId);
  if (!d) return;
  const wasMulti = multi;
  if (downs.size === 0) multi = false;
  if (cancelled || wasMulti) return;
  const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
  if (moved < 8 && performance.now() - d.t < 450) {
    const r = cvs.getBoundingClientRect();
    handleTap(e.clientX - r.left, e.clientY - r.top);
  }
};
cvs.addEventListener('pointerup', (e) => endPointer(e, false));
cvs.addEventListener('pointercancel', (e) => endPointer(e, true));

function pick(sx, sy) {
  ndc.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const objs = [...floorMeshes, ...plantObjs.values(), ...item3d.values()];
  wallGroups.forEach((wg) => { if (!wg.exterior || wg.fade > 0.5) objs.push(wg.group); });
  const hits = raycaster.intersectObjects(objs, true);
  for (const h of hits) {
    // Fenster (Glas, Rahmen, Brüstung) → Fensterbank; Position entlang des Fensters merken
    const op = h.object.userData.opening;
    if (op && op.type === 'window') return { type: 'window', o: op, x: h.point.x, y: h.point.z };
    if (h.object.userData.kind === 'glass' || h.object.userData.kind === 'door') continue;
    if (h.object.userData.uid) return { type: 'plant', uid: h.object.userData.uid };
    if (h.object.userData.kind === 'item3d') {
      // Tisch, Regal, Kommode: Pflanze auf die Oberfläche stellen
      const it = itemById(h.object.userData.itemId), top = surfaceTop(it);
      if (top && h.face && h.face.normal.y > 0.6 && Math.abs(h.point.y - top) < 0.06 && insideItem(it, h.point.x, h.point.z, 0)) return { type: 'floor', x: h.point.x, y: h.point.z, item: it };
      continue;
    }
    if (h.object.userData.kind === 'wall') {
      // Tipp knapp auf eine Wand: Boden direkt dahinter akzeptieren (nachsichtig), sonst ignorieren
      const f = hits.find((q) => q.object.userData.kind === 'floor' && q.distance > h.distance);
      if (f && Math.hypot(f.point.x - h.point.x, f.point.z - h.point.z) < 0.45) return { type: 'floor', x: f.point.x, y: f.point.z };
      return { type: 'wall' };
    }
    if (h.object.userData.kind === 'floor') return { type: 'floor', x: h.point.x, y: h.point.z };
  }
  return null;
}
function handleTap(sx, sy) {
  if (design.on) { designTap(sx, sy); return; }
  if (orient.on) return;
  const hit = pick(sx, sy);
  if (!hit) { if (selected && !moveMode) closeSheet(); return; }
  if (moveMode) {
    if (hit.type === 'floor') movePlantTo(hit.x, hit.y, hit.item);
    else if (hit.type === 'window' && selected) { selected.onItem = undefined; if (placeOnSill(selected, hit.o, hit.x, hit.y)) movePlantTo(selected.x, selected.y, 'keep'); }
    else if (hit.type === 'plant' && hit.uid === selected?.uid) cancelMove();
    return;
  }
  if (hit.type === 'window') {
    if (selected) { closeSheet(); return; }
    placeNewOnSill(hit.o, hit.x, hit.y);
    return;
  }
  if (hit.type === 'plant') {
    const p = state.plants.find((q) => q.uid === hit.uid) || (draft && draft.uid === hit.uid ? draft : null);
    if (p) openPlant(p, { focus: true });
    return;
  }
  if (hit.type === 'wall') { if (selected) closeSheet(); return; }
  if (hit.type === 'floor') {
    if (selected) { closeSheet(); return; } // erster Tipp schließt nur (und speichert)
    placeNew(hit.x, hit.y, hit.item);
  }
}

/* ------------------------------------------------------------------ */
/* Plant sheet                                                         */
/* ------------------------------------------------------------------ */
let selected = null;   // working copy currently in sheet
let draft = null;      // neue Pflanze, wird beim Schließen automatisch gespeichert
let originalCopy = null; // Stand vor dem Öffnen (für „Rückgängig“)
let savedView = null;  // Kamera vor dem Öffnen des Sheets
let moveMode = false;
let deleteArmTimer = null;
const sheet = $('pf-sheet'), sheetBody = $('pf-sheet');

function newPlant(x, y, plantId) {
  const lastId = state.lastPlantId && PLANTS.some((p) => p.id === state.lastPlantId) ? state.lastPlantId : (PLANTS[0] && PLANTS[0].id);
  const today = nowDate().toISOString();
  return { uid: uid(), plantId: plantId || lastId, x, y, potDiameterCm: 18, plantHeightCm: 50, standCm: 0, lastWateredAt: today, waterLog: [today], nick: '', waterAdj: 1, fbAt: today }; // fbAt = heute: keine Ablauf-Frage direkt nach dem Platzieren
}
function placeNew(x, y, item) {
  const p = newPlant(x, y);
  if (item) { setOnItem(p, item); p.potDiameterCm = 14; p.plantHeightCm = 30; }
  startDraft(p);
}
function setOnItem(p, item) {
  if (item) { p.onItem = item.id; p.standCm = Math.round(surfaceTop(item) * 100); }
  else if (p.onItem) { p.onItem = undefined; p.standCm = 0; }
}
function startDraft(p) {
  if (selected) closeSheet({ restoreView: false });
  draft = p;
  if (!state.seenHint) { state.seenHint = true; save(); }
  updateHint();
  syncPlantObj(p);
  openPlant(p, { isNew: true, focus: true });
}
function openPlant(p, { isNew = false, focus = false } = {}) {
  closeAux();
  if (selected && selected !== p) commitSelected();
  if (!selected && !moveMode) {
    // Ansicht merken (bei laufender Kamerafahrt deren Ziel)
    savedView = tween ? { pos: tween.p1.clone(), target: tween.t1.clone() } : { pos: camera.position.clone(), target: controls.target.clone() };
  }
  selected = p;
  originalCopy = isNew ? null : { ...p };
  ring.userData.t0 = performance.now();
  renderSheet(isNew);
  sheet.classList.add('open');
  updateSelection(); updateLightUI();
  requestAnimationFrame(() => {
    sheetOffsetTarget = sheetHeight();
    if (focus) focusPlant(p);
  });
}
function sheetHeight() { return Math.max(0, Math.min(sheet.offsetHeight, H * 0.7) - ($('pf-list-btn').getBoundingClientRect().bottom + 8)); }
const PLANT_KEYS = ['plantId', 'x', 'y', 'potDiameterCm', 'plantHeightCm', 'standCm', 'nick', 'onItem'];
// Änderungen gelten live: aktuelle Pflanze übernehmen + speichern, Toast mit „Rückgängig“
function commitSelected() {
  const p = selected; if (!p) return;
  if (draft === p) {
    state.plants.push(p); draft = null;
    state.lastPlantId = p.plantId; save(); updateCount();
    toast('Gespeichert', () => undoAdd(p.uid));
  } else if (originalCopy && PLANT_KEYS.some((k) => originalCopy[k] !== p[k])) {
    const before = { ...originalCopy };
    state.lastPlantId = p.plantId; save();
    toast('Gespeichert', () => undoEdit(p.uid, before));
  }
  originalCopy = null;
}
function undoAdd(id) {
  if (selected && selected.uid === id) closeSheet({ commit: false });
  state.plants = state.plants.filter((q) => q.uid !== id);
  removePlantObj(id);
  save(); updateCount(); updateHint();
  toast('Pflanze entfernt');
}
function undoEdit(id, before) {
  const p = state.plants.find((q) => q.uid === id); if (!p) return;
  for (const k of PLANT_KEYS) p[k] = before[k]; // Gieß-Daten bleiben unberührt
  syncPlantObj(p); save(); renderMiniBadges();
  if (selected === p) { originalCopy = { ...p }; renderSheet(false); updateSelection(); }
  toast('Rückgängig gemacht');
}
function closeSheet({ commit = true, restoreView = true } = {}) {
  distLine.visible = false;
  if (commit) commitSelected();
  if (draft) { removePlantObj(draft.uid); draft = null; } // nur falls ohne Commit geschlossen
  disarmDelete();
  sheet.classList.remove('open');
  selected = null; originalCopy = null;
  sheetOffsetTarget = 0;
  if (restoreView && savedView) flyTo(savedView.pos, savedView.target, 600);
  savedView = null;
  updateSelection(); updateHint(); updateCount(); updateLightUI();
}
function updateSelection() {
  const o = selected && plantObjs.get(selected.uid);
  if (o) {
    const r = Math.max(0.16, selected.potDiameterCm / 100 * 0.85);
    ring.userData.r = r; ring.scale.setScalar(r); ringFill.scale.setScalar(r);
    const sy = o.position.y + (o.userData.standY || 0);
    ring.position.set(o.position.x, sy + 0.008, o.position.z);
    ringFill.position.set(o.position.x, sy + 0.006, o.position.z);
    ring.visible = ringFill.visible = true;
  } else ring.visible = ringFill.visible = false;
  requestRender();
}
function pct(input) {
  const v = (input.value - input.min) / (input.max - input.min) * 100;
  input.style.setProperty('--p', v + '%');
}
function renderSheet(isNew) {
  const p = selected;
  sheetBody.innerHTML = `<div class="pf-grab"><i></i></div><div class="pf-sheet-body">
    <div class="pf-head">
      <div class="pf-emoji" id="s-emoji"></div>
      <div style="min-width:0;flex:1"><h2 id="s-name"></h2><p><span id="s-room"></span> · <i id="s-latin"></i></p></div>
      <button class="pf-x" id="s-close" aria-label="Schließen">${ICONS.close}</button>
    </div>
    <div class="pf-result">
      <div id="s-result"></div>
      <div class="pf-due"><div class="d"><b id="s-due"></b><span id="s-last"></span></div>
        <button class="pf-water" id="s-water" type="button">✓ Gegossen</button></div>
      <div class="pf-fb" id="s-fb" hidden></div>
    </div>
    <div class="pf-field" style="border-top:0">
      <div class="lbl pf-sthead"><label for="s-stand">Standhöhe <span class="val" id="s-stand-v"></span></label>
        <button class="pf-bp" id="s-best" type="button">${ICONS.sun}Beste Plätze zeigen</button></div>
      <div class="pf-stand" id="s-stand-chips"></div>
      <input type="range" class="compact" id="s-stand" min="0" max="150" step="5" value="${p.standCm || 0}" aria-label="Standhöhe">
    </div>
    <div class="pf-field pf-two">
      <div class="pf-select"><button type="button" class="pf-pickbtn" id="s-plant" aria-label="Pflanze wählen"><span class="ic" id="s-plant-ic"></span><span class="n" id="s-plant-n"></span></button></div>
      <input class="pf-input" id="s-nick" type="text" maxlength="30" placeholder="Spitzname" aria-label="Spitzname (optional)" autocomplete="off" value="${esc(p.nick || '')}">
    </div>
    <div class="pf-field pf-sl">
      <label for="s-pot"><span class="ln">Topf-Ø <span class="val" id="s-pot-v"></span></span></label>
      <input type="range" id="s-pot" min="6" max="50" step="1" value="${p.potDiameterCm}">
    </div>
    <div class="pf-field pf-sl">
      <label for="s-h"><span class="ln">Höhe <span class="val" id="s-h-v"></span></span><span class="hint">(ab Topfrand)</span></label>
      <input type="range" id="s-h" min="10" max="250" step="5" value="${p.plantHeightCm}">
    </div>
    <details class="pf-why" id="s-why"><summary>Wie wird das berechnet? · Pflege</summary><div id="s-why-body"></div><div class="pf-note" id="s-note"></div></details>
    </div><div class="pf-actions sticky">
      ${isNew ? '' : '<button class="pf-act danger" id="s-del">Löschen</button>'}
      <button class="pf-act ghost" id="s-move">Verschieben</button>
      <button class="pf-act primary" id="s-save">${isNew ? 'Speichern' : 'Fertig'}</button>
    </div>`;
  bindGrab(sheet);
  const sel = $('s-plant'), pot = $('s-pot'), hh = $('s-h'), st = $('s-stand');
  pct(pot); pct(hh); pct(st);
  st.addEventListener('input', () => { p.onItem = undefined; p.standCm = +st.value; pct(st); syncPlantObj(p); updateSelection(); refreshSheet(); });
  $('s-stand-chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cm]'); if (!b) return;
    p.onItem = undefined;
    if (b.dataset.k === 'sill') snapToSill(p);
    else p.standCm = +b.dataset.cm;
    st.value = p.standCm; pct(st);
    syncPlantObj(p); updateSelection(); refreshSheet();
    focusPlant(p);
  });
  sel.addEventListener('click', () => openPicker(p.plantId, (id) => { if (id === p.plantId) return; p.plantId = id; syncPlantObj(p); updateSelection(); refreshSheet(); }));
  pot.addEventListener('input', () => { p.potDiameterCm = +pot.value; pct(pot); syncPlantObj(p); updateSelection(); refreshSheet(); });
  hh.addEventListener('input', () => { p.plantHeightCm = +hh.value; pct(hh); syncPlantObj(p); refreshSheet(); });
  $('s-close').addEventListener('click', () => closeSheet());
  $('s-water').addEventListener('click', () => waterPlants([p]));
  const nk = $('s-nick');
  nk.addEventListener('input', () => { p.nick = cleanNick(nk.value); $('s-name').textContent = p.nick || plantDef(p.plantId).name; });
  nk.addEventListener('change', () => { nk.value = p.nick; });
  nk.addEventListener('keydown', (e) => { if (e.key === 'Enter') nk.blur(); });
  $('s-save').addEventListener('click', saveSelected);
  $('s-move').addEventListener('click', startMove);
  $('s-best').addEventListener('click', startBest);
  if ($('s-del')) $('s-del').addEventListener('click', () => {
    const b = $('s-del');
    if (!b.classList.contains('armed')) {
      b.classList.add('armed'); b.textContent = 'Wirklich?';
      deleteArmTimer = setTimeout(disarmDelete, 3500);
    } else deleteSelected();
  });
  refreshSheet();
}
const STAND_PRESETS = [{ k: 'floor', name: 'Boden', cm: 0 }, { k: 'stool', name: 'Hocker', cm: 45 }, { k: 'table', name: 'Tisch', cm: 75 }];
function standChips(p) {
  const list = STAND_PRESETS.slice();
  const w = sillWindowAt(p.x, p.y);
  if (w) list.push({ k: 'sill', name: 'Fensterbank', cm: Math.round((+w.o.sill || 0) * 100) });
  const onSill = !!sillOf(p);
  return list.map((c) => {
    const on = c.k === 'sill' ? onSill : (p.standCm === c.cm && !onSill);
    return `<button type="button" data-k="${c.k}" data-cm="${c.cm}" title="${c.cm} cm"${on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>${c.name}</button>`;
  }).join('');
}
// Pflanze auf die Fensterbank des nächsten Fensters setzen (12 cm vor der Wand-Innenseite, innerhalb der Fensterbreite)
function snapToSill(p) {
  const w = sillWindowAt(p.x, p.y); if (!w) return;
  placeOnSill(p, w.o, p.x, p.y);
}
// Pflanze auf die Fensterbank von Fenster o setzen; (ax, ay) = Stelle entlang des Fensters (z. B. Tipp-Punkt)
function placeOnSill(p, o, ax, ay) {
  const L = segLen(o) || 1, n = openingNormal(o), hw = openingHalfWall(o);
  const dx = (o.b[0] - o.a[0]) / L, dy = (o.b[1] - o.a[1]) / L;
  const m = Math.min(L / 2, p.potDiameterCm / 200 + 0.03);
  const t = clamp((ax - o.a[0]) * dx + (ay - o.a[1]) * dy, m, L - m);
  for (const off of [hw + 0.12, 0.12, hw + 0.3]) {
    const x = o.a[0] + dx * t - n[0] * off, y = o.a[1] + dy * t - n[1] * off;
    if (rooms.some((r) => pointInPoly(x, y, r.polygon))) {
      p.x = x; p.y = y;
      p.standCm = Math.round((+o.sill || 0) * 100);
      return true;
    }
  }
  return false;
}
// Tipp auf ein Fenster: neue Pflanze direkt auf die Fensterbank (kleiner Topf als Start)
function placeNewOnSill(o, ax, ay) {
  const p = newPlant(0, 0);
  if (!placesFor(plantDef(p.plantId)).includes('sill')) p.plantId = 'basilikum'; // große Pflanzen gehören nicht aufs Fensterbrett
  p.potDiameterCm = 14; p.plantHeightCm = 25;
  if (!placeOnSill(p, o, ax, ay)) return;
  startDraft(p);
}
function disarmDelete() {
  clearTimeout(deleteArmTimer);
  const b = $('s-del');
  if (b && b.classList.contains('armed')) { b.classList.remove('armed'); b.textContent = 'Löschen'; }
}
function resultHTML(r, a) {
  if (!r) return '<div class="sub">Keine Berechnung verfügbar.</div>';
  const w0 = (r.warnings || [])[0];
  const warn = w0 ? `<div class="pf-warn" title="${esc(w0)}">${ICONS.warn}<span>${esc(w0)}</span></div>` : '';
  const winChip = `<span class="pf-chip" id="s-win">${esc(windowText(a))}</span>`;
  if (isDip(r)) return `<div class="big"><span class="ml dip">Tauchen</span> <span class="ival">· ${intervalText(r.intervalDays)}</span></div>
    <div class="sub"><span>10 min in Wasser, dann abtropfen</span><span class="pf-chip">${ICONS.sun}${esc(r.lightLabel || '')}</span>${winChip}</div>${warn}`;
  const adjChip = r.adj && r.adj !== 1 ? `<span class="pf-chip adj" title="Aus deiner Rückmeldung zum Ablaufwasser">${ICONS.drop}angepasst ${pctTxt(r.adj)}</span>` : '';
  return `<div class="big"><span class="ml">${fmtInt(r.mlPerWatering)}<small> ml</small></span><span class="ival">${intervalText(r.intervalDays)}</span></div>
    <div class="sub"><span class="pf-chip">${ICONS.sun}${esc(r.lightLabel || '')}</span>${winChip}${adjChip}</div>${warn}`;
}
function whyHTML(r) {
  if (!r) return '';
  const warn = (r.warnings || []).map((w) => `<div class="pf-warn">${ICONS.warn}<span>${esc(w)}</span></div>`).join('');
  const lines = [...(r.explanation || [])];
  if (r.adj && r.adj !== 1) lines.push(`Deine Rückmeldung zum Ablaufwasser: ${fmtInt(r.mlBase)} ml ${pctTxt(r.adj)} → ${fmtInt(r.mlPerWatering)} ml`);
  if (r.mlPerWeek != null && !isDip(r)) lines.push(`≈ ${fmtInt(r.mlPerWeek)} ml pro Woche`);
  const reset = r.adj && r.adj !== 1 ? '<button type="button" class="pf-mini" id="s-adj-reset">Anpassung zurücksetzen</button>' : '';
  return `${warn}${lines.length ? `<ul>${lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${reset}`;
}
function refreshSheet() {
  const p = selected; if (!p) return;
  const def = plantDef(p.plantId);
  const { a, r } = compute(p);
  $('s-emoji').innerHTML = plantIcon(def);
  $('s-plant-ic').innerHTML = plantIcon(def);
  $('s-plant-n').textContent = def.name;
  $('s-name').textContent = p.nick || def.name;
  $('s-latin').textContent = p.nick ? def.name : (def.latin || '');
  $('s-note').textContent = def.note || '';
  $('s-pot-v').textContent = p.potDiameterCm + ' cm';
  $('s-h-v').textContent = p.plantHeightCm + ' cm';
  { const oi = p.onItem && state.design && itemById(p.onItem); $('s-stand-v').textContent = oi ? `${p.standCm} cm · ${FURN[oi.type].name}` : p.standCm ? p.standCm + ' cm' : 'Boden'; }
  $('s-stand-chips').innerHTML = standChips(p);
  $('s-room').textContent = a.roomName || '–';
  $('s-result').innerHTML = resultHTML(r, a);
  $('s-why-body').innerHTML = whyHTML(r);
  const due = dueInfo(p, r);
  const db = $('s-due');
  db.textContent = due.due ? (due.days < 0 ? `Gießen · ${due.text}` : 'Heute gießen') : `Nächstes Gießen ${due.text}`;
  db.className = due.cls || (due.due ? 'due' : '');
  const justNow = p.lastWateredAt && dayNum(new Date(p.lastWateredAt)) === dayNum(nowDate());
  $('s-last').textContent = p.lastWateredAt ? `zuletzt gegossen: ${agoText(p.lastWateredAt)}` : '';
  $('s-water').classList.toggle('done', !due.due && !!justNow);
  renderFeedback(p, r, !!justNow);
  const rs = $('s-adj-reset');
  if (rs) rs.addEventListener('click', () => setAdj(p, 1, 'Anpassung zurückgesetzt'));
  const bi = `<span class="bi">${plantIcon(def)}</span>`;
  badge.innerHTML = r ? (isDip(r) ? `${bi}Tauchen · ${esc(intervalText(r.intervalDays))}` : `${bi}${fmtInt(r.mlPerWatering)} ml · ${esc(intervalText(r.intervalDays))}`) : esc(def.name);
  updateDistLine(p);
  requestRender();
}
// Nach dem Gießen: „Lief unten Wasser raus?“ (einmal pro Gießen)
function renderFeedback(p, r, justNow) {
  const box = $('s-fb'); if (!box) return;
  const show = justNow && r && !isDip(r) && p.fbAt !== p.lastWateredAt && (state.plants.includes(p) || draft === p);
  box.hidden = !show;
  if (!show) { box.innerHTML = ''; return; }
  if (box.dataset.for === p.lastWateredAt + '|' + r.mlPerWatering) return; // Eingabe nicht verwerfen
  box.dataset.for = p.lastWateredAt + '|' + r.mlPerWatering;
  const ideal = Math.max(10, round10(r.mlPerWatering * RUNOFF_TARGET));
  box.innerHTML = `<div class="q"><span>Lief unten Wasser raus?</span><small>ideal ≈ ${fmtInt(ideal)} ml</small></div>
    <div class="r"><button type="button" id="fb-none">Nichts</button>
      <label><input id="fb-ml" type="number" inputmode="numeric" min="0" max="5000" step="10" placeholder="Menge" aria-label="Ablaufwasser in ml"><span>ml</span></label>
      <button type="button" class="ok" id="fb-ok">OK</button></div>`;
  const inp = $('fb-ml');
  const submit = (ml) => {
    const poured = r.mlPerWatering, k0 = +p.waterAdj || 1, prevFb = p.fbAt;
    const k = adjFromRunoff(k0, poured, ml);
    p.fbAt = p.lastWateredAt;
    const next = Math.max(20, round10(r.mlBase * k));
    const msg = next === poured ? 'Passt – Menge bleibt' : `Nächstes Mal ${fmtInt(next)} ml statt ${fmtInt(poured)} ml`;
    setAdj(p, k, msg, { k: k0, fb: prevFb });
  };
  $('fb-none').addEventListener('click', () => submit(0));
  $('fb-ok').addEventListener('click', () => { const v = +inp.value; if (!inp.value || !Number.isFinite(v) || v < 0) { inp.focus(); return; } submit(v); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('fb-ok').click(); });
}
function setAdj(p, k, msg, prev = { k: +p.waterAdj || 1, fb: p.fbAt }) {
  p.waterAdj = k;
  if (state.plants.includes(p)) save();
  afterWaterChange(); renderMiniBadges();
  toast(msg, () => { p.waterAdj = prev.k; p.fbAt = prev.fb; if (state.plants.includes(p)) save(); afterWaterChange(); renderMiniBadges(); });
}
function saveSelected() { if (selected) closeSheet(); }
function deleteSelected() {
  const p = selected; if (!p) return;
  state.plants = state.plants.filter((q) => q.uid !== p.uid);
  removePlantObj(p.uid);
  originalCopy = null; if (draft === p) draft = null;
  save();
  closeSheet({ commit: false });
  updateCount(); renderMiniBadges();
  toast('Pflanze entfernt');
}
// Gießen (mit Rückgängig)
function waterPlants(list) {
  if (!list.length) return;
  const now = nowDate().toISOString();
  const before = list.map((p) => ({ p, last: p.lastWateredAt, log: (p.waterLog || []).slice() }));
  for (const p of list) {
    p.lastWateredAt = now;
    p.waterLog = [...(p.waterLog || []), now].slice(-10);
  }
  if (list.some((p) => state.plants.includes(p))) save();
  list.forEach((p, i) => waterFx(p, i * 140));
  afterWaterChange();
  toast(list.length > 1 ? `${list.length} gegossen` : 'Gegossen', () => {
    for (const b of before) { b.p.lastWateredAt = b.last; b.p.waterLog = b.log; }
    save(); afterWaterChange();
  });
}
function afterWaterChange() {
  updateCount();
  if (selected) refreshSheet();
  if (listSheet.classList.contains('open')) renderList();
}
function startMove() {
  if (!selected) return;
  moveMode = true;
  sheet.classList.remove('open');
  sheetOffsetTarget = 0;
  $('pf-banner').classList.remove('hide');
  $('pf-bottom').classList.add('off');
  updateLightUI();
  const { pos, target } = camPose(viewMode); flyTo(pos, target, 600); // Überblick zum Neu-Platzieren
  requestRender();
}
function cancelMove() {
  moveMode = false;
  endBest();
  $('pf-banner').classList.add('hide');
  $('pf-bottom').classList.remove('off');
  if (selected) { sheet.classList.add('open'); sheetOffsetTarget = sheetHeight(); }
  updateLightUI();
  requestRender();
}
function movePlantTo(x, y, item) {
  const p = selected; if (!p) return;
  p.x = x; p.y = y;
  if (item !== 'keep') setOnItem(p, item || null);
  syncPlantObj(p);
  cancelMove();
  ring.userData.t0 = performance.now();
  updateSelection();
  refreshSheet();
  focusPlant(p);
}

/* ------------------------------------------------------------------ */
/* Lichtkarte: Licht-Heatmap pro Raum (window.estimateLight)           */
/* ------------------------------------------------------------------ */
const LT = window.LIGHT_THRESHOLDS || { medium: 0.06, bright: 0.25, high: 0.5, noWindow: 0.02, cap: 1 };
const LIGHT_MONTHS = [{ m: 11, name: 'Dez' }, { m: 2, name: 'Mär' }, { m: 5, name: 'Jun' }, { m: 8, name: 'Sep' }];
const LIGHT_HEIGHTS = [{ k: 'floor', name: 'Boden', cm: 0 }, { k: 'table', name: 'Tisch 75', cm: 75 }, { k: 'sill', name: 'Fensterbank' }];
const LCELL = 0.1;   // Rasterweite 10 cm
const LSS = 4;       // Pixel je Zelle in der Textur (bilinear interpoliert, Konturen an den Stufengrenzen)
const CANOPY_TYPICAL = 0.45; // Kronenhöhe einer typischen Pflanze über der Standfläche (Ø 18 cm, 50 cm hoch)
const nearestLightMonth = (m) => LIGHT_MONTHS.reduce((b, x) => { const d = Math.min(Math.abs(x.m - m), 12 - Math.abs(x.m - m)); return d < b.d ? { d, m: x.m } : b; }, { d: 99, m: 5 }).m;
const light = { on: false, month: nearestLightMonth(new Date().getMonth()), height: 'floor', best: null, meshes: [], grids: new Map(), job: 0, stats: null };
const LIGHT_RAMP = [[0, [58, 68, 84]], [0.3, [84, 108, 122]], [0.5, [96, 146, 112]], [0.685, [140, 186, 98]], [0.873, [184, 205, 104]], [1, [204, 214, 122]]];
const LOG0 = Math.log(LT.noWindow || 0.02), LOGR = Math.log(0.8) - LOG0;
const tOfIdx = (v) => clamp((Math.log(Math.max(v, 1e-4)) - LOG0) / LOGR, 0, 1);
const T_BANDS = [tOfIdx(LT.medium), tOfIdx(LT.bright), tOfIdx(LT.high)];
const bandOfT = (t) => (t < T_BANDS[0] ? 0 : t < T_BANDS[1] ? 1 : t < T_BANDS[2] ? 2 : 3);
function rampRGB(t, out) {
  let i = 1; while (i < LIGHT_RAMP.length - 1 && t > LIGHT_RAMP[i][0]) i++;
  const [t0, a] = LIGHT_RAMP[i - 1], [t1, b] = LIGHT_RAMP[i], k = clamp((t - t0) / (t1 - t0), 0, 1);
  out[0] = a[0] + (b[0] - a[0]) * k; out[1] = a[1] + (b[1] - a[1]) * k; out[2] = a[2] + (b[2] - a[2]) * k;
  return out;
}
const rgbCss = (t) => { const c = rampRGB(t, [0, 0, 0]); return `rgb(${c.map(Math.round).join(',')})`; };
const SUN_RGB = [247, 192, 62], GOOD_RGB = [86, 178, 100], RIM_RGB = [196, 240, 164], DARK_RGB = [38, 44, 56], HOT_RGB = [156, 100, 40], COLD_RGB = [92, 132, 176];
const LEGEND = [
  { name: 'schattig', css: rgbCss((0 + T_BANDS[0]) / 2) },
  { name: 'halbschattig', css: rgbCss((T_BANDS[0] + T_BANDS[1]) / 2) },
  { name: 'hell', css: rgbCss((T_BANDS[1] + T_BANDS[2]) / 2) },
  { name: 'sonnig', css: `rgb(${SUN_RGB})` }, // warmes Gelb = direkte Sonne
];
const FIT_CODE = { good: 0, dark: 1, sunny: 2, cold: 3 };
function polyBox(poly) {
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const [x, y] of poly) { b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x); b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y); }
  return b;
}
// Fenster eines Raums für estimateLight (Mitte, Achse, Normale nach draußen, Maße)
function lightWindowsOf(room) {
  return windowsOfRoom(room).map((o) => {
    const L = segLen(o) || 1, n = openingNormal(o), sill = +o.sill || 0;
    return {
      mx: (o.a[0] + o.b[0]) / 2, my: (o.a[1] + o.b[1]) / 2, ux: (o.b[0] - o.a[0]) / L, uy: (o.b[1] - o.a[1]) / L, nx: n[0], ny: n[1],
      type: o.type, sill,
      w: { compassDeg: Math.round(vecCompass(n[0], n[1])), sillM: sill, topM: Math.round((sill + (+o.height || 0)) * 100) / 100, widthM: Math.round(L * 100) / 100, distanceM: 0, lateralM: 0 },
    };
  });
}
function roomStandM(room, wins) {
  const h = LIGHT_HEIGHTS.find((x) => x.k === light.height) || LIGHT_HEIGHTS[0];
  if (h.k !== 'sill') return h.cm / 100;
  const s = wins.filter((w) => w.type === 'window').map((w) => w.sill);
  return s.length ? Math.min(...s) : 0.9;
}
// Raster für einen Raum (oder Balkon) berechnen; Werte je Zellmitte
function computeLightGrid(poly, wins, opt) {
  const b = polyBox(poly);
  const nx = Math.max(2, Math.ceil((b.maxX - b.minX) / LCELL)), ny = Math.max(2, Math.ceil((b.maxY - b.minY) / LCELL));
  const cw = (b.maxX - b.minX) / nx, ch = (b.maxY - b.minY) / ny, N = nx * ny;
  const idx = new Float32Array(N), pidx = new Float32Array(N), sun = new Uint8Array(N), fit = new Uint8Array(N); // fit: 0 passt, 1 zu dunkel, 2 zu sonnig, 3 zu kalt (draußen)
  const ws = wins.map((w) => ({ ...w.w }));
  const inp = { windows: ws, standHeightM: opt.stand, canopyHeightM: opt.canopy, date: opt.date, outdoor: !!opt.outdoor, plantId: opt.plantId || undefined };
  let goodIn = 0, cellsIn = 0;
  const est = window.estimateLight;
  if (opt.outdoor || !ws.length) {
    // gleichmäßig: draußen (Ausrichtung Balkontür) bzw. Raum ohne Fenster
    const r = est(inp);
    idx.fill(r.index); pidx.fill(r.placeIndex); sun.fill(r.directSun ? 1 : 0); fit.fill(FIT_CODE[r.fit] || 0);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (pointInPoly(b.minX + (i + 0.5) * cw, b.minY + (j + 0.5) * ch, poly)) { cellsIn++; if (!fit[0]) goodIn++; }
  } else {
    for (let j = 0; j < ny; j++) {
      const y = b.minY + (j + 0.5) * ch;
      for (let i = 0; i < nx; i++) {
        const x = b.minX + (i + 0.5) * cw;
        for (let k = 0; k < ws.length; k++) {
          const w = wins[k], rx = x - w.mx, ry = y - w.my;
          ws[k].lateralM = rx * w.ux + ry * w.uy;
          ws[k].distanceM = Math.max(0, -(rx * w.nx + ry * w.ny)); // Tiefe in den Raum (ab Wandachse, wie computeWater)
        }
        const r = est(inp), c = j * nx + i;
        idx[c] = r.index; pidx[c] = r.placeIndex; sun[c] = r.directSun ? 1 : 0;
        fit[c] = FIT_CODE[r.fit] || 0;
        if (opt.plantId && pointInPoly(x, y, poly)) { cellsIn++; if (!fit[c]) goodIn++; }
      }
    }
  }
  return { b, nx, ny, cw, ch, idx, pidx, sun, fit, need: opt.need, goodM2: goodIn * cw * ch, cellsIn };
}
// Raster → Canvas (LSS Pixel je Zelle). mode 'map' = Lichtstufen, 'best' = passt/zu dunkel/zu sonnig
function paintLightGrid(g, mode, hatch) {
  // Beste Plätze: stetiger Abstand zur Bedarfsschwelle (log), damit die Grenze glatt statt treppig wird
  const tNeed = g.need === 'high' ? LT.high : g.need === 'medium' ? LT.medium : 1e-4;
  const { nx, ny } = g, PW = nx * LSS, PH = ny * LSS, N = nx * ny;
  const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(PW, PH), D = img.data;
  const best = mode === 'best';
  // je Zelle: Wert, der interpoliert wird (Licht: log-Index 0…1; Beste Plätze: 1 = passt)
  const V = new Float32Array(N), S = new Float32Array(N);
  for (let c = 0; c < N; c++) {
    V[c] = !best ? tOfIdx(g.idx[c]) : g.fit[c] >= 2 ? 0 : clamp(0.5 + 1.6 * Math.log(Math.max(g.pidx[c], 1e-4) / tNeed), 0, 1);
    if (best && g.fit[c] === 0 && V[c] < 0.5) V[c] = 0.5; // Modell entscheidet (Rundung)
    S[c] = g.sun[c];
  }
  // Beste Plätze: harte Kanten (Sonnenkegel, „zu sonnig“) weichzeichnen – 2× 3×3-Binomialfilter
  if (best) for (let pass = 0; pass < 2; pass++) {
    const U = V.slice();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let acc = 0, wsum = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const jj = j + dj, ii = i + di; if (jj < 0 || jj >= ny || ii < 0 || ii >= nx) continue;
        const w = (di ? 1 : 2) * (dj ? 1 : 2); acc += U[jj * nx + ii] * w; wsum += w;
      }
      V[j * nx + i] = acc / wsum;
    }
  }
  // Interpolationsgewichte je Spalte/Zeile vorab
  const I0 = new Int32Array(PW), I1 = new Int32Array(PW), WX = new Float32Array(PW);
  for (let px = 0; px < PW; px++) { const f = (px + 0.5) / LSS - 0.5, i0 = clamp(Math.floor(f), 0, nx - 1); I0[px] = i0; I1[px] = Math.min(i0 + 1, nx - 1); WX[px] = clamp(f - i0, 0, 1); }
  const rgb = [0, 0, 0], prevRow = new Int8Array(PW).fill(-1);
  const tb0 = T_BANDS[0], tb1 = T_BANDS[1], tb2 = T_BANDS[2];
  for (let py = 0; py < PH; py++) {
    const fy = (py + 0.5) / LSS - 0.5, j0 = clamp(Math.floor(fy), 0, ny - 1), j1 = Math.min(j0 + 1, ny - 1), wy = clamp(fy - j0, 0, 1);
    const r0 = j0 * nx, r1 = j1 * nx;
    let prev = -1;
    for (let px = 0; px < PW; px++) {
      const i0 = I0[px], i1 = I1[px], wx = WX[px];
      const a = r0 + i0, b = r0 + i1, c = r1 + i0, d = r1 + i1;
      const v = (V[a] * (1 - wx) + V[b] * wx) * (1 - wy) + (V[c] * (1 - wx) + V[d] * wx) * wy;
      const o = (py * PW + px) * 4;
      let alpha, band;
      if (best) {
        band = v >= 0.5 ? 1 : 0;
        if (band) {
          const rim = clamp((0.72 - v) / 0.22, 0, 1); // heller Saum am Rand der passenden Fläche (Glow)
          rgb[0] = GOOD_RGB[0] + (RIM_RGB[0] - GOOD_RGB[0]) * rim; rgb[1] = GOOD_RGB[1] + (RIM_RGB[1] - GOOD_RGB[1]) * rim; rgb[2] = GOOD_RGB[2] + (RIM_RGB[2] - GOOD_RGB[2]) * rim;
          alpha = 0.9;
        } else {
          const near = g.fit[(wy < 0.5 ? r0 : r1) + (wx < 0.5 ? i0 : i1)];
          const base = near === 2 ? HOT_RGB : near === 3 ? COLD_RGB : DARK_RGB;
          rgb[0] = base[0]; rgb[1] = base[1]; rgb[2] = base[2];
          alpha = (near === 1 ? 0.76 : 0.62) - 0.4 * v; // zum passenden Bereich hin aufhellen (Glow)
        }
      } else {
        band = v < tb0 ? 0 : v < tb1 ? 1 : v < tb2 ? 2 : 3;
        rampRGB(v, rgb);
        alpha = 0.9; // über texturierten Böden etwas deckender
        const s = (S[a] * (1 - wx) + S[b] * wx) * (1 - wy) + (S[c] * (1 - wx) + S[d] * wx) * wy;
        // direkte Sonne: warm getönt, umso stärker, je heller der Platz (im Winter kaum)
        if (s > 0) { const k = 0.8 * s * clamp((v - tb0) / (tb2 - tb0), 0, 1); rgb[0] += (SUN_RGB[0] - rgb[0]) * k; rgb[1] += (SUN_RGB[1] - rgb[1]) * k; rgb[2] += (SUN_RGB[2] - rgb[2]) * k; }
      }
      // Konturlinie an Stufengrenzen
      if ((prev >= 0 && prev !== band) || (prevRow[px] >= 0 && prevRow[px] !== band)) {
        rgb[0] += (255 - rgb[0]) * 0.4; rgb[1] += (255 - rgb[1]) * 0.4; rgb[2] += (255 - rgb[2]) * 0.4;
        alpha = Math.max(alpha, 0.9);
      }
      prev = band; prevRow[px] = band;
      if (hatch && ((px + py) % 12) < 4) { rgb[0] += (255 - rgb[0]) * 0.4; rgb[1] += (255 - rgb[1]) * 0.4; rgb[2] += (255 - rgb[2]) * 0.4; }
      D[o] = rgb[0]; D[o + 1] = rgb[1]; D[o + 2] = rgb[2]; D[o + 3] = alpha * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
function lightMesh(poly, b, canvas, y) {
  const geo = new THREE.ShapeGeometry(shapeFromPoly(poly));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, uv = new Float32Array(pos.count * 2);
  const w = (b.maxX - b.minX) || 1, h = (b.maxY - b.minY) || 1;
  for (let i = 0; i < pos.count; i++) { uv[i * 2] = (pos.getX(i) - b.minX) / w; uv[i * 2 + 1] = 1 - (pos.getZ(i) - b.minY) / h; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y; m.renderOrder = 2; m.userData.kind = 'light';
  m.raycast = () => {}; // Tippen geht durch auf den Boden
  return m;
}
function disposeLightMeshes(list) {
  for (const m of list) { scene.remove(m); m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); m.material.dispose(); }
}
// Zielgröße: Liste der Flächen (Räume + Balkon) mit Rechen-Optionen und Cache-Schlüssel
function lightTargets() {
  const north = Math.round(planUpDeg());
  const out = [];
  const bp = light.best && light.best.p;
  let date, plantId = null, need = null, canopyFor;
  if (bp) {
    const st = (bp.standCm || 0) / 100;
    const canopy = st + 0.9 * bp.potDiameterCm / 100 + 0.6 * bp.plantHeightCm / 100; // wie computeWater
    date = nowDate(); plantId = bp.plantId; need = plantDef(bp.plantId).lightNeed;
    canopyFor = () => ({ stand: st, canopy });
  } else {
    date = new Date(new Date().getFullYear(), light.month, 21);
    canopyFor = (wins) => { const st = roomStandM(null, wins); return { stand: st, canopy: st + CANOPY_TYPICAL }; };
  }
  const dKey = bp ? `best:${plantId}:${dayNum(date)}` : `m${light.month}`;
  for (const r of rooms) {
    const wins = lightWindowsOf(r), h = canopyFor(wins);
    out.push({ id: r.id, poly: r.polygon, wins, y: 0.004, opt: { ...h, date, plantId, need }, key: `${r.id}|${dKey}|${h.canopy.toFixed(2)}|${north}` });
  }
  if (balcony) {
    const bd = lightOpenings.filter((o) => o.type === 'balcony-door');
    const o = (bd.length ? bd : lightOpenings)[0];
    const wins = o ? [{ w: { compassDeg: Math.round(vecCompass(...openingNormal(o))) } }] : [];
    const h = canopyFor([]);
    out.push({ id: 'balkon', poly: balcony.polygon, wins, y: -0.004, outdoor: true, opt: { ...h, date, plantId, need, outdoor: true }, key: `balkon|${dKey}|${north}` });
  }
  return out;
}
// Neu berechnen (Raster gecacht je Raum/Monat/Höhe/Nordrichtung), in Häppchen außerhalb des Frames
function refreshLight() {
  const job = ++light.job;
  if (!light.on) { disposeLightMeshes(light.meshes); light.meshes = []; requestRender(); return; }
  const targets = lightTargets(), mode = light.best ? 'best' : 'map';
  const fresh = [], t0 = performance.now();
  const st = { rooms: targets.length, cells: 0, computeMs: 0, paintMs: 0, cacheHits: 0, goodM2: 0 };
  let i = 0;
  const step = () => {
    if (job !== light.job) { disposeLightMeshes(fresh); return; }
    const s0 = performance.now();
    while (i < targets.length && performance.now() - s0 < 10) {
      const tg = targets[i++];
      let g = light.grids.get(tg.key);
      const c0 = performance.now();
      if (g) st.cacheHits++;
      else {
        g = computeLightGrid(tg.poly, tg.wins, tg.opt);
        light.grids.set(tg.key, g);
        if (light.grids.size > 120) light.grids.delete(light.grids.keys().next().value);
      }
      const c1 = performance.now();
      const cv = paintLightGrid(g, mode, !!tg.outdoor);
      const c2 = performance.now();
      st.computeMs += c1 - c0; st.paintMs += c2 - c1; st.cells += g.nx * g.ny;
      if (tg.id !== 'balkon' || light.best) st.goodM2 += g.goodM2;
      if (tg.id === 'balkon') st.balconyFit = g.fit[0];
      fresh.push(lightMesh(tg.poly, g.b, cv, tg.y));
    }
    if (i < targets.length) { setTimeout(step, 0); return; }
    // alles fertig: tauschen (kein Flackern), alte Texturen freigeben
    disposeLightMeshes(light.meshes);
    light.meshes = fresh;
    for (const m of fresh) scene.add(m);
    st.totalMs = performance.now() - t0; st.workMs = st.computeMs + st.paintMs;
    for (const k of ['computeMs', 'paintMs', 'totalMs', 'workMs']) st[k] = Math.round(st[k] * 10) / 10;
    light.stats = st;
    if (light.best) updateBestBar();
    requestRender();
  };
  step();
}
function segHTML(list, cur, key) {
  return list.map((x) => `<button type="button" data-${key}="${x[key === 'm' ? 'm' : 'k']}"${String(x[key === 'm' ? 'm' : 'k']) === String(cur) ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>${x.name}</button>`).join('');
}
function renderLightPanel() {
  $('pf-lm').innerHTML = segHTML(LIGHT_MONTHS, light.month, 'm');
  $('pf-lh').innerHTML = segHTML(LIGHT_HEIGHTS, light.height, 'k');
  $('pf-leg').innerHTML = LEGEND.map((l) => `<span><i style="background:${l.css}"></i>${l.name}</span>`).join('') + `<span><i class="out" style="--hell:${LEGEND[2].css}"></i>draußen</span>`;
}
function updateLightUI() {
  const b = $('pf-light');
  b.classList.toggle('on', light.on); b.setAttribute('aria-pressed', String(light.on));
  const panel = light.on && !light.best && !moveMode && !sheet.classList.contains('open');
  $('pf-lp').classList.toggle('hide', !panel);
  $('pf-bb').classList.toggle('hide', !light.best);
  appEl.classList.toggle('pf-lit', light.on);
  { let ch = false; for (const m of itemObjs.values()) if (m.visible === light.on) { m.visible = !light.on; ch = true; } if (ch) shadowsDirty(); } // Lichtkarte liegt direkt auf dem Boden
}
/* Sonnenlauf: echter Sonnenstand (Monat + Uhrzeit), Licht fällt nur durch die Fenster */
const SUN_MONTHS = [{ m: 11, name: 'Dez' }, { m: 2, name: 'Mär' }, { m: 5, name: 'Jun' }, { m: 8, name: 'Sep' }];
function setSunMode(on) {
  on = !!on;
  if (sunMode.on === on) return;
  if (on) {
    if (light.on) setLight(false);
    if (selected) closeSheet();
    const n = new Date(); sunMode.month = n.getMonth();
    sunMode.hour = clamp(n.getHours() + n.getMinutes() / 60, 4, 22);
    const sp = solarPos(sunDate()); if (sp.el < 3) sunMode.hour = 16; // abends/nachts: schöner Nachmittag
  }
  sunMode.on = on; sunMode.play = false;
  const showBal = state.building && state.building.floor < state.building.total;
  for (const c of sunCasters) c.visible = on && (!c.userData.balconyAbove || showBal);
  $('pf-sun').classList.toggle('on', on); $('pf-sun').setAttribute('aria-pressed', String(on));
  $('pf-sp').classList.toggle('hide', !on);
  renderSunPanel(); placeSun(); shadowsDirty();
  requestAnimationFrame(() => { const { pos, target } = camPose(viewMode); flyTo(pos, target, 600); });
}
function hhmm(h) { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${hh}:${String(mm).padStart(2, '0')}`; }
function renderSunPanel() {
  $('sp-h').value = sunMode.hour; pct($('sp-h'));
  $('sp-t').textContent = hhmm(sunMode.hour);
  const sp = solarPos(sunDate());
  $('sp-s').textContent = sp.el < 0 ? 'Sonne untergegangen' : `Sonne aus ${compassName(sp.az)}, ${Math.round(sp.el)}° hoch`;
  $('sp-m').innerHTML = SUN_MONTHS.map((x) => `<button data-m="${x.m}" class="${x.m === sunMode.month ? 'on' : ''}">${x.name}</button>`).join('') +
    (SUN_MONTHS.some((x) => x.m === sunMode.month) ? '' : `<button data-m="${sunMode.month}" class="on">${['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][sunMode.month]}</button>`);
  $('sp-play').classList.toggle('on', sunMode.play); $('sp-play').textContent = sunMode.play ? '❚❚' : '▶';
}
function sunChanged() { renderSunPanel(); placeSun(); shadowsDirty(); }
$('pf-sun').addEventListener('click', () => setSunMode(!sunMode.on));
$('sp-h').addEventListener('input', () => { sunMode.hour = +$('sp-h').value; sunMode.play = false; sunChanged(); });
$('sp-m').addEventListener('click', (e) => { const b = e.target.closest('button[data-m]'); if (!b) return; sunMode.month = +b.dataset.m; sunChanged(); });
$('sp-play').addEventListener('click', () => { sunMode.play = !sunMode.play; if (sunMode.play && sunMode.hour >= 21.9) sunMode.hour = 5; sunMode.last = performance.now(); renderSunPanel(); });
function stepSun(now) {
  if (!sunMode.on || !sunMode.play) return;
  const dt = Math.min(100, now - sunMode.last); sunMode.last = now;
  sunMode.hour += dt / 1000 * 1.2; // ein Tag in ~15 s
  if (sunMode.hour >= 22) { sunMode.hour = 22; sunMode.play = false; }
  sunChanged();
}
function setLight(on) {
  if (light.on === !!on) return;
  if (on && sunMode.on) setSunMode(false);
  light.on = !!on;
  updateLightUI(); refreshLight();
  // Grundriss über dem Panel einpassen
  requestAnimationFrame(() => { const { pos, target } = camPose(viewMode); flyTo(pos, target, 600); });
}
const LIGHT_NEED_TEXT = { low: 'kommt mit wenig Licht aus', medium: 'mag es hell, ohne pralle Sonne', high: 'braucht viel Licht' };
function updateBestBar() {
  const p = light.best && light.best.p; if (!p) return;
  const def = plantDef(p.plantId);
  $('pf-bb-e').innerHTML = plantIcon(def);
  $('pf-bb-t').textContent = `Beste Plätze für ${p.nick || def.name.replace(/\s*\(.*\)\s*$/, '')}`;
  const m2 = light.stats && light.stats.goodM2;
  $('pf-bb-s').textContent = m2 == null ? 'Tippe zum Verschieben' : m2 < 0.05 ? 'Kein passender Platz · Tippe zum Verschieben' : `Tippe zum Verschieben · ≈ ${fmt1(m2)} m² passen`;
  $('pf-bb-s').title = `${def.name} ${LIGHT_NEED_TEXT[def.lightNeed] || ''}`;
  $('pf-bb-leg').innerHTML = `<span><i style="background:rgb(${GOOD_RGB})"></i>passt</span><span><i style="background:rgb(${DARK_RGB})"></i>zu dunkel</span>` +
    (def.lightNeed !== 'high' ? `<span><i style="background:rgb(${HOT_RGB})"></i>zu sonnig</span>` : '') +
    (light.stats && light.stats.balconyFit === 3 ? `<span><i style="background:rgb(${COLD_RGB})"></i>zu kalt</span>` : '');
}
// „Beste Plätze“: Lichtkarte im Passt-Modus, nächster Tipp auf den Boden verschiebt die Pflanze (Verschieben-Modus)
function startBest() {
  const p = selected; if (!p) return;
  light.best = { p, prevOn: light.on };
  light.on = true;
  moveMode = true;
  sheet.classList.remove('open');
  sheetOffsetTarget = 0;
  distLine.visible = false;
  $('pf-bottom').classList.add('off');
  updateBestBar(); updateLightUI(); refreshLight();
  requestAnimationFrame(() => { if (viewMode !== 'top') setViewMode('top'); else { const { pos, target } = camPose('top'); flyTo(pos, target, 600); } });
}
function endBest() {
  if (!light.best) return;
  light.on = light.best.prevOn;
  light.best = null;
  updateLightUI(); refreshLight();
}
renderLightPanel();
$('pf-light').addEventListener('click', () => setLight(!light.on));
$('pf-lm').addEventListener('click', (e) => { const b = e.target.closest('button[data-m]'); if (!b || +b.dataset.m === light.month) return; light.month = +b.dataset.m; renderLightPanel(); refreshLight(); });
$('pf-lh').addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (!b || b.dataset.k === light.height) return; light.height = b.dataset.k; renderLightPanel(); refreshLight(); });
$('pf-bb-x').addEventListener('click', () => cancelMove());
$('pf-recs-btn').addEventListener('click', () => openRecs());
$('pk-close').addEventListener('click', closePicker);
$('pk-bg').addEventListener('click', closePicker);
$('pk-q').addEventListener('input', () => { picker.q = $('pk-q').value; renderPicker(); });
$('pk-body').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  const id = b.dataset.id, cb = picker.onPick;
  closePicker();
  if (cb) cb(id);
});

/* ------------------------------------------------------------------ */
/* List sheet                                                          */
/* ------------------------------------------------------------------ */
const listSheet = $('pf-list'), setSheet = $('pf-set'), scrim = $('pf-scrim');
function closeAux() {
  listSheet.classList.remove('open'); setSheet.classList.remove('open'); scrim.classList.remove('show');
}
function openList() {
  hideDueBanner();
  if (moveMode) cancelMove();
  if (selected) closeSheet();
  renderList();
  listSheet.classList.add('open'); scrim.classList.add('show');
}
const plantTitle = (p, def) => (p.nick ? `${esc(p.nick)}<small>${esc(def.name)}</small>` : esc(def.name));
function listItems() {
  return state.plants.map((p) => { const c = compute(p); return { p, ...c, def: plantDef(p.plantId), due: dueInfo(p, c.r) }; });
}
function renderList() {
  const items = listItems();
  items.sort((A, B) => A.due.days - B.due.days || (B.r?.mlPerWatering ?? 0) - (A.r?.mlPerWatering ?? 0));
  const dueL = items.filter((i) => i.due.due), soon = items.filter((i) => !i.due.due);
  const sumMl = dueL.reduce((s, i) => s + (isDip(i.r) ? 0 : (i.r?.mlPerWatering || 0)), 0);
  const vol = (ml) => (ml >= 1000 ? fmt1(ml / 1000) + ' l' : fmtInt(ml) + ' ml');
  const row = ({ p, a, r, def, due }) => {
    const w0 = (r?.warnings || [])[0];
    return `<div class="pf-lrow" data-uid="${esc(p.uid)}">
      <button class="open" data-uid="${esc(p.uid)}">
        <div class="pf-emoji">${plantIcon(def)}</div>
        <div class="t"><b>${plantTitle(p, def)}</b><span>${esc(a.roomName || '–')}${a.outdoor ? '' : a.windowDistanceM != null ? ` · ${compassName(a.windowCompassDeg)}fenster ${fmt1(a.windowDistanceM)} m` : ' · ohne Fenster'}</span>${w0 ? `<span class="wn">⚠ ${esc(w0)}</span>` : ''}</div>
        <div class="w">${r ? `<b>${isDip(r) ? 'Tauchen' : fmtInt(r.mlPerWatering) + ' ml'}</b>` : ''}<span class="${due.cls || (due.due ? 'due' : '')}">${esc(due.text)}</span></div>
      </button>
      <button class="pf-ck${due.due ? ' due' : ''}" data-water="${esc(p.uid)}" aria-label="Gegossen" title="Gegossen">✓</button>
    </div>`;
  };
  const body = $('pf-list-body');
  body.innerHTML = `
    <div class="pf-head"><div style="min-width:0"><h2>Heute gießen</h2><p style="font-style:normal">${items.length ? `${items.length} Pflanzen · ${dueL.length ? `${dueL.length} fällig` : 'alles gegossen'}` : ''}</p></div>
    <button class="pf-hbtn${state.reminder.on ? ' on' : ''}" id="l-rem" aria-label="Erinnerung" title="Erinnerung">${ICONS.bell}</button>
    <button class="pf-x" id="l-close" aria-label="Schließen">${ICONS.close}</button></div>
    ${items.length ? `
      ${dueL.length ? `<div class="pf-grp" id="l-due"><h3 class="due">Fällig (${dueL.length} · ${vol(sumMl)})</h3><button id="l-all">Alle gegossen</button></div>
        ${dueL.map(row).join('')}` : '<div class="pf-grp" id="l-due"><h3>Fällig (0)</h3></div><div class="pf-list-empty" style="padding:6px 0 10px">Heute ist nichts zu gießen. 🌿</div>'}
      ${soon.length ? `<div class="pf-grp" id="l-soon"><h3>Demnächst</h3></div>${soon.map(row).join('')}` : ''}`
    : '<div class="pf-list-empty">Noch keine Pflanzen.<br>Tippe in der 3D-Ansicht auf den Boden oder ein Fenster, um deine erste Pflanze zu platzieren.</div>'}
    <button class="pf-rlink" id="l-share"><span class="ic">📄</span><span class="t"><b>Gießplan teilen</b><span>PDF für deine Urlaubsvertretung – per WhatsApp & Co.</span></span></button>
    <button class="pf-rlink" id="l-recs"><span class="ic">🪴</span><span class="t"><b>Was passt wohin?</b><span>Freie Plätze und passende Pflanzen je Raum</span></span></button>`;
  $('l-close').addEventListener('click', closeAux);
  $('l-recs').addEventListener('click', () => openRecs());
  $('l-share').addEventListener('click', () => openShare());
  $('l-rem').addEventListener('click', () => openReminder('list'));
  if ($('l-all')) $('l-all').addEventListener('click', () => waterPlants(dueL.map((i) => i.p)));
  body.querySelectorAll('button.open').forEach((b) => b.addEventListener('click', () => {
    const p = state.plants.find((q) => q.uid === b.dataset.uid);
    closeAux();
    if (p) openPlant(p, { focus: true });
  }));
  body.querySelectorAll('[data-water]').forEach((b) => b.addEventListener('click', () => {
    const p = state.plants.find((q) => q.uid === b.dataset.water);
    if (p) waterPlants([p]);
  }));
}

/* ------------------------------------------------------------------ */
/* Settings sheet (Nordausrichtung)                                    */
/* ------------------------------------------------------------------ */
function openSettings() {
  if (moveMode) cancelMove();
  if (selected) closeSheet();
  const body = $('pf-set-body');
  const def = +FP.planUpCompassDeg || 0;
  body.innerHTML = `
    <div class="pf-head"><div style="min-width:0"><h2>Einstellungen</h2><p style="font-style:normal">Ausrichtung, Anzeige und Erinnerung</p></div>
    <button class="pf-x" id="st-close" aria-label="Schließen">${ICONS.close}</button></div>
    <div class="pf-settings">
      <p><b style="color:var(--ink)">Ausrichtung</b> – Wohin zeigt die obere Planseite? Die Himmelsrichtung ist eine Annahme. Stimmt sie nicht, korrigiere sie hier – die Lichtberechnung aller Pflanzen passt sich an.</p>
      <div class="pf-set-or">
        <div class="v"><b id="st-v"></b><span>Plan-oben zeigt in diese Richtung</span></div>
        <button id="st-orient" type="button">Mit Kompass einstellen</button>
      </div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div><b>Stockwerk</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)" id="st-bl">${esc(buildingLabel())}</p></div>
        <div class="pf-step"><button id="st-f-" aria-label="Stockwerk tiefer">−</button><b id="st-f">${state.building.floor}</b><button id="st-f+" aria-label="Stockwerk höher">+</button>
          <span>von</span><button id="st-t-" aria-label="weniger Geschosse">−</button><b id="st-t">${state.building.total}</b><button id="st-t+" aria-label="mehr Geschosse">+</button></div></div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div style="min-width:0"><b>Wände</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)" id="st-wm-h">${state.wallMode === 'cut' ? 'Alle Wände auf 1,2 m geschnitten' : 'Hintere Außenwände in voller Höhe'}</p></div>
        <div class="pf-segs" id="st-wm"><button data-m="diorama" class="${state.wallMode !== 'cut' ? 'on' : ''}">Diorama</button><button data-m="cut" class="${state.wallMode === 'cut' ? 'on' : ''}">Schnitt</button></div></div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div style="min-width:0"><b>Lampen</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)">Auto: an ab Sonnenuntergang</p></div>
        <div class="pf-segs" id="st-lamps">${[['auto', 'Auto'], ['on', 'An'], ['off', 'Aus']].map(([k, t]) => `<button data-m="${k}" class="${state.lamps === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div><b>Pflanzennamen anzeigen</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)">Aus: nur kleine Symbole an den Pflanzen</p></div>
        <button class="pf-switch" id="st-pnames" role="switch" aria-checked="${state.showPlantNames}" aria-label="Pflanzennamen anzeigen"></button></div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div><b>Raumnamen anzeigen</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)">Namen und Flächen im Grundriss</p></div>
        <button class="pf-switch" id="st-names" role="switch" aria-checked="${state.showRoomNames}" aria-label="Raumnamen anzeigen"></button></div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div><b>Pflanzen bewegen sich</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)">Leichtes Wiegen im Luftzug · aus spart Akku</p></div>
        <button class="pf-switch" id="st-motion" role="switch" aria-checked="${state.motion}" aria-label="Bewegung an/aus"></button></div>
      <button class="pf-rlink" id="st-design"><span class="ic">🛋️</span><span class="t"><b>Wohnung gestalten</b><span>Möbel als Planzeichen, Teppiche, Böden und Wandfarben</span></span></button>
      <button class="pf-rlink" id="st-rem"><span class="ic">${ICONS.bell}</span><span class="t"><b>Erinnerung</b><span>${esc(reminderSummary())}</span></span></button>
    </div>`;
  void def;
  $('st-v').textContent = `${compassName(planUpDeg())} · ${Math.round(planUpDeg())}°`;
  $('st-orient').addEventListener('click', () => { save(); startOrient(); });
  $('st-close').addEventListener('click', () => { save(); closeAux(); });
  $('st-rem').addEventListener('click', () => { save(); openReminder('settings'); });
  $('st-design').addEventListener('click', () => { save(); startDesign(); });
  const stepB = (df, dt) => {
    const B = state.building;
    B.total = clamp(B.total + dt, 1, 30); B.floor = clamp(B.floor + df, 1, B.total);
    $('st-f').textContent = B.floor; $('st-t').textContent = B.total; $('st-bl').textContent = buildingLabel();
    save(); buildBuilding();
  };
  $('st-f-').addEventListener('click', () => stepB(-1, 0)); $('st-f+').addEventListener('click', () => stepB(1, 0));
  $('st-t-').addEventListener('click', () => stepB(0, -1)); $('st-t+').addEventListener('click', () => stepB(0, 1));
  $('st-motion').addEventListener('click', () => {
    state.motion = !state.motion; save();
    $('st-motion').setAttribute('aria-checked', String(state.motion)); requestRender();
  });
  $('st-wm').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state.wallMode = b.dataset.m; save();
    $('st-wm').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    $('st-wm-h').textContent = state.wallMode === 'cut' ? 'Alle Wände auf 1,2 m geschnitten' : 'Hintere Außenwände in voller Höhe';
    requestRender();
  }));
  $('st-lamps').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    state.lamps = b.dataset.m; save();
    $('st-lamps').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    placeSun(); shadowsDirty();
  }));
  $('st-pnames').addEventListener('click', () => {
    state.showPlantNames = !state.showPlantNames; save();
    $('st-pnames').setAttribute('aria-checked', String(state.showPlantNames)); applyPlantNames();
  });
  $('st-names').addEventListener('click', () => {
    state.showRoomNames = !state.showRoomNames; save();
    $('st-names').setAttribute('aria-checked', String(state.showRoomNames)); requestRender();
  });
  setSheet.classList.add('open'); scrim.classList.add('show');
}

/* ------------------------------------------------------------------ */
/* Ausrichtung: Kompassring um die Wohnung (nur beim Einstellen)       */
/* ------------------------------------------------------------------ */
const orient = { on: false, prevNorth: null, prevView: '3d', drag: null, sens: { on: false, h: null, got: false, timer: null } };
const DIR_SHORT = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
const mod360 = (v) => ((v % 360) + 360) % 360;
// Kreis um den Grundriss (Weltkoordinaten)
const orCircle = (() => {
  let x = 0, z = 0;
  fitPts.forEach((p) => { x += p.x; z += p.z; });
  x /= fitPts.length; z /= fitPts.length;
  let r = 0; fitPts.forEach((p) => { r = Math.max(r, Math.hypot(p.x - x, p.z - z)); });
  return { x, z, r: r + 0.35 };
})();
function orientPose() {
  const pts = [];
  const R = orCircle.r * 1.22; // Platz für die Beschriftung außen
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push(new THREE.Vector3(orCircle.x + Math.cos(a) * R, 0, orCircle.z + Math.sin(a) * R)); }
  const top = $('pf-orb').getBoundingClientRect().bottom + 8, bot = $('pf-orc').getBoundingClientRect().top - 8;
  const r = fitPose(0.01, baseAzimuthDeg(), pts, { x0: -1 + 16 / W, x1: 1 - 16 / W, y0: 1 - 2 * bot / H, y1: 1 - 2 * top / H });
  controls.maxDistance = Math.max(controls.maxDistance, r.dist * 1.6);
  return r;
}
function startOrient() {
  closeAux();
  if (moveMode) cancelMove();
  if (selected) closeSheet({ restoreView: false });
  orient.on = true; orient.prevNorth = state.northDeg; orient.prevView = viewMode;
  appEl.classList.add('pf-orient');
  ['pf-or', 'pf-orb', 'pf-orc'].forEach((id) => $(id).classList.remove('hide'));
  $('or-msg').textContent = '';
  controls.enabled = false;
  viewMode = 'top';
  document.querySelectorAll('#pf-viewseg button').forEach((b) => b.classList.toggle('on', b.dataset.v === 'top'));
  requestAnimationFrame(() => { const r = orientPose(); flyTo(r.pos, r.target, 650); shadowsDirty(); });
  updateOrientText();
  requestRender();
}
function endOrient(keep) {
  if (!orient.on) return;
  if (!keep) state.northDeg = orient.prevNorth;
  orient.on = false; orient.drag = null;
  stopSensor();
  appEl.classList.remove('pf-orient');
  ['pf-or', 'pf-orb', 'pf-orc'].forEach((id) => $(id).classList.add('hide'));
  controls.enabled = true;
  save();
  northChanged(true);
  setViewMode(orient.prevView);
  if (keep) toast(`Ausrichtung: Plan-oben ${compassName(planUpDeg())} · ${Math.round(planUpDeg())}°`);
}
// Nordrichtung geändert: Sonne/Schatten sofort, teure Neuberechnungen erst am Ende (full)
function northChanged(full) {
  placeSun(); shadowsDirty();
  if (full) { updateCount(); if (selected) refreshSheet(); if (light.on) refreshLight(); }
  updateOrientText();
  requestRender();
}
let orGeom = null; // zuletzt gezeichnete Ringgeometrie (Bildschirm)
// Bildschirmwinkel (im Uhrzeigersinn ab oben) einer Kompassrichtung; angN = Bildschirmwinkel von Nord
function drawRing(angN) {
  const c = toScreen(new THREE.Vector3(orCircle.x, 0, orCircle.z));
  const ex = toScreen(new THREE.Vector3(orCircle.x + orCircle.r, 0, orCircle.z)), ez = toScreen(new THREE.Vector3(orCircle.x, 0, orCircle.z + orCircle.r));
  const R = (Math.hypot(ex.x - c.x, ex.y - c.y) + Math.hypot(ez.x - c.x, ez.y - c.y)) / 2;
  orGeom = { cx: c.x, cy: c.y, R, angN };
  const P = (deg, r) => { const a = (angN + deg) * Math.PI / 180; return [c.x + Math.sin(a) * r, c.y - Math.cos(a) * r]; };
  let ticks = '', majors = '', labels = '';
  for (let d = 0; d < 360; d += 5) {
    const big = d % 15 === 0, l = d % 45 === 0 ? 13 : big ? 9 : 5;
    const [x0, y0] = P(d, R - 1), [x1, y1] = P(d, R - 1 - l);
    (big ? (majors += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`) : (ticks += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`));
  }
  for (let k = 0; k < 8; k++) {
    const [x, y] = P(k * 45, R + 17);
    const n = k === 0;
    labels += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="${n ? 17 : k % 2 ? 11 : 14}" fill="${n ? '#b5483a' : k % 2 ? '#8d8f88' : '#22231f'}">${DIR_SHORT[k]}</text>`;
  }
  for (let d = 30; d < 360; d += 30) {
    if (d % 90 === 0) continue;
    const [x, y] = P(d, R - 24);
    labels += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9.5" fill="#8d8f88" font-weight="600">${d}</text>`;
  }
  const [nx, ny] = P(0, R + 2), [nl, nly] = P(-4, R - 15), [nr, nry] = P(4, R - 15);
  // fester Index oben = Richtung, in die die Oberkante des Handys zeigt
  const topDeg = Math.round(mod360(-angN));
  let sensor = '';
  if (orient.sens.on && orient.sens.h != null) {
    const sa = -orient.sens.h; // Handy-Nord auf dem Bildschirm
    const Q = (r) => { const a = sa * Math.PI / 180; return [c.x + Math.sin(a) * r, c.y - Math.cos(a) * r]; };
    const [a0, b0] = Q(R - 30), [a1, b1] = Q(R + 32);
    sensor = `<path d="M${a0.toFixed(1)} ${b0.toFixed(1)}L${a1.toFixed(1)} ${b1.toFixed(1)}" stroke="#2f74d0" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 5"/>` +
      `<circle cx="${a1.toFixed(1)}" cy="${b1.toFixed(1)}" r="11" fill="#2f74d0"/><text x="${a1.toFixed(1)}" y="${b1.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#fff">N</text>`;
  }
  $('pf-or-svg').innerHTML = `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${(R + 17).toFixed(1)}" fill="none" stroke="rgba(255,255,255,.82)" stroke-width="30"/>
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${R.toFixed(1)}" fill="none" stroke="#22231f" stroke-width="1.6"/>
    <path d="${ticks}" stroke="#8d8f88" stroke-width="1.2"/><path d="${majors}" stroke="#22231f" stroke-width="1.8"/>
    <path d="M${nx.toFixed(1)} ${ny.toFixed(1)}L${nl.toFixed(1)} ${nly.toFixed(1)}L${nr.toFixed(1)} ${nry.toFixed(1)}Z" fill="#b5483a"/>
    ${labels}${sensor}
    <path d="M${c.x.toFixed(1)} ${(c.y - R - 36).toFixed(1)}l-8 -12h16z" fill="#22231f"/>
    <rect x="${(c.x - 26).toFixed(1)}" y="${(c.y - R - 70).toFixed(1)}" width="52" height="22" rx="11" fill="#22231f"/>
    <text x="${c.x.toFixed(1)}" y="${(c.y - R - 59).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="12.5" fill="#fff">${topDeg}°</text>`;
  $('or-top').textContent = `${topDeg}°`;
  $('or-sub').textContent = `Handy-oben zeigt nach ${compassName(topDeg)}`;
}
function updateOrientText() {
  $('or-msg').textContent = orient.sens.on ? (orient.sens.h == null ? 'Warte auf Kompass-Sensor …' : `Handy-Kompass: ${Math.round(orient.sens.h)}° · blaues N = echter Norden. Tippe „Übernehmen“, wenn der Grundriss wie die Wohnung liegt.`) : '';
  const b = $('or-sens');
  b.classList.toggle('on', orient.sens.on && orient.sens.h != null);
  b.textContent = orient.sens.on && orient.sens.h != null ? '✓ Übernehmen' : '📱 Handy-Kompass';
}
// Ring ziehen: Winkel um die Ringmitte → Nordrichtung des Plans
const orEl = $('pf-or');
const ptrAng = (e) => { const r = appEl.getBoundingClientRect(); return Math.atan2(e.clientX - r.left - orGeom.cx, -(e.clientY - r.top - orGeom.cy)) * 180 / Math.PI; };
orEl.addEventListener('pointerdown', (e) => {
  if (!orGeom) return;
  orEl.setPointerCapture(e.pointerId);
  orient.drag = { a0: ptrAng(e), up0: planUpDeg(), id: e.pointerId };
  orEl.style.cursor = 'grabbing';
});
orEl.addEventListener('pointermove', (e) => {
  const d = orient.drag; if (!d || d.id !== e.pointerId) return;
  let delta = ptrAng(e) - d.a0;
  delta = ((delta + 540) % 360) - 180;
  d.a0 += delta; d.up0 -= delta; // fortlaufend (kein Sprung bei ±180°)
  const v = Math.round(mod360(d.up0));
  if (v !== state.northDeg) { state.northDeg = v; northChanged(false); }
});
const orUp = (e) => { if (orient.drag && orient.drag.id === e.pointerId) { orient.drag = null; orEl.style.cursor = ''; } };
orEl.addEventListener('pointerup', orUp); orEl.addEventListener('pointercancel', orUp);
$('or-done').addEventListener('click', () => endOrient(true));
$('or-cancel').addEventListener('click', () => endOrient(false));
$('or-reset').addEventListener('click', () => { state.northDeg = null; northChanged(false); });
$('or-sens').addEventListener('click', async () => {
  const S = orient.sens;
  if (S.on && S.h != null && orGeom) {
    // Handy-Nord übernehmen: Plan so drehen, dass Plan-Nord auf dem Bildschirm = Sensor-Nord
    state.northDeg = Math.round(mod360(orGeom.angN + planUpDeg() + S.h));
    northChanged(false);
    toast('Handy-Kompass übernommen');
    return;
  }
  if (S.on) { stopSensor(); updateOrientText(); return; }
  await startSensor();
});
function onOrientEvt(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
  else if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null) h = 360 - e.alpha;
  if (h == null || !Number.isFinite(h)) return;
  const so = (screen.orientation && Number.isFinite(screen.orientation.angle)) ? screen.orientation.angle : (+window.orientation || 0);
  h = mod360(h + so);
  const S = orient.sens;
  // gleitender Mittelwert auf dem Kreis (Sensor zittert)
  if (S.h == null) S.h = h; else { const dd = ((h - S.h + 540) % 360) - 180; S.h = mod360(S.h + dd * 0.2); }
  if (!S.got) { S.got = true; clearTimeout(S.timer); }
  updateOrientText(); requestRender();
}
async function startSensor() {
  const S = orient.sens;
  try {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') { const res = await DOE.requestPermission(); if (res !== 'granted') throw new Error('denied'); }
  } catch (e) { $('or-msg').textContent = 'Kein Zugriff auf den Kompass-Sensor.'; return; }
  S.on = true; S.h = null; S.got = false;
  window.addEventListener('deviceorientationabsolute', onOrientEvt);
  window.addEventListener('deviceorientation', onOrientEvt);
  clearTimeout(S.timer);
  S.timer = setTimeout(() => { if (!S.got) { stopSensor(); $('or-msg').textContent = 'Kein Kompass-Sensor gefunden – stell den Ring von Hand nach deiner Kompass-App ein.'; updateOrientText(); $('or-msg').textContent = 'Kein Kompass-Sensor gefunden – stell den Ring von Hand nach deiner Kompass-App ein.'; } }, 2500);
  updateOrientText();
}
function stopSensor() {
  const S = orient.sens;
  S.on = false; S.h = null; clearTimeout(S.timer);
  window.removeEventListener('deviceorientationabsolute', onOrientEvt);
  window.removeEventListener('deviceorientation', onOrientEvt);
  requestRender();
}

/* ------------------------------------------------------------------ */
/* Wohnung gestalten (Möbel-Planzeichen, Teppiche, Böden, Wandfarben)  */
/* ------------------------------------------------------------------ */
const design = { on: false, tab: 'moebel', pending: null, sel: null, room: null, prevView: '3d', drag: null };
const FURN_ORDER = ['sofa', 'sessel', 'bett', 'tisch', 'rund', 'couchtisch', 'schreib', 'regal', 'schrank', 'kommode', 'teppich', 'teppichrund'];
const typeIcons = new Map();
function typeIcon(type) {
  if (!typeIcons.has(type)) {
    const sz = FURN[type].sizes[Math.min(1, FURN[type].sizes.length - 1)];
    const it = { type, w: sz[0], d: sz[1], sizeIdx: 1, style: type === 'teppich' ? 'muster' : 'terra' };
    const k = 46 / Math.max(it.w + 0.6, it.d + 0.6);
    typeIcons.set(type, itemCanvas(it, k * 1.6).cv.toDataURL());
  }
  return typeIcons.get(type);
}
const floorSwatches = new Map();
function floorSwatch(id) {
  if (!floorSwatches.has(id)) {
    const o = FLOOR_OPTS.find((f) => f.id === id), img = o.tex().image;
    const cv = document.createElement('canvas'); cv.width = 92; cv.height = 60;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0, img.width * 0.45, img.height * 0.45, 0, 0, 92, 60);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#' + new THREE.Color(o.color).getHexString(); g.fillRect(0, 0, 92, 60);
    floorSwatches.set(id, cv.toDataURL());
  }
  return floorSwatches.get(id);
}
const itemById = (id) => state.design.items.find((q) => q.id === id);
const roomOfPt = (x, y) => rooms.find((r) => pointInPoly(x, y, r.polygon)) || null;
function designPose() {
  const top = $('pf-dsb').getBoundingClientRect().bottom + 8, bot = $('pf-ds').getBoundingClientRect().top - 8;
  return fitPose(0.01, baseAzimuthDeg(), fitPts, { x0: -1 + 16 / W, x1: 1 - 16 / W, y0: 1 - 2 * bot / H, y1: 1 - 2 * top / H });
}
function startDesign() {
  closeAux();
  if (moveMode) cancelMove();
  if (selected) closeSheet({ restoreView: false });
  if (light.on) setLight(false);
  design.on = true; design.prevView = viewMode; design.pending = null; design.sel = null; design.room = null;
  appEl.classList.add('pf-design');
  $('pf-dsb').classList.remove('hide'); $('pf-ds').classList.remove('hide');
  viewMode = 'top';
  document.querySelectorAll('#pf-viewseg button').forEach((b) => b.classList.toggle('on', b.dataset.v === 'top'));
  renderDesign();
  requestAnimationFrame(() => { const r = designPose(); flyTo(r.pos, r.target, 650); shadowsDirty(); });
}
function endDesign() {
  if (!design.on) return;
  design.on = false; design.drag = null; design.sel = null; design.pending = null;
  controls.enabled = true;
  appEl.classList.remove('pf-design');
  $('pf-dsb').classList.add('hide'); $('pf-ds').classList.add('hide');
  markSelItem();
  save();
  setViewMode(design.prevView);
}
function markSelItem() {
  for (const [id, m] of itemObjs) m.material.color.set(design.on && id === design.sel ? 0xd9ecd9 : 0xffffff);
  requestRender();
}
function setDesignSub(t) { $('ds-sub').textContent = t; }
function renderDesign() {
  const el = $('pf-ds');
  const seg = `<div class="seg"><button data-tab="moebel" class="${design.tab === 'moebel' ? 'on' : ''}">Möbel & Teppiche</button><button data-tab="raum" class="${design.tab === 'raum' ? 'on' : ''}">Böden & Wände</button></div>`;
  let body = '';
  if (design.tab === 'moebel') {
    const it = design.sel ? itemById(design.sel) : null;
    if (it) {
      const F = FURN[it.type];
      const sizes = F.sizes.length > 1 ? `<div class="row"><span class="lab">Größe</span>${F.sizes.map((z, i) => `<button class="chip${it.sizeIdx === i ? ' on' : ''}" data-size="${i}">${esc(z[2] || (z[0] + ' × ' + z[1]))}</button>`).join('')}</div>` : '';
      const styles = F.rug ? `<div class="row"><span class="lab">Farbe</span>${RUG_STYLES.map((st) => st.id === 'muster'
        ? `<button class="chip${it.style === 'muster' ? ' on' : ''}" data-style="muster">Muster</button>`
        : `<button class="sw${it.style === st.id ? ' on' : ''}" data-style="${st.id}" style="background:${st.c}" aria-label="${st.id}"></button>`).join('')}</div>` : '';
      body = `<div class="ttl">${esc(F.name)}<small><button class="chip" data-desel="1" style="height:28px;padding:0 11px">＋ Weiteres Möbel</button></small></div>${sizes}${styles}
        <div class="acts"><button data-act="rot">↻ Drehen</button><button data-act="dup">Duplizieren</button><button data-act="del" class="del">Löschen</button></div>`;
      setDesignSub(`${F.name} ausgewählt · ziehen zum Verschieben`);
    } else {
      body = `<div class="hint">${design.pending ? `Tippe in den Grundriss, um ${esc(FURN[design.pending].name.toLowerCase().startsWith('teppich') ? 'den Teppich' : 'das Möbel')} zu platzieren.` : 'Wähle ein Möbel und tippe dann in den Grundriss. Vorhandene Möbel antippen zum Bearbeiten.'}</div>
        <div class="types">${FURN_ORDER.map((t) => `<button data-type="${t}" class="${design.pending === t ? 'on' : ''}"><img src="${typeIcon(t)}" alt="">${esc(FURN[t].name)}</button>`).join('')}</div>`;
      setDesignSub('Möbel antippen und ziehen zum Verschieben');
    }
  } else {
    const r = design.room;
    if (!r) {
      body = `<div class="hint">Tippe auf einen Raum im Grundriss – oder wähle ihn hier:</div><div class="row">${rooms.filter((q) => polyArea(q.polygon) > 1).map((q) => `<button class="chip" data-room="${esc(q.id)}">${esc(q.name)}</button>`).join('')}</div>`;
      setDesignSub('Raum antippen, um Boden und Wandfarbe zu wählen');
    } else {
      const rd = roomDesign(r), fl = rd.floor || defaultFloor(r), wl = rd.wall || 'alt';
      body = `<div class="ttl">${esc(r.name)}<small><button class="chip" data-room="" style="height:26px;padding:0 10px">Anderer Raum</button></small></div>
        <div class="row"><span class="lab">Boden</span>${FLOOR_OPTS.map((f) => `<button class="fl${f.id === fl ? ' on' : ''}" data-floor="${f.id}"><i style="background-image:url(${floorSwatch(f.id)})"></i>${esc(f.name)}</button>`).join('')}</div>
        <div class="row"><span class="lab">Wandfarbe · ${esc((WALL_OPTS.find((w) => w.id === wl) || WALL_OPTS[0]).name)}</span>${WALL_OPTS.map((w) => `<button class="sw${w.id === wl ? ' on' : ''}" data-wall="${w.id}" style="background:${w.c}" aria-label="${esc(w.name)}"></button>`).join('')}</div>`;
      setDesignSub(`${r.name}: Boden und Wandfarbe`);
    }
  }
  el.innerHTML = seg + body;
}
$('pf-ds').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.tab) { design.tab = d.tab; design.pending = null; design.sel = null; markSelItem(); renderDesign(); return; }
  if (d.desel) { design.sel = null; markSelItem(); renderDesign(); return; }
  if (d.type) { design.pending = design.pending === d.type ? null : d.type; renderDesign(); return; }
  if (d.room !== undefined) { design.room = d.room ? rooms.find((q) => q.id === d.room) : null; renderDesign(); return; }
  if (d.floor || d.wall) {
    const r = design.room; if (!r) return;
    const rd = (state.design.rooms[r.id] = state.design.rooms[r.id] || {});
    if (d.floor) rd.floor = d.floor; else rd.wall = d.wall;
    applyRoomLooks(); save(); renderDesign(); requestRender();
    return;
  }
  const it = design.sel ? itemById(design.sel) : null; if (!it) return;
  if (d.size != null) {
    const z = FURN[it.type].sizes[+d.size]; it.sizeIdx = +d.size; it.w = z[0]; it.d = z[1];
  } else if (d.style) it.style = d.style;
  else if (d.act === 'rot') {
    it.rot = ((it.rot || 0) + Math.PI / 2) % (Math.PI * 2);
    for (const p of plantsOn(it.id)) { const dx = p.x - it.x, dy = p.y - it.y; p.x = it.x - dy; p.y = it.y + dx; syncPlantObj(p); }
  }
  else if (d.act === 'dup') {
    const c = { ...it, id: uid(), x: it.x + 0.3, y: it.y + 0.3 };
    state.design.items.push(c); syncItem(c); design.sel = c.id;
  } else if (d.act === 'del') {
    const i = state.design.items.indexOf(it);
    state.design.items.splice(i, 1); syncItem({ id: it.id, _gone: true });
    const on = plantsOn(it.id); on.forEach((p) => { p.onItem = undefined; syncPlantObj(p); });
    design.sel = null; save(); renderDesign(); markSelItem();
    toast(`${FURN[it.type].name} entfernt`, () => { state.design.items.splice(i, 0, it); syncItem(it); on.forEach((p) => { p.onItem = it.id; syncPlantObj(p); }); save(); requestRender(); });
    return;
  }
  syncItem(it); save(); markSelItem(); renderDesign();
});
$('ds-done').addEventListener('click', endDesign);
// Treffer auf Möbel: echte Möbel vor Teppichen
function designItemAt(sx, sy) {
  ndc.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects([...itemObjs.values()], false);
  if (!hits.length) return null;
  // nur innerhalb der eigentlichen Fläche (nicht im Rand für Stühle)
  const inside = (h) => { const it = itemById(h.object.userData.itemId); if (!it) return false; const c = Math.cos(it.rot || 0), s2 = Math.sin(it.rot || 0), dx = h.point.x - it.x, dy = h.point.z - it.y;
    const u = dx * c + dy * s2, v = -dx * s2 + dy * c; return Math.abs(u) <= it.w / 2 + 0.08 && Math.abs(v) <= it.d / 2 + 0.08; };
  const ok = hits.filter(inside);
  ok.sort((a, b) => (FURN[itemById(a.object.userData.itemId).type].rug ? 1 : 0) - (FURN[itemById(b.object.userData.itemId).type].rug ? 1 : 0));
  return ok.length ? itemById(ok[0].object.userData.itemId) : null;
}
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), groundPt = new THREE.Vector3();
function floorAtScreen(sx, sy) {
  ndc.set((sx / W) * 2 - 1, -(sy / H) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(groundPlane, groundPt) ? { x: groundPt.x, y: groundPt.z } : null;
}
// neues Möbel: mit der Rückseite an die nächste Wand, wenn sie nah ist
function placeItem(type, x, y) {
  const F = FURN[type], si = Math.min(1, F.sizes.length - 1), z = F.sizes[si];
  const it = { id: uid(), type, x, y, w: z[0], d: z[1], rot: 0, sizeIdx: si, style: F.rug ? (type === 'teppich' ? 'salbei' : 'terra') : undefined };
  const room = roomOfPt(x, y);
  if (room && !F.rug) {
    const P = room.polygon; let best = null;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], dd = distToSeg(x, y, a, b);
      if (!best || dd < best.dd) best = { a, b, dd };
    }
    if (best) {
      const L = Math.hypot(best.b[0] - best.a[0], best.b[1] - best.a[1]) || 1;
      let nx = -(best.b[1] - best.a[1]) / L, ny = (best.b[0] - best.a[0]) / L; // Normale
      const mx = (best.a[0] + best.b[0]) / 2, my = (best.a[1] + best.b[1]) / 2;
      if (!pointInPoly(mx + nx * 0.2, my + ny * 0.2, P)) { nx = -nx; ny = -ny; } // nach innen
      it.rot = Math.atan2(-nx, ny);
      if (best.dd < 1.0) {
        const ex = (best.b[0] - best.a[0]) / L, ey = (best.b[1] - best.a[1]) / L;
        const tpos = clamp((x - best.a[0]) * ex + (y - best.a[1]) * ey, 0, L);
        it.x = best.a[0] + ex * tpos + nx * (it.d / 2 + 0.02); it.y = best.a[1] + ey * tpos + ny * (it.d / 2 + 0.02);
      }
    }
  }
  state.design.items.push(it); syncItem(it);
  design.sel = it.id; design.pending = null;
  save(); markSelItem(); renderDesign();
}
function designTap(sx, sy) {
  if (design.tab === 'moebel') {
    if (design.pending) { const g = floorAtScreen(sx, sy); if (g && (roomOfPt(g.x, g.y) || (balcony && pointInPoly(g.x, g.y, balcony.polygon)))) placeItem(design.pending, g.x, g.y); return; }
    const it = designItemAt(sx, sy);
    design.sel = it ? it.id : null; markSelItem(); renderDesign();
    return;
  }
  const g = floorAtScreen(sx, sy), r = g && roomOfPt(g.x, g.y);
  if (r) { design.room = r; renderDesign(); }
}
// Ziehen von Möbeln (vor OrbitControls abfangen)
cvs.addEventListener('pointerdown', (e) => {
  if (!design.on || design.tab !== 'moebel' || design.pending) return;
  const rc = cvs.getBoundingClientRect(), sx = e.clientX - rc.left, sy = e.clientY - rc.top;
  const it = designItemAt(sx, sy); if (!it) return;
  const g = floorAtScreen(sx, sy); if (!g) return;
  design.drag = { id: it.id, pid: e.pointerId, ox: it.x - g.x, oy: it.y - g.y, moved: false };
  controls.enabled = false;
  if (design.sel !== it.id) { design.sel = it.id; markSelItem(); renderDesign(); }
}, { capture: true });
cvs.addEventListener('pointermove', (e) => {
  const D = design.drag; if (!D || D.pid !== e.pointerId) return;
  const rc = cvs.getBoundingClientRect(), g = floorAtScreen(e.clientX - rc.left, e.clientY - rc.top); if (!g) return;
  const it = itemById(D.id); if (!it) return;
  const dx = g.x + D.ox - it.x, dy = g.y + D.oy - it.y;
  it.x += dx; it.y += dy; D.moved = true;
  const m = itemObjs.get(it.id); if (m) m.position.set(it.x, m.position.y, it.y);
  const m3 = item3d.get(it.id); if (m3) m3.position.set(it.x, m3.position.y, it.y);
  for (const p of plantsOn(it.id)) { p.x += dx; p.y += dy; const o = plantObjs.get(p.uid); if (o) o.position.set(p.x, o.position.y, p.y); }
  requestRender();
});
const endDrag = (e) => {
  const D = design.drag; if (!D || D.pid !== e.pointerId) return;
  design.drag = null; controls.enabled = true;
  if (D.moved) { save(); shadowsDirty(); }
};
cvs.addEventListener('pointerup', endDrag); cvs.addEventListener('pointercancel', endDrag);

/* ------------------------------------------------------------------ */
/* Gießplan als PDF: wann und wie viel – zum Teilen mit der Vertretung   */
/* ------------------------------------------------------------------ */
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const dShort = (d) => `${WD[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const share = { from: null, to: null, who: '', note: '' };
function openShare() {
  if (!state.plants.length) { toast('Noch keine Pflanzen'); return; }
  closeAux();
  const t0 = new Date(); t0.setHours(12, 0, 0, 0);
  if (!share.from) { share.from = isoDay(t0); share.to = isoDay(new Date(t0.getTime() + 13 * 864e5)); }
  const body = $('pf-set-body');
  body.innerHTML = `<div class="pf-head"><div style="min-width:0"><h2>Gießplan teilen</h2><p style="font-style:normal">PDF mit Grundriss, Mengen und Terminen</p></div>
      <button class="pf-x" id="sh-close" aria-label="Schließen">${ICONS.close}</button></div>
    <div class="pf-shf">
      <div class="row2"><label>Von<input type="date" id="sh-from" value="${share.from}"></label><label>Bis<input type="date" id="sh-to" value="${share.to}"></label></div>
      <div class="chips"><button data-d="7">1 Woche</button><button data-d="14">2 Wochen</button><button data-d="21">3 Wochen</button></div>
      <label>Für (optional)<input type="text" id="sh-who" maxlength="40" placeholder="z. B. Lena" value="${esc(share.who)}"></label>
      <label>Hinweise (optional)<textarea id="sh-note" rows="3" maxlength="400" placeholder="z. B. Gießkanne steht unter der Spüle, Schlüssel bei …">${esc(share.note)}</textarea></label>
      <div class="sum" id="sh-sum"></div>
      <button class="pf-act primary" id="sh-go" style="width:100%;height:50px;flex:none;border-radius:14px;font-size:16px">PDF erstellen & teilen</button>
    </div>`;
  const upd = () => {
    share.from = $('sh-from').value; share.to = $('sh-to').value; share.who = $('sh-who').value.trim(); share.note = $('sh-note').value.trim();
    const sch = waterSchedule(share.from, share.to);
    $('sh-sum').textContent = sch.days.length ? `${sch.days.length} Gießtage · ${sch.items.length} Pflanzen` : 'Im Zeitraum muss nichts gegossen werden.';
  };
  ['sh-from', 'sh-to', 'sh-who', 'sh-note'].forEach((id) => $(id).addEventListener('input', upd));
  body.querySelector('.chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-d]'); if (!b) return;
    const f = new Date($('sh-from').value + 'T12:00'); $('sh-to').value = isoDay(new Date(f.getTime() + (+b.dataset.d - 1) * 864e5)); upd();
  });
  $('sh-close').addEventListener('click', closeAux);
  $('sh-go').addEventListener('click', async () => {
    upd();
    const b = $('sh-go'); b.disabled = true; b.textContent = 'Erstelle PDF …';
    try { await makeWaterPdf(); } catch (e) { console.warn(e); toast('PDF konnte nicht erstellt werden'); }
    b.disabled = false; b.textContent = 'PDF erstellen & teilen';
  });
  upd();
  setSheet.classList.add('open'); scrim.classList.add('show');
}
// Termine im Zeitraum: ab dem nächsten Fälligkeitstag (Überfälliges am ersten Tag) im jeweiligen Rhythmus
function waterSchedule(fromIso, toIso) {
  const from = new Date((fromIso || '') + 'T12:00'), to = new Date((toIso || '') + 'T12:00');
  if (isNaN(from) || isNaN(to) || to < from) return { items: [], days: [] };
  const list = numberedPlants();
  const byDay = new Map();
  const items = [];
  for (const it of list) {
    const r = it.r; if (!r || !Number.isFinite(+r.intervalDays)) continue;
    const iv = Math.max(1, Math.round(+r.intervalDays));
    const last = new Date(it.p.lastWateredAt || nowDate().toISOString()); last.setHours(12, 0, 0, 0);
    let d = new Date(last.getTime() + iv * 864e5);
    if (d < from) d = new Date(from);
    const dates = [];
    while (d <= to) { dates.push(new Date(d)); d = new Date(d.getTime() + iv * 864e5); }
    items.push({ ...it, iv, dates });
    for (const x of dates) { const k = isoDay(x); if (!byDay.has(k)) byDay.set(k, { date: x, list: [] }); byDay.get(k).list.push(it); }
  }
  const days = [...byDay.values()].sort((a, b) => a.date - b.date);
  return { items, days, from, to };
}
// Pflanzen nach Raum sortiert und durchnummeriert (gleiche Nummern in Plan, Liste und Kalender)
function numberedPlants() {
  const L = state.plants.map((p) => { const { a, r } = compute(p); return { p, a, r, def: plantDef(p.plantId) }; });
  L.sort((A, B) => String(A.a.roomName || '').localeCompare(String(B.a.roomName || ''), 'de') || A.p.y - B.p.y || A.p.x - B.p.x);
  L.forEach((x, i) => { x.n = i + 1; });
  return L;
}
function placeText(it) {
  const p = it.p, oi = p.onItem && state.design && itemById(p.onItem);
  const where = oi ? `auf ${FURN[oi.type].name}` : sillOf(p) ? 'Fensterbank' : p.standCm >= 60 ? 'auf dem Tisch' : p.standCm > 0 ? 'auf dem Hocker' : 'Boden';
  return [it.a.roomName, where].filter(Boolean).join(' · ');
}
const amountText = (r) => (isDip(r) ? 'Tauchen (ca. 10 Min.)' : `${fmtInt(r.mlPerWatering)} ml`);
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[data-src="${src}"]`)) { res(); return; }
    const el = document.createElement('script'); el.src = src; el.dataset.src = src; el.onload = () => res(); el.onerror = rej;
    document.head.appendChild(el);
  });
}
// Grundriss von oben rendern (eigene Kamera, quadratisch), mit nummerierten Markern
function planSnapshot(list, S = 1400) {
  const prevPR = renderer.getPixelRatio();
  const xs = fitPts.map((p) => p.x), zs = fitPts.map((p) => p.z);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ext = Math.max(x1 - x0, z1 - z0) / 2 + 0.4;
  const cam = new THREE.PerspectiveCamera(20, 1, 0.1, 400);
  const dist = ext / Math.tan(THREE.MathUtils.degToRad(10));
  cam.position.set(cx, dist, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const hidden = [];
  const hide = (o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } };
  hide(ring); hide(distLine); if (bldg.above) hide(bldg.above);
  for (const lm of light.meshes || []) hide(lm);
  renderer.setPixelRatio(1); renderer.setSize(S, S, false);
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, cam);
  const shot = renderer.domElement.toDataURL('image/png');
  hidden.forEach((o) => { o.visible = true; });
  renderer.setPixelRatio(prevPR); resize(); shadowsDirty();
  const proj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return [(v.x + 1) / 2 * S, (1 - v.y) / 2 * S]; };
  const markers = list.map((it) => { const g = plantObjs.get(it.p.uid); const top = g ? g.userData.standY + 0.05 : 0; const [x, y] = proj(it.p.x, top, it.p.y); return { n: it.n, x, y }; });
  // Zuschnitt auf den Grundriss
  const corners = fitPts.map((p) => proj(p.x, p.y, p.z));
  const pad = 40, bx0 = Math.max(0, Math.min(...corners.map((c) => c[0])) - pad), by0 = Math.max(0, Math.min(...corners.map((c) => c[1])) - pad);
  const bx1 = Math.min(S, Math.max(...corners.map((c) => c[0])) + pad), by1 = Math.min(S, Math.max(...corners.map((c) => c[1])) + pad);
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = bx1 - bx0; cv.height = by1 - by0;
      const g = cv.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
      g.drawImage(img, bx0, by0, cv.width, cv.height, 0, 0, cv.width, cv.height);
      for (const m of markers) {
        const x = m.x - bx0, y = m.y - by0, r = 26;
        g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fillStyle = '#ffffff'; g.fill();
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#3c6247'; g.fill();
        g.fillStyle = '#ffffff'; g.font = 'bold 28px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(m.n), x, y + 1);
      }
      // Nordpfeil (Plan-oben = planUpDeg)
      { const a = -planUpDeg() * Math.PI / 180, nx = cv.width - 60, ny = 64;
        g.save(); g.translate(nx, ny); g.rotate(a);
        g.fillStyle = '#3c6247'; g.beginPath(); g.moveTo(0, -34); g.lineTo(13, 10); g.lineTo(0, 2); g.lineTo(-13, 10); g.closePath(); g.fill();
        g.restore(); g.fillStyle = '#3c6247'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('N', nx + Math.sin(a) * 52, ny - Math.cos(a) * 52); }
      res({ url: cv.toDataURL('image/jpeg', 0.9), w: cv.width, h: cv.height });
    };
    img.src = shot;
  });
}
function pngOf(url, size = 96) {
  return new Promise((res) => {
    if (!url) { res(null); return; }
    const img = new Image();
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, size, size); g.drawImage(img, 0, 0, size, size); res(cv.toDataURL('image/jpeg', 0.9)); };
    img.onerror = () => res(null);
    img.src = url;
  });
}
async function makeWaterPdf() {
  await loadScript('vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf;
  const sch = waterSchedule(share.from, share.to);
  const list = numberedPlants();
  const snap = await planSnapshot(list);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, M = 14;
  const GREEN = [60, 98, 71], INK = [34, 35, 31], GREY = [120, 118, 110], LINE = [226, 222, 214];
  const txt = (t, x, y, o = {}) => { doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.setFontSize(o.s || 10); doc.setTextColor(...(o.c || INK)); doc.text(String(t), x, y, o.opt || {}); };
  const clean = (t) => String(t || '').replace(/[–—]/g, '-').replace(/[≈]/g, 'ca.').replace(/[^\x00-\xFF]/g, '');
  let y = M;
  const footer = () => { txt('Erstellt mit Plantdaddy', PW / 2, PH - 8, { s: 8, c: GREY, opt: { align: 'center' } }); };
  const newPage = () => { footer(); doc.addPage(); y = M; };
  // Kopf
  doc.setFillColor(...GREEN); doc.rect(0, 0, PW, 30, 'F');
  txt('Gießplan', M, 15, { s: 22, b: true, c: [255, 255, 255] });
  const range = sch.from && sch.to ? `${dShort(sch.from)}${sch.from.getFullYear() !== sch.to.getFullYear() ? sch.from.getFullYear() : ''} bis ${dShort(sch.to)}${sch.to.getFullYear()}` : '';
  txt(clean(`${FP.name || ''}  ·  ${range}`), M, 23, { s: 10.5, c: [225, 236, 228] });
  if (share.who) txt(clean(`Für ${share.who} - danke fürs Gießen!`), PW - M, 15, { s: 10.5, c: [255, 255, 255], opt: { align: 'right' } });
  y = 38;
  // Grundriss
  const maxW = PW - 2 * M, maxH = 112;
  let iw = maxW, ih = iw * snap.h / snap.w; if (ih > maxH) { ih = maxH; iw = ih * snap.w / snap.h; }
  doc.addImage(snap.url, 'JPEG', (PW - iw) / 2, y, iw, ih);
  y += ih + 7;
  // Pflanzenliste
  txt('Die Pflanzen', M, y, { s: 13, b: true }); y += 6;
  const thumbsPng = await Promise.all(list.map((it) => pngOf(thumbs.get(it.def.id))));
  const rowH = 13;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    if (y + rowH > PH - 16) { newPage(); }
    doc.setDrawColor(...LINE); doc.line(M, y + rowH - 1, PW - M, y + rowH - 1);
    doc.setFillColor(...GREEN); doc.circle(M + 4, y + 5.5, 3.6, 'F');
    txt(String(it.n), M + 4, y + 6.8, { s: 9, b: true, c: [255, 255, 255], opt: { align: 'center' } });
    if (thumbsPng[i]) doc.addImage(thumbsPng[i], 'JPEG', M + 10, y + 0.5, 10, 10);
    txt(clean(it.p.nick ? `${it.p.nick} (${it.def.name})` : it.def.name), M + 23, y + 4.6, { s: 10.5, b: true });
    txt(clean(placeText(it)), M + 23, y + 9.6, { s: 8.5, c: GREY });
    if (it.r) {
      txt(clean(amountText(it.r)), PW - M - 38, y + 4.6, { s: 10.5, b: true, c: GREEN });
      txt(clean(intervalText(it.r.intervalDays)), PW - M - 38, y + 9.6, { s: 8.5, c: GREY });
    }
    y += rowH;
  }
  // Kalender
  newPage();
  txt('Wann gießen?', M, y + 4, { s: 15, b: true }); y += 8;
  txt('Abhaken, was erledigt ist. Nummern = Pflanzen im Grundriss.', M, y + 2, { s: 9, c: GREY }); y += 8;
  if (!sch.days.length) { txt('Im Zeitraum muss nichts gegossen werden.', M, y + 4, { s: 11 }); y += 10; }
  for (const day of sch.days) {
    const lines = day.list.map((it) => clean(`${it.n}  ${it.p.nick || it.def.name.replace(/\s*\(.*\)\s*$/, '')}  -  ${it.r ? amountText(it.r) : ''}`));
    const sum = day.list.reduce((a, it) => a + (it.r && !isDip(it.r) ? it.r.mlPerWatering : 0), 0);
    const h = 8 + lines.length * 5.2;
    if (y + h > PH - 16) newPage();
    doc.setDrawColor(...GREEN); doc.setLineWidth(0.5); doc.roundedRect(M, y + 1, 5, 5, 1, 1, 'S');
    txt(dShort(day.date), M + 8, y + 5, { s: 11.5, b: true });
    if (sum) txt(clean(`zusammen ${sum >= 1000 ? fmt1(sum / 1000) + ' l' : fmtInt(sum) + ' ml'}`), PW - M, y + 5, { s: 9, c: GREY, opt: { align: 'right' } });
    let yy = y + 10.5;
    for (const l of lines) { txt(l, M + 8, yy, { s: 10 }); yy += 5.2; }
    doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, y + h + 1, PW - M, y + h + 1);
    y += h + 3;
  }
  // Hinweise
  const tips = ['Langsam gießen, bis unten ein wenig herausläuft. Wasser im Untersetzer nach 15 Minuten wegschütten.',
    'Lieber etwas weniger als zu viel: Ist die Erde noch nass, diesmal auslassen.',
    'Zimmerwarmes Leitungswasser ist ideal.'];
  if (share.note) tips.unshift(share.note);
  const tl = tips.flatMap((t) => doc.splitTextToSize(clean('- ' + t), PW - 2 * M - 8));
  const th = 12 + tl.length * 5;
  if (y + th > PH - 16) newPage();
  doc.setFillColor(238, 244, 239); doc.roundedRect(M, y + 2, PW - 2 * M, th, 3, 3, 'F');
  txt('Gut zu wissen', M + 5, y + 9, { s: 11, b: true, c: GREEN });
  let ty = y + 15; for (const l of tl) { txt(l, M + 5, ty, { s: 9.5 }); ty += 5; }
  footer();
  const name = `Giessplan_${share.from || 'plan'}.pdf`;
  const b64 = doc.output('datauristring').split(',')[1];
  await sharePdf(b64, name, doc);
}
async function sharePdf(b64, name, doc) {
  const C = window.Capacitor, P = C && C.Plugins;
  const text = 'Gießplan für meine Pflanzen – danke fürs Gießen! 🌿';
  if (C && typeof C.isNativePlatform === 'function' && C.isNativePlatform() && P && P.Filesystem && P.Share) {
    const w = await P.Filesystem.writeFile({ path: name, data: b64, directory: 'CACHE' });
    await P.Share.share({ title: 'Gießplan', text, files: [w.uri], dialogTitle: 'Gießplan teilen' });
    return;
  }
  const blob = doc.output('blob'), file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Gießplan', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  window.__lastPdf = b64;
}

/* ------------------------------------------------------------------ */
/* Pflanzenbilder rendern                                              */
/* ------------------------------------------------------------------ */
const THUMB_SIZE = { gruen: [24, 110], palme: [24, 110], robust: [18, 60], haenge: [16, 40], blatt: [16, 40], kraut: [14, 30], sukk: [13, 18] };
function loadThumbs() {
  try {
    const d = JSON.parse(localStorage.getItem(THUMB_KEY) || 'null');
    if (d && d.ver === THUMB_VER && d.map) for (const k of Object.keys(d.map)) thumbs.set(k, d.map[k]);
  } catch (e) { /* ignore */ }
}
function genThumbs() {
  const todo = PLANTS.filter((d) => !thumbs.has(d.id));
  if (!todo.length) return;
  let R;
  try {
    R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (e) { return; }
  const S = 160;
  R.setPixelRatio(1); R.setSize(S, S, false);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15;
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff6e8, 0x9c8a74, 1.5));
  const dl = new THREE.DirectionalLight(0xfff1dc, 2.1); dl.position.set(-1.2, 2.2, 1.6); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.01, 50);
  const box = new THREE.Box3(), ctr = new THREE.Vector3(), size = new THREE.Vector3();
  const one = (def) => {
    const sz = THUMB_SIZE[def.cat] || [18, 50];
    const m = PM.buildPlant(def.id, { potDiameterCm: sz[0], plantHeightCm: sz[1], color: def.color, shape: def.shape, seed: 'thumb', lod: 1 });
    sc.add(m);
    box.setFromObject(m); box.getCenter(ctr); box.getSize(size);
    const rad = Math.max(size.y * 0.55, Math.hypot(size.x, size.z) * 0.5);
    const dist = rad / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 1.02;
    const dir = new THREE.Vector3(0.35, 0.42, 1).normalize();
    cam.position.copy(ctr).addScaledVector(dir, dist);
    cam.lookAt(ctr);
    R.render(sc, cam);
    let url = R.domElement.toDataURL('image/webp', 0.88);
    if (!url.startsWith('data:image/webp')) url = R.domElement.toDataURL('image/png');
    thumbs.set(def.id, url);
    sc.remove(m); PM.disposePlant(m);
  };
  let i = 0;
  const step = () => {
    const t0 = performance.now();
    while (i < todo.length && performance.now() - t0 < 24) one(todo[i++]);
    if (i < todo.length) { setTimeout(step, 16); return; }
    R.dispose(); R.forceContextLoss();
    try { localStorage.setItem(THUMB_KEY, JSON.stringify({ ver: THUMB_VER, map: Object.fromEntries(thumbs) })); } catch (e) { /* voll */ }
    refreshThumbUI();
  };
  setTimeout(step, 400);
}
function refreshThumbUI() {
  renderMiniBadges();
  if (selected) refreshSheet();
  if (listSheet.classList.contains('open')) renderList();
  if ($('rc-body') && recsCache && setSheet.classList.contains('open')) renderRecs();
  if (light.best) updateBestBar();
  if ($('pf-pick') && !$('pf-pick').classList.contains('hide')) renderPicker();
}

/* ------------------------------------------------------------------ */
/* Pflanzen-Auswahl (Bilder, nach Kategorien, mit Suche)               */
/* ------------------------------------------------------------------ */
const picker = { cur: null, onPick: null, q: '' };
function openPicker(cur, onPick) {
  picker.cur = cur; picker.onPick = onPick; picker.q = '';
  const el = $('pf-pick');
  el.classList.remove('hide');
  $('pk-q').value = '';
  renderPicker();
  requestAnimationFrame(() => { el.classList.add('open'); const on = el.querySelector('.pf-pt.on'); if (on) on.scrollIntoView({ block: 'center' }); });
}
function closePicker() {
  const el = $('pf-pick');
  el.classList.remove('open');
  setTimeout(() => el.classList.add('hide'), 220);
}
function renderPicker() {
  const q = picker.q.trim().toLowerCase();
  const match = (d) => !q || d.name.toLowerCase().includes(q) || (d.latin || '').toLowerCase().includes(q);
  const byName = (a, b) => a.name.localeCompare(b.name, 'de');
  const known = new Set(CATS.map((c) => c.id));
  const groups = CATS.map((c) => ({ name: c.name, list: PLANTS.filter((d) => d.cat === c.id && match(d)).sort(byName) }));
  groups.push({ name: 'Weitere', list: PLANTS.filter((d) => !known.has(d.cat) && match(d)).sort(byName) });
  const html = groups.filter((g) => g.list.length).map((g) => `<div class="pf-pg">${esc(g.name)}</div><div class="pf-pgrid">${g.list.map((d) =>
    `<button type="button" class="pf-pt${d.id === picker.cur ? ' on' : ''}" data-id="${esc(d.id)}"><span class="im">${plantIcon(d)}</span><b>${esc(d.name.replace(/\s*\(.*\)\s*$/, ''))}</b></button>`).join('')}</div>`).join('');
  $('pk-body').innerHTML = html || '<div class="pf-list-empty">Keine Pflanze gefunden.</div>';
}

/* ------------------------------------------------------------------ */
/* Was passt wohin? Freie Plätze + passende Pflanzen je Raum           */
/* ------------------------------------------------------------------ */
// Wo steht eine Pflanzenart typischerweise? floor = Boden, table = Tisch/Regal (75 cm), sill = Fensterbank
const PLACE_OF_CAT = { gruen: 'floor', palme: 'floor', robust: 'floor', haenge: 'table', blatt: 'table', kraut: 'sill', sukk: 'sill' };
const SILL_IDS = new Set(['orchidee', 'pilea', 'gruenlilie', 'efeutute', 'philodendron', 'speerbogenhanf']);
const PLACE_NAME = { floor: 'Boden', table: 'Tisch/Regal', sill: 'Fensterbank' };
const START_SIZE = { gruen: [26, 100], palme: [24, 100], robust: [18, 60], haenge: [15, 30], blatt: [15, 35], kraut: [14, 25], sukk: [12, 15] };
const RC = 0.25; // Raster 25 cm
function placesFor(def) {
  const main = PLACE_OF_CAT[def.cat] || 'table';
  if (main === 'sill') return ['sill', 'table'];
  if (SILL_IDS.has(def.id)) return [main, 'sill'];
  return [main];
}
function recSpots(room) {
  const wins = lightWindowsOf(room), ws = wins.map((w) => ({ ...w.w }));
  const date = nowDate(), est = window.estimateLight;
  const occ = state.plants.map((p) => ({ x: p.x, y: p.y, r: p.potDiameterCm / 200 + 0.22 }));
  const doors = openings.filter((o) => o.type === 'door' || o.type === 'balcony-door');
  // frei = keine Pflanze dort und nicht im Laufweg vor Türen
  const isFree = (x, y) => !occ.some((o) => Math.hypot(x - o.x, y - o.y) < o.r) && !doors.some((o) => distToSeg(x, y, o.a, o.b) < 0.85);
  const at = (x, y, stand, canopy) => {
    for (let k = 0; k < ws.length; k++) {
      const w = wins[k], rx = x - w.mx, ry = y - w.my;
      ws[k].lateralM = rx * w.ux + ry * w.uy;
      ws[k].distanceM = Math.max(0, -(rx * w.nx + ry * w.ny));
    }
    return est({ windows: ws, standHeightM: stand, canopyHeightM: canopy, date });
  };
  const spots = { floor: [], table: [], sill: [] };
  const b = polyBox(room.polygon);
  for (let y = b.minY + RC / 2; y < b.maxY; y += RC) for (let x = b.minX + RC / 2; x < b.maxX; x += RC) {
    if (!pointInPoly(x, y, room.polygon) || distToPolyEdge(x, y, room.polygon) < 0.18) continue;
    const free = isFree(x, y);
    spots.floor.push({ x, y, free, res: at(x, y, 0, 1.0) });
    spots.table.push({ x, y, free, res: at(x, y, 0.75, 1.1) });
  }
  for (const o of windowsOfRoom(room).filter((q) => q.type === 'window')) {
    const L = segLen(o) || 1, n = openingNormal(o), hw = openingHalfWall(o), sill = +o.sill || 0;
    const dx = (o.b[0] - o.a[0]) / L, dy = (o.b[1] - o.a[1]) / L;
    for (let t = 0.15; t <= L - 0.15 + 1e-6; t += 0.2) {
      const x = o.a[0] + dx * t - n[0] * (hw + 0.12), y = o.a[1] + dy * t - n[1] * (hw + 0.12);
      if (!pointInPoly(x, y, room.polygon)) continue;
      spots.sill.push({ x, y, o, free: isFree(x, y), res: at(x, y, sill, sill + 0.25) });
    }
  }
  return spots;
}
function lightBand(res) { const v = res.placeIndex; return v < LT.medium ? 0 : v < LT.bright ? 1 : v < LT.high ? 2 : 3; }
function computeRecs() {
  const month = nowDate().getMonth(), fit = window.plantFit;
  const out = [];
  for (const room of rooms) {
    const area = polyArea(room.polygon);
    if (area < 2) continue;
    const spots = recSpots(room);
    const noWin = !windowsOfRoom(room).length;
    const bands = [0, 0, 0, 0];
    spots.table.forEach((c) => bands[lightBand(c.res)]++);
    const cellA = RC * RC;
    const list = [];
    for (const def of PLANTS) {
      let best = null;
      for (const where of placesFor(def)) {
        const good = spots[where].filter((c) => c.free && fit(def.id, c.res, month) === 'good');
        const amount = where === 'sill' ? good.length : good.length * cellA;
        if (where === 'sill' ? amount < 1 : amount < 0.4) continue;
        best = { where, amount, good };
        break; // bevorzugter Platz gewinnt
      }
      if (best && !noWin) list.push({ def, ...best });
    }
    const RANK = { low: 0, medium: 1, high: 2 };
    list.sort((A, B) => (RANK[B.def.lightNeed] - RANK[A.def.lightNeed]) || (B.where === 'sill') - (A.where === 'sill') || B.amount - A.amount);
    const wins = windowsOfRoom(room);
    const wtxt = wins.length ? [...new Set(wins.map((o) => compassName(vecCompass(...openingNormal(o)))))].join(', ') : '';
    out.push({ room, area, bands, list, winText: wtxt, nWin: wins.length, count: state.plants.filter((p) => pointInPoly(p.x, p.y, room.polygon)).length });
  }
  if (balcony) {
    const bd = lightOpenings.filter((o) => o.type === 'balcony-door');
    const o = (bd.length ? bd : lightOpenings)[0];
    const deg = o ? Math.round(vecCompass(...openingNormal(o))) : 270;
    const res = window.estimateLight({ windows: [{ compassDeg: deg }], outdoor: true, date: nowDate(), standHeightM: 0, canopyHeightM: 0.5 });
    const c = centroid(balcony.polygon);
    const cell = { x: c[0], y: c[1], free: true, res };
    const list = PLANTS.filter((d) => fit(d.id, res, month) === 'good' && d.cat !== 'sukk').map((def) => ({ def, where: 'floor', amount: polyArea(balcony.polygon), good: [cell] }));
    const RANK = { low: 0, medium: 1, high: 2 };
    list.sort((A, B) => (A.def.cat === 'kraut' ? -1 : 0) - (B.def.cat === 'kraut' ? -1 : 0) || RANK[B.def.lightNeed] - RANK[A.def.lightNeed]);
    out.push({ room: { id: 'balkon', name: 'Balkon', polygon: balcony.polygon }, area: polyArea(balcony.polygon), outdoor: true, label: res.label, list, winText: compassName(deg),
      count: state.plants.filter((p) => pointInPoly(p.x, p.y, balcony.polygon)).length });
  }
  return out;
}
// bester freier Platz für eine Pflanze (Lichtbedarf hoch/mittel: hellster passender Platz, wenig: ruhig, nicht der hellste)
function bestSpot(rec) {
  const need = rec.def.lightNeed;
  let best = null, bs = -Infinity;
  for (const c of rec.good) {
    const v = c.res.placeIndex;
    const sc = need === 'low' ? -Math.abs(Math.log(Math.max(v, 1e-4) / 0.12)) : v - (c.res.directSun && need === 'medium' ? 0.15 : 0);
    if (sc > bs) { bs = sc; best = c; }
  }
  return best;
}
let recsCache = null;
function openRecs() {
  if (moveMode) cancelMove();
  if (selected) closeSheet();
  listSheet.classList.remove('open');
  const body = $('pf-set-body');
  body.innerHTML = `<div class="pf-head"><div style="min-width:0"><h2>Was passt wohin?</h2><p style="font-style:normal">Freie Plätze je Raum · Lichtbedarf nach Sommerlicht</p></div>
    <button class="pf-x" id="rc-close" aria-label="Schließen">${ICONS.close}</button></div><div id="rc-body"><div class="pf-list-empty">Berechne Licht …</div></div>`;
  $('rc-close').addEventListener('click', closeAux);
  setSheet.classList.add('open'); scrim.classList.add('show');
  setTimeout(() => {
    recsCache = computeRecs();
    renderRecs();
  }, 30);
}
function renderRecs(expanded = new Set()) {
  const el = $('rc-body'); if (!el || !recsCache) return;
  const BAND = [{ n: 'schattig', c: LEGEND[0].css }, { n: 'halbschattig', c: LEGEND[1].css }, { n: 'hell', c: LEGEND[2].css }, { n: 'sehr hell', c: `rgb(${SUN_RGB})` }];
  const MAX = 5;
  el.innerHTML = `<p class="pf-note" style="margin:0 0 6px">Tippe auf eine Pflanze – sie wird an den besten freien Platz im Raum gestellt.</p>` + recsCache.map((R, ri) => {
    const tot = R.bands ? R.bands.reduce((a, b) => a + b, 0) || 1 : 1;
    const bar = R.bands && R.nWin ? `<div class="pf-rbar">${R.bands.map((v, i) => v ? `<i style="width:${(v / tot * 100).toFixed(1)}%;background:${BAND[i].c}"></i>` : '').join('')}</div>
      <div class="pf-rleg">${R.bands.map((v, i) => v ? `<span><i style="background:${BAND[i].c}"></i>${BAND[i].n} ${fmt1(v * RC * RC)} m²</span>` : '').join('')}</div>` : '';
    const meta = R.outdoor ? `Draußen · ${esc(R.winText)} · ${esc(R.label || '')}` : R.nWin ? `Fenster ${esc(R.winText)}` : 'Kein Fenster – zu dunkel für die meisten Pflanzen';
    // nach Platz gruppiert: Boden, Fensterbank, Tisch/Regal
    const chips = ['floor', 'sill', 'table'].map((wh) => {
      const idx = R.list.map((x, i) => [x, i]).filter(([x]) => x.where === wh);
      if (!idx.length) return '';
      const key = ri + ':' + wh, all = expanded.has(key), shown = all ? idx : idx.slice(0, MAX);
      return `<div class="pf-rg">${R.outdoor ? 'Gerade passend' : PLACE_NAME[wh]}</div><div class="pf-rp">${shown.map(([x, i]) => `<button type="button" data-r="${ri}" data-i="${i}">${plantIcon(x.def)} ${esc(x.def.name.replace(/\s*\(.*\)\s*$/, ''))}</button>`).join('')}${!all && idx.length > MAX ? `<button type="button" class="more" data-more="${key}">+ ${idx.length - MAX} weitere</button>` : ''}</div>`;
    }).join('');
    return `<div class="pf-rc"><h3>${esc(R.room.name)}<small>${fmt1(R.area)} m²${R.count ? ` · ${R.count} ${R.count === 1 ? 'Pflanze' : 'Pflanzen'}` : ''}</small></h3>
      <div class="m">${meta}</div>${bar}
      ${R.list.length ? chips : `<div class="pf-rnone">${R.outdoor ? 'Gerade passt draußen nichts – zu kalt für die meisten Pflanzen.' : R.nWin ? 'Kein freier Platz mit passendem Licht.' : 'Ohne Fenster wächst auf Dauer kaum etwas – nur mit Pflanzenlampe.'}</div>`}</div>`;
  }).join('');
  el.querySelectorAll('button[data-more]').forEach((b) => b.addEventListener('click', () => { const y = el.closest('.pf-sheet-body')?.scrollTop; expanded.add(b.dataset.more); renderRecs(expanded); if (y != null) el.closest('.pf-sheet-body').scrollTop = y; }));
  el.querySelectorAll('button[data-i]').forEach((b) => b.addEventListener('click', () => {
    const R = recsCache[+b.dataset.r], rec = R.list[+b.dataset.i];
    placeRecommended(rec);
  }));
}
function placeRecommended(rec) {
  const c = bestSpot(rec); if (!c) return;
  closeAux();
  const def = rec.def, sz = START_SIZE[def.cat] || [18, 50];
  const p = newPlant(c.x, c.y, def.id);
  p.potDiameterCm = sz[0]; p.plantHeightCm = sz[1];
  if (rec.where === 'sill' && c.o) placeOnSill(p, c.o, c.x, c.y);
  else p.standCm = rec.where === 'table' ? 75 : 0;
  startDraft(p);
}

/* ------------------------------------------------------------------ */
/* Erinnerung: Push in der Android-App (Capacitor LocalNotifications), */
/* im Browser nur ein Hinweis-Banner beim Öffnen                       */
/* ------------------------------------------------------------------ */
var remLN, remTimer = null, remBusy = false, remAgain = false, remMsg = { cls: '', text: '' }, remFrom = 'settings', dbnTimer = null;
const REM_DAYS = 21, REM_ID0 = 1000, REM_CHANNEL = 'giessen';
const pad2 = (n) => String(n).padStart(2, '0');
const remTime = () => `${pad2(state.reminder.h)}:${pad2(state.reminder.m)}`;
// LocalNotifications-Plugin nur in der nativen App, sonst null
function nativeLN() {
  if (remLN !== undefined) return remLN;
  remLN = null;
  try {
    const C = window.Capacitor;
    if (C && typeof C.isNativePlatform === 'function' && C.isNativePlatform()) {
      let LN = C.Plugins && C.Plugins.LocalNotifications;
      if (!LN && typeof C.registerPlugin === 'function' && (typeof C.isPluginAvailable !== 'function' || C.isPluginAvailable('LocalNotifications'))) LN = C.registerPlugin('LocalNotifications');
      if (LN && typeof LN.schedule === 'function') remLN = LN;
    }
  } catch (e) { remLN = null; }
  return remLN;
}
function reminderSummary() {
  return state.reminder.on ? `Täglich um ${remTime()} Uhr, wenn etwas fällig ist` : (nativeLN() ? 'Aus' : 'Aus · Push nur in der Android-App');
}
function reminderBody(list) {
  const nm = (x) => `${x.p.nick || String(x.def.name || 'Pflanze').replace(/\s*\(.*\)\s*$/, '')} (${isDip(x.r) ? 'Tauchen' : fmtInt(x.r.mlPerWatering || 0) + ' ml'})`;
  return `Heute: ${list.slice(0, 3).map(nm).join(', ')}${list.length > 3 ? ` und ${list.length - 3} weitere` : ''}`;
}
// Ein Eintrag pro Tag (nächste 21 Tage), an dem ≥1 Pflanze fällig/überfällig ist. Überfällige zählen ab heute.
function reminderPlan(days = REM_DAYS) {
  const now = nowDate();
  const items = state.plants.map((p) => {
    const { r } = compute(p);
    const d = dueInfo(p, r);
    return r && Number.isFinite(d.days) ? { p, r, def: plantDef(p.plantId), days: d.days, first: Math.max(0, d.days) } : null;
  }).filter(Boolean);
  const out = [];
  for (let i = 0; i < days; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, state.reminder.h, state.reminder.m, 0, 0);
    if (at.getTime() <= now.getTime()) continue; // heutige Uhrzeit schon vorbei
    const list = items.filter((x) => x.first <= i).sort((A, B) => A.days - B.days || (B.r.mlPerWatering || 0) - (A.r.mlPerWatering || 0));
    if (list.length) out.push({ id: REM_ID0 + i, dayIndex: i, at, count: list.length, title: '🌿 Pflanzen gießen', body: reminderBody(list) });
  }
  return out;
}
function queueReminderSync() {
  if (!nativeLN()) return;
  clearTimeout(remTimer);
  remTimer = setTimeout(syncReminders, 350);
}
// Alle geplanten Erinnerungen löschen und neu planen
async function syncReminders() {
  const LN = nativeLN();
  if (!LN) return;
  if (remBusy) { remAgain = true; return; }
  remBusy = true;
  try {
    const ids = new Set();
    for (let i = 0; i < REM_DAYS; i++) ids.add(REM_ID0 + i);
    try {
      const pend = await LN.getPending();
      for (const n of (pend && pend.notifications) || []) if (Number.isFinite(+n.id)) ids.add(+n.id);
    } catch (e) { /* ignore */ }
    await LN.cancel({ notifications: [...ids].map((id) => ({ id })) });
    if (!state.reminder.on) { if (remMsg.cls !== 'err') remMsg = { cls: '', text: '' }; return; }
    const perm = await LN.checkPermissions();
    if (!perm || perm.display !== 'granted') {
      remMsg = { cls: 'err', text: 'Benachrichtigungen sind nicht erlaubt. Aktiviere sie in den Android-Einstellungen unter Apps → Pflanzen-Wohnung → Benachrichtigungen.' };
      return;
    }
    const plan = reminderPlan();
    if (plan.length) {
      await LN.schedule({
        notifications: plan.map((n) => ({
          id: n.id, title: n.title, body: n.body, channelId: REM_CHANNEL,
          schedule: { at: n.at, allowWhileIdle: true }, extra: { open: 'list', day: n.dayIndex },
        })),
      });
    }
    remMsg = plan.length
      ? { cls: 'ok', text: `${plan.length} ${plan.length === 1 ? 'Erinnerung' : 'Erinnerungen'} für die nächsten ${REM_DAYS} Tage geplant.` }
      : { cls: '', text: `In den nächsten ${REM_DAYS} Tagen ist nichts fällig.` };
  } catch (e) {
    remMsg = { cls: 'err', text: 'Erinnerungen konnten nicht geplant werden.' };
  } finally {
    remBusy = false;
    renderReminderMsg();
    if (remAgain) { remAgain = false; syncReminders(); }
  }
}
async function setReminderOn(on) {
  const LN = nativeLN();
  if (on && LN) {
    try {
      let perm = await LN.checkPermissions();
      if (!perm || perm.display !== 'granted') perm = await LN.requestPermissions();
      if (!perm || perm.display !== 'granted') {
        state.reminder.on = false; save();
        remMsg = { cls: 'err', text: 'Ohne Erlaubnis für Benachrichtigungen kann die App dich nicht erinnern. Du kannst sie in den Android-Einstellungen unter Apps → Pflanzen-Wohnung → Benachrichtigungen erlauben.' };
        renderReminder();
        return;
      }
    } catch (e) {
      state.reminder.on = false; save();
      remMsg = { cls: 'err', text: 'Benachrichtigungen sind auf diesem Gerät nicht verfügbar.' };
      renderReminder();
      return;
    }
  }
  state.reminder.on = !!on;
  remMsg = { cls: '', text: '' };
  save();
  renderReminder();
}
function renderReminderMsg() {
  const m = $('rm-msg');
  if (m) { m.className = 'pf-rmsg' + (remMsg.cls ? ' ' + remMsg.cls : ''); m.textContent = remMsg.text; }
  const lb = $('l-rem');
  if (lb) lb.classList.toggle('on', state.reminder.on);
}
function renderReminder() {
  const body = $('pf-set-body');
  if (!setSheet.classList.contains('open') || !$('rm-sw')) return;
  const on = state.reminder.on;
  $('rm-sw').setAttribute('aria-checked', String(on));
  $('rm-time').classList.toggle('off', !on);
  const plan = reminderPlan();
  const nx = plan[0];
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const when = nx ? (nx.dayIndex === 0 ? 'heute' : nx.dayIndex === 1 ? 'morgen' : `${WD[nx.at.getDay()]}, ${pad2(nx.at.getDate())}.${pad2(nx.at.getMonth() + 1)}.`) : '';
  $('rm-next').textContent = !state.plants.length ? 'Noch keine Pflanzen platziert.'
    : nx ? `${on && nativeLN() ? 'Nächste Erinnerung' : 'Nächster Gießtag'}: ${when} um ${remTime()} · ${nx.count} ${nx.count === 1 ? 'Pflanze' : 'Pflanzen'}`
      : `In den nächsten ${REM_DAYS} Tagen ist nichts fällig.`;
  renderReminderMsg();
  body.dataset.on = on ? '1' : '0';
}
function openReminder(from) {
  remFrom = from === 'list' ? 'list' : 'settings';
  if (moveMode) cancelMove();
  if (selected) closeSheet();
  listSheet.classList.remove('open');
  const native = !!nativeLN();
  const mins = []; for (let m = 0; m < 60; m += 5) mins.push(m);
  if (!mins.includes(state.reminder.m)) { mins.push(state.reminder.m); mins.sort((a, b) => a - b); }
  const hours = []; for (let h = 0; h < 24; h++) hours.push(h);
  const opt = (v, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${pad2(v)}</option>`;
  $('pf-set-body').innerHTML = `
    <div class="pf-head"><div style="min-width:0"><h2>Erinnerung</h2><p style="font-style:normal">Tägliche Gieß-Erinnerung</p></div>
    <button class="pf-x" id="rm-close" aria-label="Schließen">${ICONS.close}</button></div>
    <div class="pf-settings">
      <div class="pf-tg"><div><b>Erinnerung</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)">An Tagen, an denen eine Pflanze fällig ist</p></div>
        <button class="pf-switch" id="rm-sw" role="switch" aria-checked="${state.reminder.on}" aria-label="Erinnerung an/aus"></button></div>
      <div class="pf-field">
        <div class="lbl">Uhrzeit</div>
        <div class="pf-time" id="rm-time">
          <div class="pf-select"><select id="rm-h" aria-label="Stunde">${hours.map((h) => opt(h, state.reminder.h)).join('')}</select></div>
          <span>:</span>
          <div class="pf-select"><select id="rm-m" aria-label="Minute">${mins.map((m) => opt(m, state.reminder.m)).join('')}</select></div>
        </div>
        <div class="pf-note" id="rm-next"></div>
      </div>
      <div class="pf-rmsg" id="rm-msg"></div>
      ${native ? '' : '<p class="pf-rnote" id="rm-web">Push-Erinnerungen gibt es nur in der Android-App.</p>'}
      <div class="pf-actions" style="margin-top:12px">
        <button class="pf-act" id="rm-back">${remFrom === 'list' ? 'Zur Liste' : 'Einstellungen'}</button>
        <button class="pf-act primary" id="rm-done" style="flex:.8">Fertig</button>
      </div>
    </div>`;
  $('rm-sw').addEventListener('click', () => setReminderOn(!state.reminder.on));
  const onTime = () => { state.reminder.h = +$('rm-h').value; state.reminder.m = +$('rm-m').value; save(); renderReminder(); };
  $('rm-h').addEventListener('change', onTime);
  $('rm-m').addEventListener('change', onTime);
  $('rm-close').addEventListener('click', closeAux);
  $('rm-done').addEventListener('click', closeAux);
  $('rm-back').addEventListener('click', () => { if (remFrom === 'list') { closeAux(); openList(); } else openSettings(); });
  setSheet.classList.add('open'); scrim.classList.add('show');
  renderReminder();
}
// Web: kompakter Hinweis beim Öffnen, wenn etwas fällig ist
function hideDueBanner() { clearTimeout(dbnTimer); $('pf-dbn').classList.add('hide'); }
function showDueBanner() {
  if (nativeLN() && state.reminder.on) return;
  const n = dueCount();
  if (!n) return;
  $('pf-dbn-t').textContent = `💧 ${n === 1 ? '1 Pflanze' : `${n} Pflanzen`} heute fällig`;
  $('pf-dbn').classList.remove('hide');
  clearTimeout(dbnTimer); dbnTimer = setTimeout(hideDueBanner, 9000);
}
$('pf-dbn-go').addEventListener('click', (e) => { e.stopPropagation(); hideDueBanner(); openList(); });
$('pf-dbn-x').addEventListener('click', (e) => { e.stopPropagation(); hideDueBanner(); });
appEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('#pf-dbn')) hideDueBanner(); }, true);
function initNativeReminders() {
  const LN = nativeLN();
  if (!LN) return;
  try {
    if (typeof LN.createChannel === 'function') {
      Promise.resolve(LN.createChannel({ id: REM_CHANNEL, name: 'Gießen', description: 'Erinnerung an fällige Pflanzen', importance: 4, visibility: 1 })).catch(() => {});
    }
    if (typeof LN.addListener === 'function') {
      Promise.resolve(LN.addListener('localNotificationActionPerformed', () => { hideDueBanner(); closeAux(); openList(); })).catch(() => {});
    }
  } catch (e) { /* ignore */ }
  queueReminderSync();
}

/* ------------------------------------------------------------------ */
/* Misc UI                                                             */
/* ------------------------------------------------------------------ */
let toastTimer = null;
function toast(msg, undo) {
  const t = $('pf-toast');
  t.textContent = msg;
  t.classList.toggle('act', !!undo);
  if (undo) {
    const b = document.createElement('button'); b.id = 'pf-undo'; b.textContent = 'Rückgängig';
    b.addEventListener('click', (e) => { e.stopPropagation(); clearTimeout(toastTimer); t.classList.add('hide'); undo(); });
    t.append(' · '); t.appendChild(b);
  }
  t.classList.remove('hide');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hide'), undo ? 4500 : 1600);
}
function dueCount() { return state.plants.reduce((n, p) => n + (dueInfo(p, compute(p).r).due ? 1 : 0), 0); }
function updateCount() {
  const n = dueCount(), c = $('pf-count');
  c.textContent = n; c.classList.toggle('due', n > 0);
  $('pf-list-btn').setAttribute('aria-label', n ? `Meine Pflanzen – ${n} heute gießen` : 'Meine Pflanzen – nichts fällig');
  renderMiniBadges();
}
// Tageswechsel: Fälligkeiten neu berechnen
let lastDay = dayNum(nowDate());
// Echte Uhrzeit: bei Sonnenuntergang/-aufgang Licht umschalten (Lampen „Auto“)
let lastNight = null;
setInterval(() => { if (sunMode.on) return; const was = lastNight; placeSun(); lastNight = isNight(); if (was !== null && was !== lastNight) shadowsDirty(); }, 60000);
setInterval(() => { const d = dayNum(nowDate()); if (d !== lastDay) { lastDay = d; updateCount(); if (selected) refreshSheet(); queueReminderSync(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastDay = dayNum(nowDate()); updateCount(); queueReminderSync(); } });
function updateHint() {
  const show = state.plants.length === 0 && !draft && !selected;
  $('pf-hint').classList.toggle('hide', !show);
}
function applyPlantNames() {
  appEl.classList.toggle('pf-nonames', !state.showPlantNames);
  for (const el of miniBadges.values()) el._w = null; // Größe neu messen
  requestRender();
}
function renderMiniBadges() {
  for (const el of miniBadges.values()) el.remove();
  miniBadges.clear();
  for (const p of state.plants) {
    const { r } = compute(p);
    const def = plantDef(p.plantId), due = dueInfo(p, r);
    const el = document.createElement('div');
    el.className = 'pf-badge mini' + (due.due ? ' due' : '') + (due.days < 0 ? ' over' : '');
    const st = due.due ? (due.days < 0 ? due.text : 'heute') : due.text;
    el.innerHTML = `<span class="e">${due.due ? ICONS.dropW : plantIcon(def)}</span><b>${esc(p.nick || def.name)}</b><span class="s">${esc(st)}</span>`;
    el.dataset.uid = p.uid; el.dataset.prio = due.due ? 1 : 2;
    setThirst(p);
    el.addEventListener('click', (e) => { e.stopPropagation(); if (moveMode) return; openPlant(p, { focus: true }); });
    labelLayer.appendChild(el);
    miniBadges.set(p.uid, el);
  }
  requestRender();
}
$('pf-addr').textContent = FP.name || '';
$('pf-list-btn').addEventListener('click', openList);
$('pf-compass').addEventListener('click', openSettings);
$('pf-scrim').addEventListener('click', () => { save(); closeAux(); });
$('pf-move-cancel').addEventListener('click', cancelMove);
$('pf-reset').addEventListener('click', () => setViewMode(viewMode));
document.querySelectorAll('#pf-viewseg button').forEach((b) => b.addEventListener('click', () => setViewMode(b.dataset.v)));

// Sheet per Wischen am Griff schließen
function bindGrab(sh) {
  const grab = sh.querySelector('.pf-grab');
  if (!grab) return;
  let y0 = null, dy = 0;
  grab.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; sh.style.transition = 'none'; grab.setPointerCapture(e.pointerId); });
  grab.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
  const up = () => {
    if (y0 == null) return;
    sh.style.transition = ''; sh.style.transform = '';
    if (dy > 70) { if (sh === sheet) closeSheet(); else { save(); closeAux(); } }
    y0 = null;
  };
  grab.addEventListener('pointerup', up); grab.addEventListener('pointercancel', up);
}
bindGrab(listSheet); bindGrab(setSheet);

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
load();
if (!state.design) { state.design = { rooms: {}, items: [] }; const r0 = defaultRug(); if (r0) state.design.items.push({ id: uid(), sizeIdx: 1, ...r0 }); }
applyRoomLooks();
syncAllItems();
buildBuilding();
lampsReady = true;
placeSun(); // Nordrichtung aus dem Speicher
state.plants.forEach(syncPlantObj);
applyPlantNames();
new ResizeObserver(resize).observe(appEl);
resize();
{
  const { pos, target } = camPose('3d');
  camera.position.copy(pos); controls.target.copy(target); controls.update();
}
updateCount(); updateHint();
requestAnimationFrame(loop);
genThumbs();
initNativeReminders();
showDueBanner();
if (!PLANTS.length) toast('Pflanzendaten fehlen');

// Debug-/Test-Hooks
window.__plantflat = {
  state,
  placeAt: (x, y) => placeNew(x, y),
  screenOf: (x, y, h = 0) => { const s = toScreen(new THREE.Vector3(x, h, y)); return { x: s.x, y: s.y }; },
  analyze, compute, vecCompass, pick: (x, y) => pick(x, y), mode: () => ({ moveMode, sel: selected && selected.uid }),
  setView: setViewMode,
  light: {
    set: (on) => setLight(on), month: (m) => { light.month = m; renderLightPanel(); refreshLight(); }, height: (k) => { light.height = k; renderLightPanel(); refreshLight(); },
    state: () => ({ on: light.on, month: light.month, height: light.height, best: !!light.best, meshes: light.meshes.length, grids: light.grids.size, job: light.job, stats: light.stats }),
    // Licht-Index an einem Planpunkt aus dem aktuell angezeigten Raster
    sample: (x, y) => {
      const t = lightTargets().find((q) => pointInPoly(x, y, q.poly)); if (!t) return null;
      const g = light.grids.get(t.key); if (!g) return null;
      const i = clamp(Math.floor((x - g.b.minX) / g.cw), 0, g.nx - 1), j = clamp(Math.floor((y - g.b.minY) / g.ch), 0, g.ny - 1);
      return { room: t.id, index: g.idx[j * g.nx + i], sun: g.sun[j * g.nx + i], fit: g.fit[j * g.nx + i] };
    },
    texCount: () => renderer.info.memory.textures,
  },
  reminderPlan: () => reminderPlan().map((n) => ({ ...n, at: n.at.getTime() })),
  reminderSync: () => syncReminders(),
  openReminder: (f) => openReminder(f),
  nativeReminders: () => !!nativeLN(),
  due: (p) => dueInfo(p, compute(p).r),
  wallShadows: () => { let n = 0; wallGroups.forEach((w) => w.group.children.forEach((c) => { if (c.userData.kind === 'wall' && c.castShadow) n++; })); return n; },
  open: (id) => { const p = state.plants.find((q) => q.uid === id); if (p) openPlant(p, { focus: true }); },
  gfx: () => {
    let leafCast = 0, potCast = 0;
    for (const g of plantObjs.values()) g.traverse((o) => { if (o.isMesh && o.castShadow) { if (o.material === potMat || o.material === PM.potMaterial) potCast++; else leafCast++; } });
    return {
      pixelRatio: renderer.getPixelRatio(), shadowMap: sun.shadow.mapSize.x, autoUpdate: renderer.shadowMap.autoUpdate, leafCast, potCast,
      walls: wallGroups.filter((w) => w.exterior).map((w) => [+w.fade.toFixed(2), +w.mats[2].opacity.toFixed(2), +w.glass.opacity.toFixed(2)]),
    };
  },
  bench: (n = 20) => {
    const gl = renderer.getContext(), px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    sync(); const t0 = performance.now();
    for (let i = 0; i < n; i++) { renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); sync(); }
    const t1 = performance.now();
    for (let i = 0; i < n; i++) { renderer.render(scene, camera); sync(); }
    return { withShadow: +((t1 - t0) / n).toFixed(2), noShadow: +((performance.now() - t1) / n).toFixed(2), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
  },
  cam: (pos, tgt) => { tween = null; camera.position.set(...pos); controls.target.set(...tgt); controls.update(); requestRender(); },
  recs: () => computeRecs().map((R) => ({ room: R.room.id, n: R.list.length, top: R.list.slice(0, 6).map((x) => x.def.id + '@' + x.where) })),
  orient: (on) => (on ? startOrient() : endOrient(true)),
  thumbs: () => thumbs.size,
  thumb: (id) => thumbs.get(id),
  live: (id) => { const L = live.get(id); return L && { droop: L.u.uDroop.value, pale: L.u.uPale.value, anim: L.anim }; },
  water: (id) => { const p = state.plants.find((q) => q.uid === id); if (p) waterPlants([p]); },
  fx: () => fx.length,
  fxSlow: (v) => { fxSlow = v; },
  schedule: (a, b) => { const s2 = waterSchedule(a, b); return s2.days.map((d) => [isoDay(d.date), d.list.map((x) => x.n + ':' + x.def.id)]); },
  pdf: async (a, b) => { share.from = a; share.to = b; share.who = 'Lena'; share.note = 'Schlüssel liegt beim Nachbarn.'; await makeWaterPdf(); return (window.__lastPdf || '').length; },
  designOn: (on) => (on ? startDesign() : endDesign()),
  designState: () => ({ d: state.design, sel: design.sel, room: design.room && design.room.id }),
  designTap: (x, y) => designTap(x, y),
  dbg: () => ({ cam: camera.position.toArray().map((v) => +v.toFixed(2)), tgt: controls.target.toArray().map((v) => +v.toFixed(2)), dist: +camera.position.distanceTo(controls.target).toFixed(2), off: sheetOffset, tween: !!tween }),
};
