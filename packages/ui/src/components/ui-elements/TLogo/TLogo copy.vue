<template>
  <svg
    :class="bemm('', ['', animate ? 'animate' : ''])"
    viewBox="0 0 207 90"
    role="img"
    aria-label="Tiko logo"
  >
    <!-- T -->
    <g class="t">
      <rect x="45" y="45" width="22.5" height="22.5" fill="#fbb040"/>
      <rect x="45" y="22.5" width="22.5" height="22.5" fill="#f7941d"/>
      <rect x="22.5" y="22.5" width="22.5" height="22.5" fill="#f15a29"/>
    </g>

    <!-- i (dot) -->
    <g class="i">
      <rect class="stem" x="82" y="56.5" width="2.5" height="14" fill="#8dc63f" rx="1.25"/>
      <circle class="dot" cx="83.25" cy="45" r="11.25" fill="#8dc63f"/>
      <circle class="spark" cx="83.25" cy="45" r="11.25" fill="none" stroke="#8dc63f" stroke-opacity=".9" stroke-width="2"/>
    </g>

    <!-- k -->
    <g class="k">
      <polygon class="w1" points="121.5 45 99 22.5 99 67.5 121.5 45" fill="#da1c5c"/>
      <polygon class="w2" points="121.5 45 99 67.5 144 67.5 121.5 45" fill="#9e1f63"/>
      <polygon class="w3" points="121.5 45 144 22.5 99 22.5 121.5 45" fill="#ee2a7b"/>
    </g>

    <!-- o -->
    <g class="o">
      <circle class="blue" cx="162" cy="45" r="22.5" fill="#27aae1"/>
      <circle class="ring" cx="162" cy="45" r="22.5" fill="none" stroke="#27aae1" stroke-opacity=".9" stroke-width="2"/>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useBemm } from 'bemm';

type Props = {
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animate: false
});

const bemm = useBemm('t-logo');
const { animate } = props;
</script>

<style lang="scss">
/*
  SCALE BY EM:
  - Set font-size on <TLogo> to control overall logo width.
  - The SVG width is 1em; height follows from viewBox aspect.
  - All motion distances use em, derived from viewBox (width = 207 units).
*/

/* Base: fluid size via font-size */
.t-logo > svg {
  inline-size: 1em;     /* width == 1em of the component */
  block-size: auto;     /* height from aspect ratio */
  overflow: visible;
  aspect-ratio: 207 / 90; /* ensure consistent intrinsic sizing */
}

/* Static final states (no animation) */
.t-logo {
  /* default timeline and easing; override --total from style if you want */
  --total: 3000ms;
  --ease: cubic-bezier(0,.5,.5,1.5);

  /* show final, hide transient accents */
  .t rect, .i .dot, .k polygon, .o .blue { opacity: 1; transform: none; filter: none }
  .i .stem, .i .spark, .o .ring { display: none }
}

/* Animated variant */
.t-logo--animate {

  /* ---- Global timeline as percentages of --total ---- */
  --total: 3000ms; /* override from inline style to scale all timings */

  /* Letter segments (percentages of total) */
  --seg-t: 0.18;   /* T portion */
  --seg-gap: 0.03; /* gaps between letters */
  --seg-i: 0.34;   /* i portion */
  --seg-k: 0.20;   /* k portion */
  --seg-o: 0.25;   /* o portion */

  /* Intra-T */
  --t-item: calc(var(--total) * (var(--seg-t) / 3));
  --t-gap:  calc(var(--total) * (var(--seg-t) / 12));

  /* Letter start times (accumulated) */
  --start-t: 0ms;
  --start-i: calc(var(--total) * var(--seg-t) + var(--total) * var(--seg-gap));
  --start-k: calc(var(--start-i) + var(--total) * var(--seg-i) + var(--total) * var(--seg-gap));
  --start-o: calc(var(--start-k) + var(--total) * var(--seg-k) + var(--total) * var(--seg-gap));

  /* i/k/o durations from segments */
  --i-dur: calc(var(--total) * var(--seg-i));
  --k-dur: calc(var(--total) * var(--seg-k));
  --o-dur: calc(var(--total) * var(--seg-o));

  /* Easing */
  --e-pop: var(--ease);
  --e-bounce: var(--ease);

  /* SVG transform sanity */
  &, & * { transform-box: fill-box; transform-origin: 50% 50%; }

  /* ===== T (three squares pop in place) ===== */
  .t rect { opacity: 0; transform: scale(0); animation: t-pop var(--t-item) var(--e-pop) both; }
  .t rect:nth-child(3){ animation-delay: calc(var(--start-t) + 0 * var(--t-item) + 0 * var(--t-gap)) }
  .t rect:nth-child(2){ animation-delay: calc(var(--start-t) + 1 * var(--t-item) + 1 * var(--t-gap)) }
  .t rect:nth-child(1){ animation-delay: calc(var(--start-t) + 2 * var(--t-item) + 2 * var(--t-gap)) }

  @keyframes t-pop{
    0%{ opacity:0; transform: scale(0) }
    60%{ opacity:1; transform: scale(1.15) }
    80%{ transform: scale(.96) }
    100%{ opacity:1; transform: scale(1) }
  }

  /* ===== i (stem hint + bouncing dot between T bounds) ===== */
  .i .stem{
    transform-origin: 50% 100%;
    opacity: 0; transform: scaleY(0);
    animation: stem-draw calc(var(--total) * 0.086) var(--e-pop) both;
    animation-delay: var(--start-i);
    display: block;
  }
  .i .dot{
    opacity: 0;
    animation: dot-chamber var(--i-dur) var(--e-bounce) both;
    animation-delay: calc(var(--start-i) + calc(var(--total) * 0.02));
    filter: drop-shadow(0 0 0 rgba(0,0,0,0));
  }
  .i .spark{
    opacity: 0;
    animation: spark calc(var(--total) * 0.14) var(--e-pop) both;
    animation-delay: calc(var(--start-i) + calc(var(--total) * 0.126));
    display: block;
  }

  @keyframes stem-draw{
    0%  { opacity:0; transform: scaleY(0) }
    70% { opacity:.85; transform: scaleY(1.02) }
    85% { opacity:.6;  transform: scaleY(1) }
    100%{ opacity:0;   transform: scaleY(1) }
  }

  /* ViewBox→em conversion: 1em == full logo width (207 units)
     Vertical moves in Y units use (distance / 207) * 1em */
  @keyframes dot-chamber{
    0%  { transform: translateY(-0.23188em) scale(.92,1.08); opacity:0; filter: drop-shadow(0 0 0 rgba(0,0,0,0)) }
    20% { transform: translateY(0.05435em)  scale(1.14,.88); opacity:1; filter: drop-shadow(0 0.04831em 0.07729em rgba(0,0,0,.22)) } /* bottom hit: 10/16 em-ish */
    35% { transform: translateY(-0.05435em) scale(.92,1.08) }  /* top hit */
    50% { transform: translateY(0.02899em)  scale(1.08,.94) }
    65% { transform: translateY(-0.01932em) scale(.97,1.03) }
    80% { transform: translateY(0.00966em)  scale(1.03,.98) }
    100%{ transform: translateY(0)          scale(1,1); opacity:1; filter: drop-shadow(0 0.02899em 0.04831em rgba(0,0,0,.18)) }
  }
  @keyframes spark{
    0%  { opacity:0; transform: scale(.6) }
    30% { opacity:1 }
    100%{ opacity:0; transform: scale(1.45) }
  }

  /* ===== k (true folding from hinges) ===== */
  .k polygon{ transform-box: view-box; opacity: 0 }
  .k .w1{ transform-origin: 121.5px 45px;     animation: k-unfold-1 var(--k-dur) var(--e-bounce) both; animation-delay: var(--start-k) }
  .k .w2{ transform-origin: 110.25px 56.25px; animation: k-unfold-2 var(--k-dur) var(--e-bounce) both; animation-delay: calc(var(--start-k) + var(--k-dur)*.5) }
  .k .w3{ transform-origin: 110.25px 33.75px; animation: k-unfold-3 var(--k-dur) var(--e-bounce) both; animation-delay: calc(var(--start-k) + var(--k-dur)*1.0) }

  @keyframes k-unfold-1{
    0%  { transform: rotate(-160deg) scale(.94); opacity:0 }
    45% { opacity:1 }
    70% { transform: rotate(10deg)  scale(1.02) }
    100%{ transform: rotate(0)      scale(1); opacity:1 }
  }
  @keyframes k-unfold-2{
    0%  { transform: rotate(-180deg) scale(.96); opacity:0 }
    45% { opacity:1 }
    70% { transform: rotate(8deg)   scale(1.02) }
    100%{ transform: rotate(0)      scale(1); opacity:1 }
  }
  @keyframes k-unfold-3{
    0%  { transform: rotate(-180deg) scale(.96); opacity:0 }
    45% { opacity:1 }
    70% { transform: rotate(-6deg)  scale(1.02) }
    100%{ transform: rotate(0)      scale(1); opacity:1 }
  }

  /* ===== o (drop → bounce → settle) =====
     Y distances converted from viewBox to em (value/207 * 1em) */
  .o .blue{
    opacity: 0;
    animation: o-drop var(--o-dur) var(--e-bounce) both;
    animation-delay: var(--start-o);
    filter: drop-shadow(0 0 0 rgba(0,0,0,0));
  }
  .o .ring{
    opacity: 0; stroke-dasharray: 141.37; stroke-dashoffset: 141.37;
    animation: ring-sweep calc(var(--total) * 0.12) var(--e-bounce) both;
    animation-delay: calc(var(--start-o) + var(--o-dur)*.55);
    display: block;
  }

  @keyframes o-drop{
    0%  { transform: translateY(-0.43478em) scale(.92,1.08); opacity:0; filter: drop-shadow(0 0 0 rgba(0,0,0,0)) }
    55% { transform: translateY(0.10870em)  scale(1.12,.90); opacity:1; filter: drop-shadow(0 0.07729em 0.09662em rgba(0,0,0,.22)) }
    75% { transform: translateY(-0.03865em) scale(.97,1.04) }
    88% { transform: translateY(0.01932em)  scale(1.04,.97) }
    100%{ transform: translateY(0)           scale(1,1);     opacity:1; filter: drop-shadow(0 0.03865em 0.05797em rgba(0,0,0,.18)) }
  }
  @keyframes ring-sweep{
    0%{ stroke-dashoffset: 141.37; opacity:0 }
    20%{ opacity:1 }
    100%{ stroke-dashoffset: 0; opacity:0 }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce){
    *{ animation: none !important }
    .i .stem, .i .spark, .o .ring { display: none }
    .t rect, .i .dot, .k polygon, .o .blue { opacity:1; transform:none; filter:none }
  }
}
</style>
