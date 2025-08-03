/**
 * Vite plugin to inject build information into HTML meta tags
 */

export function viteBuildInfo(buildInfo) {
  return {
    name: 'vite-plugin-build-info',
    transformIndexHtml(html) {
      // Create meta tags with build information
      const metaTags = [
        `<meta name="build:version" content="${buildInfo.version}">`,
        `<meta name="build:number" content="${buildInfo.buildNumber}">`,
        `<meta name="build:commit" content="${buildInfo.commit}">`,
        `<meta name="build:branch" content="${buildInfo.branch}">`,
        `<meta name="build:date" content="${buildInfo.buildDate}">`,
        `<meta name="build:environment" content="${buildInfo.environment}">`,
        // Combined version string for easy access
        `<meta name="build:full-version" content="v${buildInfo.version}-${buildInfo.buildNumber}-${buildInfo.commit}">`,
        // Generator tag
        `<meta name="generator" content="Tiko Platform v${buildInfo.version}">`
      ].join('\n    ');

      // Inject meta tags into head
      return html.replace(
        '</head>',
        `    <!-- Build Information -->\n    ${metaTags}\n  </head>`
      );
    }
  };
}