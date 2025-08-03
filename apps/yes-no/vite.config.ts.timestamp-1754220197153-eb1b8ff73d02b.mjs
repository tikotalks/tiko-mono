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
function createViteConfig(dirname, port = 3e3, pwaConfig2 = null, appName = null, i18nConfig2 = null) {
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
      ...i18nConfig2 || {}
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

// apps/yes-no/vite.config.ts
var __vite_injected_original_dirname2 = "/Users/silvandiepen/Repositories/_tiko/tiko-mono/apps/yes-no";
var pwaConfig = {
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
  manifest: {
    name: "Yes-No - Tiko",
    short_name: "Yes-No",
    description: "Simple question-answer app",
    theme_color: "#667eea",
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
var i18nConfig = {
  excludeSections: ["admin", "deployment", "media", "content"]
};
var vite_config_default = createViteConfig(__vite_injected_original_dirname2, 3e3, pwaConfig, "yes-no", i18nConfig);
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2NyaXB0cy9nZW5lcmF0ZS1pMThuLWRhdGFiYXNlLmpzIiwgInZpdGUuY29uZmlnLmJhc2UuanMiLCAic2NyaXB0cy92aXRlLXBsdWdpbi1idWlsZC1pbmZvLmpzIiwgInNjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi1zaW1wbGUuanMiLCAic2NyaXB0cy92aXRlLXBsdWdpbi1pMThuLXdvcmtlci5qcyIsICJhcHBzL3llcy1uby92aXRlLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0cy9nZW5lcmF0ZS1pMThuLWRhdGFiYXNlLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzL2dlbmVyYXRlLWkxOG4tZGF0YWJhc2UuanNcIjsvKipcbiAqIERhdGFiYXNlLWNvbm5lY3RlZCBJMThuIEdlbmVyYXRvclxuICogXG4gKiBHZW5lcmF0ZXMgc3RhdGljIFR5cGVTY3JpcHQgdHJhbnNsYXRpb24gZmlsZXMgZnJvbSB0aGUgYWN0dWFsIFN1cGFiYXNlIGRhdGFiYXNlLlxuICogVGhpcyB2ZXJzaW9uIHdvcmtzIGluIE5vZGUuanMgZW52aXJvbm1lbnQgdXNpbmcgbm9kZS1mZXRjaC5cbiAqL1xuXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcblxuLy8gQ29uZmlndXJhdGlvbiBmb3Igc2VjdGlvbiBmaWx0ZXJpbmcgcGVyIGFwcFxuY29uc3QgQVBQX1NFQ1RJT05fQ09ORklHID0ge1xuICAneWVzLW5vJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICd0aW1lcic6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAncmFkaW8nOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ2NhcmRzJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICd0b2RvJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICd0eXBlJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICdhZG1pbic6IHtcbiAgICAvLyBBZG1pbiBpbmNsdWRlcyBldmVyeXRoaW5nXG4gICAgZXhjbHVkZWQ6IFtdXG4gIH0sXG4gICdtYXJrZXRpbmcnOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCddXG4gIH0sXG4gICd1aS1kb2NzJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH1cbn1cblxuY2xhc3MgRGF0YWJhc2VJMThuR2VuZXJhdG9yIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIHRoaXMuYmFzZU91dHB1dERpciA9IG9wdGlvbnMub3V0cHV0RGlyIHx8IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncGFja2FnZXMvdWkvc3JjL2kxOG4vZ2VuZXJhdGVkJylcbiAgICBcbiAgICAvLyBHZXQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgdGhpcy5zdXBhYmFzZVVybCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX1VSTFxuICAgIHRoaXMuc3VwYWJhc2VLZXkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZIHx8IHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZXG4gICAgXG4gICAgaWYgKCF0aGlzLnN1cGFiYXNlVXJsIHx8ICF0aGlzLnN1cGFiYXNlS2V5KSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1x1MjZBMFx1RkUwRiAgTWlzc2luZyBTdXBhYmFzZSBjb25maWd1cmF0aW9uLiBTZXQgVklURV9TVVBBQkFTRV9VUkwgYW5kIFZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGVzLicpXG4gICAgICBjb25zb2xlLndhcm4oJ1x1RDgzRFx1RENBMSBGYWxsaW5nIGJhY2sgdG8gbW9jayBkYXRhIGdlbmVyYXRpb24uLi4nKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOT19TVVBBQkFTRV9DT05GSUcnKVxuICAgIH1cbiAgICBcbiAgICB0aGlzLmJhc2VVcmwgPSB0aGlzLnN1cGFiYXNlVXJsICsgJy9yZXN0L3YxJ1xuICAgIFxuICAgIC8vIEltcG9ydCBub2RlLWZldGNoIGR5bmFtaWNhbGx5IHRvIGhhbmRsZSBib3RoIENvbW1vbkpTIGFuZCBFU01cbiAgICB0aGlzLmZldGNoID0gbnVsbFxuICAgIHRoaXMuaW5pdGlhbGl6ZUZldGNoKClcbiAgfVxuICBcbiAgYXN5bmMgaW5pdGlhbGl6ZUZldGNoKCkge1xuICAgIHRyeSB7XG4gICAgICAvLyBUcnkgdG8gdXNlIGdsb2JhbCBmZXRjaCAoTm9kZS5qcyAxOCspXG4gICAgICBpZiAodHlwZW9mIGZldGNoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmZldGNoID0gZmV0Y2hcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrIHRvIG5vZGUtZmV0Y2hcbiAgICAgICAgY29uc3QgeyBkZWZhdWx0OiBmZXRjaCB9ID0gYXdhaXQgaW1wb3J0KCdub2RlLWZldGNoJylcbiAgICAgICAgdGhpcy5mZXRjaCA9IGZldGNoXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIGZldGNoLiBQbGVhc2UgaW5zdGFsbCBub2RlLWZldGNoOiBucG0gaW5zdGFsbCBub2RlLWZldGNoJylcbiAgICAgIHRocm93IGVycm9yXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbWFrZVJlcXVlc3QoZW5kcG9pbnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghdGhpcy5mZXRjaCkge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplRmV0Y2goKVxuICAgIH1cbiAgICBcbiAgICBjb25zdCB1cmwgPSBgJHt0aGlzLmJhc2VVcmx9JHtlbmRwb2ludH1gXG4gICAgXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmZldGNoKHVybCwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ2FwaWtleSc6IHRoaXMuc3VwYWJhc2VLZXksXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3RoaXMuc3VwYWJhc2VLZXl9YCxcbiAgICAgICAgJ1ByZWZlcic6ICdyZXR1cm49cmVwcmVzZW50YXRpb24nLFxuICAgICAgICAuLi5vcHRpb25zLmhlYWRlcnMsXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFN1cGFiYXNlIEFQSSBFcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvclRleHR9YClcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBlcnJvciEgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKVxuICAgIH1cblxuICAgIHJldHVybiByZXNwb25zZS5qc29uKClcbiAgfVxuXG4gIGFzeW5jIGdldEFjdGl2ZUxhbmd1YWdlcygpIHtcbiAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCgnL2kxOG5fbGFuZ3VhZ2VzP2lzX2FjdGl2ZT1lcS50cnVlJm9yZGVyPW5hbWUuYXNjJylcbiAgfVxuXG4gIGFzeW5jIGdldFRyYW5zbGF0aW9uS2V5cygpIHtcbiAgICByZXR1cm4gdGhpcy5tYWtlUmVxdWVzdCgnL2kxOG5fa2V5cz9vcmRlcj1rZXkuYXNjJylcbiAgfVxuXG4gIGFzeW5jIGdldFRyYW5zbGF0aW9uc0Zvckxhbmd1YWdlKGxhbmd1YWdlQ29kZSkge1xuICAgIHRoaXMubG9nKGBGZXRjaGluZyB0cmFuc2xhdGlvbnMgZm9yIGxhbmd1YWdlOiAke2xhbmd1YWdlQ29kZX1gKVxuICAgIFxuICAgIGxldCBxdWVyeSA9IGAvaTE4bl90cmFuc2xhdGlvbnM/c2VsZWN0PWkxOG5fa2V5cyhrZXkpLHZhbHVlLGxhbmd1YWdlX2NvZGUmaXNfcHVibGlzaGVkPWVxLnRydWVgXG4gICAgXG4gICAgLy8gSWYgbG9jYWxlIGhhcyBhIHJlZ2lvbiwgZmV0Y2ggYm90aCBiYXNlIGFuZCBzcGVjaWZpYyBpbiBvbmUgcXVlcnlcbiAgICBpZiAobGFuZ3VhZ2VDb2RlLmluY2x1ZGVzKCctJykpIHtcbiAgICAgIGNvbnN0IGJhc2VMb2NhbGUgPSBsYW5ndWFnZUNvZGUuc3BsaXQoJy0nKVswXVxuICAgICAgcXVlcnkgKz0gYCZsYW5ndWFnZV9jb2RlPWluLigke2Jhc2VMb2NhbGV9LCR7bGFuZ3VhZ2VDb2RlfSlgXG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXJ5ICs9IGAmbGFuZ3VhZ2VfY29kZT1lcS4ke2xhbmd1YWdlQ29kZX1gXG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHRyYW5zbGF0aW9ucyA9IGF3YWl0IHRoaXMubWFrZVJlcXVlc3QocXVlcnkpXG4gICAgXG4gICAgLy8gUHJvY2VzcyB0cmFuc2xhdGlvbnMsIG1lcmdpbmcgYmFzZSBhbmQgc3BlY2lmaWMgbG9jYWxlc1xuICAgIGNvbnN0IHRyYW5zbGF0aW9uc0J5S2V5ID0ge31cbiAgICBjb25zdCBiYXNlTG9jYWxlID0gbGFuZ3VhZ2VDb2RlLmluY2x1ZGVzKCctJykgPyBsYW5ndWFnZUNvZGUuc3BsaXQoJy0nKVswXSA6IG51bGxcbiAgICBcbiAgICBmb3IgKGNvbnN0IHRyYW5zbGF0aW9uIG9mIHRyYW5zbGF0aW9ucykge1xuICAgICAgaWYgKHRyYW5zbGF0aW9uLmkxOG5fa2V5cyAmJiB0cmFuc2xhdGlvbi5pMThuX2tleXMua2V5KSB7XG4gICAgICAgIGNvbnN0IGtleSA9IHRyYW5zbGF0aW9uLmkxOG5fa2V5cy5rZXlcbiAgICAgICAgXG4gICAgICAgIGlmICghdHJhbnNsYXRpb25zQnlLZXlba2V5XSkge1xuICAgICAgICAgIHRyYW5zbGF0aW9uc0J5S2V5W2tleV0gPSB7fVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHJhbnNsYXRpb24ubGFuZ3VhZ2VfY29kZSA9PT0gYmFzZUxvY2FsZSkge1xuICAgICAgICAgIHRyYW5zbGF0aW9uc0J5S2V5W2tleV0uYmFzZSA9IHRyYW5zbGF0aW9uLnZhbHVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJhbnNsYXRpb25zQnlLZXlba2V5XS5zcGVjaWZpYyA9IHRyYW5zbGF0aW9uLnZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gTWVyZ2UgdHJhbnNsYXRpb25zOiBzcGVjaWZpYyBsb2NhbGUgb3ZlcnJpZGVzIGJhc2VcbiAgICBjb25zdCBtZXJnZWRUcmFuc2xhdGlvbnMgPSB7fVxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVzXSBvZiBPYmplY3QuZW50cmllcyh0cmFuc2xhdGlvbnNCeUtleSkpIHtcbiAgICAgIG1lcmdlZFRyYW5zbGF0aW9uc1trZXldID0gdmFsdWVzLnNwZWNpZmljIHx8IHZhbHVlcy5iYXNlIHx8ICcnXG4gICAgfVxuICAgIFxuICAgIHRoaXMubG9nKGBQcm9jZXNzZWQgJHtPYmplY3Qua2V5cyhtZXJnZWRUcmFuc2xhdGlvbnMpLmxlbmd0aH0gdHJhbnNsYXRpb25zIGZvciAke2xhbmd1YWdlQ29kZX1gKVxuICAgIHJldHVybiBtZXJnZWRUcmFuc2xhdGlvbnNcbiAgfVxuXG4gIGFzeW5jIGdlbmVyYXRlKCkge1xuICAgIHRoaXMubG9nKCdcdUQ4M0NcdURGMEQgU3RhcnRpbmcgZGF0YWJhc2UgaTE4biBnZW5lcmF0aW9uLi4uJylcblxuICAgIHRyeSB7XG4gICAgICAvLyBHZXQgYXZhaWxhYmxlIGxhbmd1YWdlc1xuICAgICAgY29uc3QgbGFuZ3VhZ2VzID0gYXdhaXQgdGhpcy5nZXRUYXJnZXRMYW5ndWFnZXMoKVxuICAgICAgdGhpcy5sb2coYFx1RDgzRFx1RENDQiBUYXJnZXQgbGFuZ3VhZ2VzOiAke2xhbmd1YWdlcy5qb2luKCcsICcpfWApXG5cbiAgICAgIC8vIEdldCB0cmFuc2xhdGlvbiBrZXlzIChmaWx0ZXJlZCBieSBhcHAgaWYgc3BlY2lmaWVkKVxuICAgICAgY29uc3QgYWxsS2V5cyA9IGF3YWl0IHRoaXMuZ2V0RmlsdGVyZWRLZXlzKClcbiAgICAgIHRoaXMubG9nKGBcdUQ4M0RcdUREMTEgUHJvY2Vzc2luZyAke2FsbEtleXMubGVuZ3RofSB0cmFuc2xhdGlvbiBrZXlzYClcblxuICAgICAgLy8gRW5zdXJlIG91dHB1dCBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICB0aGlzLmVuc3VyZU91dHB1dERpcmVjdG9yeSgpXG5cbiAgICAgIC8vIEdlbmVyYXRlIGZpbGVzIGZvciBlYWNoIGxhbmd1YWdlXG4gICAgICBmb3IgKGNvbnN0IGxhbmd1YWdlIG9mIGxhbmd1YWdlcykge1xuICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlTGFuZ3VhZ2VGaWxlKGxhbmd1YWdlLCBhbGxLZXlzKVxuICAgICAgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSBUeXBlU2NyaXB0IGludGVyZmFjZXNcbiAgICAgIHRoaXMuZ2VuZXJhdGVJbnRlcmZhY2VzKGFsbEtleXMpXG5cbiAgICAgIC8vIEdlbmVyYXRlIGluZGV4IGZpbGVcbiAgICAgIHRoaXMuZ2VuZXJhdGVJbmRleEZpbGUobGFuZ3VhZ2VzKVxuXG4gICAgICAvLyBHZW5lcmF0ZSBhcHAtc3BlY2lmaWMgZXhwb3J0IChpZiBidWlsZGluZyBmb3Igc3BlY2lmaWMgYXBwKVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5hcHApIHtcbiAgICAgICAgdGhpcy5nZW5lcmF0ZUFwcEV4cG9ydCh0aGlzLm9wdGlvbnMuYXBwLCBsYW5ndWFnZXMpXG4gICAgICB9XG5cbiAgICAgIHRoaXMubG9nKCdcdTI3MDUgRGF0YWJhc2UgaTE4biBnZW5lcmF0aW9uIGNvbXBsZXRlIScpXG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignXHUyNzRDIEdlbmVyYXRpb24gZmFpbGVkOicsIGVycm9yKVxuICAgICAgcHJvY2Vzcy5leGl0KDEpXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZ2V0VGFyZ2V0TGFuZ3VhZ2VzKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VzKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmxhbmd1YWdlc1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBhY3RpdmVMYW5ndWFnZXMgPSBhd2FpdCB0aGlzLmdldEFjdGl2ZUxhbmd1YWdlcygpXG4gICAgcmV0dXJuIGFjdGl2ZUxhbmd1YWdlcy5tYXAobGFuZyA9PiBsYW5nLmNvZGUpXG4gIH1cblxuICBhc3luYyBnZXRGaWx0ZXJlZEtleXMoKSB7XG4gICAgY29uc3QgYWxsS2V5cyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNsYXRpb25LZXlzKClcbiAgICBjb25zdCBrZXlTdHJpbmdzID0gYWxsS2V5cy5tYXAoa2V5ID0+IGtleS5rZXkpXG5cbiAgICAvLyBVc2Ugb3B0aW9ucy1iYXNlZCBmaWx0ZXJpbmcgZmlyc3QsIHRoZW4gZmFsbGJhY2sgdG8gaGFyZGNvZGVkIGNvbmZpZ1xuICAgIGxldCBpbmNsdWRlU2VjdGlvbnMgPSB0aGlzLm9wdGlvbnMuaW5jbHVkZVNlY3Rpb25zXG4gICAgbGV0IGV4Y2x1ZGVTZWN0aW9ucyA9IHRoaXMub3B0aW9ucy5leGNsdWRlU2VjdGlvbnNcblxuICAgIC8vIElmIG5vIGRpcmVjdCBvcHRpb25zIGFuZCB3ZSBoYXZlIGFuIGFwcCBuYW1lLCBjaGVjayBoYXJkY29kZWQgY29uZmlnXG4gICAgaWYgKCFpbmNsdWRlU2VjdGlvbnMgJiYgIWV4Y2x1ZGVTZWN0aW9ucyAmJiB0aGlzLm9wdGlvbnMuYXBwKSB7XG4gICAgICBjb25zdCBjb25maWcgPSBBUFBfU0VDVElPTl9DT05GSUdbdGhpcy5vcHRpb25zLmFwcF1cbiAgICAgIGlmIChjb25maWcpIHtcbiAgICAgICAgaW5jbHVkZVNlY3Rpb25zID0gY29uZmlnLmluY2x1ZGVkXG4gICAgICAgIGV4Y2x1ZGVTZWN0aW9ucyA9IGNvbmZpZy5leGNsdWRlZFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIG5vIGZpbHRlcmluZyBvcHRpb25zIGF0IGFsbCwgcmV0dXJuIGFsbCBrZXlzXG4gICAgaWYgKCFpbmNsdWRlU2VjdGlvbnMgJiYgIWV4Y2x1ZGVTZWN0aW9ucykge1xuICAgICAgdGhpcy5sb2coYFx1RDgzRFx1RENFNiBObyBzZWN0aW9uIGZpbHRlcmluZyAtIGluY2x1ZGluZyBhbGwgJHtrZXlTdHJpbmdzLmxlbmd0aH0ga2V5c2ApXG4gICAgICByZXR1cm4ga2V5U3RyaW5nc1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBrZXlzIGJhc2VkIG9uIGNvbmZpZ3VyYXRpb25cbiAgICBsZXQgZmlsdGVyZWRLZXlzID0ga2V5U3RyaW5nc1xuXG4gICAgaWYgKGluY2x1ZGVTZWN0aW9ucykge1xuICAgICAgLy8gT25seSBpbmNsdWRlIHNwZWNpZmllZCBzZWN0aW9uc1xuICAgICAgZmlsdGVyZWRLZXlzID0ga2V5U3RyaW5ncy5maWx0ZXIoa2V5ID0+IFxuICAgICAgICBpbmNsdWRlU2VjdGlvbnMuc29tZShzZWN0aW9uID0+IGtleS5zdGFydHNXaXRoKGAke3NlY3Rpb259LmApKVxuICAgICAgKVxuICAgICAgdGhpcy5sb2coYFx1RDgzRFx1RENFNiBJbmNsdWRpbmcgc2VjdGlvbnM6ICR7aW5jbHVkZVNlY3Rpb25zLmpvaW4oJywgJyl9YClcbiAgICB9XG5cbiAgICBpZiAoZXhjbHVkZVNlY3Rpb25zKSB7XG4gICAgICAvLyBFeGNsdWRlIHNwZWNpZmllZCBzZWN0aW9uc1xuICAgICAgZmlsdGVyZWRLZXlzID0gZmlsdGVyZWRLZXlzLmZpbHRlcihrZXkgPT4gXG4gICAgICAgICFleGNsdWRlU2VjdGlvbnMuc29tZShzZWN0aW9uID0+IGtleS5zdGFydHNXaXRoKGAke3NlY3Rpb259LmApKVxuICAgICAgKVxuICAgICAgdGhpcy5sb2coYFx1RDgzRFx1REVBQiBFeGNsdWRpbmcgc2VjdGlvbnM6ICR7ZXhjbHVkZVNlY3Rpb25zLmpvaW4oJywgJyl9YClcbiAgICB9XG5cbiAgICBjb25zdCBhcHBOYW1lID0gdGhpcy5vcHRpb25zLmFwcCB8fCAnY3VycmVudCBhcHAnXG4gICAgdGhpcy5sb2coYFx1RDgzQ1x1REZBRiBGaWx0ZXJlZCAke2tleVN0cmluZ3MubGVuZ3RofSBcdTIxOTIgJHtmaWx0ZXJlZEtleXMubGVuZ3RofSBrZXlzIGZvciAke2FwcE5hbWV9YClcbiAgICByZXR1cm4gZmlsdGVyZWRLZXlzXG4gIH1cblxuICBhc3luYyBnZW5lcmF0ZUxhbmd1YWdlRmlsZShsYW5ndWFnZSwga2V5cykge1xuICAgIHRoaXMubG9nKGBcdUQ4M0RcdURDREQgR2VuZXJhdGluZyAke2xhbmd1YWdlfS50cy4uLmApXG5cbiAgICB0cnkge1xuICAgICAgLy8gR2V0IHRyYW5zbGF0aW9ucyBmb3IgdGhpcyBsYW5ndWFnZVxuICAgICAgY29uc3QgYWxsVHJhbnNsYXRpb25zID0gYXdhaXQgdGhpcy5nZXRUcmFuc2xhdGlvbnNGb3JMYW5ndWFnZShsYW5ndWFnZSlcbiAgICAgIFxuICAgICAgLy8gRmlsdGVyIHRvIG9ubHkgaW5jbHVkZSBvdXIgdGFyZ2V0IGtleXNcbiAgICAgIGNvbnN0IGZpbHRlcmVkVHJhbnNsYXRpb25zID0ge31cbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgaWYgKGFsbFRyYW5zbGF0aW9uc1trZXldKSB7XG4gICAgICAgICAgZmlsdGVyZWRUcmFuc2xhdGlvbnNba2V5XSA9IGFsbFRyYW5zbGF0aW9uc1trZXldXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ29udmVydCBmbGF0IHRyYW5zbGF0aW9ucyB0byBuZXN0ZWQgc3RydWN0dXJlXG4gICAgICBjb25zdCBuZXN0ZWRUcmFuc2xhdGlvbnMgPSB0aGlzLmNyZWF0ZU5lc3RlZFN0cnVjdHVyZShmaWx0ZXJlZFRyYW5zbGF0aW9ucylcblxuICAgICAgLy8gR2VuZXJhdGUgVHlwZVNjcmlwdCBjb250ZW50XG4gICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5nZW5lcmF0ZVR5cGVTY3JpcHRDb250ZW50KGxhbmd1YWdlLCBuZXN0ZWRUcmFuc2xhdGlvbnMpXG5cbiAgICAgIC8vIFdyaXRlIGZpbGVcbiAgICAgIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4odGhpcy5iYXNlT3V0cHV0RGlyLCBgJHtsYW5ndWFnZX0udHNgKVxuICAgICAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50LCAndXRmLTgnKVxuXG4gICAgICB0aGlzLmxvZyhgXHUyNzA1IEdlbmVyYXRlZCAke2xhbmd1YWdlfS50cyAoJHtPYmplY3Qua2V5cyhmaWx0ZXJlZFRyYW5zbGF0aW9ucykubGVuZ3RofSBrZXlzKWApXG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgXHUyNzRDIEZhaWxlZCB0byBnZW5lcmF0ZSAke2xhbmd1YWdlfS50czpgLCBlcnJvcilcbiAgICAgIHRocm93IGVycm9yXG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTmVzdGVkU3RydWN0dXJlKHRyYW5zbGF0aW9ucykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9XG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0cmFuc2xhdGlvbnMpKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGtleS5zcGxpdCgnLicpXG4gICAgICBsZXQgY3VycmVudCA9IHJlc3VsdFxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV1cbiAgICAgICAgaWYgKCFjdXJyZW50W3BhcnRdKSB7XG4gICAgICAgICAgY3VycmVudFtwYXJ0XSA9IHt9XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFydF1cbiAgICAgIH1cblxuICAgICAgY3VycmVudFtwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIGdlbmVyYXRlVHlwZVNjcmlwdENvbnRlbnQobGFuZ3VhZ2UsIHRyYW5zbGF0aW9ucykge1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIGNvbnN0IGFwcCA9IHRoaXMub3B0aW9ucy5hcHAgPyBgIGZvciBhcHA6ICR7dGhpcy5vcHRpb25zLmFwcH1gIDogJydcbiAgICBcbiAgICByZXR1cm4gYC8qKlxuICogR2VuZXJhdGVkIHRyYW5zbGF0aW9uIGZpbGUgZm9yICR7bGFuZ3VhZ2V9JHthcHB9XG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHt0aW1lc3RhbXB9XG4gKiBTb3VyY2U6IFRpa28gdHJhbnNsYXRpb24gZGF0YWJhc2VcbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICogXHUyNkEwXHVGRTBGICBDaGFuZ2VzIHdpbGwgYmUgb3ZlcndyaXR0ZW4gb24gbmV4dCBnZW5lcmF0aW9uXG4gKiBcbiAqIFRvIHVwZGF0ZSB0cmFuc2xhdGlvbnM6XG4gKiAxLiBFZGl0IHRyYW5zbGF0aW9ucyBpbiB0aGUgYWRtaW4gZGFzaGJvYXJkXG4gKiAyLiBSdW46IHBucG0gcnVuIGdlbmVyYXRlOmkxOG5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5cbmNvbnN0IHRyYW5zbGF0aW9uczogVHJhbnNsYXRpb25zID0gJHtKU09OLnN0cmluZ2lmeSh0cmFuc2xhdGlvbnMsIG51bGwsIDIpfVxuXG5leHBvcnQgZGVmYXVsdCB0cmFuc2xhdGlvbnNcbmV4cG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi90eXBlcydcbmBcbiAgfVxuXG4gIGdlbmVyYXRlSW50ZXJmYWNlcyhrZXlzKSB7XG4gICAgdGhpcy5sb2coJ1x1RDgzRFx1REQyNyBHZW5lcmF0aW5nIFR5cGVTY3JpcHQgaW50ZXJmYWNlcy4uLicpXG5cbiAgICAvLyBDcmVhdGUgYSBzYW1wbGUgbmVzdGVkIHN0cnVjdHVyZSB0byBkZXJpdmUgdHlwZXNcbiAgICBjb25zdCBzYW1wbGVUcmFuc2xhdGlvbnMgPSB7fVxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBzYW1wbGVUcmFuc2xhdGlvbnNba2V5XSA9ICdzdHJpbmcnXG4gICAgfSlcblxuICAgIGNvbnN0IG5lc3RlZFN0cnVjdHVyZSA9IHRoaXMuY3JlYXRlTmVzdGVkU3RydWN0dXJlKHNhbXBsZVRyYW5zbGF0aW9ucylcbiAgICBjb25zdCBpbnRlcmZhY2VDb250ZW50ID0gdGhpcy5nZW5lcmF0ZUludGVyZmFjZUNvbnRlbnQobmVzdGVkU3RydWN0dXJlKVxuXG4gICAgY29uc3QgY29udGVudCA9IGAvKipcbiAqIFR5cGVTY3JpcHQgaW50ZXJmYWNlcyBmb3IgdHJhbnNsYXRpb24gZmlsZXNcbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNsYXRpb25zIHtcbiR7aW50ZXJmYWNlQ29udGVudH1cbn1cblxuLy8gSGVscGVyIHR5cGUgZm9yIHN0cm9uZ2x5IHR5cGVkIHRyYW5zbGF0aW9uIGtleXNcbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uS2V5ID0gJHtrZXlzLm1hcChrZXkgPT4gYCcke2tleX0nYCkuam9pbignIHwgJyl9XG5cbi8vIEhlbHBlciB0eXBlIGZvciBuZXN0ZWQga2V5IGFjY2Vzc1xuZXhwb3J0IHR5cGUgTmVzdGVkS2V5T2Y8T2JqZWN0VHlwZSBleHRlbmRzIG9iamVjdD4gPSB7XG4gIFtLZXkgaW4ga2V5b2YgT2JqZWN0VHlwZSAmIChzdHJpbmcgfCBudW1iZXIpXTogT2JqZWN0VHlwZVtLZXldIGV4dGVuZHMgb2JqZWN0XG4gICAgPyBcXGBcXCR7S2V5fS5cXCR7TmVzdGVkS2V5T2Y8T2JqZWN0VHlwZVtLZXldPn1cXGBcbiAgICA6IFxcYFxcJHtLZXl9XFxgXG59W2tleW9mIE9iamVjdFR5cGUgJiAoc3RyaW5nIHwgbnVtYmVyKV1cblxuZXhwb3J0IHR5cGUgVHJhbnNsYXRpb25LZXlQYXRoID0gTmVzdGVkS2V5T2Y8VHJhbnNsYXRpb25zPlxuYFxuXG4gICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbih0aGlzLmJhc2VPdXRwdXREaXIsICd0eXBlcy50cycpXG4gICAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50LCAndXRmLTgnKVxuXG4gICAgdGhpcy5sb2coJ1x1MjcwNSBHZW5lcmF0ZWQgdHlwZXMudHMnKVxuICB9XG5cbiAgZ2VuZXJhdGVJbnRlcmZhY2VDb250ZW50KG9iaiwgaW5kZW50ID0gJyAgJykge1xuICAgIGNvbnN0IGxpbmVzID0gW11cblxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9iaikpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fSR7a2V5fTogc3RyaW5nYClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmVzLnB1c2goYCR7aW5kZW50fSR7a2V5fToge2ApXG4gICAgICAgIGxpbmVzLnB1c2godGhpcy5nZW5lcmF0ZUludGVyZmFjZUNvbnRlbnQodmFsdWUsIGluZGVudCArICcgICcpKVxuICAgICAgICBsaW5lcy5wdXNoKGAke2luZGVudH19YClcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGluZXMuam9pbignXFxuJylcbiAgfVxuXG4gIGdlbmVyYXRlSW5kZXhGaWxlKGxhbmd1YWdlcykge1xuICAgIHRoaXMubG9nKCdcdUQ4M0RcdURDQzcgR2VuZXJhdGluZyBpbmRleC50cy4uLicpXG5cbiAgICBjb25zdCBjb250ZW50ID0gYC8qKlxuICogR2VuZXJhdGVkIHRyYW5zbGF0aW9uIGluZGV4IGZpbGVcbiAqIFxuICogVGhpcyBmaWxlIHByb3ZpZGVzIGVhc3kgYWNjZXNzIHRvIGFsbCBnZW5lcmF0ZWQgdHJhbnNsYXRpb24gZmlsZXNcbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICovXG5cbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi90eXBlcydcblxuLy8gSW1wb3J0IGFsbCBsYW5ndWFnZSBmaWxlc1xuJHtsYW5ndWFnZXMubWFwKChsYW5nKSA9PiBcbiAgYGltcG9ydCAke2xhbmcucmVwbGFjZSgnLScsICdfJyl9IGZyb20gJy4vJHtsYW5nfSdgXG4pLmpvaW4oJ1xcbicpfVxuXG4vLyBFeHBvcnQgbGFuZ3VhZ2UgY29uc3RhbnRzXG5leHBvcnQgY29uc3QgQVZBSUxBQkxFX0xBTkdVQUdFUyA9ICR7SlNPTi5zdHJpbmdpZnkobGFuZ3VhZ2VzLCBudWxsLCAyKX0gYXMgY29uc3RcblxuZXhwb3J0IHR5cGUgQXZhaWxhYmxlTGFuZ3VhZ2UgPSB0eXBlb2YgQVZBSUxBQkxFX0xBTkdVQUdFU1tudW1iZXJdXG5cbi8vIEV4cG9ydCBhbGwgdHJhbnNsYXRpb25zIGluIGEgbWFwXG5leHBvcnQgY29uc3QgdHJhbnNsYXRpb25zOiBSZWNvcmQ8QXZhaWxhYmxlTGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucz4gPSB7XG4ke2xhbmd1YWdlcy5tYXAoKGxhbmcpID0+IGAgICcke2xhbmd9JzogJHtsYW5nLnJlcGxhY2UoJy0nLCAnXycpfWApLmpvaW4oJyxcXG4nKX1cbn1cblxuLy8gRXhwb3J0IGluZGl2aWR1YWwgbGFuZ3VhZ2VzXG5leHBvcnQge1xuJHtsYW5ndWFnZXMubWFwKChsYW5nKSA9PiBgICAke2xhbmcucmVwbGFjZSgnLScsICdfJyl9IGFzICR7bGFuZy5yZXBsYWNlKCctJywgJ18nKX1gKS5qb2luKCcsXFxuJyl9XG59XG5cbi8vIEV4cG9ydCB0eXBlc1xuZXhwb3J0IHR5cGUgeyBUcmFuc2xhdGlvbnMsIFRyYW5zbGF0aW9uS2V5LCBUcmFuc2xhdGlvbktleVBhdGggfSBmcm9tICcuL3R5cGVzJ1xuXG4vKipcbiAqIEdldCB0cmFuc2xhdGlvbnMgZm9yIGEgc3BlY2lmaWMgbGFuZ3VhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9ucyhsYW5ndWFnZTogQXZhaWxhYmxlTGFuZ3VhZ2UpOiBUcmFuc2xhdGlvbnMge1xuICByZXR1cm4gdHJhbnNsYXRpb25zW2xhbmd1YWdlXVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgbGFuZ3VhZ2UgaXMgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0xhbmd1YWdlU3VwcG9ydGVkKGxhbmd1YWdlOiBzdHJpbmcpOiBsYW5ndWFnZSBpcyBBdmFpbGFibGVMYW5ndWFnZSB7XG4gIHJldHVybiBBVkFJTEFCTEVfTEFOR1VBR0VTLmluY2x1ZGVzKGxhbmd1YWdlIGFzIEF2YWlsYWJsZUxhbmd1YWdlKVxufVxuYFxuXG4gICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbih0aGlzLmJhc2VPdXRwdXREaXIsICdpbmRleC50cycpXG4gICAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50LCAndXRmLTgnKVxuXG4gICAgdGhpcy5sb2coJ1x1MjcwNSBHZW5lcmF0ZWQgaW5kZXgudHMnKVxuICB9XG5cbiAgZ2VuZXJhdGVBcHBFeHBvcnQoYXBwLCBsYW5ndWFnZXMpIHtcbiAgICB0aGlzLmxvZyhgXHVEODNEXHVEQ0YxIEdlbmVyYXRpbmcgYXBwIGV4cG9ydCBmb3IgJHthcHB9Li4uYClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBgLyoqXG4gKiBBcHAtc3BlY2lmaWMgdHJhbnNsYXRpb25zIGV4cG9ydCBmb3IgJHthcHB9XG4gKiBcbiAqIFRoaXMgZmlsZSBpcyBvcHRpbWl6ZWQgZm9yIHRoZSAke2FwcH0gYXBwIGFuZCBvbmx5IGNvbnRhaW5zXG4gKiByZWxldmFudCB0cmFuc2xhdGlvbiBzZWN0aW9ucy5cbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICovXG5cbmV4cG9ydCB7IFxuICB0cmFuc2xhdGlvbnMsXG4gIGdldFRyYW5zbGF0aW9ucyxcbiAgaXNMYW5ndWFnZVN1cHBvcnRlZCxcbiAgQVZBSUxBQkxFX0xBTkdVQUdFU1xufSBmcm9tICcuL2luZGV4J1xuXG5leHBvcnQgdHlwZSB7IFxuICBUcmFuc2xhdGlvbnMsIFxuICBUcmFuc2xhdGlvbktleSwgXG4gIFRyYW5zbGF0aW9uS2V5UGF0aCxcbiAgQXZhaWxhYmxlTGFuZ3VhZ2UgXG59IGZyb20gJy4vaW5kZXgnXG5cbi8vIEFwcC1zcGVjaWZpYyByZS1leHBvcnRzIGZvciBjb252ZW5pZW5jZVxuZXhwb3J0IGNvbnN0IEFQUF9OQU1FID0gJyR7YXBwfSdcbmV4cG9ydCBjb25zdCBBUFBfVFJBTlNMQVRJT05TID0gdHJhbnNsYXRpb25zXG5gXG5cbiAgICBjb25zdCBvdXRwdXRQYXRoID0gcGF0aC5qb2luKHRoaXMuYmFzZU91dHB1dERpciwgYCR7YXBwfS50c2ApXG4gICAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXRQYXRoLCBjb250ZW50LCAndXRmLTgnKVxuXG4gICAgdGhpcy5sb2coYFx1MjcwNSBHZW5lcmF0ZWQgJHthcHB9LnRzYClcbiAgfVxuXG4gIGVuc3VyZU91dHB1dERpcmVjdG9yeSgpIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5iYXNlT3V0cHV0RGlyKSkge1xuICAgICAgZnMubWtkaXJTeW5jKHRoaXMuYmFzZU91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICAgIHRoaXMubG9nKGBcdUQ4M0RcdURDQzEgQ3JlYXRlZCBvdXRwdXQgZGlyZWN0b3J5OiAke3RoaXMuYmFzZU91dHB1dERpcn1gKVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSAuZ2l0aWdub3JlIHRvIGV4Y2x1ZGUgZ2VuZXJhdGVkIGZpbGVzXG4gICAgY29uc3QgZ2l0aWdub3JlUGF0aCA9IHBhdGguam9pbih0aGlzLmJhc2VPdXRwdXREaXIsICcuZ2l0aWdub3JlJylcbiAgICBjb25zdCBnaXRpZ25vcmVDb250ZW50ID0gYCMgQXV0by1nZW5lcmF0ZWQgdHJhbnNsYXRpb24gZmlsZXNcbiMgVGhlc2UgZmlsZXMgYXJlIGdlbmVyYXRlZCBmcm9tIHRoZSBkYXRhYmFzZSBhbmQgc2hvdWxkIG5vdCBiZSBjb21taXR0ZWRcblxuKi50c1xuKi5qc1xuKi5kLnRzXG4hLmdpdGlnbm9yZVxuXG4jIEtlZXAgdGhpcyBkaXJlY3RvcnkgYnV0IGlnbm9yZSBhbGwgZ2VuZXJhdGVkIGNvbnRlbnRcbmBcblxuICAgIGZzLndyaXRlRmlsZVN5bmMoZ2l0aWdub3JlUGF0aCwgZ2l0aWdub3JlQ29udGVudCwgJ3V0Zi04JylcbiAgfVxuXG4gIGxvZyhtZXNzYWdlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy52ZXJib3NlICE9PSBmYWxzZSkge1xuICAgICAgY29uc29sZS5sb2cobWVzc2FnZSlcbiAgICB9XG4gIH1cbn1cblxuLy8gQ0xJIGFyZ3VtZW50IHBhcnNpbmdcbmZ1bmN0aW9uIHBhcnNlQXJncygpIHtcbiAgY29uc3QgYXJncyA9IHByb2Nlc3MuYXJndi5zbGljZSgyKVxuICBjb25zdCBvcHRpb25zID0ge31cblxuICBmb3IgKGNvbnN0IGFyZyBvZiBhcmdzKSB7XG4gICAgaWYgKGFyZy5zdGFydHNXaXRoKCctLWFwcD0nKSkge1xuICAgICAgb3B0aW9ucy5hcHAgPSBhcmcuc3BsaXQoJz0nKVsxXVxuICAgIH0gZWxzZSBpZiAoYXJnLnN0YXJ0c1dpdGgoJy0tbGFuZ3VhZ2VzPScpKSB7XG4gICAgICBvcHRpb25zLmxhbmd1YWdlcyA9IGFyZy5zcGxpdCgnPScpWzFdLnNwbGl0KCcsJylcbiAgICB9IGVsc2UgaWYgKGFyZy5zdGFydHNXaXRoKCctLW91dHB1dD0nKSkge1xuICAgICAgb3B0aW9ucy5vdXRwdXREaXIgPSBhcmcuc3BsaXQoJz0nKVsxXVxuICAgIH0gZWxzZSBpZiAoYXJnID09PSAnLS1wcm9kdWN0aW9uJykge1xuICAgICAgb3B0aW9ucy5wcm9kdWN0aW9uID0gdHJ1ZVxuICAgIH0gZWxzZSBpZiAoYXJnID09PSAnLS12ZXJib3NlJykge1xuICAgICAgb3B0aW9ucy52ZXJib3NlID0gdHJ1ZVxuICAgIH0gZWxzZSBpZiAoYXJnID09PSAnLS1xdWlldCcpIHtcbiAgICAgIG9wdGlvbnMudmVyYm9zZSA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnNcbn1cblxuLy8gTWFpbiBleGVjdXRpb25cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIGNvbnN0IG9wdGlvbnMgPSBwYXJzZUFyZ3MoKVxuICBjb25zdCBnZW5lcmF0b3IgPSBuZXcgRGF0YWJhc2VJMThuR2VuZXJhdG9yKG9wdGlvbnMpXG4gIGF3YWl0IGdlbmVyYXRvci5nZW5lcmF0ZSgpXG59XG5cbi8vIFJ1biBpZiBjYWxsZWQgZGlyZWN0bHlcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBtYWluKCkuY2F0Y2goZXJyb3IgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0dlbmVyYXRpb24gZmFpbGVkOicsIGVycm9yKVxuICAgIHByb2Nlc3MuZXhpdCgxKVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgRGF0YWJhc2VJMThuR2VuZXJhdG9yIH0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9ub1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3ZpdGUuY29uZmlnLmJhc2UuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3ZpdGUuY29uZmlnLmJhc2UuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2VzcydcbmltcG9ydCBmcyBmcm9tICdmcydcbmltcG9ydCB7IHZpdGVCdWlsZEluZm8gfSBmcm9tICcuL3NjcmlwdHMvdml0ZS1wbHVnaW4tYnVpbGQtaW5mby5qcydcbmltcG9ydCB7IGNyZWF0ZUFwcEkxOG5QbHVnaW4gfSBmcm9tICcuL3NjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi1zaW1wbGUuanMnXG5pbXBvcnQgeyBpMThuV29ya2VyUGx1Z2luIH0gZnJvbSAnLi9zY3JpcHRzL3ZpdGUtcGx1Z2luLWkxOG4td29ya2VyLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVml0ZUNvbmZpZyhkaXJuYW1lLCBwb3J0ID0gMzAwMCwgcHdhQ29uZmlnID0gbnVsbCwgYXBwTmFtZSA9IG51bGwsIGkxOG5Db25maWcgPSBudWxsKSB7XG4gIGxldCBidWlsZEluZm8gPSBudWxsO1xuICBcbiAgLy8gSW5qZWN0IGJ1aWxkIGluZm8gYmVmb3JlIGJ1aWxkXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNTeW5jKGBub2RlICR7cGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NjcmlwdHMvaW5qZWN0LWJ1aWxkLWluZm8uanMnKX0gJHtkaXJuYW1lfWAsIHtcbiAgICAgICAgc3RkaW86ICdpbmhlcml0J1xuICAgICAgfSlcbiAgICAgIFxuICAgICAgLy8gUmVhZCB0aGUgZ2VuZXJhdGVkIGJ1aWxkIGluZm8gZm9yIHRoZSBwbHVnaW5cbiAgICAgIGNvbnN0IGJ1aWxkSW5mb1BhdGggPSBwYXRoLmpvaW4oZGlybmFtZSwgJ3B1YmxpYycsICdidWlsZC1pbmZvLmpzb24nKTtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGJ1aWxkSW5mb1BhdGgpKSB7XG4gICAgICAgIGJ1aWxkSW5mbyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKGJ1aWxkSW5mb1BhdGgsICd1dGY4JykpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBpbmplY3QgYnVpbGQgaW5mbzonLCBlcnJvci5tZXNzYWdlKVxuICAgIH1cbiAgfVxuICBcbiAgY29uc3QgcGx1Z2lucyA9IFt2dWUoKV1cbiAgXG4gIC8vIEFkZCBpMThuIGdlbmVyYXRpb24gcGx1Z2luIGlmIGFwcCBuYW1lIGlzIHByb3ZpZGVkXG4gIGlmIChhcHBOYW1lKSB7XG4gICAgY29uc3QgaTE4bk9wdGlvbnMgPSB7XG4gICAgICBhcHA6IGFwcE5hbWUsXG4gICAgICBlbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/ICdwcm9kdWN0aW9uJyA6ICdkZXZlbG9wbWVudCcsXG4gICAgICAuLi4oaTE4bkNvbmZpZyB8fCB7fSlcbiAgICB9XG4gICAgXG4gICAgLy8gVXNlIHdvcmtlci1iYXNlZCBwbHVnaW4gZm9yIHByb2R1Y3Rpb24gYnVpbGRzLCBmYWxsYmFjayB0byBzaW1wbGUgcGx1Z2luIGZvciBkZXZcbiAgICBpZiAocHJvY2Vzcy5lbnYuVVNFX0kxOE5fV09SS0VSID09PSAndHJ1ZScgfHwgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgcGx1Z2lucy5wdXNoKGkxOG5Xb3JrZXJQbHVnaW4oaTE4bk9wdGlvbnMpKVxuICAgIH0gZWxzZSB7XG4gICAgICBwbHVnaW5zLnB1c2goY3JlYXRlQXBwSTE4blBsdWdpbihpMThuT3B0aW9ucykpXG4gICAgfVxuICB9XG4gIFxuICAvLyBBZGQgYnVpbGQgaW5mbyBwbHVnaW4gaWYgd2UgaGF2ZSBidWlsZCBpbmZvcm1hdGlvblxuICBpZiAoYnVpbGRJbmZvKSB7XG4gICAgcGx1Z2lucy5wdXNoKHZpdGVCdWlsZEluZm8oYnVpbGRJbmZvKSlcbiAgfVxuICBcbiAgaWYgKHB3YUNvbmZpZykge1xuICAgIHBsdWdpbnMucHVzaChWaXRlUFdBKHB3YUNvbmZpZykpXG4gIH1cblxuICByZXR1cm4gZGVmaW5lQ29uZmlnKHtcbiAgICBwbHVnaW5zLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKGRpcm5hbWUsICcuL3NyYycpLFxuICAgICAgICAnQHRpa28vdWknOiBwYXRoLnJlc29sdmUoZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL3VpL3NyYycpLFxuICAgICAgICAnQHRpa28vY29yZSc6IHBhdGgucmVzb2x2ZShkaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvY29yZS9zcmMnKVxuICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0LFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIGNvcnM6IHRydWUsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDYWNoZS1Db250cm9sJzogJ25vLWNhY2hlLCBuby1zdG9yZSwgbXVzdC1yZXZhbGlkYXRlJyxcbiAgICAgICAgJ1ByYWdtYSc6ICduby1jYWNoZScsXG4gICAgICAgICdFeHBpcmVzJzogJzAnXG4gICAgICB9XG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICd2dWUtdmVuZG9yJzogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYSddLFxuICAgICAgICAgICAgJ3Rpa28tdmVuZG9yJzogWydAdGlrby91aScsICdAdGlrby9jb3JlJ11cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYScsICdAdGlrby91aScsICdAdGlrby9jb3JlJywgJ29wZW4taWNvbiddXG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgIF9fVlVFX09QVElPTlNfQVBJX186IHRydWUsXG4gICAgICBfX1ZVRV9QUk9EX0RFVlRPT0xTX186IGZhbHNlLFxuICAgICAgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fOiBmYWxzZVxuICAgIH1cbiAgfSlcbn0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0cy92aXRlLXBsdWdpbi1idWlsZC1pbmZvLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9zY3JpcHRzL3ZpdGUtcGx1Z2luLWJ1aWxkLWluZm8uanNcIjsvKipcbiAqIFZpdGUgcGx1Z2luIHRvIGluamVjdCBidWlsZCBpbmZvcm1hdGlvbiBpbnRvIEhUTUwgbWV0YSB0YWdzXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHZpdGVCdWlsZEluZm8oYnVpbGRJbmZvKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtcGx1Z2luLWJ1aWxkLWluZm8nLFxuICAgIHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XG4gICAgICAvLyBDcmVhdGUgbWV0YSB0YWdzIHdpdGggYnVpbGQgaW5mb3JtYXRpb25cbiAgICAgIGNvbnN0IG1ldGFUYWdzID0gW1xuICAgICAgICBgPG1ldGEgbmFtZT1cImJ1aWxkOnZlcnNpb25cIiBjb250ZW50PVwiJHtidWlsZEluZm8udmVyc2lvbn1cIj5gLFxuICAgICAgICBgPG1ldGEgbmFtZT1cImJ1aWxkOm51bWJlclwiIGNvbnRlbnQ9XCIke2J1aWxkSW5mby5idWlsZE51bWJlcn1cIj5gLFxuICAgICAgICBgPG1ldGEgbmFtZT1cImJ1aWxkOmNvbW1pdFwiIGNvbnRlbnQ9XCIke2J1aWxkSW5mby5jb21taXR9XCI+YCxcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJidWlsZDpicmFuY2hcIiBjb250ZW50PVwiJHtidWlsZEluZm8uYnJhbmNofVwiPmAsXG4gICAgICAgIGA8bWV0YSBuYW1lPVwiYnVpbGQ6ZGF0ZVwiIGNvbnRlbnQ9XCIke2J1aWxkSW5mby5idWlsZERhdGV9XCI+YCxcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJidWlsZDplbnZpcm9ubWVudFwiIGNvbnRlbnQ9XCIke2J1aWxkSW5mby5lbnZpcm9ubWVudH1cIj5gLFxuICAgICAgICAvLyBDb21iaW5lZCB2ZXJzaW9uIHN0cmluZyBmb3IgZWFzeSBhY2Nlc3NcbiAgICAgICAgYDxtZXRhIG5hbWU9XCJidWlsZDpmdWxsLXZlcnNpb25cIiBjb250ZW50PVwidiR7YnVpbGRJbmZvLnZlcnNpb259LSR7YnVpbGRJbmZvLmJ1aWxkTnVtYmVyfS0ke2J1aWxkSW5mby5jb21taXR9XCI+YCxcbiAgICAgICAgLy8gR2VuZXJhdG9yIHRhZ1xuICAgICAgICBgPG1ldGEgbmFtZT1cImdlbmVyYXRvclwiIGNvbnRlbnQ9XCJUaWtvIFBsYXRmb3JtIHYke2J1aWxkSW5mby52ZXJzaW9ufVwiPmBcbiAgICAgIF0uam9pbignXFxuICAgICcpO1xuXG4gICAgICAvLyBJbmplY3QgbWV0YSB0YWdzIGludG8gaGVhZFxuICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZShcbiAgICAgICAgJzwvaGVhZD4nLFxuICAgICAgICBgICAgIDwhLS0gQnVpbGQgSW5mb3JtYXRpb24gLS0+XFxuICAgICR7bWV0YVRhZ3N9XFxuICA8L2hlYWQ+YFxuICAgICAgKTtcbiAgICB9XG4gIH07XG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi1zaW1wbGUuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi1zaW1wbGUuanNcIjsvKipcbiAqIFNpbXBsZSBWaXRlIFBsdWdpbiBmb3IgSTE4biBHZW5lcmF0aW9uXG4gKiBcbiAqIFRoaXMgcGx1Z2luIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVzIHRyYW5zbGF0aW9uIGZpbGVzIGR1cmluZyB0aGUgYnVpbGQgcHJvY2Vzc1xuICogZm9yIHNwZWNpZmljIGFwcHMuXG4gKi9cblxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuLy8gSW1wb3J0IHRoZSBkYXRhYmFzZSBnZW5lcmF0b3IgZm9yIGFjdHVhbCBkYXRhXG5jb25zdCB7IERhdGFiYXNlSTE4bkdlbmVyYXRvciB9ID0gcmVxdWlyZSgnLi9nZW5lcmF0ZS1pMThuLWRhdGFiYXNlLmpzJylcblxuLy8gTW9jayB0cmFuc2xhdGlvbiBkYXRhIGZvciB0ZXN0aW5nXG5jb25zdCBNT0NLX0xBTkdVQUdFUyA9IFsnZW4nLCAnbmwnLCAnZnInLCAnZGUnXVxuXG5jb25zdCBNT0NLX1RSQU5TTEFUSU9OUyA9IHtcbiAgJ2NvbW1vbi5zYXZlJzoge1xuICAgIGVuOiAnU2F2ZScsXG4gICAgbmw6ICdPcHNsYWFuJyxcbiAgICBmcjogJ0VucmVnaXN0cmVyJyxcbiAgICBkZTogJ1NwZWljaGVybidcbiAgfSxcbiAgJ2NvbW1vbi5jYW5jZWwnOiB7XG4gICAgZW46ICdDYW5jZWwnLFxuICAgIG5sOiAnQW5udWxlcmVuJyxcbiAgICBmcjogJ0FubnVsZXInLFxuICAgIGRlOiAnQWJicmVjaGVuJ1xuICB9LFxuICAnY29tbW9uLmxvYWRpbmcnOiB7XG4gICAgZW46ICdMb2FkaW5nLi4uJyxcbiAgICBubDogJ0xhZGVuLi4uJyxcbiAgICBmcjogJ0NoYXJnZW1lbnQuLi4nLFxuICAgIGRlOiAnTGFkZW4uLi4nXG4gIH0sXG4gICd0aW1lci5zdGFydCc6IHtcbiAgICBlbjogJ1N0YXJ0IFRpbWVyJyxcbiAgICBubDogJ1RpbWVyIFN0YXJ0ZW4nLFxuICAgIGZyOiAnRFx1MDBFOW1hcnJlciBsZSBtaW51dGV1cicsXG4gICAgZGU6ICdUaW1lciBzdGFydGVuJ1xuICB9LFxuICAndGltZXIucGF1c2UnOiB7XG4gICAgZW46ICdQYXVzZScsXG4gICAgbmw6ICdQYXV6ZXJlbicsXG4gICAgZnI6ICdQYXVzZScsXG4gICAgZGU6ICdQYXVzaWVyZW4nXG4gIH0sXG4gICd0aW1lci5yZXNldCc6IHtcbiAgICBlbjogJ1Jlc2V0JyxcbiAgICBubDogJ1Jlc2V0JyxcbiAgICBmcjogJ1JcdTAwRTlpbml0aWFsaXNlcicsXG4gICAgZGU6ICdadXJcdTAwRkNja3NldHplbidcbiAgfSxcbiAgJ2FkbWluLnVzZXJzJzoge1xuICAgIGVuOiAnVXNlcnMnLFxuICAgIG5sOiAnR2VicnVpa2VycycsXG4gICAgZnI6ICdVdGlsaXNhdGV1cnMnLFxuICAgIGRlOiAnQmVudXR6ZXInXG4gIH0sXG4gICdhZG1pbi5zZXR0aW5ncyc6IHtcbiAgICBlbjogJ1NldHRpbmdzJyxcbiAgICBubDogJ0luc3RlbGxpbmdlbicsXG4gICAgZnI6ICdQYXJhbVx1MDBFOHRyZXMnLFxuICAgIGRlOiAnRWluc3RlbGx1bmdlbidcbiAgfVxufVxuXG4vLyBDb25maWd1cmF0aW9uIGZvciBzZWN0aW9uIGZpbHRlcmluZyBwZXIgYXBwXG5jb25zdCBBUFBfU0VDVElPTl9DT05GSUcgPSB7XG4gICd5ZXMtbm8nOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ3RpbWVyJzoge1xuICAgIGV4Y2x1ZGVkOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG4gIH0sXG4gICdyYWRpbyc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50JywgJ21lZGlhJywgJ2NvbnRlbnQnXVxuICB9LFxuICAnY2FyZHMnOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ3RvZG8nOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ3R5cGUnOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfSxcbiAgJ2FkbWluJzoge1xuICAgIC8vIEFkbWluIGluY2x1ZGVzIGV2ZXJ5dGhpbmdcbiAgICBleGNsdWRlZDogW11cbiAgfSxcbiAgJ21hcmtldGluZyc6IHtcbiAgICBleGNsdWRlZDogWydhZG1pbicsICdkZXBsb3ltZW50J11cbiAgfSxcbiAgJ3VpLWRvY3MnOiB7XG4gICAgZXhjbHVkZWQ6IFsnYWRtaW4nLCAnZGVwbG95bWVudCcsICdtZWRpYScsICdjb250ZW50J11cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVOZXN0ZWRTdHJ1Y3R1cmUodHJhbnNsYXRpb25zKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9XG5cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModHJhbnNsYXRpb25zKSkge1xuICAgIGNvbnN0IHBhcnRzID0ga2V5LnNwbGl0KCcuJylcbiAgICBsZXQgY3VycmVudCA9IHJlc3VsdFxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXVxuICAgICAgaWYgKCFjdXJyZW50W3BhcnRdKSB7XG4gICAgICAgIGN1cnJlbnRbcGFydF0gPSB7fVxuICAgICAgfVxuICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFydF1cbiAgICB9XG5cbiAgICBjdXJyZW50W3BhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXSA9IHZhbHVlXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVHlwZVNjcmlwdENvbnRlbnQobGFuZ3VhZ2UsIHRyYW5zbGF0aW9ucywgYXBwKSB7XG4gIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICBjb25zdCBhcHBTdWZmaXggPSBhcHAgPyBgIGZvciBhcHA6ICR7YXBwfWAgOiAnJ1xuICBcbiAgcmV0dXJuIGAvKipcbiAqIEdlbmVyYXRlZCB0cmFuc2xhdGlvbiBmaWxlIGZvciAke2xhbmd1YWdlfSR7YXBwU3VmZml4fVxuICogXG4gKiBHZW5lcmF0ZWQgb246ICR7dGltZXN0YW1wfVxuICogU291cmNlOiBUaWtvIHRyYW5zbGF0aW9uIGRhdGFiYXNlXG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqIFx1MjZBMFx1RkUwRiAgQ2hhbmdlcyB3aWxsIGJlIG92ZXJ3cml0dGVuIG9uIG5leHQgZ2VuZXJhdGlvblxuICogXG4gKiBUbyB1cGRhdGUgdHJhbnNsYXRpb25zOlxuICogMS4gRWRpdCB0cmFuc2xhdGlvbnMgaW4gdGhlIGFkbWluIGRhc2hib2FyZFxuICogMi4gUnVuOiBwbnBtIHJ1biBnZW5lcmF0ZTppMThuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL3R5cGVzJ1xuXG5jb25zdCB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9ucyA9ICR7SlNPTi5zdHJpbmdpZnkodHJhbnNsYXRpb25zLCBudWxsLCAyKX1cblxuZXhwb3J0IGRlZmF1bHQgdHJhbnNsYXRpb25zXG5leHBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5gXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW50ZXJmYWNlcyhrZXlzKSB7XG4gIC8vIENyZWF0ZSBhIHNhbXBsZSBuZXN0ZWQgc3RydWN0dXJlIHRvIGRlcml2ZSB0eXBlc1xuICBjb25zdCBzYW1wbGVUcmFuc2xhdGlvbnMgPSB7fVxuICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHNhbXBsZVRyYW5zbGF0aW9uc1trZXldID0gJ3N0cmluZydcbiAgfSlcblxuICBjb25zdCBuZXN0ZWRTdHJ1Y3R1cmUgPSBjcmVhdGVOZXN0ZWRTdHJ1Y3R1cmUoc2FtcGxlVHJhbnNsYXRpb25zKVxuICBjb25zdCBpbnRlcmZhY2VDb250ZW50ID0gZ2VuZXJhdGVJbnRlcmZhY2VDb250ZW50KG5lc3RlZFN0cnVjdHVyZSlcblxuICByZXR1cm4gYC8qKlxuICogVHlwZVNjcmlwdCBpbnRlcmZhY2VzIGZvciB0cmFuc2xhdGlvbiBmaWxlc1xuICogXG4gKiBHZW5lcmF0ZWQgb246ICR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfVxuICogXG4gKiBcdTI2QTBcdUZFMEYgIERPIE5PVCBFRElUIE1BTlVBTExZIC0gVGhpcyBmaWxlIGlzIGF1dG8tZ2VuZXJhdGVkXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2xhdGlvbnMge1xuJHtpbnRlcmZhY2VDb250ZW50fVxufVxuXG4vLyBIZWxwZXIgdHlwZSBmb3Igc3Ryb25nbHkgdHlwZWQgdHJhbnNsYXRpb24ga2V5c1xuZXhwb3J0IHR5cGUgVHJhbnNsYXRpb25LZXkgPSAke2tleXMubWFwKGtleSA9PiBgJyR7a2V5fSdgKS5qb2luKCcgfCAnKX1cblxuLy8gSGVscGVyIHR5cGUgZm9yIG5lc3RlZCBrZXkgYWNjZXNzXG5leHBvcnQgdHlwZSBOZXN0ZWRLZXlPZjxPYmplY3RUeXBlIGV4dGVuZHMgb2JqZWN0PiA9IHtcbiAgW0tleSBpbiBrZXlvZiBPYmplY3RUeXBlICYgKHN0cmluZyB8IG51bWJlcildOiBPYmplY3RUeXBlW0tleV0gZXh0ZW5kcyBvYmplY3RcbiAgICA/IFxcYFxcJHtLZXl9LlxcJHtOZXN0ZWRLZXlPZjxPYmplY3RUeXBlW0tleV0+fVxcYFxuICAgIDogXFxgXFwke0tleX1cXGBcbn1ba2V5b2YgT2JqZWN0VHlwZSAmIChzdHJpbmcgfCBudW1iZXIpXVxuXG5leHBvcnQgdHlwZSBUcmFuc2xhdGlvbktleVBhdGggPSBOZXN0ZWRLZXlPZjxUcmFuc2xhdGlvbnM+XG5gXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW50ZXJmYWNlQ29udGVudChvYmosIGluZGVudCA9ICcgICcpIHtcbiAgY29uc3QgbGluZXMgPSBbXVxuXG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9iaikpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgbGluZXMucHVzaChgJHtpbmRlbnR9JHtrZXl9OiBzdHJpbmdgKVxuICAgIH0gZWxzZSB7XG4gICAgICBsaW5lcy5wdXNoKGAke2luZGVudH0ke2tleX06IHtgKVxuICAgICAgbGluZXMucHVzaChnZW5lcmF0ZUludGVyZmFjZUNvbnRlbnQodmFsdWUsIGluZGVudCArICcgICcpKVxuICAgICAgbGluZXMucHVzaChgJHtpbmRlbnR9fWApXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW5kZXhGaWxlKGxhbmd1YWdlcykge1xuICByZXR1cm4gYC8qKlxuICogR2VuZXJhdGVkIHRyYW5zbGF0aW9uIGluZGV4IGZpbGVcbiAqIFxuICogVGhpcyBmaWxlIHByb3ZpZGVzIGVhc3kgYWNjZXNzIHRvIGFsbCBnZW5lcmF0ZWQgdHJhbnNsYXRpb24gZmlsZXNcbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICovXG5cbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi90eXBlcydcblxuLy8gSW1wb3J0IGFsbCBsYW5ndWFnZSBmaWxlc1xuJHtsYW5ndWFnZXMubWFwKChsYW5nKSA9PiBcbiAgYGltcG9ydCAke2xhbmcucmVwbGFjZSgnLScsICdfJyl9IGZyb20gJy4vJHtsYW5nfSdgXG4pLmpvaW4oJ1xcbicpfVxuXG4vLyBFeHBvcnQgbGFuZ3VhZ2UgY29uc3RhbnRzXG5leHBvcnQgY29uc3QgQVZBSUxBQkxFX0xBTkdVQUdFUyA9ICR7SlNPTi5zdHJpbmdpZnkobGFuZ3VhZ2VzLCBudWxsLCAyKX0gYXMgY29uc3RcblxuZXhwb3J0IHR5cGUgQXZhaWxhYmxlTGFuZ3VhZ2UgPSB0eXBlb2YgQVZBSUxBQkxFX0xBTkdVQUdFU1tudW1iZXJdXG5cbi8vIEV4cG9ydCBhbGwgdHJhbnNsYXRpb25zIGluIGEgbWFwXG5leHBvcnQgY29uc3QgdHJhbnNsYXRpb25zOiBSZWNvcmQ8QXZhaWxhYmxlTGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucz4gPSB7XG4ke2xhbmd1YWdlcy5tYXAoKGxhbmcpID0+IGAgICcke2xhbmd9JzogJHtsYW5nLnJlcGxhY2UoJy0nLCAnXycpfWApLmpvaW4oJyxcXG4nKX1cbn1cblxuLy8gRXhwb3J0IGluZGl2aWR1YWwgbGFuZ3VhZ2VzXG5leHBvcnQge1xuJHtsYW5ndWFnZXMubWFwKChsYW5nKSA9PiBgICAke2xhbmcucmVwbGFjZSgnLScsICdfJyl9IGFzICR7bGFuZy5yZXBsYWNlKCctJywgJ18nKX1gKS5qb2luKCcsXFxuJyl9XG59XG5cbi8vIEV4cG9ydCB0eXBlc1xuZXhwb3J0IHR5cGUgeyBUcmFuc2xhdGlvbnMsIFRyYW5zbGF0aW9uS2V5LCBUcmFuc2xhdGlvbktleVBhdGggfSBmcm9tICcuL3R5cGVzJ1xuXG4vKipcbiAqIEdldCB0cmFuc2xhdGlvbnMgZm9yIGEgc3BlY2lmaWMgbGFuZ3VhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9ucyhsYW5ndWFnZTogQXZhaWxhYmxlTGFuZ3VhZ2UpOiBUcmFuc2xhdGlvbnMge1xuICByZXR1cm4gdHJhbnNsYXRpb25zW2xhbmd1YWdlXVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgbGFuZ3VhZ2UgaXMgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0xhbmd1YWdlU3VwcG9ydGVkKGxhbmd1YWdlOiBzdHJpbmcpOiBsYW5ndWFnZSBpcyBBdmFpbGFibGVMYW5ndWFnZSB7XG4gIHJldHVybiBBVkFJTEFCTEVfTEFOR1VBR0VTLmluY2x1ZGVzKGxhbmd1YWdlIGFzIEF2YWlsYWJsZUxhbmd1YWdlKVxufVxuYFxufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUkxOG5GaWxlcyhvcHRpb25zID0ge30pIHtcbiAgLy8gVHJ5IHRvIHVzZSBkYXRhYmFzZSBnZW5lcmF0b3IgZmlyc3QsIGZhbGxiYWNrIHRvIG1vY2sgZGF0YVxuICB0cnkge1xuICAgIGlmIChwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCAmJiBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZKSB7XG4gICAgICBjb25zdCBnZW5lcmF0b3IgPSBuZXcgRGF0YWJhc2VJMThuR2VuZXJhdG9yKHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgdmVyYm9zZTogb3B0aW9ucy52ZXJib3NlICE9PSBmYWxzZVxuICAgICAgfSlcbiAgICAgIGF3YWl0IGdlbmVyYXRvci5nZW5lcmF0ZSgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKCdcdTI3NEMgRGF0YWJhc2UgZ2VuZXJhdGlvbiBmYWlsZWQsIGZhbGxpbmcgYmFjayB0byBtb2NrIGRhdGE6JywgZXJyb3IubWVzc2FnZSlcbiAgfVxuICBcbiAgLy8gRmFsbGJhY2sgdG8gbW9jayBkYXRhIGdlbmVyYXRpb25cbiAgY29uc3QgYmFzZU91dHB1dERpciA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAncGFja2FnZXMvdWkvc3JjL2kxOG4vZ2VuZXJhdGVkJylcbiAgXG4gIC8vIEdldCBsYW5ndWFnZXNcbiAgY29uc3QgbGFuZ3VhZ2VzID0gb3B0aW9ucy5sYW5ndWFnZXMgfHwgTU9DS19MQU5HVUFHRVNcbiAgXG4gIC8vIEdldCBhbGwga2V5c1xuICBjb25zdCBhbGxLZXlzID0gT2JqZWN0LmtleXMoTU9DS19UUkFOU0xBVElPTlMpXG4gIFxuICAvLyBGaWx0ZXIga2V5cyBiYXNlZCBvbiBhcHAgY29uZmlndXJhdGlvblxuICBsZXQgZmlsdGVyZWRLZXlzID0gYWxsS2V5c1xuICBcbiAgaWYgKG9wdGlvbnMuYXBwICYmIEFQUF9TRUNUSU9OX0NPTkZJR1tvcHRpb25zLmFwcF0pIHtcbiAgICBjb25zdCBjb25maWcgPSBBUFBfU0VDVElPTl9DT05GSUdbb3B0aW9ucy5hcHBdXG4gICAgaWYgKGNvbmZpZy5leGNsdWRlZCkge1xuICAgICAgZmlsdGVyZWRLZXlzID0gYWxsS2V5cy5maWx0ZXIoa2V5ID0+IFxuICAgICAgICAhY29uZmlnLmV4Y2x1ZGVkLnNvbWUoc2VjdGlvbiA9PiBrZXkuc3RhcnRzV2l0aChgJHtzZWN0aW9ufS5gKSlcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgXG4gIC8vIEVuc3VyZSBvdXRwdXQgZGlyZWN0b3J5IGV4aXN0c1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoYmFzZU91dHB1dERpcikpIHtcbiAgICBmcy5ta2RpclN5bmMoYmFzZU91dHB1dERpciwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgfVxuICBcbiAgLy8gR2VuZXJhdGUgZmlsZXMgZm9yIGVhY2ggbGFuZ3VhZ2VcbiAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiBsYW5ndWFnZXMpIHtcbiAgICBjb25zdCBmaWx0ZXJlZFRyYW5zbGF0aW9ucyA9IHt9XG4gICAgZm9yIChjb25zdCBrZXkgb2YgZmlsdGVyZWRLZXlzKSB7XG4gICAgICBpZiAoTU9DS19UUkFOU0xBVElPTlNba2V5XSAmJiBNT0NLX1RSQU5TTEFUSU9OU1trZXldW2xhbmd1YWdlXSkge1xuICAgICAgICBmaWx0ZXJlZFRyYW5zbGF0aW9uc1trZXldID0gTU9DS19UUkFOU0xBVElPTlNba2V5XVtsYW5ndWFnZV1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29uc3QgbmVzdGVkVHJhbnNsYXRpb25zID0gY3JlYXRlTmVzdGVkU3RydWN0dXJlKGZpbHRlcmVkVHJhbnNsYXRpb25zKVxuICAgIGNvbnN0IGNvbnRlbnQgPSBnZW5lcmF0ZVR5cGVTY3JpcHRDb250ZW50KGxhbmd1YWdlLCBuZXN0ZWRUcmFuc2xhdGlvbnMsIG9wdGlvbnMuYXBwKVxuICAgIFxuICAgIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oYmFzZU91dHB1dERpciwgYCR7bGFuZ3VhZ2V9LnRzYClcbiAgICBmcy53cml0ZUZpbGVTeW5jKG91dHB1dFBhdGgsIGNvbnRlbnQsICd1dGYtOCcpXG4gIH1cbiAgXG4gIC8vIEdlbmVyYXRlIHR5cGVzXG4gIGNvbnN0IHR5cGVzQ29udGVudCA9IGdlbmVyYXRlSW50ZXJmYWNlcyhmaWx0ZXJlZEtleXMpXG4gIGNvbnN0IHR5cGVzUGF0aCA9IHBhdGguam9pbihiYXNlT3V0cHV0RGlyLCAndHlwZXMudHMnKVxuICBmcy53cml0ZUZpbGVTeW5jKHR5cGVzUGF0aCwgdHlwZXNDb250ZW50LCAndXRmLTgnKVxuICBcbiAgLy8gR2VuZXJhdGUgaW5kZXhcbiAgY29uc3QgaW5kZXhDb250ZW50ID0gZ2VuZXJhdGVJbmRleEZpbGUobGFuZ3VhZ2VzKVxuICBjb25zdCBpbmRleFBhdGggPSBwYXRoLmpvaW4oYmFzZU91dHB1dERpciwgJ2luZGV4LnRzJylcbiAgZnMud3JpdGVGaWxlU3luYyhpbmRleFBhdGgsIGluZGV4Q29udGVudCwgJ3V0Zi04JylcbiAgXG4gIC8vIEdlbmVyYXRlIC5naXRpZ25vcmVcbiAgY29uc3QgZ2l0aWdub3JlUGF0aCA9IHBhdGguam9pbihiYXNlT3V0cHV0RGlyLCAnLmdpdGlnbm9yZScpXG4gIGNvbnN0IGdpdGlnbm9yZUNvbnRlbnQgPSBgIyBBdXRvLWdlbmVyYXRlZCB0cmFuc2xhdGlvbiBmaWxlc1xuIyBUaGVzZSBmaWxlcyBhcmUgZ2VuZXJhdGVkIGZyb20gdGhlIGRhdGFiYXNlIGFuZCBzaG91bGQgbm90IGJlIGNvbW1pdHRlZFxuXG4qLnRzXG4qLmpzXG4qLmQudHNcbiEuZ2l0aWdub3JlXG5cbiMgS2VlcCB0aGlzIGRpcmVjdG9yeSBidXQgaWdub3JlIGFsbCBnZW5lcmF0ZWQgY29udGVudFxuYFxuICBmcy53cml0ZUZpbGVTeW5jKGdpdGlnbm9yZVBhdGgsIGdpdGlnbm9yZUNvbnRlbnQsICd1dGYtOCcpXG4gIFxuICBpZiAob3B0aW9ucy52ZXJib3NlICE9PSBmYWxzZSkge1xuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0NcdURGMEQgR2VuZXJhdGVkIGkxOG4gZmlsZXMgZm9yICR7b3B0aW9ucy5hcHAgfHwgJ2FwcCd9IHdpdGggJHtmaWx0ZXJlZEtleXMubGVuZ3RofSBrZXlzICh1c2luZyBtb2NrIGRhdGEpYClcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7aW1wb3J0KCd2aXRlJykuUGx1Z2lufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkdlbmVyYXRpb24ob3B0aW9ucyA9IHt9KSB7XG4gIGxldCBoYXNHZW5lcmF0ZWQgPSBmYWxzZVxuICBcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnaTE4bi1nZW5lcmF0aW9uJyxcbiAgICBcbiAgICBhc3luYyBjb25maWdSZXNvbHZlZCgpIHtcbiAgICAgIC8vIEdlbmVyYXRlIGZpbGVzIG9uY2UgZHVyaW5nIGNvbmZpZyByZXNvbHV0aW9uXG4gICAgICBpZiAoIWhhc0dlbmVyYXRlZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGdlbmVyYXRlSTE4bkZpbGVzKG9wdGlvbnMpXG4gICAgICAgICAgaGFzR2VuZXJhdGVkID0gdHJ1ZVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignXHUyNzRDIEkxOG4gZ2VuZXJhdGlvbiBmYWlsZWQ6JywgZXJyb3IubWVzc2FnZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIHNpbXBsaWZpZWQgcGx1Z2luIGZvciBhcHBzIHRoYXQganVzdCBuZWVkIGJhc2ljIGkxOG4gZ2VuZXJhdGlvblxuICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBhcHBOYW1lT3JPcHRpb25zIC0gQXBwIG5hbWUgb3IgZnVsbCBvcHRpb25zIG9iamVjdFxuICogQHJldHVybnMge2ltcG9ydCgndml0ZScpLlBsdWdpbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwcEkxOG5QbHVnaW4oYXBwTmFtZU9yT3B0aW9ucykge1xuICBjb25zdCBvcHRpb25zID0gdHlwZW9mIGFwcE5hbWVPck9wdGlvbnMgPT09ICdzdHJpbmcnIFxuICAgID8geyBhcHA6IGFwcE5hbWVPck9wdGlvbnMsIHZlcmJvc2U6IGZhbHNlIH1cbiAgICA6IHsgdmVyYm9zZTogZmFsc2UsIC4uLmFwcE5hbWVPck9wdGlvbnMgfVxuICBcbiAgcmV0dXJuIGkxOG5HZW5lcmF0aW9uKG9wdGlvbnMpXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vc2NyaXB0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi13b3JrZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NpbHZhbmRpZXBlbi9SZXBvc2l0b3JpZXMvX3Rpa28vdGlrby1tb25vL3NjcmlwdHMvdml0ZS1wbHVnaW4taTE4bi13b3JrZXIuanNcIjsvKipcbiAqIFZpdGUgUGx1Z2luIGZvciBJMThuIFdvcmtlciBJbnRlZ3JhdGlvblxuICogXG4gKiBUaGlzIHBsdWdpbiBmZXRjaGVzIHRyYW5zbGF0aW9uIGRhdGEgZnJvbSB0aGUgaTE4bi1kYXRhIHdvcmtlciBkdXJpbmcgYnVpbGRcbiAqIGFuZCBnZW5lcmF0ZXMgc3RhdGljIFR5cGVTY3JpcHQgZmlsZXMgZm9yIHJ1bnRpbWUgdXNlLlxuICovXG5cbmltcG9ydCBmcyBmcm9tICdmcydcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJ1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSlcblxuLy8gRGVmYXVsdCBjb25maWd1cmF0aW9uXG5jb25zdCBERUZBVUxUX0NPTkZJRyA9IHtcbiAgd29ya2VyVXJsOiB7XG4gICAgZGV2ZWxvcG1lbnQ6ICdodHRwOi8vbG9jYWxob3N0Ojg3ODcnLFxuICAgIHByb2R1Y3Rpb246ICdodHRwczovL2kxOG4tZGF0YS5zaWx2YW5kaWVwZW4ud29ya2Vycy5kZXYnXG4gIH0sXG4gIG91dHB1dERpcjogJy4uL3BhY2thZ2VzL3VpL3NyYy9pMThuL2dlbmVyYXRlZCcsXG4gIGVudmlyb25tZW50OiAncHJvZHVjdGlvbicsIC8vIERlZmF1bHQgdG8gcHJvZHVjdGlvbiBmb3IgYnVpbGRzXG4gIGFwcDogbnVsbCAvLyBPcHRpb25hbCBhcHAgZmlsdGVyXG59XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBWaXRlIHBsdWdpblxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bldvcmtlclBsdWdpbih1c2VyQ29uZmlnID0ge30pIHtcbiAgY29uc3QgY29uZmlnID0geyAuLi5ERUZBVUxUX0NPTkZJRywgLi4udXNlckNvbmZpZyB9XG4gIGNvbnN0IG91dHB1dERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGNvbmZpZy5vdXRwdXREaXIpXG4gIFxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdpMThuLXdvcmtlcicsXG4gICAgXG4gICAgYXN5bmMgYnVpbGRTdGFydCgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0NcdURGMEQgW2kxOG4td29ya2VyXSBGZXRjaGluZyB0cmFuc2xhdGlvbiBkYXRhIGR1cmluZyBidWlsZC4uLicpXG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGdlbmVyYXRlVHJhbnNsYXRpb25zRnJvbVdvcmtlcihjb25maWcsIG91dHB1dERpcilcbiAgICAgICAgY29uc29sZS5sb2coJ1x1MjcwNSBbaTE4bi13b3JrZXJdIFRyYW5zbGF0aW9uIGZpbGVzIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHknKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gRG9uJ3QgZmFpbCB0aGUgYnVpbGQsIGJ1dCB3YXJuIGFib3V0IG1pc3NpbmcgdHJhbnNsYXRpb25zXG4gICAgICAgIGNvbnNvbGUud2FybignXHUyNkEwXHVGRTBGIFtpMThuLXdvcmtlcl0gRmFpbGVkIHRvIGZldGNoIHRyYW5zbGF0aW9ucyBmcm9tIHdvcmtlcjonLCBlcnJvci5tZXNzYWdlKVxuICAgICAgICBjb25zb2xlLndhcm4oJ1x1MjZBMFx1RkUwRiBbaTE4bi13b3JrZXJdIFVzaW5nIGV4aXN0aW5nIHRyYW5zbGF0aW9uIGZpbGVzIGlmIGF2YWlsYWJsZScpXG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBpZiBleGlzdGluZyBmaWxlcyBhcmUgYXZhaWxhYmxlXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ob3V0cHV0RGlyLCAnaW5kZXgudHMnKSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgW2kxOG4td29ya2VyXSBObyBleGlzdGluZyB0cmFuc2xhdGlvbiBmaWxlcyBmb3VuZC4gQnVpbGQgbWF5IGZhaWwuJylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyYW5zbGF0aW9uIGZpbGVzIGFyZSByZXF1aXJlZCBidXQgY291bGQgbm90IGJlIGdlbmVyYXRlZCBvciBmb3VuZCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0cmFuc2xhdGlvbnMgZnJvbSB3b3JrZXJcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVUcmFuc2xhdGlvbnNGcm9tV29ya2VyKGNvbmZpZywgb3V0cHV0RGlyKSB7XG4gIGNvbnN0IHdvcmtlclVybCA9IGNvbmZpZy53b3JrZXJVcmxbY29uZmlnLmVudmlyb25tZW50XSB8fCBjb25maWcud29ya2VyVXJsLnByb2R1Y3Rpb25cbiAgY29uc3QgZW5kcG9pbnQgPSBjb25maWcuYXBwID8gYC9hcHAvJHtjb25maWcuYXBwfWAgOiAnL2FsbCdcbiAgY29uc3QgdXJsID0gYCR7d29ya2VyVXJsfSR7ZW5kcG9pbnR9YFxuICBcbiAgY29uc29sZS5sb2coYFx1RDgzQ1x1REYxMCBbaTE4bi13b3JrZXJdIEZldGNoaW5nIGZyb206ICR7dXJsfWApXG4gIFxuICAvLyBGZXRjaCB0cmFuc2xhdGlvbiBkYXRhXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH1cbiAgfSlcbiAgXG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9OiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YClcbiAgfVxuICBcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG4gIFxuICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHJlc3VsdC5lcnJvciB8fCAnVW5rbm93biBlcnJvciBmcm9tIHdvcmtlcicpXG4gIH1cbiAgXG4gIGNvbnNvbGUubG9nKGBcdUQ4M0RcdURDQ0EgW2kxOG4td29ya2VyXSBGZXRjaGVkICR7cmVzdWx0Lm1ldGFkYXRhLnRvdGFsS2V5c30ga2V5cywgJHtyZXN1bHQubWV0YWRhdGEudG90YWxMYW5ndWFnZXN9IGxhbmd1YWdlc2ApXG4gIFxuICAvLyBHZW5lcmF0ZSBUeXBlU2NyaXB0IGNvbnRlbnRcbiAgY29uc3QgZ2VuZXJhdGVkQ29udGVudCA9IGdlbmVyYXRlVHlwZVNjcmlwdChyZXN1bHQuZGF0YSlcbiAgXG4gIC8vIFdyaXRlIGZpbGVzXG4gIHdyaXRlRmlsZXMoZ2VuZXJhdGVkQ29udGVudCwgb3V0cHV0RGlyKVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIFR5cGVTY3JpcHQgaW50ZXJmYWNlIGZvciB0cmFuc2xhdGlvbiBrZXlzXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlVHlwZVNjcmlwdCh0cmFuc2xhdGlvbkRhdGEpIHtcbiAgY29uc3QgeyBrZXlzLCBsYW5ndWFnZXMsIHRyYW5zbGF0aW9ucyB9ID0gdHJhbnNsYXRpb25EYXRhXG4gIFxuICAvLyBDcmVhdGUgbmVzdGVkIGtleSBzdHJ1Y3R1cmUgZm9yIHR5cGUgZGVmaW5pdGlvbnNcbiAgY29uc3Qga2V5U3RydWN0dXJlID0gY3JlYXRlS2V5U3RydWN0dXJlKGtleXMubWFwKGsgPT4gay5rZXkpKVxuICBcbiAgLy8gR2VuZXJhdGUgVHlwZVNjcmlwdCB0eXBlc1xuICBjb25zdCB0eXBlQ29udGVudCA9IGdlbmVyYXRlVHJhbnNsYXRpb25UeXBlcyhrZXlTdHJ1Y3R1cmUsIGtleXMpXG4gIFxuICAvLyBHZW5lcmF0ZSBsYW5ndWFnZSBmaWxlc1xuICBjb25zdCBsYW5ndWFnZUZpbGVzID0ge31cbiAgZm9yIChjb25zdCBsYW5ndWFnZSBvZiBsYW5ndWFnZXMpIHtcbiAgICBsYW5ndWFnZUZpbGVzW2xhbmd1YWdlLmNvZGVdID0gZ2VuZXJhdGVMYW5ndWFnZUZpbGUoXG4gICAgICBsYW5ndWFnZS5jb2RlLFxuICAgICAgdHJhbnNsYXRpb25zW2xhbmd1YWdlLmNvZGVdIHx8IHt9LFxuICAgICAga2V5c1xuICAgIClcbiAgfVxuICBcbiAgLy8gR2VuZXJhdGUgaW5kZXggZmlsZVxuICBjb25zdCBpbmRleENvbnRlbnQgPSBnZW5lcmF0ZUluZGV4RmlsZShsYW5ndWFnZXMsIHRyYW5zbGF0aW9uRGF0YSlcbiAgXG4gIHJldHVybiB7XG4gICAgdHlwZXM6IHR5cGVDb250ZW50LFxuICAgIGxhbmd1YWdlczogbGFuZ3VhZ2VGaWxlcyxcbiAgICBpbmRleDogaW5kZXhDb250ZW50XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgbmVzdGVkIGtleSBzdHJ1Y3R1cmUgZnJvbSBmbGF0IGtleXNcbiAqL1xuZnVuY3Rpb24gY3JlYXRlS2V5U3RydWN0dXJlKGtleXMpIHtcbiAgY29uc3QgcmVzdWx0ID0ge31cbiAgXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICBjb25zdCBwYXJ0cyA9IGtleS5zcGxpdCgnLicpXG4gICAgbGV0IGN1cnJlbnQgPSByZXN1bHRcbiAgICBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldXG4gICAgICBpZiAoIWN1cnJlbnRbcGFydF0pIHtcbiAgICAgICAgY3VycmVudFtwYXJ0XSA9IHt9XG4gICAgICB9XG4gICAgICBjdXJyZW50ID0gY3VycmVudFtwYXJ0XVxuICAgIH1cbiAgICBcbiAgICBjb25zdCBsYXN0UGFydCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXG4gICAgY3VycmVudFtsYXN0UGFydF0gPSBrZXlcbiAgfVxuICBcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEdlbmVyYXRlIFR5cGVTY3JpcHQgdHlwZXMgZnJvbSBrZXkgc3RydWN0dXJlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlVHJhbnNsYXRpb25UeXBlcyhzdHJ1Y3R1cmUsIGtleXMsIGxldmVsID0gMCkge1xuICBjb25zdCBpbmRlbnQgPSAnICAnLnJlcGVhdChsZXZlbClcbiAgbGV0IHJlc3VsdCA9ICcnXG4gIFxuICBpZiAobGV2ZWwgPT09IDApIHtcbiAgICByZXN1bHQgKz0gYC8qKlxuICogR2VuZXJhdGVkIHRyYW5zbGF0aW9uIHR5cGVzXG4gKiBcbiAqIFRoaXMgZmlsZSBwcm92aWRlcyBUeXBlU2NyaXB0IGludGVyZmFjZXMgZm9yIGFsbCB0cmFuc2xhdGlvbiBrZXlzXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG4vLyBBbGwgYXZhaWxhYmxlIHRyYW5zbGF0aW9uIGtleXMgYXMgdW5pb24gdHlwZVxuZXhwb3J0IHR5cGUgVHJhbnNsYXRpb25LZXkgPSAke2tleXMubWFwKGsgPT4gYFwiJHtrLmtleX1cImApLmpvaW4oJyB8XFxuICAnKX1cXG5cXG5gXG5cbiAgICByZXN1bHQgKz0gYC8vIE5lc3RlZCBrZXkgc3RydWN0dXJlIGZvciBhdXRvLWNvbXBsZXRpb25cXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zbGF0aW9uS2V5UGF0aCB7XFxuYFxuICB9XG4gIFxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzdHJ1Y3R1cmUpKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9ICBcIiR7a2V5fVwiOiBcIiR7dmFsdWV9XCJcXG5gXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSBgJHtpbmRlbnR9ICBcIiR7a2V5fVwiOiB7XFxuYFxuICAgICAgcmVzdWx0ICs9IGdlbmVyYXRlVHJhbnNsYXRpb25UeXBlcyh2YWx1ZSwga2V5cywgbGV2ZWwgKyAxKVxuICAgICAgcmVzdWx0ICs9IGAke2luZGVudH0gIH1cXG5gXG4gICAgfVxuICB9XG4gIFxuICBpZiAobGV2ZWwgPT09IDApIHtcbiAgICByZXN1bHQgKz0gYH1cXG5cXG5gXG4gICAgcmVzdWx0ICs9IGAvLyBNYWluIHRyYW5zbGF0aW9ucyBpbnRlcmZhY2VcXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zbGF0aW9ucyB7XFxuYFxuICAgIHJlc3VsdCArPSBgICBba2V5OiBzdHJpbmddOiBzdHJpbmdcXG5gXG4gICAgcmVzdWx0ICs9IGB9XFxuYFxuICB9XG4gIFxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogR2VuZXJhdGUgVHlwZVNjcmlwdCBmaWxlIGZvciBhIHNwZWNpZmljIGxhbmd1YWdlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTGFuZ3VhZ2VGaWxlKGxhbmd1YWdlQ29kZSwgdHJhbnNsYXRpb25zLCBrZXlzKSB7XG4gIGNvbnN0IHRyYW5zbGF0aW9uRW50cmllcyA9IGtleXMubWFwKGtleSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmFuc2xhdGlvbnNba2V5LmtleV0gfHwgJydcbiAgICAvLyBFc2NhcGUgcXVvdGVzIGFuZCBuZXdsaW5lc1xuICAgIGNvbnN0IGVzY2FwZWRWYWx1ZSA9IHZhbHVlXG4gICAgICAucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKVxuICAgICAgLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKVxuICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKVxuICAgICAgLnJlcGxhY2UoL1xcci9nLCAnXFxcXHInKVxuICAgICAgLnJlcGxhY2UoL1xcdC9nLCAnXFxcXHQnKVxuICAgIFxuICAgIHJldHVybiBgICBcIiR7a2V5LmtleX1cIjogXCIke2VzY2FwZWRWYWx1ZX1cImBcbiAgfSkuam9pbignLFxcbicpXG4gIFxuICByZXR1cm4gYC8qKlxuICogJHtsYW5ndWFnZUNvZGUudG9VcHBlckNhc2UoKX0gdHJhbnNsYXRpb25zXG4gKiBcbiAqIEdlbmVyYXRlZCBvbjogJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XG4gKiBcbiAqIFx1MjZBMFx1RkUwRiAgRE8gTk9UIEVESVQgTUFOVUFMTFkgLSBUaGlzIGZpbGUgaXMgYXV0by1nZW5lcmF0ZWRcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdHlwZXMnXG5cbmNvbnN0ICR7bGFuZ3VhZ2VDb2RlfTogVHJhbnNsYXRpb25zID0ge1xuJHt0cmFuc2xhdGlvbkVudHJpZXN9XG59XG5cbmV4cG9ydCBkZWZhdWx0ICR7bGFuZ3VhZ2VDb2RlfVxuYFxufVxuXG4vKipcbiAqIEdlbmVyYXRlIGluZGV4IGZpbGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbmRleEZpbGUobGFuZ3VhZ2VzLCB0cmFuc2xhdGlvbkRhdGEpIHtcbiAgY29uc3QgaW1wb3J0cyA9IGxhbmd1YWdlcy5tYXAobGFuZyA9PiBcbiAgICBgaW1wb3J0ICR7bGFuZy5jb2RlfSBmcm9tICcuLyR7bGFuZy5jb2RlfSdgXG4gICkuam9pbignXFxuJylcbiAgXG4gIGNvbnN0IGxhbmd1YWdlQ29kZXMgPSBsYW5ndWFnZXMubWFwKGxhbmcgPT4gYFwiJHtsYW5nLmNvZGV9XCJgKS5qb2luKCcsXFxuICAnKVxuICBcbiAgY29uc3QgdHJhbnNsYXRpb25zTWFwID0gbGFuZ3VhZ2VzLm1hcChsYW5nID0+IFxuICAgIGAgICcke2xhbmcuY29kZX0nOiAke2xhbmcuY29kZX1gXG4gICkuam9pbignLFxcbicpXG4gIFxuICByZXR1cm4gYC8qKlxuICogR2VuZXJhdGVkIHRyYW5zbGF0aW9uIGluZGV4IGZpbGVcbiAqIFxuICogVGhpcyBmaWxlIHByb3ZpZGVzIGVhc3kgYWNjZXNzIHRvIGFsbCBnZW5lcmF0ZWQgdHJhbnNsYXRpb24gZmlsZXNcbiAqIFxuICogR2VuZXJhdGVkIG9uOiAke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKX1cbiAqIFxuICogXHUyNkEwXHVGRTBGICBETyBOT1QgRURJVCBNQU5VQUxMWSAtIFRoaXMgZmlsZSBpcyBhdXRvLWdlbmVyYXRlZFxuICovXG5cbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zIH0gZnJvbSAnLi90eXBlcydcblxuLy8gSW1wb3J0IGFsbCBsYW5ndWFnZSBmaWxlc1xuJHtpbXBvcnRzfVxuXG4vLyBFeHBvcnQgbGFuZ3VhZ2UgY29uc3RhbnRzXG5leHBvcnQgY29uc3QgQVZBSUxBQkxFX0xBTkdVQUdFUyA9IFtcbiAgJHtsYW5ndWFnZUNvZGVzfVxuXSBhcyBjb25zdFxuXG5leHBvcnQgdHlwZSBBdmFpbGFibGVMYW5ndWFnZSA9IHR5cGVvZiBBVkFJTEFCTEVfTEFOR1VBR0VTW251bWJlcl1cblxuLy8gRXhwb3J0IGFsbCB0cmFuc2xhdGlvbnMgaW4gYSBtYXBcbmV4cG9ydCBjb25zdCB0cmFuc2xhdGlvbnM6IFJlY29yZDxBdmFpbGFibGVMYW5ndWFnZSwgVHJhbnNsYXRpb25zPiA9IHtcbiR7dHJhbnNsYXRpb25zTWFwfVxufVxuXG4vLyBFeHBvcnQgaW5kaXZpZHVhbCBsYW5ndWFnZXNcbmV4cG9ydCB7XG4ke2xhbmd1YWdlcy5tYXAobGFuZyA9PiBgICAke2xhbmcuY29kZX0gYXMgJHtsYW5nLmNvZGV9YCkuam9pbignLFxcbicpfVxufVxuXG4vLyBFeHBvcnQgdHlwZXNcbmV4cG9ydCB0eXBlIHsgVHJhbnNsYXRpb25zLCBUcmFuc2xhdGlvbktleSwgVHJhbnNsYXRpb25LZXlQYXRoIH0gZnJvbSAnLi90eXBlcydcblxuLyoqXG4gKiBHZXQgdHJhbnNsYXRpb25zIGZvciBhIHNwZWNpZmljIGxhbmd1YWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbnMobGFuZ3VhZ2U6IEF2YWlsYWJsZUxhbmd1YWdlKTogVHJhbnNsYXRpb25zIHtcbiAgcmV0dXJuIHRyYW5zbGF0aW9uc1tsYW5ndWFnZV1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGxhbmd1YWdlIGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMYW5ndWFnZVN1cHBvcnRlZChsYW5ndWFnZTogc3RyaW5nKTogbGFuZ3VhZ2UgaXMgQXZhaWxhYmxlTGFuZ3VhZ2Uge1xuICByZXR1cm4gQVZBSUxBQkxFX0xBTkdVQUdFUy5pbmNsdWRlcyhsYW5ndWFnZSBhcyBBdmFpbGFibGVMYW5ndWFnZSlcbn1cbmBcbn1cblxuLyoqXG4gKiBXcml0ZSBnZW5lcmF0ZWQgZmlsZXMgdG8gZGlza1xuICovXG5mdW5jdGlvbiB3cml0ZUZpbGVzKGdlbmVyYXRlZENvbnRlbnQsIG91dHB1dERpcikge1xuICAvLyBFbnN1cmUgb3V0cHV0IGRpcmVjdG9yeSBleGlzdHNcbiAgaWYgKCFmcy5leGlzdHNTeW5jKG91dHB1dERpcikpIHtcbiAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICB9XG4gIFxuICBjb25zb2xlLmxvZyhgXHVEODNEXHVEQ0REIFtpMThuLXdvcmtlcl0gV3JpdGluZyBUeXBlU2NyaXB0IGZpbGVzIHRvOiAke291dHB1dERpcn1gKVxuICBcbiAgLy8gV3JpdGUgdHlwZXMgZmlsZVxuICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXREaXIsICd0eXBlcy50cycpLCBnZW5lcmF0ZWRDb250ZW50LnR5cGVzKVxuICBcbiAgLy8gV3JpdGUgbGFuZ3VhZ2UgZmlsZXNcbiAgZm9yIChjb25zdCBbbGFuZ3VhZ2VDb2RlLCBjb250ZW50XSBvZiBPYmplY3QuZW50cmllcyhnZW5lcmF0ZWRDb250ZW50Lmxhbmd1YWdlcykpIHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXREaXIsIGAke2xhbmd1YWdlQ29kZX0udHNgKSwgY29udGVudClcbiAgfVxuICBcbiAgLy8gV3JpdGUgaW5kZXggZmlsZVxuICBmcy53cml0ZUZpbGVTeW5jKHBhdGguam9pbihvdXRwdXREaXIsICdpbmRleC50cycpLCBnZW5lcmF0ZWRDb250ZW50LmluZGV4KVxufVxuXG5leHBvcnQgZGVmYXVsdCBpMThuV29ya2VyUGx1Z2luIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vYXBwcy95ZXMtbm9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zaWx2YW5kaWVwZW4vUmVwb3NpdG9yaWVzL190aWtvL3Rpa28tbW9uby9hcHBzL3llcy1uby92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2lsdmFuZGllcGVuL1JlcG9zaXRvcmllcy9fdGlrby90aWtvLW1vbm8vYXBwcy95ZXMtbm8vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBjcmVhdGVWaXRlQ29uZmlnIH0gZnJvbSAnLi4vLi4vdml0ZS5jb25maWcuYmFzZSdcblxuY29uc3QgcHdhQ29uZmlnID0ge1xuICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdtYXNrZWQtaWNvbi5zdmcnXSxcbiAgbWFuaWZlc3Q6IHtcbiAgICBuYW1lOiAnWWVzLU5vIC0gVGlrbycsXG4gICAgc2hvcnRfbmFtZTogJ1llcy1ObycsXG4gICAgZGVzY3JpcHRpb246ICdTaW1wbGUgcXVlc3Rpb24tYW5zd2VyIGFwcCcsXG4gICAgdGhlbWVfY29sb3I6ICcjNjY3ZWVhJyxcbiAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgIG9yaWVudGF0aW9uOiAncG9ydHJhaXQnLFxuICAgIHNjb3BlOiAnLycsXG4gICAgc3RhcnRfdXJsOiAnLycsXG4gICAgaWNvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgc3JjOiAncHdhLTE5MngxOTIucG5nJyxcbiAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXG4gICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZSdcbiAgICAgIH1cbiAgICBdXG4gIH1cbn1cblxuY29uc3QgaTE4bkNvbmZpZyA9IHtcbiAgZXhjbHVkZVNlY3Rpb25zOiBbJ2FkbWluJywgJ2RlcGxveW1lbnQnLCAnbWVkaWEnLCAnY29udGVudCddXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVZpdGVDb25maWcoX19kaXJuYW1lLCAzMDAwLCBwd2FDb25maWcsICd5ZXMtbm8nLCBpMThuQ29uZmlnKSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFPQSxRQUFNQSxNQUFLLFVBQVEsSUFBSTtBQUN2QixRQUFNQyxRQUFPLFVBQVEsTUFBTTtBQUczQixRQUFNQyxzQkFBcUI7QUFBQSxNQUN6QixVQUFVO0FBQUEsUUFDUixVQUFVLENBQUMsU0FBUyxjQUFjLFNBQVMsU0FBUztBQUFB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QUFDO0FBQ0g7OztBSWpHQSxJQUFNRSxvQ0FBbUM7QUFFekMsSUFBTSxZQUFZO0FBQUEsRUFDaEIsY0FBYztBQUFBLEVBQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGlCQUFpQjtBQUFBLEVBQ3hFLFVBQVU7QUFBQSxJQUNSLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQSxJQUNiLGtCQUFrQjtBQUFBLElBQ2xCLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsTUFDUjtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxNQUNSO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTSxhQUFhO0FBQUEsRUFDakIsaUJBQWlCLENBQUMsU0FBUyxjQUFjLFNBQVMsU0FBUztBQUM3RDtBQUVBLElBQU8sc0JBQVEsaUJBQWlCQyxtQ0FBVyxLQUFNLFdBQVcsVUFBVSxVQUFVOyIsCiAgIm5hbWVzIjogWyJmcyIsICJwYXRoIiwgIkFQUF9TRUNUSU9OX0NPTkZJRyIsICJEYXRhYmFzZUkxOG5HZW5lcmF0b3IiLCAiZmV0Y2giLCAiYmFzZUxvY2FsZSIsICJwYXRoIiwgImZzIiwgImZzIiwgInBhdGgiLCAiX19kaXJuYW1lIiwgInBhdGgiLCAiZnMiLCAiZ2VuZXJhdGVJbmRleEZpbGUiLCAicHdhQ29uZmlnIiwgImkxOG5Db25maWciLCAicGF0aCIsICJmcyIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSJdCn0K
