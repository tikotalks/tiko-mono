export const processTitle = (title: string): string => {

  // give a span to the dot on the end.

  let fixedTitle = title.trim();

  if (fixedTitle.endsWith('.')) {
    fixedTitle = `${fixedTitle.slice(0, -1)}<span class="title-dot">.</span>`
  }

  // replace Break
  if (fixedTitle.includes('//')) {
    fixedTitle = fixedTitle.replace('//', '<br />')
  }

  return fixedTitle
}
