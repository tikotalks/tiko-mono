<template>
  <div v-if="conflicts.length > 0" :class="bemm()">
    <TAlert type="warning" :class="bemm('alert')">
      <div :class="bemm('header')">
        <TIcon :name="Icons.TRIANGLED_EXCLAMATION_MARK" />
        <h3>{{ t('i18n.conflicts.found', { count: conflicts.length }) }}</h3>

      </div>

      <p :class="bemm('description')">
        {{ t('i18n.conflicts.description') }}
      </p>

      <div :class="bemm('conflicts')">
        <details
          v-for="(conflict, index) in conflicts"
          :key="conflict.type === 'hierarchical' ? conflict.parentKey : `duplicate-${conflict.key}-${index}`"
          :class="bemm('conflict')"
        >
          <summary :class="bemm('conflict-summary')">
            <template v-if="conflict.type === 'hierarchical'">
              <code>{{ conflict.parentKey }}</code> -
              <span :class="bemm('conflict-count')">
                {{ t('i18n.conflicts.childCount', { count: conflict.childKeys.length }) }}
              </span>
              <TButton :href="`#${conflict.parentKey}`" :icon="Icons.ARROW_DOWN" />
            </template>
            <template v-else>
              <code>{{ conflict.key }}</code> -
              <span :class="bemm('conflict-count')">
                {{ t('i18n.conflicts.duplicateCount', { count: conflict.duplicateIds.length }) }}
              </span>
              <TButton :href="`#${conflict.key}`" :icon="Icons.ARROW_DOWN" />
            </template>
          </summary>

          <div :class="bemm('conflict-details')">
            <template v-if="conflict.type === 'hierarchical'">
              <p :class="bemm('explanation')">
                {{ t('i18n.conflicts.explanation', { key: conflict.parentKey }) }}
              </p>

              <div :class="bemm('child-list')">
                <h4>{{ t('i18n.conflicts.conflictingKeys') }}</h4>
                <ul>
                  <li v-for="child in conflict.childKeys.slice(0, 10)" :key="child">
                    <code>{{ child }}</code>
                  </li>
                  <li v-if="conflict.childKeys.length > 10" :class="bemm('more')">
                    {{ t('i18n.conflicts.andMore', { count: conflict.childKeys.length - 10 }) }}
                  </li>
                </ul>
              </div>

              <div v-if="conflict.suggestions.length > 0" :class="bemm('suggestions')">
                <h4>{{ t('i18n.conflicts.suggestedFix') }}</h4>
                <p>{{ t('i18n.conflicts.renameParentTo') }}</p>
                <div :class="bemm('suggestion-list')">
                  <code v-for="suggestion in conflict.suggestions" :key="suggestion">
                    {{ suggestion }}
                  </code>
                </div>
              </div>
            </template>
            <template v-else>
              <p :class="bemm('explanation')">
                {{ t('i18n.conflicts.duplicateExplanation', { key: conflict.key }) }}
              </p>

              <div :class="bemm('duplicate-list')">
                <h4>{{ t('i18n.conflicts.duplicateIds') }}</h4>
                <ul>
                  <li v-for="id in conflict.duplicateIds" :key="id">
                    <code>{{ id }}</code>
                  </li>
                </ul>
                <p :class="bemm('duplicate-suggestion')">
                  {{ t('i18n.conflicts.duplicateSuggestion') }}
                </p>
              </div>
            </template>
          </div>
        </details>
      </div>
    </TAlert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { TAlert, TButton, TIcon, useI18n } from '@tiko/ui'

interface Props {
  keys: Array<{ id: string; key: string }>
}

interface HierarchicalConflict {
  type: 'hierarchical'
  parentKey: string
  childKeys: string[]
  suggestions: string[]
}

interface DuplicateConflict {
  type: 'duplicate'
  key: string
  duplicateIds: string[]
}

type KeyConflict = HierarchicalConflict | DuplicateConflict

const props = defineProps<Props>()
const bemm = useBemm('i18n-conflict-alert')
const { t } = useI18n()

const conflicts = computed(() => {
  const foundConflicts: KeyConflict[] = []
  const keySet = new Set(props.keys.map(k => k.key))
  const sortedKeys = [...props.keys].sort((a, b) => a.key.localeCompare(b.key))
  const processedKeys = new Set<string>()

  // Check for duplicate keys first
  const keyGroups = new Map<string, string[]>()
  props.keys.forEach(keyData => {
    if (!keyGroups.has(keyData.key)) {
      keyGroups.set(keyData.key, [])
    }
    keyGroups.get(keyData.key)!.push(keyData.id)
  })

  // Add duplicate conflicts
  keyGroups.forEach((ids, key) => {
    if (ids.length > 1) {
      foundConflicts.push({
        type: 'duplicate',
        key,
        duplicateIds: ids
      })
      processedKeys.add(key)
    }
  })

  // Check for hierarchical conflicts
  for (const keyData of sortedKeys) {
    if (processedKeys.has(keyData.key)) continue

    const parts = keyData.key.split('.')

    // Check if any parent path exists as a key
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.')

      if (keySet.has(parentPath) && !processedKeys.has(parentPath)) {
        // Find all child keys that conflict with this parent
        const conflictingChildren = props.keys
          .filter(k => k.key.startsWith(parentPath + '.') && k.key !== parentPath)
          .map(k => k.key)

        const suggestions: string[] = []

        // Generate suggestions
        if (!parentPath.includes('.title') && !parentPath.includes('.label')) {
          suggestions.push(`${parentPath}.title`)
          suggestions.push(`${parentPath}.label`)
          suggestions.push(`${parentPath}.text`)
        }

        if (conflictingChildren.length > 3) {
          suggestions.push(`${parentPath}.default`)
          suggestions.push(`${parentPath}.value`)
        }

        foundConflicts.push({
          type: 'hierarchical',
          parentKey: parentPath,
          childKeys: conflictingChildren,
          suggestions: suggestions.filter(s => !conflictingChildren.includes(s))
        })

        // Mark as processed
        processedKeys.add(parentPath)
        conflictingChildren.forEach(child => processedKeys.add(child))
      }
    }
  }

  return foundConflicts
})
</script>

<style lang="scss">
.i18-n-conflict-alert {
  margin-bottom: var(--space-l);

  &__alert {
    // Using TAlert's styling
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    margin-bottom: var(--space-s);

    h3 {
      margin: 0;
      font-size: var(--font-size-l);
      color: var(--color-warning-text);
    }

    .t-icon {
      color: var(--color-warning);
      font-size: var(--font-size-l);
    }
  }

  &__description {
    margin-bottom: var(--space);
    color: var(--color-text-secondary);
  }

  &__conflicts {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__conflict {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    padding: var(--space-s);

    summary {
      cursor: pointer;
      user-select: none;

      &:hover {
        background: var(--color-background-hover);
      }
    }
  }

  &__conflict-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-xs);

    code {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-sm);
      background: var(--color-background-secondary);
      padding: var(--space-xs) var(--space-s);
      border-radius: var(--border-radius);
    }
  }

  &__conflict-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
  }

  &__conflict-details {
    padding: var(--space) var(--space-s) var(--space-s);
  }

  &__explanation {
    margin-bottom: var(--space);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__child-list,
  &__duplicate-list,
  &__suggestions {
    margin-bottom: var(--space);

    h4 {
      margin: 0 0 var(--space-xs) 0;
      font-size: var(--font-size-s);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
    }

    ul {
      margin: 0;
      padding-left: var(--space-l);
      list-style: none;

      li {
        position: relative;
        padding: var(--space-xs) 0;

        &::before {
          content: '•';
          position: absolute;
          left: calc(var(--space-l) * -1);
          color: var(--color-text-tertiary);
        }

        code {
          font-family: var(--font-family-mono);
          font-size: var(--font-size-xs);
          background: var(--color-background-secondary);
          padding: 2px var(--space-xs);
          border-radius: var(--border-radius-xs);
        }
      }
    }
  }

  &__more {
    font-style: italic;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-xs);
  }

  &__suggestion-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin-top: var(--space-xs);

    code {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-sm);
      background: var(--color-success-background);
      color: var(--color-success-text);
      padding: var(--space-xs) var(--space-s);
      border-radius: var(--border-radius-xs);
      border: 1px solid var(--color-success-border);
    }
  }

  &__duplicate-suggestion {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-s);
    font-style: italic;
  }
}
</style>
