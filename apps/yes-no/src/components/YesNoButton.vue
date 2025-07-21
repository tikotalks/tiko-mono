<template>
  <button :class="bemm('',['', current ? 'x' : 'v', size])">
    <div :class="bemm('char', ['', current ? 'x' : 'v'])">
      <div :class="bemm('char-leg', ['', '1'])"></div>
      <div :class="bemm('char-leg', ['', '2'])"></div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { ref, defineProps } from 'vue';

const bemm = useBemm('yes-no-button');

const props = defineProps({
  mode: {
    type: Number,
    default: 0,
  },
  toggleMode: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'large',
    validator: (value: string) => ['small', 'medium', 'large'].includes(value)
  }
});

const current = ref(props.mode || 0);

const toggle = () => {
  if (props.toggleMode) {
  }
  current.value = current.value === 0 ? 1 : 0;
};
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

.yes-no-button {
  $b: &;

  background-color: var(--color-primary);
 display: block;
 border-radius: var(--border-radius-s); position: relative;
  padding: .25em;
  border: none;

  // Size variants
  &--small {
    font-size: .5em;
  }

  &--medium {
    font-size: .75em;
  }

  &--large {
    font-size: 1em;
  }

  --inner-shadow-size: 0.25em;
  --inner-shadow-offset: 0.025em;
  --inner-shadow-color-light: rgba(255, 255, 255, 0.5);
  --inner-shadow-color-dark: rgba(0, 0, 0, 0.5);

  --outer-shadow-size: 0.025em;


  --light-color:color-mix(in srgb, var(--color), white 25%);
  --dark-color: color-mix(in srgb, var(--color), black 25%);

  background-image: linear-gradient(to top, var(--light-color), var(--dark-color));

  box-shadow: 0 .025em 0 var(--light-color) inset, 0 -.025em 0 var(--dark-color) inset,
  .025em .025em .025em rgba(0, 0, 0, 0.25),
  .25em .25em .25em rgba(0, 0, 0, 0.5);

      // box-shadow: var(--inner-shadow-offset) var(--inner-shadow-offset) var(--inner-shadow-size) var(--inner-shadow-color-dark) inset, calc(var(--inner-shadow-offset) * -1) calc(var(--inner-shadow-offset) * -1) var(--inner-shadow-offset) var(--inner-shadow-color-light) inset;


      transition: all .2s ease-in-out;

  &--x{
    --color: var(--color-red);
  }
  &--v{
    --color: var(--color-green);
  }
  &:focus{

    --color: var(--color-purple);
  }



  &__char {
    position: relative;
    width: 1em;
    height: 1em;
    position: relative;
    filter: drop-shadow(0.025em 0.025em 0.025em rgba(0, 0, 0, 0.5))
      drop-shadow(0.1em 0.1em 0.05em rgba(0, 0, 0, 0.25));

    &--x {
      #{$b}__char-leg--1 {
        transform: translate(-50%, -50%) rotate(-45deg);
      }
      #{$b}__char-leg--2 {
        transform: translate(-50%, -50%) rotate(45deg);
      }
    }
    &--v {
      #{$b}__char-leg--1 {
        top: 40%;
        left: 40%;
        transform: rotate(45deg) translate(-60%, -50%);
      }
      #{$b}__char-leg--2 {
        top: 40%;
        left: 40%;
        height: 0.6em;
        transform: rotate(-45deg) translate(-30%, -30%);
      }
    }
  }
  &__char-leg {
    --leg-width: 0.2em;
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--leg-width);
    height: 1em;
    border-radius: 0.05em;
    transition: 0.3s ease-in-out;

    background-color: white;
  }
}
</style>
