var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// scripts/generate-i18n-database.js
var require_generate_i18n_database = __commonJS({
  "scripts/generate-i18n-database.js"(exports, module) {
    var fs4 = __require("fs");
    var path4 = __require("path");
    var APP_SECTION_CONFIG2 = {
      "yes-no": {
        excluded: ["admin", "deployment", "media", "content"]
      },
      "timer": {
        excluded: ["admin", "deployment", "media", "content"]
      },
      "radio": {
        excluded: ["admin", "deployment", "media", "content"]
      },
      "cards": {
        excluded: ["admin", "deployment", "media", "content"]
      },
      "todo": {
        excluded: ["admin", "deployment", "media", "content"]
      },
      "type": {
        excluded: ["admin", "deployment", "media", "content"]
      },
      "admin": {
        // Admin includes everything
        excluded: []
      },
      "marketing": {
        excluded: ["admin", "deployment"]
      },
      "ui-docs": {
        excluded: ["admin", "deployment", "media", "content"]
      }
    };
    var DatabaseI18nGenerator2 = class {
      constructor(options = {}) {
        this.options = options;
        this.baseOutputDir = options.outputDir || path4.join(process.cwd(), "packages/ui/src/i18n/generated");
        this.supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        if (!this.supabaseUrl || !this.supabaseKey) {
          console.warn("\u26A0\uFE0F  Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
          console.warn("\u{1F4A1} Falling back to mock data generation...");
          throw new Error("NO_SUPABASE_CONFIG");
        }
        this.baseUrl = this.supabaseUrl + "/rest/v1";
        this.fetch = null;
        this.initializeFetch();
      }
      async initializeFetch() {
        try {
          if (typeof fetch !== "undefined") {
            this.fetch = fetch;
          } else {
            const { default: fetch2 } = await import("file:///Users/silvandiepen/Repositories/node_modules/node-fetch/lib/index.js");
            this.fetch = fetch2;
          }
        } catch (error) {
          console.error("Failed to initialize fetch. Please install node-fetch: npm install node-fetch");
          throw error;
        }
      }
      async makeRequest(endpoint, options = {}) {
        if (!this.fetch) {
          await this.initializeFetch();
        }
        const url = `${this.baseUrl}${endpoint}`;
        const response = await this.fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "apikey": this.supabaseKey,
            "Authorization": `Bearer ${this.supabaseKey}`,
            "Prefer": "return=representation",
            ...options.headers
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Supabase API Error: ${response.status} - ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      }
      async getActiveLanguages() {
        return this.makeRequest("/i18n_languages?is_active=eq.true&order=name.asc");
      }
      async getTranslationKeys() {
        return this.makeRequest("/i18n_keys?order=key.asc");
      }
      async getTranslationsForLanguage(languageCode) {
        this.log(`Fetching translations for language: ${languageCode}`);
        let query = `/i18n_translations?select=i18n_keys(key),value,language_code&is_published=eq.true`;
        if (languageCode.includes("-")) {
          const baseLocale2 = languageCode.split("-")[0];
          query += `&language_code=in.(${baseLocale2},${languageCode})`;
        } else {
          query += `&language_code=eq.${languageCode}`;
        }
        const translations = await this.makeRequest(query);
        const translationsByKey = {};
        const baseLocale = languageCode.includes("-") ? languageCode.split("-")[0] : null;
        for (const translation of translations) {
          if (translation.i18n_keys && translation.i18n_keys.key) {
            const key = translation.i18n_keys.key;
            if (!translationsByKey[key]) {
              translationsByKey[key] = {};
            }
            if (translation.language_code === baseLocale) {
              translationsByKey[key].base = translation.value;
            } else {
              translationsByKey[key].specific = translation.value;
            }
          }
        }
        const mergedTranslations = {};
        for (const [key, values] of Object.entries(translationsByKey)) {
          mergedTranslations[key] = values.specific || values.base || "";
        }
        this.log(`Processed ${Object.keys(mergedTranslations).length} translations for ${languageCode}`);
        return mergedTranslations;
      }
      async generate() {
        this.log("\u{1F30D} Starting database i18n generation...");
        try {
          const languages = await this.getTargetLanguages();
          this.log(`\u{1F4CB} Target languages: ${languages.join(", ")}`);
          const allKeys = await this.getFilteredKeys();
          this.log(`\u{1F511} Processing ${allKeys.length} translation keys`);
          this.ensureOutputDirectory();
          for (const language of languages) {
            await this.generateLanguageFile(language, allKeys);
          }
          this.generateInterfaces(allKeys);
          this.generateIndexFile(languages);
          if (this.options.app) {
            this.generateAppExport(this.options.app, languages);
          }
          this.log("\u2705 Database i18n generation complete!");
        } catch (error) {
          console.error("\u274C Generation failed:", error);
          process.exit(1);
        }
      }
      async getTargetLanguages() {
        if (this.options.languages) {
          return this.options.languages;
        }
        const activeLanguages = await this.getActiveLanguages();
        return activeLanguages.map((lang) => lang.code);
      }
      async getFilteredKeys() {
        const allKeys = await this.getTranslationKeys();
        const keyStrings = allKeys.map((key) => key.key);
        let includeSections = this.options.includeSections;
        let excludeSections = this.options.excludeSections;
        if (!includeSections && !excludeSections && this.options.app) {
          const config = APP_SECTION_CONFIG2[this.options.app];
          if (config) {
            includeSections = config.included;
            excludeSections = config.excluded;
          }
        }
        if (!includeSections && !excludeSections) {
          this.log(`\u{1F4E6} No section filtering - including all ${keyStrings.length} keys`);
          return keyStrings;
        }
        let filteredKeys = keyStrings;
        if (includeSections) {
          filteredKeys = keyStrings.filter(
            (key) => includeSections.some((section) => key.startsWith(`${section}.`))
          );
          this.log(`\u{1F4E6} Including sections: ${includeSections.join(", ")}`);
        }
        if (excludeSections) {
          filteredKeys = filteredKeys.filter(
            (key) => !excludeSections.some((section) => key.startsWith(`${section}.`))
          );
          this.log(`\u{1F6AB} Excluding sections: ${excludeSections.join(", ")}`);
        }
        const appName = this.options.app || "current app";
        this.log(`\u{1F3AF} Filtered ${keyStrings.length} \u2192 ${filteredKeys.length} keys for ${appName}`);
        return filteredKeys;
      }
      async generateLanguageFile(language, keys) {
        this.log(`\u{1F4DD} Generating ${language}.ts...`);
        try {
          const allTranslations = await this.getTranslationsForLanguage(language);
          const filteredTranslations = {};
          for (const key of keys) {
            if (allTranslations[key]) {
              filteredTranslations[key] = allTranslations[key];
            }
          }
          const nestedTranslations = this.createNestedStructure(filteredTranslations);
          const content = this.generateTypeScriptContent(language, nestedTranslations);
          const outputPath = path4.join(this.baseOutputDir, `${language}.ts`);
          fs4.writeFileSync(outputPath, content, "utf-8");
          this.log(`\u2705 Generated ${language}.ts (${Object.keys(filteredTranslations).length} keys)`);
        } catch (error) {
          console.error(`\u274C Failed to generate ${language}.ts:`, error);
          throw error;
        }
      }
      createNestedStructure(translations) {
        const result = {};
        for (const [key, value] of Object.entries(translations)) {
          const parts = key.split(".");
          let current = result;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          current[parts[parts.length - 1]] = value;
        }
        return result;
      }
      generateTypeScriptContent(language, translations) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const app = this.options.app ? ` for app: ${this.options.app}` : "";
        return `/**
 * Generated translation file for ${language}${app}
 * 
 * Generated on: ${timestamp}
 * Source: Tiko translation database
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 * \u26A0\uFE0F  Changes will be overwritten on next generation
 * 
 * To update translations:
 * 1. Edit translations in the admin dashboard
 * 2. Run: pnpm run generate:i18n
 */

import type { Translations } from './types'

const translations: Translations = ${JSON.stringify(translations, null, 2)}

export default translations
export type { Translations } from './types'
`;
      }
      generateInterfaces(keys) {
        this.log("\u{1F527} Generating TypeScript interfaces...");
        const sampleTranslations = {};
        keys.forEach((key) => {
          sampleTranslations[key] = "string";
        });
        const nestedStructure = this.createNestedStructure(sampleTranslations);
        const interfaceContent = this.generateInterfaceContent(nestedStructure);
        const content = `/**
 * TypeScript interfaces for translation files
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

export interface Translations {
${interfaceContent}
}

// Helper type for strongly typed translation keys
export type TranslationKey = ${keys.map((key) => `'${key}'`).join(" | ")}

// Helper type for nested key access
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? \`\${Key}.\${NestedKeyOf<ObjectType[Key]>}\`
    : \`\${Key}\`
}[keyof ObjectType & (string | number)]

export type TranslationKeyPath = NestedKeyOf<Translations>
`;
        const outputPath = path4.join(this.baseOutputDir, "types.ts");
        fs4.writeFileSync(outputPath, content, "utf-8");
        this.log("\u2705 Generated types.ts");
      }
      generateInterfaceContent(obj, indent = "  ") {
        const lines = [];
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "string") {
            lines.push(`${indent}${key}: string`);
          } else {
            lines.push(`${indent}${key}: {`);
            lines.push(this.generateInterfaceContent(value, indent + "  "));
            lines.push(`${indent}}`);
          }
        }
        return lines.join("\n");
      }
      generateIndexFile(languages) {
        this.log("\u{1F4C7} Generating index.ts...");
        const content = `/**
 * Generated translation index file
 * 
 * This file provides easy access to all generated translation files
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

// Import all language files
${languages.map(
          (lang) => `import ${lang.replace("-", "_")} from './${lang}'`
        ).join("\n")}

// Export language constants
export const AVAILABLE_LANGUAGES = ${JSON.stringify(languages, null, 2)} as const

export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number]

// Export all translations in a map
export const translations: Record<AvailableLanguage, Translations> = {
${languages.map((lang) => `  '${lang}': ${lang.replace("-", "_")}`).join(",\n")}
}

// Export individual languages
export {
${languages.map((lang) => `  ${lang.replace("-", "_")} as ${lang.replace("-", "_")}`).join(",\n")}
}

// Export types
export type { Translations, TranslationKey, TranslationKeyPath } from './types'

/**
 * Get translations for a specific language
 */
export function getTranslations(language: AvailableLanguage): Translations {
  return translations[language]
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is AvailableLanguage {
  return AVAILABLE_LANGUAGES.includes(language as AvailableLanguage)
}
`;
        const outputPath = path4.join(this.baseOutputDir, "index.ts");
        fs4.writeFileSync(outputPath, content, "utf-8");
        this.log("\u2705 Generated index.ts");
      }
      generateAppExport(app, languages) {
        this.log(`\u{1F4F1} Generating app export for ${app}...`);
        const content = `/**
 * App-specific translations export for ${app}
 * 
 * This file is optimized for the ${app} app and only contains
 * relevant translation sections.
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

export { 
  translations,
  getTranslations,
  isLanguageSupported,
  AVAILABLE_LANGUAGES
} from './index'

export type { 
  Translations, 
  TranslationKey, 
  TranslationKeyPath,
  AvailableLanguage 
} from './index'

// App-specific re-exports for convenience
export const APP_NAME = '${app}'
export const APP_TRANSLATIONS = translations
`;
        const outputPath = path4.join(this.baseOutputDir, `${app}.ts`);
        fs4.writeFileSync(outputPath, content, "utf-8");
        this.log(`\u2705 Generated ${app}.ts`);
      }
      ensureOutputDirectory() {
        if (!fs4.existsSync(this.baseOutputDir)) {
          fs4.mkdirSync(this.baseOutputDir, { recursive: true });
          this.log(`\u{1F4C1} Created output directory: ${this.baseOutputDir}`);
        }
        const gitignorePath = path4.join(this.baseOutputDir, ".gitignore");
        const gitignoreContent = `# Auto-generated translation files
# These files are generated from the database and should not be committed

*.ts
*.js
*.d.ts
!.gitignore

# Keep this directory but ignore all generated content
`;
        fs4.writeFileSync(gitignorePath, gitignoreContent, "utf-8");
      }
      log(message) {
        if (this.options.verbose !== false) {
          console.log(message);
        }
      }
    };
    function parseArgs() {
      const args = process.argv.slice(2);
      const options = {};
      for (const arg of args) {
        if (arg.startsWith("--app=")) {
          options.app = arg.split("=")[1];
        } else if (arg.startsWith("--languages=")) {
          options.languages = arg.split("=")[1].split(",");
        } else if (arg.startsWith("--output=")) {
          options.outputDir = arg.split("=")[1];
        } else if (arg === "--production") {
          options.production = true;
        } else if (arg === "--verbose") {
          options.verbose = true;
        } else if (arg === "--quiet") {
          options.verbose = false;
        }
      }
      return options;
    }
    async function main() {
      const options = parseArgs();
      const generator = new DatabaseI18nGenerator2(options);
      await generator.generate();
    }
    if (__require.main === module) {
      main().catch((error) => {
        console.error("Generation failed:", error);
        process.exit(1);
      });
    }
    module.exports = { DatabaseI18nGenerator: DatabaseI18nGenerator2 };
  }
});

// vite.config.base.js
import { defineConfig } from "file:///Users/silvandiepen/Repositories/_tiko/tiko-mono/node_modules/.pnpm/vite@5.4.19_@types+node@18.16.9_sass@1.89.2_terser@5.43.1/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/silvandiepen/Repositories/_tiko/tiko-mono/node_modules/.pnpm/@vitejs+plugin-vue@4.6.2_vite@5.4.19_@types+node@18.16.9_sass@1.89.2_terser@5.43.1__vue@3.5.18_typescript@5.3.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { VitePWA } from "file:///Users/silvandiepen/Repositories/_tiko/tiko-mono/node_modules/.pnpm/vite-plugin-pwa@1.0.2_vite@5.4.19_@types+node@18.16.9_sass@1.89.2_terser@5.43.1__workbox-buil_odrgd4uc5cx52q6wrhiaafjsl4/node_modules/vite-plugin-pwa/dist/index.js";
import path3 from "path";
import { execSync } from "child_process";
import fs3 from "fs";

// scripts/vite-plugin-build-info.js
function viteBuildInfo(buildInfo) {
  return {
    name: "vite-plugin-build-info",
    transformIndexHtml(html) {
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
      ].join("\n    ");
      return html.replace(
        "</head>",
        `    <!-- Build Information -->
    ${metaTags}
  </head>`
      );
    }
  };
}

// scripts/vite-plugin-i18n-simple.js
import fs from "fs";
import path from "path";
var { DatabaseI18nGenerator } = require_generate_i18n_database();
var MOCK_LANGUAGES = ["en", "nl", "fr", "de"];
var MOCK_TRANSLATIONS = {
  "common.save": {
    en: "Save",
    nl: "Opslaan",
    fr: "Enregistrer",
    de: "Speichern"
  },
  "common.cancel": {
    en: "Cancel",
    nl: "Annuleren",
    fr: "Annuler",
    de: "Abbrechen"
  },
  "common.loading": {
    en: "Loading...",
    nl: "Laden...",
    fr: "Chargement...",
    de: "Laden..."
  },
  "timer.start": {
    en: "Start Timer",
    nl: "Timer Starten",
    fr: "D\xE9marrer le minuteur",
    de: "Timer starten"
  },
  "timer.pause": {
    en: "Pause",
    nl: "Pauzeren",
    fr: "Pause",
    de: "Pausieren"
  },
  "timer.reset": {
    en: "Reset",
    nl: "Reset",
    fr: "R\xE9initialiser",
    de: "Zur\xFCcksetzen"
  },
  "admin.users": {
    en: "Users",
    nl: "Gebruikers",
    fr: "Utilisateurs",
    de: "Benutzer"
  },
  "admin.settings": {
    en: "Settings",
    nl: "Instellingen",
    fr: "Param\xE8tres",
    de: "Einstellungen"
  }
};
var APP_SECTION_CONFIG = {
  "yes-no": {
    excluded: ["admin", "deployment", "media", "content"]
  },
  "timer": {
    excluded: ["admin", "deployment", "media", "content"]
  },
  "radio": {
    excluded: ["admin", "deployment", "media", "content"]
  },
  "cards": {
    excluded: ["admin", "deployment", "media", "content"]
  },
  "todo": {
    excluded: ["admin", "deployment", "media", "content"]
  },
  "type": {
    excluded: ["admin", "deployment", "media", "content"]
  },
  "admin": {
    // Admin includes everything
    excluded: []
  },
  "marketing": {
    excluded: ["admin", "deployment"]
  },
  "ui-docs": {
    excluded: ["admin", "deployment", "media", "content"]
  }
};
function createNestedStructure(translations) {
  const result = {};
  for (const [key, value] of Object.entries(translations)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}
function generateTypeScriptContent(language, translations, app) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const appSuffix = app ? ` for app: ${app}` : "";
  return `/**
 * Generated translation file for ${language}${appSuffix}
 * 
 * Generated on: ${timestamp}
 * Source: Tiko translation database
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 * \u26A0\uFE0F  Changes will be overwritten on next generation
 * 
 * To update translations:
 * 1. Edit translations in the admin dashboard
 * 2. Run: pnpm run generate:i18n
 */

import type { Translations } from './types'

const translations: Translations = ${JSON.stringify(translations, null, 2)}

export default translations
export type { Translations } from './types'
`;
}
function generateInterfaces(keys) {
  const sampleTranslations = {};
  keys.forEach((key) => {
    sampleTranslations[key] = "string";
  });
  const nestedStructure = createNestedStructure(sampleTranslations);
  const interfaceContent = generateInterfaceContent(nestedStructure);
  return `/**
 * TypeScript interfaces for translation files
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

export interface Translations {
${interfaceContent}
}

// Helper type for strongly typed translation keys
export type TranslationKey = ${keys.map((key) => `'${key}'`).join(" | ")}

// Helper type for nested key access
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? \`\${Key}.\${NestedKeyOf<ObjectType[Key]>}\`
    : \`\${Key}\`
}[keyof ObjectType & (string | number)]

export type TranslationKeyPath = NestedKeyOf<Translations>
`;
}
function generateInterfaceContent(obj, indent = "  ") {
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      lines.push(`${indent}${key}: string`);
    } else {
      lines.push(`${indent}${key}: {`);
      lines.push(generateInterfaceContent(value, indent + "  "));
      lines.push(`${indent}}`);
    }
  }
  return lines.join("\n");
}
function generateIndexFile(languages) {
  return `/**
 * Generated translation index file
 * 
 * This file provides easy access to all generated translation files
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

// Import all language files
${languages.map(
    (lang) => `import ${lang.replace("-", "_")} from './${lang}'`
  ).join("\n")}

// Export language constants
export const AVAILABLE_LANGUAGES = ${JSON.stringify(languages, null, 2)} as const

export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number]

// Export all translations in a map
export const translations: Record<AvailableLanguage, Translations> = {
${languages.map((lang) => `  '${lang}': ${lang.replace("-", "_")}`).join(",\n")}
}

// Export individual languages
export {
${languages.map((lang) => `  ${lang.replace("-", "_")} as ${lang.replace("-", "_")}`).join(",\n")}
}

// Export types
export type { Translations, TranslationKey, TranslationKeyPath } from './types'

/**
 * Get translations for a specific language
 */
export function getTranslations(language: AvailableLanguage): Translations {
  return translations[language]
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is AvailableLanguage {
  return AVAILABLE_LANGUAGES.includes(language as AvailableLanguage)
}
`;
}
async function generateI18nFiles(options = {}) {
  try {
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      const generator = new DatabaseI18nGenerator({
        ...options,
        verbose: options.verbose !== false
      });
      await generator.generate();
      return;
    }
  } catch (error) {
    console.warn("\u274C Database generation failed, falling back to mock data:", error.message);
  }
  const baseOutputDir = path.join(process.cwd(), "packages/ui/src/i18n/generated");
  const languages = options.languages || MOCK_LANGUAGES;
  const allKeys = Object.keys(MOCK_TRANSLATIONS);
  let filteredKeys = allKeys;
  if (options.app && APP_SECTION_CONFIG[options.app]) {
    const config = APP_SECTION_CONFIG[options.app];
    if (config.excluded) {
      filteredKeys = allKeys.filter(
        (key) => !config.excluded.some((section) => key.startsWith(`${section}.`))
      );
    }
  }
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true });
  }
  for (const language of languages) {
    const filteredTranslations = {};
    for (const key of filteredKeys) {
      if (MOCK_TRANSLATIONS[key] && MOCK_TRANSLATIONS[key][language]) {
        filteredTranslations[key] = MOCK_TRANSLATIONS[key][language];
      }
    }
    const nestedTranslations = createNestedStructure(filteredTranslations);
    const content = generateTypeScriptContent(language, nestedTranslations, options.app);
    const outputPath = path.join(baseOutputDir, `${language}.ts`);
    fs.writeFileSync(outputPath, content, "utf-8");
  }
  const typesContent = generateInterfaces(filteredKeys);
  const typesPath = path.join(baseOutputDir, "types.ts");
  fs.writeFileSync(typesPath, typesContent, "utf-8");
  const indexContent = generateIndexFile(languages);
  const indexPath = path.join(baseOutputDir, "index.ts");
  fs.writeFileSync(indexPath, indexContent, "utf-8");
  const gitignorePath = path.join(baseOutputDir, ".gitignore");
  const gitignoreContent = `# Auto-generated translation files
# These files are generated from the database and should not be committed

*.ts
*.js
*.d.ts
!.gitignore

# Keep this directory but ignore all generated content
`;
  fs.writeFileSync(gitignorePath, gitignoreContent, "utf-8");
  if (options.verbose !== false) {
    console.log(`\u{1F30D} Generated i18n files for ${options.app || "app"} with ${filteredKeys.length} keys (using mock data)`);
  }
}
function i18nGeneration(options = {}) {
  let hasGenerated = false;
  return {
    name: "i18n-generation",
    async configResolved() {
      if (!hasGenerated) {
        try {
          await generateI18nFiles(options);
          hasGenerated = true;
        } catch (error) {
          console.warn("\u274C I18n generation failed:", error.message);
        }
      }
    }
  };
}
function createAppI18nPlugin(appNameOrOptions) {
  const options = typeof appNameOrOptions === "string" ? { app: appNameOrOptions, verbose: false } : { verbose: false, ...appNameOrOptions };
  return i18nGeneration(options);
}

// scripts/vite-plugin-i18n-worker.js
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/silvandiepen/Repositories/_tiko/tiko-mono/scripts/vite-plugin-i18n-worker.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname2 = path2.dirname(__filename);
var DEFAULT_CONFIG = {
  workerUrl: {
    development: "http://localhost:8787",
    production: "https://i18n-data.silvandiepen.workers.dev"
  },
  outputDir: "../packages/ui/src/i18n/generated",
  environment: "production",
  // Default to production for builds
  app: null
  // Optional app filter
};
function i18nWorkerPlugin(userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const outputDir = path2.resolve(__dirname2, config.outputDir);
  return {
    name: "i18n-worker",
    async buildStart() {
      console.log("\u{1F30D} [i18n-worker] Fetching translation data during build...");
      try {
        await generateTranslationsFromWorker(config, outputDir);
        console.log("\u2705 [i18n-worker] Translation files generated successfully");
      } catch (error) {
        console.warn("\u26A0\uFE0F [i18n-worker] Failed to fetch translations from worker:", error.message);
        console.warn("\u26A0\uFE0F [i18n-worker] Using existing translation files if available");
        if (!fs2.existsSync(path2.join(outputDir, "index.ts"))) {
          console.error("\u274C [i18n-worker] No existing translation files found. Build may fail.");
          throw new Error("Translation files are required but could not be generated or found");
        }
      }
    }
  };
}
async function generateTranslationsFromWorker(config, outputDir) {
  const workerUrl = config.workerUrl[config.environment] || config.workerUrl.production;
  const endpoint = config.app ? `/app/${config.app}` : "/all";
  const url = `${workerUrl}${endpoint}`;
  console.log(`\u{1F310} [i18n-worker] Fetching from: ${url}`);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Unknown error from worker");
  }
  console.log(`\u{1F4CA} [i18n-worker] Fetched ${result.metadata.totalKeys} keys, ${result.metadata.totalLanguages} languages`);
  const generatedContent = generateTypeScript(result.data);
  writeFiles(generatedContent, outputDir);
}
function generateTypeScript(translationData) {
  const { keys, languages, translations } = translationData;
  const keyStructure = createKeyStructure(keys.map((k) => k.key));
  const typeContent = generateTranslationTypes(keyStructure, keys);
  const languageFiles = {};
  for (const language of languages) {
    languageFiles[language.code] = generateLanguageFile(
      language.code,
      translations[language.code] || {},
      keys
    );
  }
  const indexContent = generateIndexFile2(languages, translationData);
  return {
    types: typeContent,
    languages: languageFiles,
    index: indexContent
  };
}
function createKeyStructure(keys) {
  const result = {};
  for (const key of keys) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    const lastPart = parts[parts.length - 1];
    current[lastPart] = key;
  }
  return result;
}
function generateTranslationTypes(structure, keys, level = 0) {
  const indent = "  ".repeat(level);
  let result = "";
  if (level === 0) {
    result += `/**
 * Generated translation types
 * 
 * This file provides TypeScript interfaces for all translation keys
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

// All available translation keys as union type
export type TranslationKey = ${keys.map((k) => `"${k.key}"`).join(" |\n  ")}

`;
    result += `// Nested key structure for auto-completion
export interface TranslationKeyPath {
`;
  }
  for (const [key, value] of Object.entries(structure)) {
    if (typeof value === "string") {
      result += `${indent}  "${key}": "${value}"
`;
    } else {
      result += `${indent}  "${key}": {
`;
      result += generateTranslationTypes(value, keys, level + 1);
      result += `${indent}  }
`;
    }
  }
  if (level === 0) {
    result += `}

`;
    result += `// Main translations interface
export interface Translations {
`;
    result += `  [key: string]: string
`;
    result += `}
`;
  }
  return result;
}
function generateLanguageFile(languageCode, translations, keys) {
  const translationEntries = keys.map((key) => {
    const value = translations[key.key] || "";
    const escapedValue = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    return `  "${key.key}": "${escapedValue}"`;
  }).join(",\n");
  return `/**
 * ${languageCode.toUpperCase()} translations
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

const ${languageCode}: Translations = {
${translationEntries}
}

export default ${languageCode}
`;
}
function generateIndexFile2(languages, translationData) {
  const imports = languages.map(
    (lang) => `import ${lang.code} from './${lang.code}'`
  ).join("\n");
  const languageCodes = languages.map((lang) => `"${lang.code}"`).join(",\n  ");
  const translationsMap = languages.map(
    (lang) => `  '${lang.code}': ${lang.code}`
  ).join(",\n");
  return `/**
 * Generated translation index file
 * 
 * This file provides easy access to all generated translation files
 * 
 * Generated on: ${(/* @__PURE__ */ new Date()).toISOString()}
 * 
 * \u26A0\uFE0F  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

// Import all language files
${imports}

// Export language constants
export const AVAILABLE_LANGUAGES = [
  ${languageCodes}
] as const

export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number]

// Export all translations in a map
export const translations: Record<AvailableLanguage, Translations> = {
${translationsMap}
}

// Export individual languages
export {
${languages.map((lang) => `  ${lang.code} as ${lang.code}`).join(",\n")}
}

// Export types
export type { Translations, TranslationKey, TranslationKeyPath } from './types'

/**
 * Get translations for a specific language
 */
export function getTranslations(language: AvailableLanguage): Translations {
  return translations[language]
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is AvailableLanguage {
  return AVAILABLE_LANGUAGES.includes(language as AvailableLanguage)
}
`;
}
function writeFiles(generatedContent, outputDir) {
  if (!fs2.existsSync(outputDir)) {
    fs2.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`\u{1F4DD} [i18n-worker] Writing TypeScript files to: ${outputDir}`);
  fs2.writeFileSync(path2.join(outputDir, "types.ts"), generatedContent.types);
  for (const [languageCode, content] of Object.entries(generatedContent.languages)) {
    fs2.writeFileSync(path2.join(outputDir, `${languageCode}.ts`), content);
  }
  fs2.writeFileSync(path2.join(outputDir, "index.ts"), generatedContent.index);
}

// vite.config.base.js
var __vite_injected_original_dirname = "/Users/silvandiepen/Repositories/_tiko/tiko-mono";
function createViteConfig(dirname, port = 3e3, pwaConfig2 = null, appName = null, i18nConfig = null) {
  let buildInfo = null;
  if (process.env.NODE_ENV === "production") {
    try {
      execSync(`node ${path3.resolve(__vite_injected_original_dirname, "scripts/inject-build-info.js")} ${dirname}`, {
        stdio: "inherit"
      });
      const buildInfoPath = path3.join(dirname, "public", "build-info.json");
      if (fs3.existsSync(buildInfoPath)) {
        buildInfo = JSON.parse(fs3.readFileSync(buildInfoPath, "utf8"));
      }
    } catch (error) {
      console.warn("Failed to inject build info:", error.message);
    }
  }
  const plugins = [vue()];
  if (appName) {
    const i18nOptions = {
      app: appName,
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      ...i18nConfig || {}
    };
    if (process.env.USE_I18N_WORKER === "true" || process.env.NODE_ENV === "production") {
      plugins.push(i18nWorkerPlugin(i18nOptions));
    } else {
      plugins.push(createAppI18nPlugin(i18nOptions));
    }
  }
  if (buildInfo) {
    plugins.push(viteBuildInfo(buildInfo));
  }
  if (pwaConfig2) {
    plugins.push(VitePWA(pwaConfig2));
  }
  return defineConfig({
    plugins,
    resolve: {
      alias: {
        "@": path3.resolve(dirname, "./src"),
        "@tiko/ui": path3.resolve(dirname, "../../packages/ui/src"),
        "@tiko/core": path3.resolve(dirname, "../../packages/core/src")
      }
    },
    server: {
      port,
      strictPort: false,
      open: false,
      cors: true,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "vue-vendor": ["vue", "vue-router", "pinia"],
            "tiko-vendor": ["@tiko/ui", "@tiko/core"]
          }
        }
      }
    },
    optimizeDeps: {
      include: ["vue", "vue-router", "pinia", "@tiko/ui", "@tiko/core", "open-icon"]
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }
  });
}

// apps/todo/vite.config.ts
var __vite_injected_original_dirname2 = "/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/todo";
var pwaConfig = {
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
  manifest: {
    name: "Todo - Tiko",
    short_name: "Todo",
    description: "Visual todo list app with groups and items",
    theme_color: "#3b82f6",
    background_color: "#ffffff",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  }
};
var vite_config_default = createViteConfig(__vite_injected_original_dirname2, 3007, pwaConfig);
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2NyaXB0cy9nZW5lcmF0ZS1pMThuLWRhdGFiYXNlLmpzIiwgInZpdGUuY29uZmlnLmJhc2UuanMiLCAic2NyaXB0cy92aXRlLXBsdWdpbi1idWlsZC1pbmZvLmpzIiwgInNjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi1zaW1wbGUuanMiLCAic2NyaXB0cy92aXRlLXBsdWdpbi1pMThuLXdvcmtlci5qcyIsICJhcHBzL3RvZG8vdml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHMvZ2VuZXJhdGUtaTE4bi1kYXRhYmFzZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0cy9nZW5lcmF0ZS1pMThuLWRhdGFiYXNlLmpzXCI7LyoqXG4gKiBEYXRhYmFzZS1jb25uZWN0ZWQgSTE4biBHZW5lcmF0b3JcbiAqIFxuICogR2VuZXJhdGVzIHN0YXRpYyBUeXBlU2NyaXB0IHRyYW5zbGF0aW9uIGZpbGVzIGZyb20gdGhlIGFjdHVhbCBTdXBhYmFzZSBkYXRhYmFzZS5cbiAqIFRoaXMgdmVyc2lvbiB3b3JrcyBpbiBOb2RlLmpzIGVudmlyb25tZW50IHVzaW5nIG5vZGUtZmV0Y2guXG4gKi9cblxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbi8vIENvbmZpZ3VyYXRpb24gZm9yIHNlY3Rpb24gZmlsdGVyaW5nIHBlciBhcHBcbmNvbnN0IEFQUF9TRUNUSU9OX0NPTkZJRyA9IHtcbiAgJ3llcy1ubyc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAndGltZXInOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ3JhZGlvJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICdjYXJkcyc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAndG9kbyc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAndHlwZSc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAnYWRtaW4nOiB7XG4gICAgLy8gQWRtaW4gaW5jbHVkZXMgZXZlcnl0aGluZ1xuICAgIGV4Y2x1ZGVkOiBbXVxuICB9LFxuICAnbWFya2V0aW5nJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnXVxuICB9LFxuICAndWktZG9jcyc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9XG59XG5cbmNsYXNzIERhdGFiYXNlSTE4bkdlbmVyYXRvciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICB0aGlzLmJhc2VPdXRwdXREaXIgPSBvcHRpb25zLm91dHB1dERpciB8fCBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3BhY2thZ2VzL3VpL3NyYy9pMThuL2dlbmVyYXRlZCcpXG4gICAgXG4gICAgLy8gR2V0IGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIHRoaXMuc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9VUkxcbiAgICB0aGlzLnN1cGFiYXNlS2V5ID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCBwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWVxuICAgIFxuICAgIGlmICghdGhpcy5zdXBhYmFzZVVybCB8fCAhdGhpcy5zdXBhYmFzZUtleSkge1xuICAgICAgY29uc29sZS53YXJuKCdcdTI2QTBcdUZFMEYgIE1pc3NpbmcgU3VwYWJhc2UgY29uZmlndXJhdGlvbi4gU2V0IFZJVEVfU1VQQUJBU0VfVVJMIGFuZCBWSVRFX1NVUEFCQVNFX0FOT05fS0VZIGVudmlyb25tZW50IHZhcmlhYmxlcy4nKVxuICAgICAgY29uc29sZS53YXJuKCdcdUQ4M0RcdURDQTEgRmFsbGluZyBiYWNrIHRvIG1vY2sgZGF0YSBnZW5lcmF0aW9uLi4uJylcbiAgICAgIHRocm93IG5ldyBFcnJvcignTk9fU1VQQUJBU0VfQ09ORklHJylcbiAgICB9XG4gICAgXG4gICAgdGhpcy5iYXNlVXJsID0gdGhpcy5zdXBhYmFzZVVybCArICcvcmVzdC92MSdcbiAgICBcbiAgICAvLyBJbXBvcnQgbm9kZS1mZXRjaCBkeW5hbWljYWxseSB0byBoYW5kbGUgYm90aCBDb21tb25KUyBhbmQgRVNNXG4gICAgdGhpcy5mZXRjaCA9IG51bGxcbiAgICB0aGlzLmluaXRpYWxpemVGZXRjaCgpXG4gIH1cbiAgXG4gIGFzeW5jIGluaXRpYWxpemVGZXRjaCgpIHtcbiAgICB0cnkge1xuICAgICAgLy8gVHJ5IHRvIHVzZSBnbG9iYWwgZmV0Y2ggKE5vZGUuanMgMTgrKVxuICAgICAgaWYgKHR5cGVvZiBmZXRjaCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5mZXRjaCA9IGZldGNoXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjayB0byBub2RlLWZldGNoXG4gICAgICAgIGNvbnN0IHsgZGVmYXVsdDogZmV0Y2ggfSA9IGF3YWl0IGltcG9ydCgnbm9kZS1mZXRjaCcpXG4gICAgICAgIHRoaXMuZmV0Y2ggPSBmZXRjaFxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBmZXRjaC4gUGxlYXNlIGluc3RhbGwgbm9kZS1mZXRjaDogbnBtIGluc3RhbGwgbm9kZS1mZXRjaCcpXG4gICAgICB0aHJvdyBlcnJvclxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG1ha2VSZXF1ZXN0KGVuZHBvaW50LCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAoIXRoaXMuZmV0Y2gpIHtcbiAgICAgIGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUZldGNoKClcbiAgICB9XG4gICAgXG4gICAgY29uc3QgdXJsID0gYCR7dGhpcy5iYXNlVXJsfSR7ZW5kcG9pbnR9YFxuICAgIFxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5mZXRjaCh1cmwsIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdhcGlrZXknOiB0aGlzLnN1cGFiYXNlS2V5LFxuICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHt0aGlzLnN1cGFiYXNlS2V5fWAsXG4gICAgICAgICdQcmVmZXInOiAncmV0dXJuPXJlcHJlc2VudGF0aW9uJyxcbiAgICAgICAgLi4ub3B0aW9ucy5oZWFkZXJzLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgICBjb25zb2xlLmVycm9yKGBTdXBhYmFzZSBBUEkgRXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3JUZXh0fWApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YClcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpXG4gIH1cblxuICBhc3luYyBnZXRBY3RpdmVMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3QoJy9pMThuX2xhbmd1YWdlcz9pc19hY3RpdmU9ZXEudHJ1ZSZvcmRlcj1uYW1lLmFzYycpXG4gIH1cblxuICBhc3luYyBnZXRUcmFuc2xhdGlvbktleXMoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFrZVJlcXVlc3QoJy9pMThuX2tleXM/b3JkZXI9a2V5LmFzYycpXG4gIH1cblxuICBhc3luYyBnZXRUcmFuc2xhdGlvbnNGb3JMYW5ndWFnZShsYW5ndWFnZUNvZGUpIHtcbiAgICB0aGlzLmxvZyhgRmV0Y2hpbmcgdHJhbnNsYXRpb25zIGZvciBsYW5ndWFnZTogJHtsYW5ndWFnZUNvZGV9YClcbiAgICBcbiAgICBsZXQgcXVlcnkgPSBgL2kxOG5fdHJhbnNsYXRpb25zP3NlbGVjdD1pMThuX2tleXMoa2V5KSx2YWx1ZSxsYW5ndWFnZV9jb2RlJmlzX3B1Ymxpc2hlZD1lcS50cnVlYFxuICAgIFxuICAgIC8vIElmIGxvY2FsZSBoYXMgYSByZWdpb24sIGZldGNoIGJvdGggYmFzZSBhbmQgc3BlY2lmaWMgaW4gb25lIHF1ZXJ5XG4gICAgaWYgKGxhbmd1YWdlQ29kZS5pbmNsdWRlcygnLScpKSB7XG4gICAgICBjb25zdCBiYXNlTG9jYWxlID0gbGFuZ3VhZ2VDb2RlLnNwbGl0KCctJylbMF1cbiAgICAgIHF1ZXJ5ICs9IGAmbGFuZ3VhZ2VfY29kZT1pbi4oJHtiYXNlTG9jYWxlfSwke2xhbmd1YWdlQ29kZX0pYFxuICAgIH0gZWxzZSB7XG4gICAgICBxdWVyeSArPSBgJmxhbmd1YWdlX2NvZGU9ZXEuJHtsYW5ndWFnZUNvZGV9YFxuICAgIH1cbiAgICBcbiAgICBjb25zdCB0cmFuc2xhdGlvbnMgPSBhd2FpdCB0aGlzLm1ha2VSZXF1ZXN0KHF1ZXJ5KVxuICAgIFxuICAgIC8vIFByb2Nlc3MgdHJhbnNsYXRpb25zLCBtZXJnaW5nIGJhc2UgYW5kIHNwZWNpZmljIGxvY2FsZXNcbiAgICBjb25zdCB0cmFuc2xhdGlvbnNCeUtleSA9IHt9XG4gICAgY29uc3QgYmFzZUxvY2FsZSA9IGxhbmd1YWdlQ29kZS5pbmNsdWRlcygnLScpID8gbGFuZ3VhZ2VDb2RlLnNwbGl0KCctJylbMF0gOiBudWxsXG4gICAgXG4gICAgZm9yIChjb25zdCB0cmFuc2xhdGlvbiBvZiB0cmFuc2xhdGlvbnMpIHtcbiAgICAgIGlmICh0cmFuc2xhdGlvbi5pMThuX2tleXMgJiYgdHJhbnNsYXRpb24uaTE4bl9rZXlzLmtleSkge1xuICAgICAgICBjb25zdCBrZXkgPSB0cmFuc2xhdGlvbi5pMThuX2tleXMua2V5XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRyYW5zbGF0aW9uc0J5S2V5W2tleV0pIHtcbiAgICAgICAgICB0cmFuc2xhdGlvbnNCeUtleVtrZXldID0ge31cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRyYW5zbGF0aW9uLmxhbmd1YWdlX2NvZGUgPT09IGJhc2VMb2NhbGUpIHtcbiAgICAgICAgICB0cmFuc2xhdGlvbnNCeUtleVtrZXldLmJhc2UgPSB0cmFuc2xhdGlvbi52YWx1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyYW5zbGF0aW9uc0J5S2V5W2tleV0uc3BlY2lmaWMgPSB0cmFuc2xhdGlvbi52YWx1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIE1lcmdlIHRyYW5zbGF0aW9uczogc3BlY2lmaWMgbG9jYWxlIG92ZXJyaWRlcyBiYXNlXG4gICAgY29uc3QgbWVyZ2VkVHJhbnNsYXRpb25zID0ge31cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlc10gb2YgT2JqZWN0LmVudHJpZXModHJhbnNsYXRpb25zQnlLZXkpKSB7XG4gICAgICBtZXJnZWRUcmFuc2xhdGlvbnNba2V5XSA9IHZhbHVlcy5zcGVjaWZpYyB8fCB2YWx1ZXMuYmFzZSB8fCAnJ1xuICAgIH1cbiAgICBcbiAgICB0aGlzLmxvZyhgUHJvY2Vzc2VkICR7T2JqZWN0LmtleXMobWVyZ2VkVHJhbnNsYXRpb25zKS5sZW5ndGh9IHRyYW5zbGF0aW9ucyBmb3IgJHtsYW5ndWFnZUNvZGV9YClcbiAgICByZXR1cm4gbWVyZ2VkVHJhbnNsYXRpb25zXG4gIH1cblxuICBhc3luYyBnZW5lcmF0ZSgpIHtcbiAgICB0aGlzLmxvZygnXHVEODNDXHVERjBEIFN0YXJ0aW5nIGRhdGFiYXNlIGkxOG4gZ2VuZXJhdGlvbi4uLicpXG5cbiAgICB0cnkge1xuICAgICAgLy8gR2V0IGF2YWlsYWJsZSBsYW5ndWFnZXNcbiAgICAgIGNvbnN0IGxhbmd1YWdlcyA9IGF3YWl0IHRoaXMuZ2V0VGFyZ2V0TGFuZ3VhZ2VzKClcbiAgICAgIHRoaXMubG9nKGBcdUQ4M0RcdURDQ0IgVGFyZ2V0IGxhbmd1YWdlczogJHtsYW5ndWFnZXMuam9pbignLCAnKX1gKVxuXG4gICAgICAvLyBHZXQgdHJhbnNsYXRpb24ga2V5cyAoZmlsdGVyZWQgYnkgYXBwIGlmIHNwZWNpZmllZClcbiAgICAgIGNvbnN0IGFsbEtleXMgPSBhd2FpdCB0aGlzLmdldEZpbHRlcmVkS2V5cygpXG4gICAgICB0aGlzLmxvZyhgXHVEODNEXHVERDExIFByb2Nlc3NpbmcgJHthbGxLZXlzLmxlbmd0aH0gdHJhbnNsYXRpb24ga2V5c2ApXG5cbiAgICAgIC8vIEVuc3VyZSBvdXRwdXQgZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgdGhpcy5lbnN1cmVPdXRwdXREaXJlY3RvcnkoKVxuXG4gICAgICAvLyBHZW5lcmF0ZSBmaWxlcyBmb3IgZWFjaCBsYW5ndWFnZVxuICAgICAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiBsYW5ndWFnZXMpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUxhbmd1YWdlRmlsZShsYW5ndWFnZSwgYWxsS2V5cylcbiAgICAgIH1cblxuICAgICAgLy8gR2VuZXJhdGUgVHlwZVNjcmlwdCBpbnRlcmZhY2VzXG4gICAgICB0aGlzLmdlbmVyYXRlSW50ZXJmYWNlcyhhbGxLZXlzKVxuXG4gICAgICAvLyBHZW5lcmF0ZSBpbmRleCBmaWxlXG4gICAgICB0aGlzLmdlbmVyYXRlSW5kZXhGaWxlKGxhbmd1YWdlcylcblxuICAgICAgLy8gR2VuZXJhdGUgYXBwLXNwZWNpZmljIGV4cG9ydCAoaWYgYnVpbGRpbmcgZm9yIHNwZWNpZmljIGFwcClcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXBwKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdGVBcHBFeHBvcnQodGhpcy5vcHRpb25zLmFwcCwgbGFuZ3VhZ2VzKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmxvZygnXHUyNzA1IERhdGFiYXNlIGkxOG4gZ2VuZXJhdGlvbiBjb21wbGV0ZSEnKVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBHZW5lcmF0aW9uIGZhaWxlZDonLCBlcnJvcilcbiAgICAgIHByb2Nlc3MuZXhpdCgxKVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldFRhcmdldExhbmd1YWdlcygpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmxhbmd1YWdlcykge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5sYW5ndWFnZXNcbiAgICB9XG4gICAgXG4gICAgY29uc3QgYWN0aXZlTGFuZ3VhZ2VzID0gYXdhaXQgdGhpcy5nZXRBY3RpdmVMYW5ndWFnZXMoKVxuICAgIHJldHVybiBhY3RpdmVMYW5ndWFnZXMubWFwKGxhbmcgPT4gbGFuZy5jb2RlKVxuICB9XG5cbiAgYXN5bmMgZ2V0RmlsdGVyZWRLZXlzKCkge1xuICAgIGNvbnN0IGFsbEtleXMgPSBhd2FpdCB0aGlzLmdldFRyYW5zbGF0aW9uS2V5cygpXG4gICAgY29uc3Qga2V5U3RyaW5ncyA9IGFsbEtleXMubWFwKGtleSA9PiBrZXkua2V5KVxuXG4gICAgLy8gVXNlIG9wdGlvbnMtYmFzZWQgZmlsdGVyaW5nIGZpcnN0LCB0aGVuIGZhbGxiYWNrIHRvIGhhcmRjb2RlZCBjb25maWdcbiAgICBsZXQgaW5jbHVkZVNlY3Rpb25zID0gdGhpcy5vcHRpb25zLmluY2x1ZGVTZWN0aW9uc1xuICAgIGxldCBleGNsdWRlU2VjdGlvbnMgPSB0aGlzLm9wdGlvbnMuZXhjbHVkZVNlY3Rpb25zXG5cbiAgICAvLyBJZiBubyBkaXJlY3Qgb3B0aW9ucyBhbmQgd2UgaGF2ZSBhbiBhcHAgbmFtZSwgY2hlY2sgaGFyZGNvZGVkIGNvbmZpZ1xuICAgIGlmICghaW5jbHVkZVNlY3Rpb25zICYmICFleGNsdWRlU2VjdGlvbnMgJiYgdGhpcy5vcHRpb25zLmFwcCkge1xuICAgICAgY29uc3QgY29uZmlnID0gQVBQX1NFQ1RJT05fQ09ORklHW3RoaXMub3B0aW9ucy5hcHBdXG4gICAgICBpZiAoY29uZmlnKSB7XG4gICAgICAgIGluY2x1ZGVTZWN0aW9ucyA9IGNvbmZpZy5pbmNsdWRlZFxuICAgICAgICBleGNsdWRlU2VjdGlvbnMgPSBjb25maWcuZXhjbHVkZWRcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBubyBmaWx0ZXJpbmcgb3B0aW9ucyBhdCBhbGwsIHJldHVybiBhbGwga2V5c1xuICAgIGlmICghaW5jbHVkZVNlY3Rpb25zICYmICFleGNsdWRlU2VjdGlvbnMpIHtcbiAgICAgIHRoaXMubG9nKGBcdUQ4M0RcdURDRTYgTm8gc2VjdGlvbiBmaWx0ZXJpbmcgLSBpbmNsdWRpbmcgYWxsICR7a2V5U3RyaW5ncy5sZW5ndGh9IGtleXNgKVxuICAgICAgcmV0dXJuIGtleVN0cmluZ3NcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXIga2V5cyBiYXNlZCBvbiBjb25maWd1cmF0aW9uXG4gICAgbGV0IGZpbHRlcmVkS2V5cyA9IGtleVN0cmluZ3NcblxuICAgIGlmIChpbmNsdWRlU2VjdGlvbnMpIHtcbiAgICAgIC8vIE9ubHkgaW5jbHVkZSBzcGVjaWZpZWQgc2VjdGlvbnNcbiAgICAgIGZpbHRlcmVkS2V5cyA9IGtleVN0cmluZ3MuZmlsdGVyKGtleSA9PiBcbiAgICAgICAgaW5jbHVkZVNlY3Rpb25zLnNvbWUoc2VjdGlvbiA9PiBrZXkuc3RhcnRzV2l0aChgJHtzZWN0aW9ufS5gKSlcbiAgICAgIClcbiAgICAgIHRoaXMubG9nKGBcdUQ4M0RcdURDRTYgSW5jbHVkaW5nIHNlY3Rpb25zOiAke2luY2x1ZGVTZWN0aW9ucy5qb2luKCcsICcpfWApXG4gICAgfVxuXG4gICAgaWYgKGV4Y2x1ZGVTZWN0aW9ucykge1xuICAgICAgLy8gRXhjbHVkZSBzcGVjaWZpZWQgc2VjdGlvbnNcbiAgICAgIGZpbHRlcmVkS2V5cyA9IGZpbHRlcmVkS2V5cy5maWx0ZXIoa2V5ID0+IFxuICAgICAgICAhZXhjbHVkZVNlY3Rpb25zLnNvbWUoc2VjdGlvbiA9PiBrZXkuc3RhcnRzV2l0aChgJHtzZWN0aW9ufS5gKSlcbiAgICAgIClcbiAgICAgIHRoaXMubG9nKGBcdUQ4M0RcdURFQUIgRXhjbHVkaW5nIHNlY3Rpb25zOiAke2V4Y2x1ZGVTZWN0aW9ucy5qb2luKCcsICcpfWApXG4gICAgfVxuXG4gICAgY29uc3QgYXBwTmFtZSA9IHRoaXMub3B0aW9ucy5hcHAgfHwgJ2N1cnJlbnQgYXBwJ1xuICAgIHRoaXMubG9nKGBcdUQ4M0NcdURGQUYgRmlsdGVyZWQgJHtrZXlTdHJpbmdzLmxlbmd0aH0gXHUyMTkyICR7ZmlsdGVyZWRLZXlzLmxlbmd0aH0ga2V5cyBmb3IgJHthcHBOYW1lfWApXG4gICAgcmV0dXJuIGZpbHRlcmVkS2V5c1xuICB9XG5cbiAgYXN5bmMgZ2VuZXJhdGVMYW5ndWFnZUZpbGUobGFuZ3VhZ2UsIGtleXMpIHtcbiAgICB0aGlzLmxvZyhgXHVEODNEXHVEQ0REIEdlbmVyYXRpbmcgJHtsYW5ndWFnZX0udHMuLi5gKVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEdldCB0cmFuc2xhdGlvbnMgZm9yIHRoaXMgbGFuZ3VhZ2VcbiAgICAgIGNvbnN0IGFsbFRyYW5zbGF0aW9ucyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UobGFuZ3VhZ2UpXG4gICAgICBcbiAgICAgIC8vIEZpbHRlciB0byBvbmx5IGluY2x1ZGUgb3VyIHRhcmdldCBrZXlzXG4gICAgICBjb25zdCBmaWx0ZXJlZFRyYW5zbGF0aW9ucyA9IHt9XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgIGlmIChhbGxUcmFuc2xhdGlvbnNba2V5XSkge1xuICAgICAgICAgIGZpbHRlcmVkVHJhbnNsYXRpb25zW2tleV0gPSBhbGxUcmFuc2xhdGlvbnNba2V5XVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENvbnZlcnQgZmxhdCB0cmFuc2xhdGlvbnMgdG8gbmVzdGVkIHN0cnVjdHVyZVxuICAgICAgY29uc3QgbmVzdGVkVHJhbnNsYXRpb25zID0gdGhpcy5jcmVhdGVOZXN0ZWRTdHJ1Y3R1cmUoZmlsdGVyZWRUcmFuc2xhdGlvbnMpXG5cbiAgICAgIC8vIEdlbmVyYXRlIFR5cGVTY3JpcHQgY29udGVudFxuICAgICAgY29uc3QgY29udGVudCA9IHRoaXMuZ2VuZXJhdGVUeXBlU2NyaXB0Q29udGVudChsYW5ndWFnZSwgbmVzdGVkVHJhbnNsYXRpb25zKVxuXG4gICAgICAvLyBXcml0ZSBmaWxlXG4gICAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKHRoaXMuYmFzZU91dHB1dERpciwgYCR7bGFuZ3VhZ2V9LnRzYClcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGF0aCwgY29udGVudCwgJ3V0Zi04JylcblxuICAgICAgdGhpcy5sb2coYFx1MjcwNSBHZW5lcmF0ZWQgJHtsYW5ndWFnZX0udHMgKCR7T2JqZWN0LmtleXMoZmlsdGVyZWRUcmFuc2xhdGlvbnMpLmxlbmd0aH0ga2V5cylgKVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFx1Mjc0QyBGYWlsZWQgdG8gZ2VuZXJhdGUgJHtsYW5ndWFnZX0udHM6YCwgZXJyb3IpXG4gICAgICB0aHJvdyBlcnJvclxuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZU5lc3RlZFN0cnVjdHVyZSh0cmFuc2xhdGlvbnMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fVxuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModHJhbnNsYXRpb25zKSkge1xuICAgICAgY29uc3QgcGFydHMgPSBrZXkuc3BsaXQoJy4nKVxuICAgICAgbGV0IGN1cnJlbnQgPSByZXN1bHRcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldXG4gICAgICAgIGlmICghY3VycmVudFtwYXJ0XSkge1xuICAgICAgICAgIGN1cnJlbnRbcGFydF0gPSB7fVxuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdXG4gICAgICB9XG5cbiAgICAgIGN1cnJlbnRbcGFydHNbcGFydHMubGVuZ3RoIC0gMV1dID0gdmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICBnZW5lcmF0ZVR5cGVTY3JpcHRDb250ZW50KGxhbmd1YWdlLCB0cmFuc2xhdGlvbnMpIHtcbiAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICBjb25zdCBhcHAgPSB0aGlzLm9wdGlvbnMuYXBwID8gYCBmb3IgYXBwOiAke3RoaXMub3B0aW9ucy5hcHB9YCA6ICcnXG4gICAgXG4gICAgcmV0dXJuIGAvKipcbiAqIEdlbmVyYXRlZCB0cmFuc2xhdGlvbiBmaWxlIGZvciAke2xhbmd1YWdlfSR7YXBwfVxuICogXG4gKiBHZW5lcmF0ZWQgb246ICR7dGltZXN0YW1wfVxuICogU291cmNlOiBUaWtvIHRyYW5zbGF0aW9uIGRhdGFiYXNlXG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqIFx1MjZBMFx1RkUwRiAgQ2hhbmdlcyB3aWxsIGJlIG92ZXJ3cml0dGVuIG9uIG5leHQgZ2VuZXJhdGlvblxuICogXG4gKiBUbyB1cGRhdGUgdHJhbnNsYXRpb25zOlxuICogMS4gRWRpdCB0cmFuc2xhdGlvbnMgaW4gdGhlIGFkbWluIGRhc2hib2FyZFxuICogMi4gUnVuOiBwbnBtIHJ1biBnZW5lcmF0ZTppMThuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL3R5cGVzJ1xuXG5jb25zdCB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9ucyA9ICR7SlNPTi5zdHJpbmdpZnkodHJhbnNsYXRpb25zLCBudWxsLCAyKX1cblxuZXhwb3J0IGRlZmF1bHQgdHJhbnNsYXRpb25zXG5leHBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5gXG4gIH1cblxuICBnZW5lcmF0ZUludGVyZmFjZXMoa2V5cykge1xuICAgIHRoaXMubG9nKCdcdUQ4M0RcdUREMjcgR2VuZXJhdGluZyBUeXBlU2NyaXB0IGludGVyZmFjZXMuLi4nKVxuXG4gICAgLy8gQ3JlYXRlIGEgc2FtcGxlIG5lc3RlZCBzdHJ1Y3R1cmUgdG8gZGVyaXZlIHR5cGVzXG4gICAgY29uc3Qgc2FtcGxlVHJhbnNsYXRpb25zID0ge31cbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgc2FtcGxlVHJhbnNsYXRpb25zW2tleV0gPSAnc3RyaW5nJ1xuICAgIH0pXG5cbiAgICBjb25zdCBuZXN0ZWRTdHJ1Y3R1cmUgPSB0aGlzLmNyZWF0ZU5lc3RlZFN0cnVjdHVyZShzYW1wbGVUcmFuc2xhdGlvbnMpXG4gICAgY29uc3QgaW50ZXJmYWNlQ29udGVudCA9IHRoaXMuZ2VuZXJhdGVJbnRlcmZhY2VDb250ZW50KG5lc3RlZFN0cnVjdHVyZSlcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBgLyoqXG4gKiBUeXBlU2NyaXB0IGludGVyZmFjZXMgZm9yIHRyYW5zbGF0aW9uIGZpbGVzXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zbGF0aW9ucyB7XG4ke2ludGVyZmFjZUNvbnRlbnR9XG59XG5cbi8vIEhlbHBlciB0eXBlIGZvciBzdHJvbmdseSB0eXBlZCB0cmFuc2xhdGlvbiBrZXlzXG5leHBvcnQgdHlwZSBUcmFuc2xhdGlvbktleSA9ICR7a2V5cy5tYXAoa2V5ID0+IGAnJHtrZXl9J2ApLmpvaW4oJyB8ICcpfVxuXG4vLyBIZWxwZXIgdHlwZSBmb3IgbmVzdGVkIGtleSBhY2Nlc3NcbmV4cG9ydCB0eXBlIE5lc3RlZEtleU9mPE9iamVjdFR5cGUgZXh0ZW5kcyBvYmplY3Q+ID0ge1xuICBbS2V5IGluIGtleW9mIE9iamVjdFR5cGUgJiAoc3RyaW5nIHwgbnVtYmVyKV06IE9iamVjdFR5cGVbS2V5XSBleHRlbmRzIG9iamVjdFxuICAgID8gXFxgXFwke0tleX0uXFwke05lc3RlZEtleU9mPE9iamVjdFR5cGVbS2V5XT59XFxgXG4gICAgOiBcXGBcXCR7S2V5fVxcYFxufVtrZXlvZiBPYmplY3RUeXBlICYgKHN0cmluZyB8IG51bWJlcildXG5cbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uS2V5UGF0aCA9IE5lc3RlZEtleU9mPFRyYW5zbGF0aW9ucz5cbmBcblxuICAgIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4odGhpcy5iYXNlT3V0cHV0RGlyLCAndHlwZXMudHMnKVxuICAgIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGF0aCwgY29udGVudCwgJ3V0Zi04JylcblxuICAgIHRoaXMubG9nKCdcdTI3MDUgR2VuZXJhdGVkIHR5cGVzLnRzJylcbiAgfVxuXG4gIGdlbmVyYXRlSW50ZXJmYWNlQ29udGVudChvYmosIGluZGVudCA9ICcgICcpIHtcbiAgICBjb25zdCBsaW5lcyA9IFtdXG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvYmopKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBsaW5lcy5wdXNoKGAke2luZGVudH0ke2tleX06IHN0cmluZ2ApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaW5lcy5wdXNoKGAke2luZGVudH0ke2tleX06IHtgKVxuICAgICAgICBsaW5lcy5wdXNoKHRoaXMuZ2VuZXJhdGVJbnRlcmZhY2VDb250ZW50KHZhbHVlLCBpbmRlbnQgKyAnICAnKSlcbiAgICAgICAgbGluZXMucHVzaChgJHtpbmRlbnR9fWApXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpXG4gIH1cblxuICBnZW5lcmF0ZUluZGV4RmlsZShsYW5ndWFnZXMpIHtcbiAgICB0aGlzLmxvZygnXHVEODNEXHVEQ0M3IEdlbmVyYXRpbmcgaW5kZXgudHMuLi4nKVxuXG4gICAgY29uc3QgY29udGVudCA9IGAvKipcbiAqIEdlbmVyYXRlZCB0cmFuc2xhdGlvbiBpbmRleCBmaWxlXG4gKiBcbiAqIFRoaXMgZmlsZSBwcm92aWRlcyBlYXN5IGFjY2VzcyB0byBhbGwgZ2VuZXJhdGVkIHRyYW5zbGF0aW9uIGZpbGVzXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5cbi8vIEltcG9ydCBhbGwgbGFuZ3VhZ2UgZmlsZXNcbiR7bGFuZ3VhZ2VzLm1hcCgobGFuZykgPT4gXG4gIGBpbXBvcnQgJHtsYW5nLnJlcGxhY2UoJy0nLCAnXycpfSBmcm9tICcuLyR7bGFuZ30nYFxuKS5qb2luKCdcXG4nKX1cblxuLy8gRXhwb3J0IGxhbmd1YWdlIGNvbnN0YW50c1xuZXhwb3J0IGNvbnN0IEFWQUlMQUJMRV9MQU5HVUFHRVMgPSAke0pTT04uc3RyaW5naWZ5KGxhbmd1YWdlcywgbnVsbCwgMil9IGFzIGNvbnN0XG5cbmV4cG9ydCB0eXBlIEF2YWlsYWJsZUxhbmd1YWdlID0gdHlwZW9mIEFWQUlMQUJMRV9MQU5HVUFHRVNbbnVtYmVyXVxuXG4vLyBFeHBvcnQgYWxsIHRyYW5zbGF0aW9ucyBpbiBhIG1hcFxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9uczogUmVjb3JkPEF2YWlsYWJsZUxhbmd1YWdlLCBUcmFuc2xhdGlvbnM+ID0ge1xuJHtsYW5ndWFnZXMubWFwKChsYW5nKSA9PiBgICAnJHtsYW5nfSc6ICR7bGFuZy5yZXBsYWNlKCctJywgJ18nKX1gKS5qb2luKCcsXFxuJyl9XG59XG5cbi8vIEV4cG9ydCBpbmRpdmlkdWFsIGxhbmd1YWdlc1xuZXhwb3J0IHtcbiR7bGFuZ3VhZ2VzLm1hcCgobGFuZykgPT4gYCAgJHtsYW5nLnJlcGxhY2UoJy0nLCAnXycpfSBhcyAke2xhbmcucmVwbGFjZSgnLScsICdfJyl9YCkuam9pbignLFxcbicpfVxufVxuXG4vLyBFeHBvcnQgdHlwZXNcbmV4cG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zLCBUcmFuc2xhdGlvbktleSwgVHJhbnNsYXRpb25LZXlQYXRoIH0gZnJvbSAnLi90eXBlcydcblxuLyoqXG4gKiBHZXQgdHJhbnNsYXRpb25zIGZvciBhIHNwZWNpZmljIGxhbmd1YWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbnMobGFuZ3VhZ2U6IEF2YWlsYWJsZUxhbmd1YWdlKTogVHJhbnNsYXRpb25zIHtcbiAgcmV0dXJuIHRyYW5zbGF0aW9uc1tsYW5ndWFnZV1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGxhbmd1YWdlIGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMYW5ndWFnZVN1cHBvcnRlZChsYW5ndWFnZTogc3RyaW5nKTogbGFuZ3VhZ2UgaXMgQXZhaWxhYmxlTGFuZ3VhZ2Uge1xuICByZXR1cm4gQVZBSUxBQkxFX0xBTkdVQUdFUy5pbmNsdWRlcyhsYW5ndWFnZSBhcyBBdmFpbGFibGVMYW5ndWFnZSlcbn1cbmBcblxuICAgIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4odGhpcy5iYXNlT3V0cHV0RGlyLCAnaW5kZXgudHMnKVxuICAgIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGF0aCwgY29udGVudCwgJ3V0Zi04JylcblxuICAgIHRoaXMubG9nKCdcdTI3MDUgR2VuZXJhdGVkIGluZGV4LnRzJylcbiAgfVxuXG4gIGdlbmVyYXRlQXBwRXhwb3J0KGFwcCwgbGFuZ3VhZ2VzKSB7XG4gICAgdGhpcy5sb2coYFx1RDgzRFx1RENGMSBHZW5lcmF0aW5nIGFwcCBleHBvcnQgZm9yICR7YXBwfS4uLmApXG5cbiAgICBjb25zdCBjb250ZW50ID0gYC8qKlxuICogQXBwLXNwZWNpZmljIHRyYW5zbGF0aW9ucyBleHBvcnQgZm9yICR7YXBwfVxuICogXG4gKiBUaGlzIGZpbGUgaXMgb3B0aW1pemVkIGZvciB0aGUgJHthcHB9IGFwcCBhbmQgb25seSBjb250YWluc1xuICogcmVsZXZhbnQgdHJhbnNsYXRpb24gc2VjdGlvbnMuXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG5leHBvcnQgeyBcbiAgdHJhbnNsYXRpb25zLFxuICBnZXRUcmFuc2xhdGlvbnMsXG4gIGlzTGFuZ3VhZ2VTdXBwb3J0ZWQsXG4gIEFWQUlMQUJMRV9MQU5HVUFHRVNcbn0gZnJvbSAnLi9pbmRleCdcblxuZXhwb3J0IHR5cGUgeyBcbiAgVHJhbnNsYXRpb25zLCBcbiAgVHJhbnNsYXRpb25LZXksIFxuICBUcmFuc2xhdGlvbktleVBhdGgsXG4gIEF2YWlsYWJsZUxhbmd1YWdlIFxufSBmcm9tICcuL2luZGV4J1xuXG4vLyBBcHAtc3BlY2lmaWMgcmUtZXhwb3J0cyBmb3IgY29udmVuaWVuY2VcbmV4cG9ydCBjb25zdCBBUFBfTkFNRSA9ICcke2FwcH0nXG5leHBvcnQgY29uc3QgQVBQX1RSQU5TTEFUSU9OUyA9IHRyYW5zbGF0aW9uc1xuYFxuXG4gICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbih0aGlzLmJhc2VPdXRwdXREaXIsIGAke2FwcH0udHNgKVxuICAgIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGF0aCwgY29udGVudCwgJ3V0Zi04JylcblxuICAgIHRoaXMubG9nKGBcdTI3MDUgR2VuZXJhdGVkICR7YXBwfS50c2ApXG4gIH1cblxuICBlbnN1cmVPdXRwdXREaXJlY3RvcnkoKSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHRoaXMuYmFzZU91dHB1dERpcikpIHtcbiAgICAgIGZzLm1rZGlyU3luYyh0aGlzLmJhc2VPdXRwdXREaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgICB0aGlzLmxvZyhgXHVEODNEXHVEQ0MxIENyZWF0ZWQgb3V0cHV0IGRpcmVjdG9yeTogJHt0aGlzLmJhc2VPdXRwdXREaXJ9YClcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgLmdpdGlnbm9yZSB0byBleGNsdWRlIGdlbmVyYXRlZCBmaWxlc1xuICAgIGNvbnN0IGdpdGlnbm9yZVBhdGggPSBwYXRoLmpvaW4odGhpcy5iYXNlT3V0cHV0RGlyLCAnLmdpdGlnbm9yZScpXG4gICAgY29uc3QgZ2l0aWdub3JlQ29udGVudCA9IGAjIEF1dG8tZ2VuZXJhdGVkIHRyYW5zbGF0aW9uIGZpbGVzXG4jIFRoZXNlIGZpbGVzIGFyZSBnZW5lcmF0ZWQgZnJvbSB0aGUgZGF0YWJhc2UgYW5kIHNob3VsZCBub3QgYmUgY29tbWl0dGVkXG5cbioudHNcbiouanNcbiouZC50c1xuIS5naXRpZ25vcmVcblxuIyBLZWVwIHRoaXMgZGlyZWN0b3J5IGJ1dCBpZ25vcmUgYWxsIGdlbmVyYXRlZCBjb250ZW50XG5gXG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKGdpdGlnbm9yZVBhdGgsIGdpdGlnbm9yZUNvbnRlbnQsICd1dGYtOCcpXG4gIH1cblxuICBsb2cobWVzc2FnZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMudmVyYm9zZSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpXG4gICAgfVxuICB9XG59XG5cbi8vIENMSSBhcmd1bWVudCBwYXJzaW5nXG5mdW5jdGlvbiBwYXJzZUFyZ3MoKSB7XG4gIGNvbnN0IGFyZ3MgPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMilcbiAgY29uc3Qgb3B0aW9ucyA9IHt9XG5cbiAgZm9yIChjb25zdCBhcmcgb2YgYXJncykge1xuICAgIGlmIChhcmcuc3RhcnRzV2l0aCgnLS1hcHA9JykpIHtcbiAgICAgIG9wdGlvbnMuYXBwID0gYXJnLnNwbGl0KCc9JylbMV1cbiAgICB9IGVsc2UgaWYgKGFyZy5zdGFydHNXaXRoKCctLWxhbmd1YWdlcz0nKSkge1xuICAgICAgb3B0aW9ucy5sYW5ndWFnZXMgPSBhcmcuc3BsaXQoJz0nKVsxXS5zcGxpdCgnLCcpXG4gICAgfSBlbHNlIGlmIChhcmcuc3RhcnRzV2l0aCgnLS1vdXRwdXQ9JykpIHtcbiAgICAgIG9wdGlvbnMub3V0cHV0RGlyID0gYXJnLnNwbGl0KCc9JylbMV1cbiAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJy0tcHJvZHVjdGlvbicpIHtcbiAgICAgIG9wdGlvbnMucHJvZHVjdGlvbiA9IHRydWVcbiAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJy0tdmVyYm9zZScpIHtcbiAgICAgIG9wdGlvbnMudmVyYm9zZSA9IHRydWVcbiAgICB9IGVsc2UgaWYgKGFyZyA9PT0gJy0tcXVpZXQnKSB7XG4gICAgICBvcHRpb25zLnZlcmJvc2UgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvcHRpb25zXG59XG5cbi8vIE1haW4gZXhlY3V0aW9uXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBvcHRpb25zID0gcGFyc2VBcmdzKClcbiAgY29uc3QgZ2VuZXJhdG9yID0gbmV3IERhdGFiYXNlSTE4bkdlbmVyYXRvcihvcHRpb25zKVxuICBhd2FpdCBnZW5lcmF0b3IuZ2VuZXJhdGUoKVxufVxuXG4vLyBSdW4gaWYgY2FsbGVkIGRpcmVjdGx5XG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgbWFpbigpLmNhdGNoKGVycm9yID0+IHtcbiAgICBjb25zb2xlLmVycm9yKCdHZW5lcmF0aW9uIGZhaWxlZDonLCBlcnJvcilcbiAgICBwcm9jZXNzLmV4aXQoMSlcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IERhdGFiYXNlSTE4bkdlbmVyYXRvciB9IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby92aXRlLmNvbmZpZy5iYXNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby92aXRlLmNvbmZpZy5iYXNlLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyB2aXRlQnVpbGRJbmZvIH0gZnJvbSAnLi9zY3JpcHRzL3ZpdGUtcGx1Z2luLWJ1aWxkLWluZm8uanMnXG5pbXBvcnQgeyBjcmVhdGVBcHBJMThuUGx1Z2luIH0gZnJvbSAnLi9zY3JpcHRzL3ZpdGUtcGx1Z2luLWkxOG4tc2ltcGxlLmpzJ1xuaW1wb3J0IHsgaTE4bldvcmtlclBsdWdpbiB9IGZyb20gJy4vc2NyaXB0cy92aXRlLXBsdWdpbi1pMThuLXdvcmtlci5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpdGVDb25maWcoZGlybmFtZSwgcG9ydCA9IDMwMDAsIHB3YUNvbmZpZyA9IG51bGwsIGFwcE5hbWUgPSBudWxsLCBpMThuQ29uZmlnID0gbnVsbCkge1xuICBsZXQgYnVpbGRJbmZvID0gbnVsbDtcbiAgXG4gIC8vIEluamVjdCBidWlsZCBpbmZvIGJlZm9yZSBidWlsZFxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykge1xuICAgIHRyeSB7XG4gICAgICBleGVjU3luYyhgbm9kZSAke3BhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzY3JpcHRzL2luamVjdC1idWlsZC1pbmZvLmpzJyl9ICR7ZGlybmFtZX1gLCB7XG4gICAgICAgIHN0ZGlvOiAnaW5oZXJpdCdcbiAgICAgIH0pXG4gICAgICBcbiAgICAgIC8vIFJlYWQgdGhlIGdlbmVyYXRlZCBidWlsZCBpbmZvIGZvciB0aGUgcGx1Z2luXG4gICAgICBjb25zdCBidWlsZEluZm9QYXRoID0gcGF0aC5qb2luKGRpcm5hbWUsICdwdWJsaWMnLCAnYnVpbGQtaW5mby5qc29uJyk7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhidWlsZEluZm9QYXRoKSkge1xuICAgICAgICBidWlsZEluZm8gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhidWlsZEluZm9QYXRoLCAndXRmOCcpKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gaW5qZWN0IGJ1aWxkIGluZm86JywgZXJyb3IubWVzc2FnZSlcbiAgICB9XG4gIH1cbiAgXG4gIGNvbnN0IHBsdWdpbnMgPSBbdnVlKCldXG4gIFxuICAvLyBBZGQgaTE4biBnZW5lcmF0aW9uIHBsdWdpbiBpZiBhcHAgbmFtZSBpcyBwcm92aWRlZFxuICBpZiAoYXBwTmFtZSkge1xuICAgIGNvbnN0IGkxOG5PcHRpb25zID0ge1xuICAgICAgYXBwOiBhcHBOYW1lLFxuICAgICAgZW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyAncHJvZHVjdGlvbicgOiAnZGV2ZWxvcG1lbnQnLFxuICAgICAgLi4uKGkxOG5Db25maWcgfHwge30pXG4gICAgfVxuICAgIFxuICAgIC8vIFVzZSB3b3JrZXItYmFzZWQgcGx1Z2luIGZvciBwcm9kdWN0aW9uIGJ1aWxkcywgZmFsbGJhY2sgdG8gc2ltcGxlIHBsdWdpbiBmb3IgZGV2XG4gICAgaWYgKHByb2Nlc3MuZW52LlVTRV9JMThOX1dPUktFUiA9PT0gJ3RydWUnIHx8IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHBsdWdpbnMucHVzaChpMThuV29ya2VyUGx1Z2luKGkxOG5PcHRpb25zKSlcbiAgICB9IGVsc2Uge1xuICAgICAgcGx1Z2lucy5wdXNoKGNyZWF0ZUFwcEkxOG5QbHVnaW4oaTE4bk9wdGlvbnMpKVxuICAgIH1cbiAgfVxuICBcbiAgLy8gQWRkIGJ1aWxkIGluZm8gcGx1Z2luIGlmIHdlIGhhdmUgYnVpbGQgaW5mb3JtYXRpb25cbiAgaWYgKGJ1aWxkSW5mbykge1xuICAgIHBsdWdpbnMucHVzaCh2aXRlQnVpbGRJbmZvKGJ1aWxkSW5mbykpXG4gIH1cbiAgXG4gIGlmIChwd2FDb25maWcpIHtcbiAgICBwbHVnaW5zLnB1c2goVml0ZVBXQShwd2FDb25maWcpKVxuICB9XG5cbiAgcmV0dXJuIGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2lucyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShkaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgICAgJ0B0aWtvL3VpJzogcGF0aC5yZXNvbHZlKGRpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy91aS9zcmMnKSxcbiAgICAgICAgJ0B0aWtvL2NvcmUnOiBwYXRoLnJlc29sdmUoZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjJylcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydCxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgb3BlbjogZmFsc2UsXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICduby1jYWNoZSwgbm8tc3RvcmUsIG11c3QtcmV2YWxpZGF0ZScsXG4gICAgICAgICdQcmFnbWEnOiAnbm8tY2FjaGUnLFxuICAgICAgICAnRXhwaXJlcyc6ICcwJ1xuICAgICAgfVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICAndnVlLXZlbmRvcic6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnXSxcbiAgICAgICAgICAgICd0aWtvLXZlbmRvcic6IFsnQHRpa28vdWknLCAnQHRpa28vY29yZSddXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnLCAnQHRpa28vdWknLCAnQHRpa28vY29yZScsICdvcGVuLWljb24nXVxuICAgIH0sXG4gICAgZGVmaW5lOiB7XG4gICAgICBfX1ZVRV9PUFRJT05TX0FQSV9fOiB0cnVlLFxuICAgICAgX19WVUVfUFJPRF9ERVZUT09MU19fOiBmYWxzZSxcbiAgICAgIF9fVlVFX1BST0RfSFlEUkFUSU9OX01JU01BVENIX0RFVEFJTFNfXzogZmFsc2VcbiAgICB9XG4gIH0pXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHMvdml0ZS1wbHVnaW4tYnVpbGQtaW5mby5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0cy92aXRlLXBsdWdpbi1idWlsZC1pbmZvLmpzXCI7LyoqXG4gKiBWaXRlIHBsdWdpbiB0byBpbmplY3QgYnVpbGQgaW5mb3JtYXRpb24gaW50byBIVE1MIG1ldGEgdGFnc1xuICovXG5cbmV4cG9ydCBmdW5jdGlvbiB2aXRlQnVpbGRJbmZvKGJ1aWxkSW5mbykge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2aXRlLXBsdWdpbi1idWlsZC1pbmZvJyxcbiAgICB0cmFuc2Zvcm1JbmRleEh0bWwoaHRtbCkge1xuICAgICAgLy8gQ3JlYXRlIG1ldGEgdGFncyB3aXRoIGJ1aWxkIGluZm9ybWF0aW9uXG4gICAgICBjb25zdCBtZXRhVGFncyA9IFtcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJidWlsZDp2ZXJzaW9uXCIgY29udGVudD1cIiR7YnVpbGRJbmZvLnZlcnNpb259XCI+YCxcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJidWlsZDpudW1iZXJcIiBjb250ZW50PVwiJHtidWlsZEluZm8uYnVpbGROdW1iZXJ9XCI+YCxcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJidWlsZDpjb21taXRcIiBjb250ZW50PVwiJHtidWlsZEluZm8uY29tbWl0fVwiPmAsXG4gICAgICAgIGA8bWV0YSBuYW1lPVwiYnVpbGQ6YnJhbmNoXCIgY29udGVudD1cIiR7YnVpbGRJbmZvLmJyYW5jaH1cIj5gLFxuICAgICAgICBgPG1ldGEgbmFtZT1cImJ1aWxkOmRhdGVcIiBjb250ZW50PVwiJHtidWlsZEluZm8uYnVpbGREYXRlfVwiPmAsXG4gICAgICAgIGA8bWV0YSBuYW1lPVwiYnVpbGQ6ZW52aXJvbm1lbnRcIiBjb250ZW50PVwiJHtidWlsZEluZm8uZW52aXJvbm1lbnR9XCI+YCxcbiAgICAgICAgLy8gQ29tYmluZWQgdmVyc2lvbiBzdHJpbmcgZm9yIGVhc3kgYWNjZXNzXG4gICAgICAgIGA8bWV0YSBuYW1lPVwiYnVpbGQ6ZnVsbC12ZXJzaW9uXCIgY29udGVudD1cInYke2J1aWxkSW5mby52ZXJzaW9ufS0ke2J1aWxkSW5mby5idWlsZE51bWJlcn0tJHtidWlsZEluZm8uY29tbWl0fVwiPmAsXG4gICAgICAgIC8vIEdlbmVyYXRvciB0YWdcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJnZW5lcmF0b3JcIiBjb250ZW50PVwiVGlrbyBQbGF0Zm9ybSB2JHtidWlsZEluZm8udmVyc2lvbn1cIj5gXG4gICAgICBdLmpvaW4oJ1xcbiAgICAnKTtcblxuICAgICAgLy8gSW5qZWN0IG1ldGEgdGFncyBpbnRvIGhlYWRcbiAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoXG4gICAgICAgICc8L2hlYWQ+JyxcbiAgICAgICAgYCAgICA8IS0tIEJ1aWxkIEluZm9ybWF0aW9uIC0tPlxcbiAgICAke21ldGFUYWdzfVxcbiAgPC9oZWFkPmBcbiAgICAgICk7XG4gICAgfVxuICB9O1xufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzL3ZpdGUtcGx1Z2luLWkxOG4tc2ltcGxlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzL3ZpdGUtcGx1Z2luLWkxOG4tc2ltcGxlLmpzXCI7LyoqXG4gKiBTaW1wbGUgVml0ZSBQbHVnaW4gZm9yIEkxOG4gR2VuZXJhdGlvblxuICogXG4gKiBUaGlzIHBsdWdpbiBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlcyB0cmFuc2xhdGlvbiBmaWxlcyBkdXJpbmcgdGhlIGJ1aWxkIHByb2Nlc3NcbiAqIGZvciBzcGVjaWZpYyBhcHBzLlxuICovXG5cbmltcG9ydCBmcyBmcm9tICdmcydcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbi8vIEltcG9ydCB0aGUgZGF0YWJhc2UgZ2VuZXJhdG9yIGZvciBhY3R1YWwgZGF0YVxuY29uc3QgeyBEYXRhYmFzZUkxOG5HZW5lcmF0b3IgfSA9IHJlcXVpcmUoJy4vZ2VuZXJhdGUtaTE4bi1kYXRhYmFzZS5qcycpXG5cbi8vIE1vY2sgdHJhbnNsYXRpb24gZGF0YSBmb3IgdGVzdGluZ1xuY29uc3QgTU9DS19MQU5HVUFHRVMgPSBbJ2VuJywgJ25sJywgJ2ZyJywgJ2RlJ11cblxuY29uc3QgTU9DS19UUkFOU0xBVElPTlMgPSB7XG4gICdjb21tb24uc2F2ZSc6IHtcbiAgICBlbjogJ1NhdmUnLFxuICAgIG5sOiAnT3BzbGFhbicsXG4gICAgZnI6ICdFbnJlZ2lzdHJlcicsXG4gICAgZGU6ICdTcGVpY2hlcm4nXG4gIH0sXG4gICdjb21tb24uY2FuY2VsJzoge1xuICAgIGVuOiAnQ2FuY2VsJyxcbiAgICBubDogJ0FubnVsZXJlbicsXG4gICAgZnI6ICdBbm51bGVyJyxcbiAgICBkZTogJ0FiYnJlY2hlbidcbiAgfSxcbiAgJ2NvbW1vbi5sb2FkaW5nJzoge1xuICAgIGVuOiAnTG9hZGluZy4uLicsXG4gICAgbmw6ICdMYWRlbi4uLicsXG4gICAgZnI6ICdDaGFyZ2VtZW50Li4uJyxcbiAgICBkZTogJ0xhZGVuLi4uJ1xuICB9LFxuICAndGltZXIuc3RhcnQnOiB7XG4gICAgZW46ICdTdGFydCBUaW1lcicsXG4gICAgbmw6ICdUaW1lciBTdGFydGVuJyxcbiAgICBmcjogJ0RcdTAwRTltYXJyZXIgbGUgbWludXRldXInLFxuICAgIGRlOiAnVGltZXIgc3RhcnRlbidcbiAgfSxcbiAgJ3RpbWVyLnBhdXNlJzoge1xuICAgIGVuOiAnUGF1c2UnLFxuICAgIG5sOiAnUGF1emVyZW4nLFxuICAgIGZyOiAnUGF1c2UnLFxuICAgIGRlOiAnUGF1c2llcmVuJ1xuICB9LFxuICAndGltZXIucmVzZXQnOiB7XG4gICAgZW46ICdSZXNldCcsXG4gICAgbmw6ICdSZXNldCcsXG4gICAgZnI6ICdSXHUwMEU5aW5pdGlhbGlzZXInLFxuICAgIGRlOiAnWnVyXHUwMEZDY2tzZXR6ZW4nXG4gIH0sXG4gICdhZG1pbi51c2Vycyc6IHtcbiAgICBlbjogJ1VzZXJzJyxcbiAgICBubDogJ0dlYnJ1aWtlcnMnLFxuICAgIGZyOiAnVXRpbGlzYXRldXJzJyxcbiAgICBkZTogJ0JlbnV0emVyJ1xuICB9LFxuICAnYWRtaW4uc2V0dGluZ3MnOiB7XG4gICAgZW46ICdTZXR0aW5ncycsXG4gICAgbmw6ICdJbnN0ZWxsaW5nZW4nLFxuICAgIGZyOiAnUGFyYW1cdTAwRTh0cmVzJyxcbiAgICBkZTogJ0VpbnN0ZWxsdW5nZW4nXG4gIH1cbn1cblxuLy8gQ29uZmlndXJhdGlvbiBmb3Igc2VjdGlvbiBmaWx0ZXJpbmcgcGVyIGFwcFxuY29uc3QgQVBQX1NFQ1RJT05fQ09ORklHID0ge1xuICAneWVzLW5vJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICd0aW1lcic6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAncmFkaW8nOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ2NhcmRzJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICd0b2RvJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICd0eXBlJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICdhZG1pbic6IHtcbiAgICAvLyBBZG1pbiBpbmNsdWRlcyBldmVyeXRoaW5nXG4gICAgZXhjbHVkZWQ6IFtdXG4gIH0sXG4gICdtYXJrZXRpbmcnOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCddXG4gIH0sXG4gICd1aS1kb2NzJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTmVzdGVkU3RydWN0dXJlKHRyYW5zbGF0aW9ucykge1xuICBjb25zdCByZXN1bHQgPSB7fVxuXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHRyYW5zbGF0aW9ucykpIHtcbiAgICBjb25zdCBwYXJ0cyA9IGtleS5zcGxpdCgnLicpXG4gICAgbGV0IGN1cnJlbnQgPSByZXN1bHRcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV1cbiAgICAgIGlmICghY3VycmVudFtwYXJ0XSkge1xuICAgICAgICBjdXJyZW50W3BhcnRdID0ge31cbiAgICAgIH1cbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdXG4gICAgfVxuXG4gICAgY3VycmVudFtwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0gPSB2YWx1ZVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVTY3JpcHRDb250ZW50KGxhbmd1YWdlLCB0cmFuc2xhdGlvbnMsIGFwcCkge1xuICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgY29uc3QgYXBwU3VmZml4ID0gYXBwID8gYCBmb3IgYXBwOiAke2FwcH1gIDogJydcbiAgXG4gIHJldHVybiBgLyoqXG4gKiBHZW5lcmF0ZWQgdHJhbnNsYXRpb24gZmlsZSBmb3IgJHtsYW5ndWFnZX0ke2FwcFN1ZmZpeH1cbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke3RpbWVzdGFtcH1cbiAqIFNvdXJjZTogVGlrbyB0cmFuc2xhdGlvbiBkYXRhYmFzZVxuICogXG4gKiBcdTI2QTBcdUZFMEYgIERPIE5PVCBFRElUIE1BTlVBTExZIC0gVGhpcyBmaWxlIGlzIGF1dG8tZ2VuZXJhdGVkXG4gKiBcdTI2QTBcdUZFMEYgIENoYW5nZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiBvbiBuZXh0IGdlbmVyYXRpb25cbiAqIFxuICogVG8gdXBkYXRlIHRyYW5zbGF0aW9uczpcbiAqIDEuIEVkaXQgdHJhbnNsYXRpb25zIGluIHRoZSBhZG1pbiBkYXNoYm9hcmRcbiAqIDIuIFJ1bjogcG5wbSBydW4gZ2VuZXJhdGU6aTE4blxuICovXG5cbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi90eXBlcydcblxuY29uc3QgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbnMgPSAke0pTT04uc3RyaW5naWZ5KHRyYW5zbGF0aW9ucywgbnVsbCwgMil9XG5cbmV4cG9ydCBkZWZhdWx0IHRyYW5zbGF0aW9uc1xuZXhwb3J0IHR5cGUgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL3R5cGVzJ1xuYFxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUludGVyZmFjZXMoa2V5cykge1xuICAvLyBDcmVhdGUgYSBzYW1wbGUgbmVzdGVkIHN0cnVjdHVyZSB0byBkZXJpdmUgdHlwZXNcbiAgY29uc3Qgc2FtcGxlVHJhbnNsYXRpb25zID0ge31cbiAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBzYW1wbGVUcmFuc2xhdGlvbnNba2V5XSA9ICdzdHJpbmcnXG4gIH0pXG5cbiAgY29uc3QgbmVzdGVkU3RydWN0dXJlID0gY3JlYXRlTmVzdGVkU3RydWN0dXJlKHNhbXBsZVRyYW5zbGF0aW9ucylcbiAgY29uc3QgaW50ZXJmYWNlQ29udGVudCA9IGdlbmVyYXRlSW50ZXJmYWNlQ29udGVudChuZXN0ZWRTdHJ1Y3R1cmUpXG5cbiAgcmV0dXJuIGAvKipcbiAqIFR5cGVTY3JpcHQgaW50ZXJmYWNlcyBmb3IgdHJhbnNsYXRpb24gZmlsZXNcbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNsYXRpb25zIHtcbiR7aW50ZXJmYWNlQ29udGVudH1cbn1cblxuLy8gSGVscGVyIHR5cGUgZm9yIHN0cm9uZ2x5IHR5cGVkIHRyYW5zbGF0aW9uIGtleXNcbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uS2V5ID0gJHtrZXlzLm1hcChrZXkgPT4gYCcke2tleX0nYCkuam9pbignIHwgJyl9XG5cbi8vIEhlbHBlciB0eXBlIGZvciBuZXN0ZWQga2V5IGFjY2Vzc1xuZXhwb3J0IHR5cGUgTmVzdGVkS2V5T2Y8T2JqZWN0VHlwZSBleHRlbmRzIG9iamVjdD4gPSB7XG4gIFtLZXkgaW4ga2V5b2YgT2JqZWN0VHlwZSAmIChzdHJpbmcgfCBudW1iZXIpXTogT2JqZWN0VHlwZVtLZXldIGV4dGVuZHMgb2JqZWN0XG4gICAgPyBcXGBcXCR7S2V5fS5cXCR7TmVzdGVkS2V5T2Y8T2JqZWN0VHlwZVtLZXldPn1cXGBcbiAgICA6IFxcYFxcJHtLZXl9XFxgXG59W2tleW9mIE9iamVjdFR5cGUgJiAoc3RyaW5nIHwgbnVtYmVyKV1cblxuZXhwb3J0IHR5cGUgVHJhbnNsYXRpb25LZXlQYXRoID0gTmVzdGVkS2V5T2Y8VHJhbnNsYXRpb25zPlxuYFxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUludGVyZmFjZUNvbnRlbnQob2JqLCBpbmRlbnQgPSAnICAnKSB7XG4gIGNvbnN0IGxpbmVzID0gW11cblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvYmopKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fSR7a2V5fTogc3RyaW5nYClcbiAgICB9IGVsc2Uge1xuICAgICAgbGluZXMucHVzaChgJHtpbmRlbnR9JHtrZXl9OiB7YClcbiAgICAgIGxpbmVzLnB1c2goZ2VuZXJhdGVJbnRlcmZhY2VDb250ZW50KHZhbHVlLCBpbmRlbnQgKyAnICAnKSlcbiAgICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fX1gKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUluZGV4RmlsZShsYW5ndWFnZXMpIHtcbiAgcmV0dXJuIGAvKipcbiAqIEdlbmVyYXRlZCB0cmFuc2xhdGlvbiBpbmRleCBmaWxlXG4gKiBcbiAqIFRoaXMgZmlsZSBwcm92aWRlcyBlYXN5IGFjY2VzcyB0byBhbGwgZ2VuZXJhdGVkIHRyYW5zbGF0aW9uIGZpbGVzXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5cbi8vIEltcG9ydCBhbGwgbGFuZ3VhZ2UgZmlsZXNcbiR7bGFuZ3VhZ2VzLm1hcCgobGFuZykgPT4gXG4gIGBpbXBvcnQgJHtsYW5nLnJlcGxhY2UoJy0nLCAnXycpfSBmcm9tICcuLyR7bGFuZ30nYFxuKS5qb2luKCdcXG4nKX1cblxuLy8gRXhwb3J0IGxhbmd1YWdlIGNvbnN0YW50c1xuZXhwb3J0IGNvbnN0IEFWQUlMQUJMRV9MQU5HVUFHRVMgPSAke0pTT04uc3RyaW5naWZ5KGxhbmd1YWdlcywgbnVsbCwgMil9IGFzIGNvbnN0XG5cbmV4cG9ydCB0eXBlIEF2YWlsYWJsZUxhbmd1YWdlID0gdHlwZW9mIEFWQUlMQUJMRV9MQU5HVUFHRVNbbnVtYmVyXVxuXG4vLyBFeHBvcnQgYWxsIHRyYW5zbGF0aW9ucyBpbiBhIG1hcFxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9uczogUmVjb3JkPEF2YWlsYWJsZUxhbmd1YWdlLCBUcmFuc2xhdGlvbnM+ID0ge1xuJHtsYW5ndWFnZXMubWFwKChsYW5nKSA9PiBgICAnJHtsYW5nfSc6ICR7bGFuZy5yZXBsYWNlKCctJywgJ18nKX1gKS5qb2luKCcsXFxuJyl9XG59XG5cbi8vIEV4cG9ydCBpbmRpdmlkdWFsIGxhbmd1YWdlc1xuZXhwb3J0IHtcbiR7bGFuZ3VhZ2VzLm1hcCgobGFuZykgPT4gYCAgJHtsYW5nLnJlcGxhY2UoJy0nLCAnXycpfSBhcyAke2xhbmcucmVwbGFjZSgnLScsICdfJyl9YCkuam9pbignLFxcbicpfVxufVxuXG4vLyBFeHBvcnQgdHlwZXNcbmV4cG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zLCBUcmFuc2xhdGlvbktleSwgVHJhbnNsYXRpb25LZXlQYXRoIH0gZnJvbSAnLi90eXBlcydcblxuLyoqXG4gKiBHZXQgdHJhbnNsYXRpb25zIGZvciBhIHNwZWNpZmljIGxhbmd1YWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbnMobGFuZ3VhZ2U6IEF2YWlsYWJsZUxhbmd1YWdlKTogVHJhbnNsYXRpb25zIHtcbiAgcmV0dXJuIHRyYW5zbGF0aW9uc1tsYW5ndWFnZV1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGxhbmd1YWdlIGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMYW5ndWFnZVN1cHBvcnRlZChsYW5ndWFnZTogc3RyaW5nKTogbGFuZ3VhZ2UgaXMgQXZhaWxhYmxlTGFuZ3VhZ2Uge1xuICByZXR1cm4gQVZBSUxBQkxFX0xBTkdVQUdFUy5pbmNsdWRlcyhsYW5ndWFnZSBhcyBBdmFpbGFibGVMYW5ndWFnZSlcbn1cbmBcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVJMThuRmlsZXMob3B0aW9ucyA9IHt9KSB7XG4gIC8vIFRyeSB0byB1c2UgZGF0YWJhc2UgZ2VuZXJhdG9yIGZpcnN0LCBmYWxsYmFjayB0byBtb2NrIGRhdGFcbiAgdHJ5IHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkwgJiYgcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSkge1xuICAgICAgY29uc3QgZ2VuZXJhdG9yID0gbmV3IERhdGFiYXNlSTE4bkdlbmVyYXRvcih7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIHZlcmJvc2U6IG9wdGlvbnMudmVyYm9zZSAhPT0gZmFsc2VcbiAgICAgIH0pXG4gICAgICBhd2FpdCBnZW5lcmF0b3IuZ2VuZXJhdGUoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybignXHUyNzRDIERhdGFiYXNlIGdlbmVyYXRpb24gZmFpbGVkLCBmYWxsaW5nIGJhY2sgdG8gbW9jayBkYXRhOicsIGVycm9yLm1lc3NhZ2UpXG4gIH1cbiAgXG4gIC8vIEZhbGxiYWNrIHRvIG1vY2sgZGF0YSBnZW5lcmF0aW9uXG4gIGNvbnN0IGJhc2VPdXRwdXREaXIgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3BhY2thZ2VzL3VpL3NyYy9pMThuL2dlbmVyYXRlZCcpXG4gIFxuICAvLyBHZXQgbGFuZ3VhZ2VzXG4gIGNvbnN0IGxhbmd1YWdlcyA9IG9wdGlvbnMubGFuZ3VhZ2VzIHx8IE1PQ0tfTEFOR1VBR0VTXG4gIFxuICAvLyBHZXQgYWxsIGtleXNcbiAgY29uc3QgYWxsS2V5cyA9IE9iamVjdC5rZXlzKE1PQ0tfVFJBTlNMQVRJT05TKVxuICBcbiAgLy8gRmlsdGVyIGtleXMgYmFzZWQgb24gYXBwIGNvbmZpZ3VyYXRpb25cbiAgbGV0IGZpbHRlcmVkS2V5cyA9IGFsbEtleXNcbiAgXG4gIGlmIChvcHRpb25zLmFwcCAmJiBBUFBfU0VDVElPTl9DT05GSUdbb3B0aW9ucy5hcHBdKSB7XG4gICAgY29uc3QgY29uZmlnID0gQVBQX1NFQ1RJT05fQ09ORklHW29wdGlvbnMuYXBwXVxuICAgIGlmIChjb25maWcuZXhjbHVkZWQpIHtcbiAgICAgIGZpbHRlcmVkS2V5cyA9IGFsbEtleXMuZmlsdGVyKGtleSA9PiBcbiAgICAgICAgIWNvbmZpZy5leGNsdWRlZC5zb21lKHNlY3Rpb24gPT4ga2V5LnN0YXJ0c1dpdGgoYCR7c2VjdGlvbn0uYCkpXG4gICAgICApXG4gICAgfVxuICB9XG4gIFxuICAvLyBFbnN1cmUgb3V0cHV0IGRpcmVjdG9yeSBleGlzdHNcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGJhc2VPdXRwdXREaXIpKSB7XG4gICAgZnMubWtkaXJTeW5jKGJhc2VPdXRwdXREaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gIH1cbiAgXG4gIC8vIEdlbmVyYXRlIGZpbGVzIGZvciBlYWNoIGxhbmd1YWdlXG4gIGZvciAoY29uc3QgbGFuZ3VhZ2Ugb2YgbGFuZ3VhZ2VzKSB7XG4gICAgY29uc3QgZmlsdGVyZWRUcmFuc2xhdGlvbnMgPSB7fVxuICAgIGZvciAoY29uc3Qga2V5IG9mIGZpbHRlcmVkS2V5cykge1xuICAgICAgaWYgKE1PQ0tfVFJBTlNMQVRJT05TW2tleV0gJiYgTU9DS19UUkFOU0xBVElPTlNba2V5XVtsYW5ndWFnZV0pIHtcbiAgICAgICAgZmlsdGVyZWRUcmFuc2xhdGlvbnNba2V5XSA9IE1PQ0tfVFJBTlNMQVRJT05TW2tleV1bbGFuZ3VhZ2VdXG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IG5lc3RlZFRyYW5zbGF0aW9ucyA9IGNyZWF0ZU5lc3RlZFN0cnVjdHVyZShmaWx0ZXJlZFRyYW5zbGF0aW9ucylcbiAgICBjb25zdCBjb250ZW50ID0gZ2VuZXJhdGVUeXBlU2NyaXB0Q29udGVudChsYW5ndWFnZSwgbmVzdGVkVHJhbnNsYXRpb25zLCBvcHRpb25zLmFwcClcbiAgICBcbiAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKGJhc2VPdXRwdXREaXIsIGAke2xhbmd1YWdlfS50c2ApXG4gICAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50LCAndXRmLTgnKVxuICB9XG4gIFxuICAvLyBHZW5lcmF0ZSB0eXBlc1xuICBjb25zdCB0eXBlc0NvbnRlbnQgPSBnZW5lcmF0ZUludGVyZmFjZXMoZmlsdGVyZWRLZXlzKVxuICBjb25zdCB0eXBlc1BhdGggPSBwYXRoLmpvaW4oYmFzZU91dHB1dERpciwgJ3R5cGVzLnRzJylcbiAgZnMud3JpdGVGaWxlU3luYyh0eXBlc1BhdGgsIHR5cGVzQ29udGVudCwgJ3V0Zi04JylcbiAgXG4gIC8vIEdlbmVyYXRlIGluZGV4XG4gIGNvbnN0IGluZGV4Q29udGVudCA9IGdlbmVyYXRlSW5kZXhGaWxlKGxhbmd1YWdlcylcbiAgY29uc3QgaW5kZXhQYXRoID0gcGF0aC5qb2luKGJhc2VPdXRwdXREaXIsICdpbmRleC50cycpXG4gIGZzLndyaXRlRmlsZVN5bmMoaW5kZXhQYXRoLCBpbmRleENvbnRlbnQsICd1dGYtOCcpXG4gIFxuICAvLyBHZW5lcmF0ZSAuZ2l0aWdub3JlXG4gIGNvbnN0IGdpdGlnbm9yZVBhdGggPSBwYXRoLmpvaW4oYmFzZU91dHB1dERpciwgJy5naXRpZ25vcmUnKVxuICBjb25zdCBnaXRpZ25vcmVDb250ZW50ID0gYCMgQXV0by1nZW5lcmF0ZWQgdHJhbnNsYXRpb24gZmlsZXNcbiMgVGhlc2UgZmlsZXMgYXJlIGdlbmVyYXRlZCBmcm9tIHRoZSBkYXRhYmFzZSBhbmQgc2hvdWxkIG5vdCBiZSBjb21taXR0ZWRcblxuKi50c1xuKi5qc1xuKi5kLnRzXG4hLmdpdGlnbm9yZVxuXG4jIEtlZXAgdGhpcyBkaXJlY3RvcnkgYnV0IGlnbm9yZSBhbGwgZ2VuZXJhdGVkIGNvbnRlbnRcbmBcbiAgZnMud3JpdGVGaWxlU3luYyhnaXRpZ25vcmVQYXRoLCBnaXRpZ25vcmVDb250ZW50LCAndXRmLTgnKVxuICBcbiAgaWYgKG9wdGlvbnMudmVyYm9zZSAhPT0gZmFsc2UpIHtcbiAgICBjb25zb2xlLmxvZyhgXHVEODNDXHVERjBEIEdlbmVyYXRlZCBpMThuIGZpbGVzIGZvciAke29wdGlvbnMuYXBwIHx8ICdhcHAnfSB3aXRoICR7ZmlsdGVyZWRLZXlzLmxlbmd0aH0ga2V5cyAodXNpbmcgbW9jayBkYXRhKWApXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybnMge2ltcG9ydCgndml0ZScpLlBsdWdpbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5HZW5lcmF0aW9uKG9wdGlvbnMgPSB7fSkge1xuICBsZXQgaGFzR2VuZXJhdGVkID0gZmFsc2VcbiAgXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2kxOG4tZ2VuZXJhdGlvbicsXG4gICAgXG4gICAgYXN5bmMgY29uZmlnUmVzb2x2ZWQoKSB7XG4gICAgICAvLyBHZW5lcmF0ZSBmaWxlcyBvbmNlIGR1cmluZyBjb25maWcgcmVzb2x1dGlvblxuICAgICAgaWYgKCFoYXNHZW5lcmF0ZWQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBnZW5lcmF0ZUkxOG5GaWxlcyhvcHRpb25zKVxuICAgICAgICAgIGhhc0dlbmVyYXRlZCA9IHRydWVcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1x1Mjc0QyBJMThuIGdlbmVyYXRpb24gZmFpbGVkOicsIGVycm9yLm1lc3NhZ2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBzaW1wbGlmaWVkIHBsdWdpbiBmb3IgYXBwcyB0aGF0IGp1c3QgbmVlZCBiYXNpYyBpMThuIGdlbmVyYXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gYXBwTmFtZU9yT3B0aW9ucyAtIEFwcCBuYW1lIG9yIGZ1bGwgb3B0aW9ucyBvYmplY3RcbiAqIEByZXR1cm5zIHtpbXBvcnQoJ3ZpdGUnKS5QbHVnaW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHBJMThuUGx1Z2luKGFwcE5hbWVPck9wdGlvbnMpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IHR5cGVvZiBhcHBOYW1lT3JPcHRpb25zID09PSAnc3RyaW5nJyBcbiAgICA/IHsgYXBwOiBhcHBOYW1lT3JPcHRpb25zLCB2ZXJib3NlOiBmYWxzZSB9XG4gICAgOiB7IHZlcmJvc2U6IGZhbHNlLCAuLi5hcHBOYW1lT3JPcHRpb25zIH1cbiAgXG4gIHJldHVybiBpMThuR2VuZXJhdGlvbihvcHRpb25zKVxufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzL3ZpdGUtcGx1Z2luLWkxOG4td29ya2VyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzL3ZpdGUtcGx1Z2luLWkxOG4td29ya2VyLmpzXCI7LyoqXG4gKiBWaXRlIFBsdWdpbiBmb3IgSTE4biBXb3JrZXIgSW50ZWdyYXRpb25cbiAqIFxuICogVGhpcyBwbHVnaW4gZmV0Y2hlcyB0cmFuc2xhdGlvbiBkYXRhIGZyb20gdGhlIGkxOG4tZGF0YSB3b3JrZXIgZHVyaW5nIGJ1aWxkXG4gKiBhbmQgZ2VuZXJhdGVzIHN0YXRpYyBUeXBlU2NyaXB0IGZpbGVzIGZvciBydW50aW1lIHVzZS5cbiAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCdcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKVxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpXG5cbi8vIERlZmF1bHQgY29uZmlndXJhdGlvblxuY29uc3QgREVGQVVMVF9DT05GSUcgPSB7XG4gIHdvcmtlclVybDoge1xuICAgIGRldmVsb3BtZW50OiAnaHR0cDovL2xvY2FsaG9zdDo4Nzg3JyxcbiAgICBwcm9kdWN0aW9uOiAnaHR0cHM6Ly9pMThuLWRhdGEuc2lsdmFuZGllcGVuLndvcmtlcnMuZGV2J1xuICB9LFxuICBvdXRwdXREaXI6ICcuLi9wYWNrYWdlcy91aS9zcmMvaTE4bi9nZW5lcmF0ZWQnLFxuICBlbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nLCAvLyBEZWZhdWx0IHRvIHByb2R1Y3Rpb24gZm9yIGJ1aWxkc1xuICBhcHA6IG51bGwgLy8gT3B0aW9uYWwgYXBwIGZpbHRlclxufVxuXG4vKipcbiAqIENyZWF0ZSB0aGUgVml0ZSBwbHVnaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5Xb3JrZXJQbHVnaW4odXNlckNvbmZpZyA9IHt9KSB7XG4gIGNvbnN0IGNvbmZpZyA9IHsgLi4uREVGQVVMVF9DT05GSUcsIC4uLnVzZXJDb25maWcgfVxuICBjb25zdCBvdXRwdXREaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBjb25maWcub3V0cHV0RGlyKVxuICBcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnaTE4bi13b3JrZXInLFxuICAgIFxuICAgIGFzeW5jIGJ1aWxkU3RhcnQoKSB7XG4gICAgICBjb25zb2xlLmxvZygnXHVEODNDXHVERjBEIFtpMThuLXdvcmtlcl0gRmV0Y2hpbmcgdHJhbnNsYXRpb24gZGF0YSBkdXJpbmcgYnVpbGQuLi4nKVxuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBnZW5lcmF0ZVRyYW5zbGF0aW9uc0Zyb21Xb3JrZXIoY29uZmlnLCBvdXRwdXREaXIpXG4gICAgICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgW2kxOG4td29ya2VyXSBUcmFuc2xhdGlvbiBmaWxlcyBnZW5lcmF0ZWQgc3VjY2Vzc2Z1bGx5JylcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIERvbid0IGZhaWwgdGhlIGJ1aWxkLCBidXQgd2FybiBhYm91dCBtaXNzaW5nIHRyYW5zbGF0aW9uc1xuICAgICAgICBjb25zb2xlLndhcm4oJ1x1MjZBMFx1RkUwRiBbaTE4bi13b3JrZXJdIEZhaWxlZCB0byBmZXRjaCB0cmFuc2xhdGlvbnMgZnJvbSB3b3JrZXI6JywgZXJyb3IubWVzc2FnZSlcbiAgICAgICAgY29uc29sZS53YXJuKCdcdTI2QTBcdUZFMEYgW2kxOG4td29ya2VyXSBVc2luZyBleGlzdGluZyB0cmFuc2xhdGlvbiBmaWxlcyBpZiBhdmFpbGFibGUnKVxuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgaWYgZXhpc3RpbmcgZmlsZXMgYXJlIGF2YWlsYWJsZVxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKG91dHB1dERpciwgJ2luZGV4LnRzJykpKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIFtpMThuLXdvcmtlcl0gTm8gZXhpc3RpbmcgdHJhbnNsYXRpb24gZmlsZXMgZm91bmQuIEJ1aWxkIG1heSBmYWlsLicpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2xhdGlvbiBmaWxlcyBhcmUgcmVxdWlyZWQgYnV0IGNvdWxkIG5vdCBiZSBnZW5lcmF0ZWQgb3IgZm91bmQnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdHJhbnNsYXRpb25zIGZyb20gd29ya2VyXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlVHJhbnNsYXRpb25zRnJvbVdvcmtlcihjb25maWcsIG91dHB1dERpcikge1xuICBjb25zdCB3b3JrZXJVcmwgPSBjb25maWcud29ya2VyVXJsW2NvbmZpZy5lbnZpcm9ubWVudF0gfHwgY29uZmlnLndvcmtlclVybC5wcm9kdWN0aW9uXG4gIGNvbnN0IGVuZHBvaW50ID0gY29uZmlnLmFwcCA/IGAvYXBwLyR7Y29uZmlnLmFwcH1gIDogJy9hbGwnXG4gIGNvbnN0IHVybCA9IGAke3dvcmtlclVybH0ke2VuZHBvaW50fWBcbiAgXG4gIGNvbnNvbGUubG9nKGBcdUQ4M0NcdURGMTAgW2kxOG4td29ya2VyXSBGZXRjaGluZyBmcm9tOiAke3VybH1gKVxuICBcbiAgLy8gRmV0Y2ggdHJhbnNsYXRpb24gZGF0YVxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9XG4gIH0pXG4gIFxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApXG4gIH1cbiAgXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuICBcbiAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyb3IgfHwgJ1Vua25vd24gZXJyb3IgZnJvbSB3b3JrZXInKVxuICB9XG4gIFxuICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0NBIFtpMThuLXdvcmtlcl0gRmV0Y2hlZCAke3Jlc3VsdC5tZXRhZGF0YS50b3RhbEtleXN9IGtleXMsICR7cmVzdWx0Lm1ldGFkYXRhLnRvdGFsTGFuZ3VhZ2VzfSBsYW5ndWFnZXNgKVxuICBcbiAgLy8gR2VuZXJhdGUgVHlwZVNjcmlwdCBjb250ZW50XG4gIGNvbnN0IGdlbmVyYXRlZENvbnRlbnQgPSBnZW5lcmF0ZVR5cGVTY3JpcHQocmVzdWx0LmRhdGEpXG4gIFxuICAvLyBXcml0ZSBmaWxlc1xuICB3cml0ZUZpbGVzKGdlbmVyYXRlZENvbnRlbnQsIG91dHB1dERpcilcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBUeXBlU2NyaXB0IGludGVyZmFjZSBmb3IgdHJhbnNsYXRpb24ga2V5c1xuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVR5cGVTY3JpcHQodHJhbnNsYXRpb25EYXRhKSB7XG4gIGNvbnN0IHsga2V5cywgbGFuZ3VhZ2VzLCB0cmFuc2xhdGlvbnMgfSA9IHRyYW5zbGF0aW9uRGF0YVxuICBcbiAgLy8gQ3JlYXRlIG5lc3RlZCBrZXkgc3RydWN0dXJlIGZvciB0eXBlIGRlZmluaXRpb25zXG4gIGNvbnN0IGtleVN0cnVjdHVyZSA9IGNyZWF0ZUtleVN0cnVjdHVyZShrZXlzLm1hcChrID0+IGsua2V5KSlcbiAgXG4gIC8vIEdlbmVyYXRlIFR5cGVTY3JpcHQgdHlwZXNcbiAgY29uc3QgdHlwZUNvbnRlbnQgPSBnZW5lcmF0ZVRyYW5zbGF0aW9uVHlwZXMoa2V5U3RydWN0dXJlLCBrZXlzKVxuICBcbiAgLy8gR2VuZXJhdGUgbGFuZ3VhZ2UgZmlsZXNcbiAgY29uc3QgbGFuZ3VhZ2VGaWxlcyA9IHt9XG4gIGZvciAoY29uc3QgbGFuZ3VhZ2Ugb2YgbGFuZ3VhZ2VzKSB7XG4gICAgbGFuZ3VhZ2VGaWxlc1tsYW5ndWFnZS5jb2RlXSA9IGdlbmVyYXRlTGFuZ3VhZ2VGaWxlKFxuICAgICAgbGFuZ3VhZ2UuY29kZSxcbiAgICAgIHRyYW5zbGF0aW9uc1tsYW5ndWFnZS5jb2RlXSB8fCB7fSxcbiAgICAgIGtleXNcbiAgICApXG4gIH1cbiAgXG4gIC8vIEdlbmVyYXRlIGluZGV4IGZpbGVcbiAgY29uc3QgaW5kZXhDb250ZW50ID0gZ2VuZXJhdGVJbmRleEZpbGUobGFuZ3VhZ2VzLCB0cmFuc2xhdGlvbkRhdGEpXG4gIFxuICByZXR1cm4ge1xuICAgIHR5cGVzOiB0eXBlQ29udGVudCxcbiAgICBsYW5ndWFnZXM6IGxhbmd1YWdlRmlsZXMsXG4gICAgaW5kZXg6IGluZGV4Q29udGVudFxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIG5lc3RlZCBrZXkgc3RydWN0dXJlIGZyb20gZmxhdCBrZXlzXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUtleVN0cnVjdHVyZShrZXlzKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9XG4gIFxuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgY29uc3QgcGFydHMgPSBrZXkuc3BsaXQoJy4nKVxuICAgIGxldCBjdXJyZW50ID0gcmVzdWx0XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXVxuICAgICAgaWYgKCFjdXJyZW50W3BhcnRdKSB7XG4gICAgICAgIGN1cnJlbnRbcGFydF0gPSB7fVxuICAgICAgfVxuICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFydF1cbiAgICB9XG4gICAgXG4gICAgY29uc3QgbGFzdFBhcnQgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXVxuICAgIGN1cnJlbnRbbGFzdFBhcnRdID0ga2V5XG4gIH1cbiAgXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBUeXBlU2NyaXB0IHR5cGVzIGZyb20ga2V5IHN0cnVjdHVyZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVRyYW5zbGF0aW9uVHlwZXMoc3RydWN0dXJlLCBrZXlzLCBsZXZlbCA9IDApIHtcbiAgY29uc3QgaW5kZW50ID0gJyAgJy5yZXBlYXQobGV2ZWwpXG4gIGxldCByZXN1bHQgPSAnJ1xuICBcbiAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgcmVzdWx0ICs9IGAvKipcbiAqIEdlbmVyYXRlZCB0cmFuc2xhdGlvbiB0eXBlc1xuICogXG4gKiBUaGlzIGZpbGUgcHJvdmlkZXMgVHlwZVNjcmlwdCBpbnRlcmZhY2VzIGZvciBhbGwgdHJhbnNsYXRpb24ga2V5c1xuICogXG4gKiBHZW5lcmF0ZWQgb246ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxuICogXG4gKiBcdTI2QTBcdUZFMEYgIERPIE5PVCBFRElUIE1BTlVBTExZIC0gVGhpcyBmaWxlIGlzIGF1dG8tZ2VuZXJhdGVkXG4gKi9cblxuLy8gQWxsIGF2YWlsYWJsZSB0cmFuc2xhdGlvbiBrZXlzIGFzIHVuaW9uIHR5cGVcbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uS2V5ID0gJHtrZXlzLm1hcChrID0+IGBcIiR7ay5rZXl9XCJgKS5qb2luKCcgfFxcbiAgJyl9XFxuXFxuYFxuXG4gICAgcmVzdWx0ICs9IGAvLyBOZXN0ZWQga2V5IHN0cnVjdHVyZSBmb3IgYXV0by1jb21wbGV0aW9uXFxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2xhdGlvbktleVBhdGgge1xcbmBcbiAgfVxuICBcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc3RydWN0dXJlKSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXN1bHQgKz0gYCR7aW5kZW50fSAgXCIke2tleX1cIjogXCIke3ZhbHVlfVwiXFxuYFxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgKz0gYCR7aW5kZW50fSAgXCIke2tleX1cIjoge1xcbmBcbiAgICAgIHJlc3VsdCArPSBnZW5lcmF0ZVRyYW5zbGF0aW9uVHlwZXModmFsdWUsIGtleXMsIGxldmVsICsgMSlcbiAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9ICB9XFxuYFxuICAgIH1cbiAgfVxuICBcbiAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgcmVzdWx0ICs9IGB9XFxuXFxuYFxuICAgIHJlc3VsdCArPSBgLy8gTWFpbiB0cmFuc2xhdGlvbnMgaW50ZXJmYWNlXFxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2xhdGlvbnMge1xcbmBcbiAgICByZXN1bHQgKz0gYCAgW2tleTogc3RyaW5nXTogc3RyaW5nXFxuYFxuICAgIHJlc3VsdCArPSBgfVxcbmBcbiAgfVxuICBcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEdlbmVyYXRlIFR5cGVTY3JpcHQgZmlsZSBmb3IgYSBzcGVjaWZpYyBsYW5ndWFnZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUxhbmd1YWdlRmlsZShsYW5ndWFnZUNvZGUsIHRyYW5zbGF0aW9ucywga2V5cykge1xuICBjb25zdCB0cmFuc2xhdGlvbkVudHJpZXMgPSBrZXlzLm1hcChrZXkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gdHJhbnNsYXRpb25zW2tleS5rZXldIHx8ICcnXG4gICAgLy8gRXNjYXBlIHF1b3RlcyBhbmQgbmV3bGluZXNcbiAgICBjb25zdCBlc2NhcGVkVmFsdWUgPSB2YWx1ZVxuICAgICAgLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJylcbiAgICAgIC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJylcbiAgICAgIC5yZXBsYWNlKC9cXG4vZywgJ1xcXFxuJylcbiAgICAgIC5yZXBsYWNlKC9cXHIvZywgJ1xcXFxyJylcbiAgICAgIC5yZXBsYWNlKC9cXHQvZywgJ1xcXFx0JylcbiAgICBcbiAgICByZXR1cm4gYCAgXCIke2tleS5rZXl9XCI6IFwiJHtlc2NhcGVkVmFsdWV9XCJgXG4gIH0pLmpvaW4oJyxcXG4nKVxuICBcbiAgcmV0dXJuIGAvKipcbiAqICR7bGFuZ3VhZ2VDb2RlLnRvVXBwZXJDYXNlKCl9IHRyYW5zbGF0aW9uc1xuICogXG4gKiBHZW5lcmF0ZWQgb246ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxuICogXG4gKiBcdTI2QTBcdUZFMEYgIERPIE5PVCBFRElUIE1BTlVBTExZIC0gVGhpcyBmaWxlIGlzIGF1dG8tZ2VuZXJhdGVkXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL3R5cGVzJ1xuXG5jb25zdCAke2xhbmd1YWdlQ29kZX06IFRyYW5zbGF0aW9ucyA9IHtcbiR7dHJhbnNsYXRpb25FbnRyaWVzfVxufVxuXG5leHBvcnQgZGVmYXVsdCAke2xhbmd1YWdlQ29kZX1cbmBcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBpbmRleCBmaWxlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5kZXhGaWxlKGxhbmd1YWdlcywgdHJhbnNsYXRpb25EYXRhKSB7XG4gIGNvbnN0IGltcG9ydHMgPSBsYW5ndWFnZXMubWFwKGxhbmcgPT4gXG4gICAgYGltcG9ydCAke2xhbmcuY29kZX0gZnJvbSAnLi8ke2xhbmcuY29kZX0nYFxuICApLmpvaW4oJ1xcbicpXG4gIFxuICBjb25zdCBsYW5ndWFnZUNvZGVzID0gbGFuZ3VhZ2VzLm1hcChsYW5nID0+IGBcIiR7bGFuZy5jb2RlfVwiYCkuam9pbignLFxcbiAgJylcbiAgXG4gIGNvbnN0IHRyYW5zbGF0aW9uc01hcCA9IGxhbmd1YWdlcy5tYXAobGFuZyA9PiBcbiAgICBgICAnJHtsYW5nLmNvZGV9JzogJHtsYW5nLmNvZGV9YFxuICApLmpvaW4oJyxcXG4nKVxuICBcbiAgcmV0dXJuIGAvKipcbiAqIEdlbmVyYXRlZCB0cmFuc2xhdGlvbiBpbmRleCBmaWxlXG4gKiBcbiAqIFRoaXMgZmlsZSBwcm92aWRlcyBlYXN5IGFjY2VzcyB0byBhbGwgZ2VuZXJhdGVkIHRyYW5zbGF0aW9uIGZpbGVzXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5cbi8vIEltcG9ydCBhbGwgbGFuZ3VhZ2UgZmlsZXNcbiR7aW1wb3J0c31cblxuLy8gRXhwb3J0IGxhbmd1YWdlIGNvbnN0YW50c1xuZXhwb3J0IGNvbnN0IEFWQUlMQUJMRV9MQU5HVUFHRVMgPSBbXG4gICR7bGFuZ3VhZ2VDb2Rlc31cbl0gYXMgY29uc3RcblxuZXhwb3J0IHR5cGUgQXZhaWxhYmxlTGFuZ3VhZ2UgPSB0eXBlb2YgQVZBSUxBQkxFX0xBTkdVQUdFU1tudW1iZXJdXG5cbi8vIEV4cG9ydCBhbGwgdHJhbnNsYXRpb25zIGluIGEgbWFwXG5leHBvcnQgY29uc3QgdHJhbnNsYXRpb25zOiBSZWNvcmQ8QXZhaWxhYmxlTGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucz4gPSB7XG4ke3RyYW5zbGF0aW9uc01hcH1cbn1cblxuLy8gRXhwb3J0IGluZGl2aWR1YWwgbGFuZ3VhZ2VzXG5leHBvcnQge1xuJHtsYW5ndWFnZXMubWFwKGxhbmcgPT4gYCAgJHtsYW5nLmNvZGV9IGFzICR7bGFuZy5jb2RlfWApLmpvaW4oJyxcXG4nKX1cbn1cblxuLy8gRXhwb3J0IHR5cGVzXG5leHBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucywgVHJhbnNsYXRpb25LZXksIFRyYW5zbGF0aW9uS2V5UGF0aCB9IGZyb20gJy4vdHlwZXMnXG5cbi8qKlxuICogR2V0IHRyYW5zbGF0aW9ucyBmb3IgYSBzcGVjaWZpYyBsYW5ndWFnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25zKGxhbmd1YWdlOiBBdmFpbGFibGVMYW5ndWFnZSk6IFRyYW5zbGF0aW9ucyB7XG4gIHJldHVybiB0cmFuc2xhdGlvbnNbbGFuZ3VhZ2VdXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBsYW5ndWFnZSBpcyBzdXBwb3J0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGFuZ3VhZ2VTdXBwb3J0ZWQobGFuZ3VhZ2U6IHN0cmluZyk6IGxhbmd1YWdlIGlzIEF2YWlsYWJsZUxhbmd1YWdlIHtcbiAgcmV0dXJuIEFWQUlMQUJMRV9MQU5HVUFHRVMuaW5jbHVkZXMobGFuZ3VhZ2UgYXMgQXZhaWxhYmxlTGFuZ3VhZ2UpXG59XG5gXG59XG5cbi8qKlxuICogV3JpdGUgZ2VuZXJhdGVkIGZpbGVzIHRvIGRpc2tcbiAqL1xuZnVuY3Rpb24gd3JpdGVGaWxlcyhnZW5lcmF0ZWRDb250ZW50LCBvdXRwdXREaXIpIHtcbiAgLy8gRW5zdXJlIG91dHB1dCBkaXJlY3RvcnkgZXhpc3RzXG4gIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXIpKSB7XG4gICAgZnMubWtkaXJTeW5jKG91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgfVxuICBcbiAgY29uc29sZS5sb2coYFx1RDgzRFx1RENERCBbaTE4bi13b3JrZXJdIFdyaXRpbmcgVHlwZVNjcmlwdCBmaWxlcyB0bzogJHtvdXRwdXREaXJ9YClcbiAgXG4gIC8vIFdyaXRlIHR5cGVzIGZpbGVcbiAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0RGlyLCAndHlwZXMudHMnKSwgZ2VuZXJhdGVkQ29udGVudC50eXBlcylcbiAgXG4gIC8vIFdyaXRlIGxhbmd1YWdlIGZpbGVzXG4gIGZvciAoY29uc3QgW2xhbmd1YWdlQ29kZSwgY29udGVudF0gb2YgT2JqZWN0LmVudHJpZXMoZ2VuZXJhdGVkQ29udGVudC5sYW5ndWFnZXMpKSB7XG4gICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0RGlyLCBgJHtsYW5ndWFnZUNvZGV9LnRzYCksIGNvbnRlbnQpXG4gIH1cbiAgXG4gIC8vIFdyaXRlIGluZGV4IGZpbGVcbiAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ob3V0cHV0RGlyLCAnaW5kZXgudHMnKSwgZ2VuZXJhdGVkQ29udGVudC5pbmRleClcbn1cblxuZXhwb3J0IGRlZmF1bHQgaTE4bldvcmtlclBsdWdpbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL2FwcHMvdG9kb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL2FwcHMvdG9kby92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vYXBwcy90b2RvL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgY3JlYXRlVml0ZUNvbmZpZyB9IGZyb20gJy4uLy4uL3ZpdGUuY29uZmlnLmJhc2UnXG5cbmNvbnN0IHB3YUNvbmZpZyA9IHtcbiAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAnbWFza2VkLWljb24uc3ZnJ10sXG4gIG1hbmlmZXN0OiB7XG4gICAgbmFtZTogJ1RvZG8gLSBUaWtvJyxcbiAgICBzaG9ydF9uYW1lOiAnVG9kbycsXG4gICAgZGVzY3JpcHRpb246ICdWaXN1YWwgdG9kbyBsaXN0IGFwcCB3aXRoIGdyb3VwcyBhbmQgaXRlbXMnLFxuICAgIHRoZW1lX2NvbG9yOiAnIzNiODJmNicsXG4gICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxuICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0JyxcbiAgICBzY29wZTogJy8nLFxuICAgIHN0YXJ0X3VybDogJy8nLFxuICAgIGljb25zOiBbXG4gICAgICB7XG4gICAgICAgIHNyYzogJ3B3YS0xOTJ4MTkyLnBuZycsXG4gICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc3JjOiAncHdhLTUxMng1MTIucG5nJyxcbiAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnXG4gICAgICB9XG4gICAgXVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVZpdGVDb25maWcoX19kaXJuYW1lLCAzMDA3LCBwd2FDb25maWcpIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQU9BLFFBQU1BLE1BQUssVUFBUSxJQUFJO0FBQ3ZCLFFBQU1DLFFBQU8sVUFBUSxNQUFNO0FBRzNCLFFBQU1DLHNCQUFxQjtBQUFBLE1BQ3pCLFVBQVU7QUFBQSxRQUNSLFVBQVUsQ0FBQyxTQUFTLGNBQWMsU0FBUyxTQUFTO0FBQUEsTUFDdEQ7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLFVBQVUsQ0FBQyxTQUFTLGNBQWMsU0FBUyxTQUFTO0FBQUEsTUFDdEQ7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLFVBQVUsQ0FBQyxT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LFVBQVU7QUFBQSxJQUNSLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxJQUNiLGtCQUFrQjtBQUFBLElBQ2xCLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsTUFDUjtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxNQUNSO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxpQkFBaUJDLG1DQUFXLE1BQU0sU0FBUzsiLAogICJuYW1lcyI6IFsiZnMiLCAicGF0aCIsICJBUFBfU0VDVElPTl9DT05GSUciLCAiRGF0YWJhc2VJMThuR2VuZXJhdG9yIiwgImZldGNoIiwgImJhc2VMb2NhbGUiLCAicGF0aCIsICJmcyIsICJmcyIsICJwYXRoIiwgIl9fZGlybmFtZSIsICJwYXRoIiwgImZzIiwgImdlbmVyYXRlSW5kZXhGaWxlIiwgInB3YUNvbmZpZyIsICJwYXRoIiwgImZzIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIl0KfQo=
