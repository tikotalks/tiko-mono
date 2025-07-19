#!/bin/bash

# Function to add validation section
add_validation_section() {
  local file=$1
  local lang=$2
  
  # Check if validation section exists
  if ! grep -q "validation:" "$file"; then
    # Add validation section before the closing brace
    sed -i.bak '/^}$/i\
  },\
  validation: {\
    onlyOneNumberAllowed: '\''[TODO: Translate to '"$lang"']'\''\
  ' "$file"
    echo "Added validation section to $file"
  fi
}

# Function to add uiDocs section
add_uidocs_section() {
  local file=$1
  local lang=$2
  
  # Check if uiDocs section exists
  if ! grep -q "uiDocs:" "$file"; then
    # Add uiDocs section before the closing brace
    sed -i.bak '/^}$/i\
  },\
  uiDocs: {\
    documentationSettings: '\''[TODO: Translate to '"$lang"']'\'',\
    buttons: '\''[TODO: Translate to '"$lang"']'\'',\
    buttonsDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    cards: '\''[TODO: Translate to '"$lang"']'\'',\
    cardsDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    colors: '\''[TODO: Translate to '"$lang"']'\'',\
    colorsDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    icons: '\''[TODO: Translate to '"$lang"']'\'',\
    iconsDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    inputs: '\''[TODO: Translate to '"$lang"']'\'',\
    inputsDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    welcomeToUIDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    exploreComponents: '\''[TODO: Translate to '"$lang"']'\'',\
    comingSoon: '\''[TODO: Translate to '"$lang"']'\'',\
    tikoUIDocumentation: '\''[TODO: Translate to '"$lang"']'\'',\
    completeDocumentationAndTesting: '\''[TODO: Translate to '"$lang"']'\'',\
    interactiveButtonComponents: '\''[TODO: Translate to '"$lang"']'\'',\
    completeIconLibrary: '\''[TODO: Translate to '"$lang"']'\'',\
    inputComponents: '\''[TODO: Translate to '"$lang"']'\'',\
    formInputsSelectsTextareas: '\''[TODO: Translate to '"$lang"']'\'',\
    contentContainersAndLayouts: '\''[TODO: Translate to '"$lang"']'\'',\
    colorSystem: '\''[TODO: Translate to '"$lang"']'\'',\
    colorPaletteThemes: '\''[TODO: Translate to '"$lang"']'\'',\
    quickStart: '\''[TODO: Translate to '"$lang"']'\'',\
    documentationAppShowcase: '\''[TODO: Translate to '"$lang"']'\'',\
    codeExamples: '\''[TODO: Translate to '"$lang"']'\'',\
    seeWorkingExamples: '\''[TODO: Translate to '"$lang"']'\'',\
    livePreviews: '\''[TODO: Translate to '"$lang"']'\'',\
    interactiveComponentPreviews: '\''[TODO: Translate to '"$lang"']'\'',\
    documentation: '\''[TODO: Translate to '"$lang"']'\'',\
    completePropAndUsage: '\''[TODO: Translate to '"$lang"']'\'',\
    items: '\''[TODO: Translate to '"$lang"']'\''\
  ' "$file"
    echo "Added uiDocs section to $file"
  fi
}

# Process each locale
locales=("nl:Dutch" "pl:Polish" "pt:Portuguese" "ru:Russian" "sv:Swedish")

for locale_info in "${locales[@]}"; do
  IFS=':' read -r code lang <<< "$locale_info"
  file="packages/ui/src/i18n/locales/${code}.ts"
  
  echo "Processing $file ($lang)..."
  
  # Add missing sections
  add_validation_section "$file" "$lang"
  add_uidocs_section "$file" "$lang"
  
  # Clean up backup files
  rm -f "${file}.bak"
done

echo "Done! All locale files have been updated."