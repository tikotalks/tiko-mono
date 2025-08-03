export const processTitle = (title: string): string => {

  // give a span to the dot on the end.

  if (title.endsWith('.')) {
    return `${title.slice(0, -1)}<span class="title-dot">.</span>`
  }
  
  return title
}
