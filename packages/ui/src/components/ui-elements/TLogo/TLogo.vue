<template>
 <svg :class="bemm('', size)" :style="logoStyles" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 207 90">
  <g class="t">
    <rect x="45" y="45" width="22.5" height="22.5" style="fill: #fbb040;"/>
    <rect x="45" y="22.5" width="22.5" height="22.5" style="fill: #f7941d;"/>
    <rect x="22.5" y="22.5" width="22.5" height="22.5" style="fill: #f15a29;"/>
  </g>
  <g class="i">
    <circle cx="83.25" cy="45" r="11.25" style="fill: #8dc63f;"/>
  </g>

  <g class="o">
    <circle cx="162" cy="45" r="22.5" style="fill: #27aae1;"/>
  </g>

  <g class="k">
    <polygon points="121.5 45 99 22.5 99 67.5 121.5 45" style="fill: #da1c5c;"/>
  <polygon points="121.5 45 99 67.5 144 67.5 121.5 45" style="fill: #9e1f63;"/>
  <polygon points="121.5 45 144 22.5 99 22.5 121.5 45" style="fill: #ee2a7b;"/>
  </g>
</svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBemm } from 'bemm';
import type { TLogoProps } from './TLogo.model';

const props = withDefaults(defineProps<TLogoProps>(), {
  size: 'medium',
  animate: true
});

const bemm = useBemm('t-logo');

const logoStyles = computed(() => {
  const sizeMap = {
    small: { width: '80px', height: '35px' },
    medium: { width: '120px', height: '52px' },
    large: { width: '207px', height: '90px' }
  };
  
  return sizeMap[props.size];
});
</script>

<style lang="scss" scoped>
.t-logo {
  display: inline-block;
  
  &--small {
    width: 80px;
    height: 35px;
  }
  
  &--medium {
    width: 120px;
    height: 52px;
  }
  
  &--large {
    width: 207px;
    height: 90px;
  }
  
  svg{
    width: 100%;
    height: 100%;
    --delay: .3s;
    --anim: .3s;

    &,*{
        transform-box: fill-box;
        transform-origin: 50% 50%;
    }

    .t{
      --extra-delay: 1s;
      rect{
        animation: block var(--anim) var(--custom-delay) forwards;
        transform: scale(0);
        pointer-events: all;
        transition: .3s;
         &:hover {
          animation: quarterRotate .3s ease-in-out;
           @keyframes quarterRotate{
             to{
               transform: scale(1) rotate(45deg);
             }
           }
        }
        @for $i from 1 through 3{
          &:nth-child(#{$i}){
            --custom-delay: calc((var(--delay) + var(--extra-delay)) + (#{$i} * .25s));
          }
        }
      }
    }

    .i, .o{
      transition: transform .3s ease-in-out;
      circle{
        transform: scale(0);
        animation: dot  var(--anim) var(--delay) forwards;
      }
    }
    .i{
      --delay: .25s;
        transform-origin: 0% 50%;

      &:hover{
        transform: scale(2);
        transform-origin: 0% 50%;

        & ~ .o{
          transform: scale(0.5);
        }
        & ~ .k{
          transform: translateX(50%);
        }
      }
    }
    .o{
      transform-origin: 100% 50%;
      --delay: .75s;
    }

    .k{
      --extra-delay: .25s;

      transition: transform .3s ease-in-out;
      polygon{
        animation: triangle var(--anim) var(--custom-delay) forwards;
        transform: scale(0);

        &:hover {
          transform: scale(1.1);
        }

        @for $i from 1 through 3{
          &:nth-child(#{$i}){
            --custom-delay: calc((var(--delay) + var(--extra-delay)) + (#{$i} * .25s));
          }
        }
      }
    }
  }
}

@keyframes block{
  0% {
    transform: scale(0, 0) rotate(25deg);
  }
  100%{
    transform: scale(1, 1) rotate(0deg);
  }
}
@keyframes dot{
  0% {
    transform: scale(0, 0) rotate(25deg);
  }
  100%{
    transform: scale(1, 1) rotate(0deg);
  }
}
@keyframes triangle{
  0% {
    transform: scale(0,0) rotate(-25deg);
  }
  50% {
    transform: scale(0,1) rotate(25deg);
  }
  100%{
    transform: scale(1) rotate(0deg);
  }
}
</style>