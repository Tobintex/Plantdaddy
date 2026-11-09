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
#pf{position:fixed;inset:0;overflow:hidden;overflow:clip;background:linear-gradient(180deg,#f8f1e6 0%,#f6e7d9 46%,#e6e9da 100%)}
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
  white-space:nowrap;pointer-events:none;box-shadow:var(--shadow);transition:opacity .3s, transform .3s}
.pf-hint.hide{opacity:0;transform:translateX(-50%) translateY(8px)}
.pf-hint .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#9fd0a8;margin-right:8px;vertical-align:1px;
  animation:pfpulse 1.6s ease-in-out infinite}
@keyframes pfpulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
.pf-banner{position:absolute;left:12px;right:12px;top:calc(var(--sat) + 62px);margin:0 auto;max-width:420px;background:var(--ink);color:#fff;
  border-radius:14px;padding:11px 12px 11px 16px;display:flex;align-items:center;gap:10px;font-size:14px;box-shadow:var(--shadow);
  transition:opacity .2s,transform .2s}
.pf-banner.hide{opacity:0;transform:translateY(-8px);pointer-events:none}
.pf-banner span{flex:1}
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
  <div class="pf-hint hide" id="pf-hint"><span class="dot"></span>Tippe auf den Boden, um eine Pflanze zu platzieren</div>
  <div class="pf-banner hide" id="pf-banner"><span>Tippe auf die neue Stelle für die Pflanze</span><button id="pf-move-cancel">Abbrechen</button></div>
  <div class="pf-dbn hide" id="pf-dbn" role="status"><span id="pf-dbn-t"></span><button id="pf-dbn-go">Ansehen</button><button id="pf-dbn-x" aria-label="Hinweis schließen">${ICONS.close}</button></div>
  <div class="pf-toast hide" id="pf-toast"></div>
  <div class="pf-lp hide" id="pf-lp" aria-label="Lichtkarte">
    <div class="pf-lr"><span>Monat</span><div class="pf-ms" id="pf-lm"></div></div>
    <div class="pf-lr"><span>Höhe</span><div class="pf-ms" id="pf-lh"></div></div>
    <div class="pf-leg" id="pf-leg"></div>
  </div>
  <div class="pf-bottom" id="pf-bottom">
    <div class="pf-bl">
      <div class="pf-seg" id="pf-viewseg"><button data-v="3d" class="on">3D</button><button data-v="top">Draufsicht</button></div>
      <button class="pf-btn pf-lbtn" id="pf-light" aria-pressed="false" aria-label="Lichtkarte">${ICONS.sun}<span>Licht</span></button>
    </div>
    <button class="pf-btn" id="pf-reset" aria-label="Ansicht zurücksetzen" style="padding:0 12px">${ICONS.focus}</button>
  </div>
  <div class="pf-bb hide" id="pf-bb" role="status"><div class="pf-emoji" id="pf-bb-e"></div>
    <div class="t"><b id="pf-bb-t"></b><span id="pf-bb-s"></span><div class="pf-leg" id="pf-bb-leg"></div></div>
    <button class="pf-x" id="pf-bb-x" aria-label="Beste Plätze beenden">${ICONS.close}</button></div>
  <div class="pf-scrim" id="pf-scrim"></div>
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
          };
        });
    }
    if (Number.isFinite(d.northDeg)) state.northDeg = ((Math.round(d.northDeg) % 360) + 360) % 360;
    if (known(d.lastPlantId)) state.lastPlantId = d.lastPlantId;
    state.seenHint = d.seenHint === true;
    state.showRoomNames = d.showRoomNames === true;
    if (d.reminder && typeof d.reminder === 'object') {
      state.reminder = { on: d.reminder.on === true, h: Math.round(num(d.reminder.h, 8, 0, 23)), m: Math.round(num(d.reminder.m, 0, 0, 59)) };
    }
  } catch (e) { /* storage unavailable */ }
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1, plants: state.plants, northDeg: state.northDeg, lastPlantId: state.lastPlantId, seenHint: state.seenHint,
      reminder: state.reminder, showRoomNames: state.showRoomNames,
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
  return { a, r };
}
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
scene.add(new THREE.HemisphereLight(0xfff4e6, 0xa8825e, 1.15));
scene.add(new THREE.AmbientLight(0xffe2c4, 0.45));
// Nachmittagssonne aus Westen (kompassrichtig über planUpDeg), golden, eher flach
const sun = new THREE.DirectionalLight(0xffd9a8, 2.2);
const SUN_COMPASS = 262, SUN_ELEV = 42;
function placeSun() {
  const d = THREE.MathUtils.degToRad(SUN_COMPASS - planUpDeg());
  const vx = Math.sin(d), vy = -Math.cos(d); // Plan-Vektor zur Sonne
  const el = THREE.MathUtils.degToRad(SUN_ELEV), R = span * 1.6;
  sun.position.set(cx0 + vx * R * Math.cos(el), R * Math.sin(el), cy0 + vy * R * Math.cos(el));
  sun.target.position.set(cx0, 0, cy0);
  sun.target.updateMatrixWorld();
}
placeSun();
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
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
  for (const m of [top, side]) { m.receiveShadow = true; m.userData.kind = 'plate'; scene.add(m); }
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
  scene.add(sh);
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

// Ein weicher Teppich im Wohnzimmer: frei von Fenstern, Balkontür und Türaufschlägen, möglichst mittig
let rug = null;
{
  const room = rooms.find((r) => r.id === 'wohnen') || rooms.filter((r) => floorKind(r) === 'wood').sort((a, b) => polyArea(b.polygon) - polyArea(a.polygon))[0];
  if (room) {
    const b = polyBox(room.polygon), along = (b.maxX - b.minX) >= (b.maxY - b.minY); // lange Seite entlang x?
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
      // Abstand Teppichrand ↔ Öffnung (Rechteck-Punkt-Distanz)
      return ops.every((o) => [o.a, o.b, [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2]].every((q) => Math.hypot(Math.max(0, Math.abs(q[0] - x) - hx), Math.max(0, Math.abs(q[1] - y) - hy)) > (o.type === 'door' ? segLen(o) + 0.1 : 0.9)));
    };
    let best = null;
    for (let dy = -2; dy <= 2.001; dy += 0.1) for (let dx = -2; dx <= 2.001; dx += 0.1) {
      const x = c[0] + dx, y = c[1] + dy, d = Math.hypot(dx, dy);
      if ((!best || d < best.d) && ok(x, y)) best = { x, y, d };
    }
    if (best) {
      const PX = 256, py = Math.round(PX * RW / RL);
      const cv = document.createElement('canvas'); cv.width = PX; cv.height = py;
      const g = cv.getContext('2d'), rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      const m0 = 6;
      rr(m0, m0, PX - 2 * m0, py - 2 * m0, 22); g.fillStyle = '#c99274'; g.fill();          // Terrakotta-Rand
      rr(m0 + 9, m0 + 9, PX - 2 * m0 - 18, py - 2 * m0 - 18, 15); g.fillStyle = '#f1e4d0'; g.fill(); // Cremeband
      rr(m0 + 16, m0 + 16, PX - 2 * m0 - 32, py - 2 * m0 - 32, 10); g.fillStyle = '#b3bf9f'; g.fill(); // Salbei-Feld
      g.save(); g.clip();
      g.strokeStyle = 'rgba(244,234,216,.55)'; g.lineWidth = 2;
      for (let k = -py; k < PX + py; k += 22) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + py, py); g.moveTo(k + py, 0); g.lineTo(k, py); g.stroke(); }
      g.fillStyle = 'rgba(201,146,116,.65)';
      for (let k = -py; k < PX + py; k += 22) for (let j = 0; j < py; j += 22) { g.beginPath(); g.arc(k + 11, j + 11 + 0.5, 2.2, 0, Math.PI * 2); g.fill(); }
      g.restore();
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.premultiplyAlpha = true;
      rug = new THREE.Mesh(new THREE.PlaneGeometry(RL, RW), new THREE.MeshStandardMaterial({ map: t, roughness: 1, transparent: true, premultipliedAlpha: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      rug.rotation.set(-Math.PI / 2, 0, along ? 0 : Math.PI / 2);
      rug.position.set(best.x, 0.0028, best.y);
      rug.receiveShadow = true; rug.userData.kind = 'rug'; rug.raycast = () => {};
      scene.add(rug);
    }
  }
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
  const frame = ext ? frameMat.clone() : frameMat;
  const glass = ext ? glassMat.clone() : glassMat;
  const cap = ext ? capMat.clone() : capMat;
  const capGeos = [], edgeGeos = [];
  const group = new THREE.Group();
  const ang = -Math.atan2(dy, dx);
  const ext0 = t / 2; // Ecken schließen
  const box = (s0, s1, y0, y1, extend0 = 0, extend1 = 0) => {
    y1 = Math.min(y1, CUT); // oberhalb der Schnitthöhe nichts zeichnen
    const len = s1 - s0 + extend0 + extend1, h = y1 - y0;
    if (len < 0.005 || h < 0.005) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), mats);
    const sm = (s0 - extend0 + s1 + extend1) / 2;
    m.position.set(w.a[0] + ux * sm, y0 + h / 2, w.a[1] + uy * sm);
    m.rotation.y = ang; m.castShadow = true; m.receiveShadow = true; m.userData.kind = 'wall';
    group.add(m);
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
    if (sill > 0) box(s0, s1, 0, sill);
    if (top < WH) box(s0, s1, top, WH);
    if (o.type === 'window' || o.type === 'balcony-door') {
      const gTop = Math.min(top, CUT);
      const len = s1 - s0, h = Math.max(0.05, gTop - sill), sm = (s0 + s1) / 2;
      const g = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.02), glass);
      g.position.set(w.a[0] + ux * sm, sill + h / 2, w.a[1] + uy * sm); g.rotation.y = ang; g.renderOrder = 2;
      g.userData.kind = 'glass';
      group.add(g);
      // schlanker Rahmen
      const fr = 0.04;
      [[len, fr, sill + fr / 2], [len, fr, sill + h - fr / 2]].forEach(([l, hh, y]) => {
        const f = new THREE.Mesh(new THREE.BoxGeometry(l, hh, 0.07), frame);
        f.position.set(w.a[0] + ux * sm, y, w.a[1] + uy * sm); f.rotation.y = ang; group.add(f);
      });
      if (len > 1.3 && o.type === 'window') {
        const f = new THREE.Mesh(new THREE.BoxGeometry(fr, h, 0.07), frame);
        f.position.set(w.a[0] + ux * sm, sill + h / 2, w.a[1] + uy * sm); f.rotation.y = ang; group.add(f);
      }
    }
    cur = Math.max(cur, s1);
    void i;
  });
  if (cur < L) box(cur, L, 0, WH, cur === 0 ? ext0 : 0, ext0);
  else if (ops.length) { /* Öffnung bis Wandende */ }
  if (capGeos.length) {
    const cm = new THREE.Mesh(mergeGeos(capGeos), cap);
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
  wallGroups.push({ group, mats: ext ? [side, top, frame, cap] : null, glass: ext ? glass : null, nOut: n, mid, exterior: ext, fade: 1 });
}
(FP.walls || []).forEach(addWall);

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
    } else {
      const pw = d * 1.25 + 0.06;
      const ped = new THREE.Mesh(new THREE.BoxGeometry(pw, standM, pw), woodMat);
      ped.position.y = standM / 2; ped.castShadow = true; ped.receiveShadow = true; ped.userData.kind = 'stand';
      root.add(ped);
    }
  }
  root.position.set(p.x, 0.003, p.y);
  if (analyze(p.x, p.y)?.outdoor) root.position.y = 0;
  root.userData.uid = p.uid;
  root.traverse((o) => { o.userData.uid = p.uid; });
  root.userData.standY = standM;
  root.userData.topY = standM + model.userData.topY;
  return root;
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
  for (const id of ['pf-lp', 'pf-bb']) { const e = $(id); if (e && !e.classList.contains('hide')) t = Math.min(t, e.getBoundingClientRect().top); }
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
const POLAR_3D = 31; // ≈ 59° Blickneigung über dem Horizont
function camPose(mode) {
  const polar = mode === 'top' ? 0.01 : POLAR_3D;
  const az = baseAzimuthDeg() + (mode === 'top' ? 0 : -8); // leicht seitlich
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
const FOCUS_MIN = 6;
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
const BASE_FOV = 38;
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
    const cs = !topShadowOff && (!wg.exterior || wg.fade > 0.5);
    wg.group.children.forEach((c) => { if (c.userData.kind === 'wall' && c.castShadow !== cs) { c.castShadow = cs; renderer.shadowMap.needsUpdate = true; } });
  }
  dirty = true;
}
function updateWallFade() {
  camera.getWorldDirection(camDir);
  const tilt = Math.acos(clamp(-camDir.y, -1, 1)); // 0 = von oben
  // Draufsicht: Wände werfen keine Schatten (sonst doppelte Wandkanten)
  const off = tilt < 0.3;
  if (off !== topShadowOff) {
    topShadowOff = off; applyWallShadows();
    // Draufsicht: Wandkappen etwas dunkler (Plan liest), 3D: helle Creme
    const cc = off ? CAP_TOP : CAP_3D;
    capMat.color.copy(cc); for (const wg of wallGroups) if (wg.mats) wg.mats[3].color.copy(cc);
    for (const e of edgeMeshes) e.visible = off;
  }
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
}

const PULSE_MS = 1500;
let last = performance.now();
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
  const objs = [...floorMeshes, ...plantObjs.values()];
  wallGroups.forEach((wg) => { if (!wg.exterior || wg.fade > 0.5) objs.push(wg.group); });
  const hits = raycaster.intersectObjects(objs, true);
  for (const h of hits) {
    if (h.object.userData.kind === 'glass' || h.object.userData.kind === 'door') continue;
    if (h.object.userData.uid) return { type: 'plant', uid: h.object.userData.uid };
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
  const hit = pick(sx, sy);
  if (!hit) { if (selected && !moveMode) closeSheet(); return; }
  if (moveMode) {
    if (hit.type === 'floor') movePlantTo(hit.x, hit.y);
    else if (hit.type === 'plant' && hit.uid === selected?.uid) cancelMove();
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
    placeNew(hit.x, hit.y);
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

function placeNew(x, y) {
  const lastId = state.lastPlantId && PLANTS.some((p) => p.id === state.lastPlantId) ? state.lastPlantId : (PLANTS[0] && PLANTS[0].id);
  const today = nowDate().toISOString();
  const p = { uid: uid(), plantId: lastId, x, y, potDiameterCm: 18, plantHeightCm: 50, standCm: 0, lastWateredAt: today, waterLog: [today], nick: '' };
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
const PLANT_KEYS = ['plantId', 'x', 'y', 'potDiameterCm', 'plantHeightCm', 'standCm', 'nick'];
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
  const opts = PLANTS.map((d) => `<option value="${esc(d.id)}"${d.id === p.plantId ? ' selected' : ''}>${d.emoji || '🪴'}  ${esc(d.name)}</option>`).join('');
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
    </div>
    <div class="pf-field" style="border-top:0">
      <div class="lbl pf-sthead"><label for="s-stand">Standhöhe <span class="val" id="s-stand-v"></span></label>
        <button class="pf-bp" id="s-best" type="button">${ICONS.sun}Beste Plätze zeigen</button></div>
      <div class="pf-stand" id="s-stand-chips"></div>
      <input type="range" class="compact" id="s-stand" min="0" max="150" step="5" value="${p.standCm || 0}" aria-label="Standhöhe">
    </div>
    <div class="pf-field pf-two">
      <div class="pf-select"><select id="s-plant" aria-label="Pflanze">${opts}</select></div>
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
  st.addEventListener('input', () => { p.standCm = +st.value; pct(st); syncPlantObj(p); updateSelection(); refreshSheet(); });
  $('s-stand-chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cm]'); if (!b) return;
    if (b.dataset.k === 'sill') snapToSill(p);
    else p.standCm = +b.dataset.cm;
    st.value = p.standCm; pct(st);
    syncPlantObj(p); updateSelection(); refreshSheet();
    focusPlant(p);
  });
  sel.addEventListener('change', () => { p.plantId = sel.value; syncPlantObj(p); updateSelection(); refreshSheet(); });
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
  const o = w.o, L = segLen(o) || 1, n = openingNormal(o), hw = openingHalfWall(o);
  const dx = (o.b[0] - o.a[0]) / L, dy = (o.b[1] - o.a[1]) / L;
  const m = Math.min(L / 2, p.potDiameterCm / 200 + 0.03);
  const t = clamp((p.x - o.a[0]) * dx + (p.y - o.a[1]) * dy, m, L - m);
  for (const off of [hw + 0.12, 0.12, hw + 0.3]) {
    const x = o.a[0] + dx * t - n[0] * off, y = o.a[1] + dy * t - n[1] * off;
    if (pointInPoly(x, y, w.room.polygon)) { p.x = x; p.y = y; break; }
  }
  p.standCm = Math.round((+o.sill || 0) * 100);
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
  return `<div class="big"><span class="ml">${fmtInt(r.mlPerWatering)}<small> ml</small></span><span class="ival">${intervalText(r.intervalDays)}</span></div>
    <div class="sub"><span class="pf-chip">${ICONS.sun}${esc(r.lightLabel || '')}</span>${winChip}</div>${warn}`;
}
function whyHTML(r) {
  if (!r) return '';
  const warn = (r.warnings || []).map((w) => `<div class="pf-warn">${ICONS.warn}<span>${esc(w)}</span></div>`).join('');
  const lines = [...(r.explanation || [])];
  if (r.mlPerWeek != null && !isDip(r)) lines.push(`≈ ${fmtInt(r.mlPerWeek)} ml pro Woche`);
  return `${warn}${lines.length ? `<ul>${lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
}
function refreshSheet() {
  const p = selected; if (!p) return;
  const def = plantDef(p.plantId);
  const { a, r } = compute(p);
  $('s-emoji').textContent = def.emoji || '🪴';
  $('s-name').textContent = p.nick || def.name;
  $('s-latin').textContent = p.nick ? def.name : (def.latin || '');
  $('s-note').textContent = def.note || '';
  $('s-pot-v').textContent = p.potDiameterCm + ' cm';
  $('s-h-v').textContent = p.plantHeightCm + ' cm';
  $('s-stand-v').textContent = p.standCm ? p.standCm + ' cm' : 'Boden';
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
  badge.textContent = r ? (isDip(r) ? `${def.emoji || ''} Tauchen · ${intervalText(r.intervalDays)}` : `${def.emoji || ''} ${fmtInt(r.mlPerWatering)} ml · ${intervalText(r.intervalDays)}`) : def.name;
  updateDistLine(p);
  requestRender();
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
function movePlantTo(x, y) {
  const p = selected; if (!p) return;
  p.x = x; p.y = y;
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
  if (rug && rug.visible === light.on) { rug.visible = !light.on; shadowsDirty(); } // Lichtkarte liegt direkt auf dem Boden
}
function setLight(on) {
  if (light.on === !!on) return;
  light.on = !!on;
  updateLightUI(); refreshLight();
  // Grundriss über dem Panel einpassen
  requestAnimationFrame(() => { const { pos, target } = camPose(viewMode); flyTo(pos, target, 600); });
}
const LIGHT_NEED_TEXT = { low: 'kommt mit wenig Licht aus', medium: 'mag es hell, ohne pralle Sonne', high: 'braucht viel Licht' };
function updateBestBar() {
  const p = light.best && light.best.p; if (!p) return;
  const def = plantDef(p.plantId);
  $('pf-bb-e').textContent = def.emoji || '🪴';
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
        <div class="pf-emoji">${def.emoji || '🪴'}</div>
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
    : '<div class="pf-list-empty">Noch keine Pflanzen.<br>Tippe in der 3D-Ansicht auf den Boden, um deine erste Pflanze zu platzieren.</div>'}`;
  $('l-close').addEventListener('click', closeAux);
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
      <div class="pf-field" style="border-top:0">
        <label for="st-n">Plan-oben zeigt nach <span class="val" id="st-v"></span></label>
        <input type="range" id="st-n" min="0" max="359" step="1" value="${Math.round(planUpDeg())}">
      </div>
      <div class="pf-actions" style="border-top:0;padding-top:4px">
        <button class="pf-act" id="st-reset">Zurücksetzen · ${Math.round(def)}°</button>
        <button class="pf-act primary" id="st-done" style="flex:.6">Fertig</button>
      </div>
      <div class="pf-tg" style="border-top:1px solid #efede9"><div><b>Raumnamen anzeigen</b><p style="margin:2px 0 0;font-size:12.5px;color:var(--ink3)">Namen und Flächen im Grundriss</p></div>
        <button class="pf-switch" id="st-names" role="switch" aria-checked="${state.showRoomNames}" aria-label="Raumnamen anzeigen"></button></div>
      <button class="pf-rlink" id="st-rem"><span class="ic">${ICONS.bell}</span><span class="t"><b>Erinnerung</b><span>${esc(reminderSummary())}</span></span></button>
    </div>`;
  const inp = $('st-n');
  const upd = () => {
    $('st-v').textContent = `${compassName(planUpDeg())} · ${Math.round(planUpDeg())}°`; pct(inp);
    updateCount(); refreshSheet(); if (light.on) refreshLight(); placeSun(); shadowsDirty();
  };
  inp.addEventListener('input', () => { state.northDeg = +inp.value; upd(); });
  inp.addEventListener('change', save);
  $('st-reset').addEventListener('click', () => { state.northDeg = null; inp.value = Math.round(def); upd(); save(); });
  $('st-done').addEventListener('click', () => { save(); closeAux(); });
  $('st-close').addEventListener('click', () => { save(); closeAux(); });
  $('st-rem').addEventListener('click', () => { save(); openReminder('settings'); });
  $('st-names').addEventListener('click', () => {
    state.showRoomNames = !state.showRoomNames; save();
    $('st-names').setAttribute('aria-checked', String(state.showRoomNames)); requestRender();
  });
  upd();
  setSheet.classList.add('open'); scrim.classList.add('show');
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
setInterval(() => { const d = dayNum(nowDate()); if (d !== lastDay) { lastDay = d; updateCount(); if (selected) refreshSheet(); queueReminderSync(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastDay = dayNum(nowDate()); updateCount(); queueReminderSync(); } });
function updateHint() {
  const show = state.plants.length === 0 && !draft && !selected;
  $('pf-hint').classList.toggle('hide', !show);
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
    el.innerHTML = `<span class="e">${due.due ? ICONS.dropW : (def.emoji || '🪴')}</span><b>${esc(p.nick || def.name)}</b><span class="s">${esc(st)}</span>`;
    el.dataset.uid = p.uid; el.dataset.prio = due.due ? 1 : 2;
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
placeSun(); // Nordrichtung aus dem Speicher
state.plants.forEach(syncPlantObj);
new ResizeObserver(resize).observe(appEl);
resize();
{
  const { pos, target } = camPose('3d');
  camera.position.copy(pos); controls.target.copy(target); controls.update();
}
updateCount(); updateHint();
requestAnimationFrame(loop);
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
  dbg: () => ({ cam: camera.position.toArray().map((v) => +v.toFixed(2)), tgt: controls.target.toArray().map((v) => +v.toFixed(2)), dist: +camera.position.distanceTo(controls.target).toFixed(2), off: sheetOffset, tween: !!tween }),
};
