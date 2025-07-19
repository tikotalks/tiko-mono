#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Language name translations for each language
const LANGUAGE_TRANSLATIONS = {
  bg: {
    bulgarian: 'Български', czech: 'Чешки', welsh: 'Уелски', danish: 'Датски', german: 'Немски', greek: 'Гръцки', english: 'Английски', spanish: 'Испански', estonian: 'Естонски', finnish: 'Фински', french: 'Френски', irish: 'Ирландски', croatian: 'Хърватски', hungarian: 'Унгарски', armenian: 'Арменски', icelandic: 'Исландски', italian: 'Италиански', lithuanian: 'Литовски', latvian: 'Латвийски', maltese: 'Малтийски', dutch: 'Холандски', norwegian: 'Норвежки', polish: 'Полски', portuguese: 'Португалски', romanian: 'Румънски', russian: 'Руски', slovak: 'Словашки', slovenian: 'Словенски', swedish: 'Шведски',
    germanGermany: 'Немски (Германия)', germanAustria: 'Немски (Австрия)', germanSwitzerland: 'Немски (Швейцария)', englishUK: 'Английски (Обединено кралство)', englishUS: 'Английски (САЩ)', englishAustralia: 'Английски (Австралия)', englishCanada: 'Английски (Канада)', spanishSpain: 'Испански (Испания)', spanishMexico: 'Испански (Мексико)', spanishArgentina: 'Испански (Аржентина)', frenchFrance: 'Френски (Франция)', frenchCanada: 'Френски (Канада)', frenchBelgium: 'Френски (Белгия)', dutchNetherlands: 'Холандски (Холандия)', dutchBelgium: 'Холандски (Белгия)', portuguesePortugal: 'Португалски (Португалия)', portugueseBrazil: 'Португалски (Бразилия)'
  },
  cs: {
    bulgarian: 'Bulharština', czech: 'Čeština', welsh: 'Velština', danish: 'Dánština', german: 'Němčina', greek: 'Řečtina', english: 'Angličtina', spanish: 'Španělština', estonian: 'Estonština', finnish: 'Finština', french: 'Francouzština', irish: 'Irština', croatian: 'Chorvatština', hungarian: 'Maďarština', armenian: 'Arménština', icelandic: 'Islandština', italian: 'Italština', lithuanian: 'Litevština', latvian: 'Lotyština', maltese: 'Maltština', dutch: 'Nizozemština', norwegian: 'Norština', polish: 'Polština', portuguese: 'Portugalština', romanian: 'Rumunština', russian: 'Ruština', slovak: 'Slovenština', slovenian: 'Slovinština', swedish: 'Švédština',
    germanGermany: 'Němčina (Německo)', germanAustria: 'Němčina (Rakousko)', germanSwitzerland: 'Němčina (Švýcarsko)', englishUK: 'Angličtina (Spojené království)', englishUS: 'Angličtina (USA)', englishAustralia: 'Angličtina (Austrálie)', englishCanada: 'Angličtina (Kanada)', spanishSpain: 'Španělština (Španělsko)', spanishMexico: 'Španělština (Mexiko)', spanishArgentina: 'Španělština (Argentina)', frenchFrance: 'Francouzština (Francie)', frenchCanada: 'Francouzština (Kanada)', frenchBelgium: 'Francouzština (Belgie)', dutchNetherlands: 'Nizozemština (Nizozemsko)', dutchBelgium: 'Nizozemština (Belgie)', portuguesePortugal: 'Portugalština (Portugalsko)', portugueseBrazil: 'Portugalština (Brazílie)'
  },
  cy: {
    bulgarian: 'Bwlgareg', czech: 'Tsieceg', welsh: 'Cymraeg', danish: 'Daneg', german: 'Almaeneg', greek: 'Groeg', english: 'Saesneg', spanish: 'Sbaeneg', estonian: 'Estoneg', finnish: 'Ffinneg', french: 'Ffrangeg', irish: 'Gwyddeleg', croatian: 'Croateg', hungarian: 'Hwngareg', armenian: 'Armeneg', icelandic: 'Islandeg', italian: 'Eidaleg', lithuanian: 'Lithwaneg', latvian: 'Latfieg', maltese: 'Malteg', dutch: 'Iseldireg', norwegian: 'Norwyeg', polish: 'Pwyleg', portuguese: 'Portiwgaleg', romanian: 'Rwmaneg', russian: 'Rwseg', slovak: 'Slofaceg', slovenian: 'Slofeneg', swedish: 'Swedeg',
    germanGermany: 'Almaeneg (Yr Almaen)', germanAustria: 'Almaeneg (Awstria)', germanSwitzerland: 'Almaeneg (Y Swistir)', englishUK: 'Saesneg (Y Deyrnas Unedig)', englishUS: 'Saesneg (UDA)', englishAustralia: 'Saesneg (Awstralia)', englishCanada: 'Saesneg (Canada)', spanishSpain: 'Sbaeneg (Sbaen)', spanishMexico: 'Sbaeneg (Mecsico)', spanishArgentina: 'Sbaeneg (Yr Ariannin)', frenchFrance: 'Ffrangeg (Ffrainc)', frenchCanada: 'Ffrangeg (Canada)', frenchBelgium: 'Ffrangeg (Gwlad Belg)', dutchNetherlands: 'Iseldireg (Yr Iseldiroedd)', dutchBelgium: 'Iseldireg (Gwlad Belg)', portuguesePortugal: 'Portiwgaleg (Portiwgal)', portugueseBrazil: 'Portiwgaleg (Brasil)'
  },
  fr: {
    bulgarian: 'Bulgare', czech: 'Tchèque', welsh: 'Gallois', danish: 'Danois', german: 'Allemand', greek: 'Grec', english: 'Anglais', spanish: 'Espagnol', estonian: 'Estonien', finnish: 'Finnois', french: 'Français', irish: 'Irlandais', croatian: 'Croate', hungarian: 'Hongrois', armenian: 'Arménien', icelandic: 'Islandais', italian: 'Italien', lithuanian: 'Lituanien', latvian: 'Letton', maltese: 'Maltais', dutch: 'Néerlandais', norwegian: 'Norvégien', polish: 'Polonais', portuguese: 'Portugais', romanian: 'Roumain', russian: 'Russe', slovak: 'Slovaque', slovenian: 'Slovène', swedish: 'Suédois',
    germanGermany: 'Allemand (Allemagne)', germanAustria: 'Allemand (Autriche)', germanSwitzerland: 'Allemand (Suisse)', englishUK: 'Anglais (Royaume-Uni)', englishUS: 'Anglais (États-Unis)', englishAustralia: 'Anglais (Australie)', englishCanada: 'Anglais (Canada)', spanishSpain: 'Espagnol (Espagne)', spanishMexico: 'Espagnol (Mexique)', spanishArgentina: 'Espagnol (Argentine)', frenchFrance: 'Français (France)', frenchCanada: 'Français (Canada)', frenchBelgium: 'Français (Belgique)', dutchNetherlands: 'Néerlandais (Pays-Bas)', dutchBelgium: 'Néerlandais (Belgique)', portuguesePortugal: 'Portugais (Portugal)', portugueseBrazil: 'Portugais (Brésil)'
  },
  es: {
    bulgarian: 'Búlgaro', czech: 'Checo', welsh: 'Galés', danish: 'Danés', german: 'Alemán', greek: 'Griego', english: 'Inglés', spanish: 'Español', estonian: 'Estonio', finnish: 'Finlandés', french: 'Francés', irish: 'Irlandés', croatian: 'Croata', hungarian: 'Húngaro', armenian: 'Armenio', icelandic: 'Islandés', italian: 'Italiano', lithuanian: 'Lituano', latvian: 'Letón', maltese: 'Maltés', dutch: 'Neerlandés', norwegian: 'Noruego', polish: 'Polaco', portuguese: 'Portugués', romanian: 'Rumano', russian: 'Ruso', slovak: 'Eslovaco', slovenian: 'Esloveno', swedish: 'Sueco',
    germanGermany: 'Alemán (Alemania)', germanAustria: 'Alemán (Austria)', germanSwitzerland: 'Alemán (Suiza)', englishUK: 'Inglés (Reino Unido)', englishUS: 'Inglés (Estados Unidos)', englishAustralia: 'Inglés (Australia)', englishCanada: 'Inglés (Canadá)', spanishSpain: 'Español (España)', spanishMexico: 'Español (México)', spanishArgentina: 'Español (Argentina)', frenchFrance: 'Francés (Francia)', frenchCanada: 'Francés (Canadá)', frenchBelgium: 'Francés (Bélgica)', dutchNetherlands: 'Neerlandés (Países Bajos)', dutchBelgium: 'Neerlandés (Bélgica)', portuguesePortugal: 'Portugués (Portugal)', portugueseBrazil: 'Portugués (Brasil)'
  },
  it: {
    bulgarian: 'Bulgaro', czech: 'Ceco', welsh: 'Gallese', danish: 'Danese', german: 'Tedesco', greek: 'Greco', english: 'Inglese', spanish: 'Spagnolo', estonian: 'Estone', finnish: 'Finlandese', french: 'Francese', irish: 'Irlandese', croatian: 'Croato', hungarian: 'Ungherese', armenian: 'Armeno', icelandic: 'Islandese', italian: 'Italiano', lithuanian: 'Lituano', latvian: 'Lettone', maltese: 'Maltese', dutch: 'Olandese', norwegian: 'Norvegese', polish: 'Polacco', portuguese: 'Portoghese', romanian: 'Rumeno', russian: 'Russo', slovak: 'Slovacco', slovenian: 'Sloveno', swedish: 'Svedese',
    germanGermany: 'Tedesco (Germania)', germanAustria: 'Tedesco (Austria)', germanSwitzerland: 'Tedesco (Svizzera)', englishUK: 'Inglese (Regno Unito)', englishUS: 'Inglese (Stati Uniti)', englishAustralia: 'Inglese (Australia)', englishCanada: 'Inglese (Canada)', spanishSpain: 'Spagnolo (Spagna)', spanishMexico: 'Spagnolo (Messico)', spanishArgentina: 'Spagnolo (Argentina)', frenchFrance: 'Francese (Francia)', frenchCanada: 'Francese (Canada)', frenchBelgium: 'Francese (Belgio)', dutchNetherlands: 'Olandese (Paesi Bassi)', dutchBelgium: 'Olandese (Belgio)', portuguesePortugal: 'Portoghese (Portogallo)', portugueseBrazil: 'Portoghese (Brasile)'
  },
  is: {
    bulgarian: 'Búlgarska', czech: 'Tékkneska', welsh: 'Velska', danish: 'Danska', german: 'Þýska', greek: 'Gríska', english: 'Enska', spanish: 'Spænska', estonian: 'Eistneska', finnish: 'Finnska', french: 'Franska', irish: 'Írska', croatian: 'Króatíska', hungarian: 'Ungverska', armenian: 'Armenska', icelandic: 'Íslenska', italian: 'Ítalska', lithuanian: 'Litháíska', latvian: 'Lettneska', maltese: 'Maltneska', dutch: 'Hollenska', norwegian: 'Norska', polish: 'Pólska', portuguese: 'Portúgalska', romanian: 'Rúmenska', russian: 'Rússneska', slovak: 'Slóvakíska', slovenian: 'Slóvenska', swedish: 'Sænska',
    germanGermany: 'Þýska (Þýskaland)', germanAustria: 'Þýska (Austurríki)', germanSwitzerland: 'Þýska (Sviss)', englishUK: 'Enska (Bretland)', englishUS: 'Enska (Bandaríkin)', englishAustralia: 'Enska (Ástralía)', englishCanada: 'Enska (Kanada)', spanishSpain: 'Spænska (Spánn)', spanishMexico: 'Spænska (Mexíkó)', spanishArgentina: 'Spænska (Argentína)', frenchFrance: 'Franska (Frakkland)', frenchCanada: 'Franska (Kanada)', frenchBelgium: 'Franska (Belgía)', dutchNetherlands: 'Hollenska (Holland)', dutchBelgium: 'Hollenska (Belgía)', portuguesePortugal: 'Portúgalska (Portúgal)', portugueseBrazil: 'Portúgalska (Brasilía)'
  },
  da: {
    bulgarian: 'Bulgarsk', czech: 'Tjekkisk', welsh: 'Walisisk', danish: 'Dansk', german: 'Tysk', greek: 'Græsk', english: 'Engelsk', spanish: 'Spansk', estonian: 'Estisk', finnish: 'Finsk', french: 'Fransk', irish: 'Irsk', croatian: 'Kroatisk', hungarian: 'Ungarsk', armenian: 'Armensk', icelandic: 'Islandsk', italian: 'Italiensk', lithuanian: 'Litauisk', latvian: 'Lettisk', maltese: 'Maltesisk', dutch: 'Hollandsk', norwegian: 'Norsk', polish: 'Polsk', portuguese: 'Portugisisk', romanian: 'Rumænsk', russian: 'Russisk', slovak: 'Slovakisk', slovenian: 'Slovensk', swedish: 'Svensk',
    germanGermany: 'Tysk (Tyskland)', germanAustria: 'Tysk (Østrig)', germanSwitzerland: 'Tysk (Schweiz)', englishUK: 'Engelsk (Storbritannien)', englishUS: 'Engelsk (USA)', englishAustralia: 'Engelsk (Australien)', englishCanada: 'Engelsk (Canada)', spanishSpain: 'Spansk (Spanien)', spanishMexico: 'Spansk (Mexico)', spanishArgentina: 'Spansk (Argentina)', frenchFrance: 'Fransk (Frankrig)', frenchCanada: 'Fransk (Canada)', frenchBelgium: 'Fransk (Belgien)', dutchNetherlands: 'Hollandsk (Holland)', dutchBelgium: 'Hollandsk (Belgien)', portuguesePortugal: 'Portugisisk (Portugal)', portugueseBrazil: 'Portugisisk (Brasilien)'
  },
  pl: {
    bulgarian: 'Bułgarski', czech: 'Czeski', welsh: 'Walijski', danish: 'Duński', german: 'Niemiecki', greek: 'Grecki', english: 'Angielski', spanish: 'Hiszpański', estonian: 'Estoński', finnish: 'Fiński', french: 'Francuski', irish: 'Irlandzki', croatian: 'Chorwacki', hungarian: 'Węgierski', armenian: 'Ormiański', icelandic: 'Islandzki', italian: 'Włoski', lithuanian: 'Litewski', latvian: 'Łotewski', maltese: 'Maltański', dutch: 'Holenderski', norwegian: 'Norweski', polish: 'Polski', portuguese: 'Portugalski', romanian: 'Rumuński', russian: 'Rosyjski', slovak: 'Słowacki', slovenian: 'Słoweński', swedish: 'Szwedzki',
    germanGermany: 'Niemiecki (Niemcy)', germanAustria: 'Niemiecki (Austria)', germanSwitzerland: 'Niemiecki (Szwajcaria)', englishUK: 'Angielski (Wielka Brytania)', englishUS: 'Angielski (USA)', englishAustralia: 'Angielski (Australia)', englishCanada: 'Angielski (Kanada)', spanishSpain: 'Hiszpański (Hiszpania)', spanishMexico: 'Hiszpański (Meksyk)', spanishArgentina: 'Hiszpański (Argentyna)', frenchFrance: 'Francuski (Francja)', frenchCanada: 'Francuski (Kanada)', frenchBelgium: 'Francuski (Belgia)', dutchNetherlands: 'Holenderski (Holandia)', dutchBelgium: 'Holenderski (Belgia)', portuguesePortugal: 'Portugalski (Portugalia)', portugueseBrazil: 'Portugalski (Brazylia)'
  },
  ru: {
    bulgarian: 'Болгарский', czech: 'Чешский', welsh: 'Валлийский', danish: 'Датский', german: 'Немецкий', greek: 'Греческий', english: 'Английский', spanish: 'Испанский', estonian: 'Эстонский', finnish: 'Финский', french: 'Французский', irish: 'Ирландский', croatian: 'Хорватский', hungarian: 'Венгерский', armenian: 'Армянский', icelandic: 'Исландский', italian: 'Итальянский', lithuanian: 'Литовский', latvian: 'Латышский', maltese: 'Мальтийский', dutch: 'Нидерландский', norwegian: 'Норвежский', polish: 'Польский', portuguese: 'Португальский', romanian: 'Румынский', russian: 'Русский', slovak: 'Словацкий', slovenian: 'Словенский', swedish: 'Шведский',
    germanGermany: 'Немецкий (Германия)', germanAustria: 'Немецкий (Австрия)', germanSwitzerland: 'Немецкий (Швейцария)', englishUK: 'Английский (Великобритания)', englishUS: 'Английский (США)', englishAustralia: 'Английский (Австралия)', englishCanada: 'Английский (Канада)', spanishSpain: 'Испанский (Испания)', spanishMexico: 'Испанский (Мексика)', spanishArgentina: 'Испанский (Аргентина)', frenchFrance: 'Французский (Франция)', frenchCanada: 'Французский (Канада)', frenchBelgium: 'Французский (Бельгия)', dutchNetherlands: 'Нидерландский (Нидерланды)', dutchBelgium: 'Нидерландский (Бельгия)', portuguesePortugal: 'Португальский (Португалия)', portugueseBrazil: 'Португальский (Бразилия)'
  },
  sv: {
    bulgarian: 'Bulgariska', czech: 'Tjeckiska', welsh: 'Walesiska', danish: 'Danska', german: 'Tyska', greek: 'Grekiska', english: 'Engelska', spanish: 'Spanska', estonian: 'Estniska', finnish: 'Finska', french: 'Franska', irish: 'Iriska', croatian: 'Kroatiska', hungarian: 'Ungerska', armenian: 'Armeniska', icelandic: 'Isländska', italian: 'Italienska', lithuanian: 'Litauiska', latvian: 'Lettiska', maltese: 'Maltesiska', dutch: 'Nederländska', norwegian: 'Norska', polish: 'Polska', portuguese: 'Portugisiska', romanian: 'Rumänska', russian: 'Ryska', slovak: 'Slovakiska', slovenian: 'Slovenska', swedish: 'Svenska',
    germanGermany: 'Tyska (Tyskland)', germanAustria: 'Tyska (Österrike)', germanSwitzerland: 'Tyska (Schweiz)', englishUK: 'Engelska (Storbritannien)', englishUS: 'Engelska (USA)', englishAustralia: 'Engelska (Australien)', englishCanada: 'Engelska (Kanada)', spanishSpain: 'Spanska (Spanien)', spanishMexico: 'Spanska (Mexiko)', spanishArgentina: 'Spanska (Argentina)', frenchFrance: 'Franska (Frankrike)', frenchCanada: 'Franska (Kanada)', frenchBelgium: 'Franska (Belgien)', dutchNetherlands: 'Nederländska (Nederländerna)', dutchBelgium: 'Nederländska (Belgien)', portuguesePortugal: 'Portugisiska (Portugal)', portugueseBrazil: 'Portugisiska (Brasilien)'
  },
  et: {
    bulgarian: 'Bulgaaria', czech: 'Tšehhi', welsh: 'Kõmri', danish: 'Taani', german: 'Saksa', greek: 'Kreeka', english: 'Inglise', spanish: 'Hispaania', estonian: 'Eesti', finnish: 'Soome', french: 'Prantsuse', irish: 'Iiri', croatian: 'Horvaatia', hungarian: 'Ungari', armenian: 'Armeenia', icelandic: 'Islandi', italian: 'Itaalia', lithuanian: 'Leedu', latvian: 'Läti', maltese: 'Malta', dutch: 'Hollandi', norwegian: 'Norra', polish: 'Poola', portuguese: 'Portugali', romanian: 'Rumeenia', russian: 'Vene', slovak: 'Slovaki', slovenian: 'Sloveenia', swedish: 'Rootsi',
    germanGermany: 'Saksa (Saksamaa)', germanAustria: 'Saksa (Austria)', germanSwitzerland: 'Saksa (Šveits)', englishUK: 'Inglise (Ühendkuningriik)', englishUS: 'Inglise (USA)', englishAustralia: 'Inglise (Austraalia)', englishCanada: 'Inglise (Kanada)', spanishSpain: 'Hispaania (Hispaania)', spanishMexico: 'Hispaania (Mehhiko)', spanishArgentina: 'Hispaania (Argentina)', frenchFrance: 'Prantsuse (Prantsusmaa)', frenchCanada: 'Prantsuse (Kanada)', frenchBelgium: 'Prantsuse (Belgia)', dutchNetherlands: 'Hollandi (Holland)', dutchBelgium: 'Hollandi (Belgia)', portuguesePortugal: 'Portugali (Portugal)', portugueseBrazil: 'Portugali (Brasiilia)'
  },
  fi: {
    bulgarian: 'Bulgaria', czech: 'Tsekki', welsh: 'Wales', danish: 'Tanska', german: 'Saksa', greek: 'Kreikka', english: 'Englanti', spanish: 'Espanja', estonian: 'Viro', finnish: 'Suomi', french: 'Ranska', irish: 'Iiri', croatian: 'Kroatia', hungarian: 'Unkari', armenian: 'Armenia', icelandic: 'Islanti', italian: 'Italia', lithuanian: 'Liettua', latvian: 'Latvia', maltese: 'Malta', dutch: 'Hollanti', norwegian: 'Norja', polish: 'Puola', portuguese: 'Portugali', romanian: 'Romania', russian: 'Venäjä', slovak: 'Slovakia', slovenian: 'Slovenia', swedish: 'Ruotsi',
    germanGermany: 'Saksa (Saksa)', germanAustria: 'Saksa (Itävalta)', germanSwitzerland: 'Saksa (Sveitsi)', englishUK: 'Englanti (Iso-Britannia)', englishUS: 'Englanti (USA)', englishAustralia: 'Englanti (Australia)', englishCanada: 'Englanti (Kanada)', spanishSpain: 'Espanja (Espanja)', spanishMexico: 'Espanja (Meksiko)', spanishArgentina: 'Espanja (Argentiina)', frenchFrance: 'Ranska (Ranska)', frenchCanada: 'Ranska (Kanada)', frenchBelgium: 'Ranska (Belgia)', dutchNetherlands: 'Hollanti (Alankomaat)', dutchBelgium: 'Hollanti (Belgia)', portuguesePortugal: 'Portugali (Portugali)', portugueseBrazil: 'Portugali (Brasilia)'
  },
  ga: {
    bulgarian: 'Bulgáiris', czech: 'Seicis', welsh: 'Breatnais', danish: 'Danmhairgis', german: 'Gearmáinis', greek: 'Gréigis', english: 'Béarla', spanish: 'Spáinnis', estonian: 'Eastóinis', finnish: 'Fionlainnis', french: 'Fraincis', irish: 'Gaeilge', croatian: 'Cróitis', hungarian: 'Ungáiris', armenian: 'Airméinis', icelandic: 'Íoslainnis', italian: 'Iodáilis', lithuanian: 'Liotuáinis', latvian: 'Laitvis', maltese: 'Máltais', dutch: 'Ollainnis', norwegian: 'Ioruais', polish: 'Polainnis', portuguese: 'Portaingéilis', romanian: 'Rómáinis', russian: 'Rúisis', slovak: 'Slóvaicis', slovenian: 'Slóivéinis', swedish: 'Sualainnis',
    germanGermany: 'Gearmáinis (An Ghearmáin)', germanAustria: 'Gearmáinis (An Ostair)', germanSwitzerland: 'Gearmáinis (An Eilvéis)', englishUK: 'Béarla (An Ríocht Aontaithe)', englishUS: 'Béarla (SAM)', englishAustralia: 'Béarla (An Astráil)', englishCanada: 'Béarla (Ceanada)', spanishSpain: 'Spáinnis (An Spáinn)', spanishMexico: 'Spáinnis (Meicsiceo)', spanishArgentina: 'Spáinnis (An Airgintín)', frenchFrance: 'Fraincis (An Fhrainc)', frenchCanada: 'Fraincis (Ceanada)', frenchBelgium: 'Fraincis (An Bheilg)', dutchNetherlands: 'Ollainnis (An Ísiltír)', dutchBelgium: 'Ollainnis (An Bheilg)', portuguesePortugal: 'Portaingéilis (An Phortaingéil)', portugueseBrazil: 'Portaingéilis (An Bhrasaíl)'
  },
  hr: {
    bulgarian: 'Bugarski', czech: 'Češki', welsh: 'Velški', danish: 'Danski', german: 'Njemački', greek: 'Grčki', english: 'Engleski', spanish: 'Španjolski', estonian: 'Estonski', finnish: 'Finski', french: 'Francuski', irish: 'Irski', croatian: 'Hrvatski', hungarian: 'Mađarski', armenian: 'Armenski', icelandic: 'Islandski', italian: 'Talijanski', lithuanian: 'Litavski', latvian: 'Latvijski', maltese: 'Malteški', dutch: 'Nizozemski', norwegian: 'Norveški', polish: 'Poljski', portuguese: 'Portugalski', romanian: 'Rumunjski', russian: 'Ruski', slovak: 'Slovački', slovenian: 'Slovenski', swedish: 'Švedski',
    germanGermany: 'Njemački (Njemačka)', germanAustria: 'Njemački (Austrija)', germanSwitzerland: 'Njemački (Švicarska)', englishUK: 'Engleski (Ujedinjeno Kraljevstvo)', englishUS: 'Engleski (SAD)', englishAustralia: 'Engleski (Australija)', englishCanada: 'Engleski (Kanada)', spanishSpain: 'Španjolski (Španjolska)', spanishMexico: 'Španjolski (Meksiko)', spanishArgentina: 'Španjolski (Argentina)', frenchFrance: 'Francuski (Francuska)', frenchCanada: 'Francuski (Kanada)', frenchBelgium: 'Francuski (Belgija)', dutchNetherlands: 'Nizozemski (Nizozemska)', dutchBelgium: 'Nizozemski (Belgija)', portuguesePortugal: 'Portugalski (Portugal)', portugueseBrazil: 'Portugalski (Brazil)'
  },
  hu: {
    bulgarian: 'Bolgár', czech: 'Cseh', welsh: 'Walesi', danish: 'Dán', german: 'Német', greek: 'Görög', english: 'Angol', spanish: 'Spanyol', estonian: 'Észt', finnish: 'Finn', french: 'Francia', irish: 'Ír', croatian: 'Horvát', hungarian: 'Magyar', armenian: 'Örmény', icelandic: 'Izlandi', italian: 'Olasz', lithuanian: 'Litván', latvian: 'Lett', maltese: 'Máltai', dutch: 'Holland', norwegian: 'Norvég', polish: 'Lengyel', portuguese: 'Portugál', romanian: 'Román', russian: 'Orosz', slovak: 'Szlovák', slovenian: 'Szlovén', swedish: 'Svéd',
    germanGermany: 'Német (Németország)', germanAustria: 'Német (Ausztria)', germanSwitzerland: 'Német (Svájc)', englishUK: 'Angol (Egyesült Királyság)', englishUS: 'Angol (USA)', englishAustralia: 'Angol (Ausztrália)', englishCanada: 'Angol (Kanada)', spanishSpain: 'Spanyol (Spanyolország)', spanishMexico: 'Spanyol (Mexikó)', spanishArgentina: 'Spanyol (Argentína)', frenchFrance: 'Francia (Franciaország)', frenchCanada: 'Francia (Kanada)', frenchBelgium: 'Francia (Belgium)', dutchNetherlands: 'Holland (Hollandia)', dutchBelgium: 'Holland (Belgium)', portuguesePortugal: 'Portugál (Portugália)', portugueseBrazil: 'Portugál (Brazília)'
  },
  hy: {
    bulgarian: 'Բուլղարերեն', czech: 'Չեխերեն', welsh: 'Ուելսերեն', danish: 'Դանիերեն', german: 'Գերմաներեն', greek: 'Հունարեն', english: 'Անգլերեն', spanish: 'Իսպաներեն', estonian: 'Էստոներեն', finnish: 'Ֆիններեն', french: 'Ֆրանսերեն', irish: 'Իռլանդերեն', croatian: 'Խորվաթերեն', hungarian: 'Հունգարերեն', armenian: 'Հայերեն', icelandic: 'Իսլանդերեն', italian: 'Իտալերեն', lithuanian: 'Լիտվաներեն', latvian: 'Լատվիերեն', maltese: 'Մալթայերեն', dutch: 'Հոլանդերեն', norwegian: 'Նորվեգերեն', polish: 'Լեհերեն', portuguese: 'Պորտուգալերեն', romanian: 'Ռումիներեն', russian: 'Ռուսերեն', slovak: 'Սլովակերեն', slovenian: 'Սլովեներեն', swedish: 'Շվեդերեն',
    germanGermany: 'Գերմաներեն (Գերմանիա)', germanAustria: 'Գերմաներեն (Ավստրիա)', germanSwitzerland: 'Գերմաներեն (Շվեյցարիա)', englishUK: 'Անգլերեն (Միավորված Թագավորություն)', englishUS: 'Անգլերեն (ԱՄՆ)', englishAustralia: 'Անգլերեն (Ավստրալիա)', englishCanada: 'Անգլերեն (Կանադա)', spanishSpain: 'Իսպաներեն (Իսպանիա)', spanishMexico: 'Իսպաներեն (Մեքսիկա)', spanishArgentina: 'Իսպաներեն (Արգենտինա)', frenchFrance: 'Ֆրանսերեն (Ֆրանսիա)', frenchCanada: 'Ֆրանսերեն (Կանադա)', frenchBelgium: 'Ֆրանսերեն (Բելգիա)', dutchNetherlands: 'Հոլանդերեն (Հոլանդիա)', dutchBelgium: 'Հոլանդերեն (Բելգիա)', portuguesePortugal: 'Պորտուգալերեն (Պորտուգալիա)', portugueseBrazil: 'Պորտուգալերեն (Բրազիլիա)'
  },
  lt: {
    bulgarian: 'Bulgarų', czech: 'Čekų', welsh: 'Valų', danish: 'Danų', german: 'Vokiečių', greek: 'Graikų', english: 'Anglų', spanish: 'Ispanų', estonian: 'Estų', finnish: 'Suomių', french: 'Prancūzų', irish: 'Airių', croatian: 'Kroatų', hungarian: 'Vengrų', armenian: 'Armėnų', icelandic: 'Islandų', italian: 'Italų', lithuanian: 'Lietuvių', latvian: 'Latvių', maltese: 'Maltiečių', dutch: 'Olandų', norwegian: 'Norvegų', polish: 'Lenkų', portuguese: 'Portugalų', romanian: 'Rumunų', russian: 'Rusų', slovak: 'Slovakų', slovenian: 'Slovėnų', swedish: 'Švedų',
    germanGermany: 'Vokiečių (Vokietija)', germanAustria: 'Vokiečių (Austrija)', germanSwitzerland: 'Vokiečių (Šveicarija)', englishUK: 'Anglų (Jungtinė Karalystė)', englishUS: 'Anglų (JAV)', englishAustralia: 'Anglų (Australija)', englishCanada: 'Anglų (Kanada)', spanishSpain: 'Ispanų (Ispanija)', spanishMexico: 'Ispanų (Meksika)', spanishArgentina: 'Ispanų (Argentina)', frenchFrance: 'Prancūzų (Prancūzija)', frenchCanada: 'Prancūzų (Kanada)', frenchBelgium: 'Prancūzų (Belgija)', dutchNetherlands: 'Olandų (Nyderlandai)', dutchBelgium: 'Olandų (Belgija)', portuguesePortugal: 'Portugalų (Portugalija)', portugueseBrazil: 'Portugalų (Brazilija)'
  },
  lv: {
    bulgarian: 'Bulgāru', czech: 'Čehu', welsh: 'Velsiešu', danish: 'Dāņu', german: 'Vācu', greek: 'Grieķu', english: 'Angļu', spanish: 'Spāņu', estonian: 'Igauņu', finnish: 'Somu', french: 'Franču', irish: 'Īru', croatian: 'Horvātu', hungarian: 'Ungāru', armenian: 'Armēņu', icelandic: 'Islandiešu', italian: 'Itāļu', lithuanian: 'Lietuviešu', latvian: 'Latviešu', maltese: 'Maltiešu', dutch: 'Holandiešu', norwegian: 'Norvēģu', polish: 'Poļu', portuguese: 'Portugāļu', romanian: 'Rumāņu', russian: 'Krievu', slovak: 'Slovāku', slovenian: 'Slovēņu', swedish: 'Zviedru',
    germanGermany: 'Vācu (Vācija)', germanAustria: 'Vācu (Austrija)', germanSwitzerland: 'Vācu (Šveice)', englishUK: 'Angļu (Apvienotā Karaliste)', englishUS: 'Angļu (ASV)', englishAustralia: 'Angļu (Austrālija)', englishCanada: 'Angļu (Kanāda)', spanishSpain: 'Spāņu (Spānija)', spanishMexico: 'Spāņu (Meksika)', spanishArgentina: 'Spāņu (Argentīna)', frenchFrance: 'Franču (Francija)', frenchCanada: 'Franču (Kanāda)', frenchBelgium: 'Franču (Beļģija)', dutchNetherlands: 'Holandiešu (Nīderlande)', dutchBelgium: 'Holandiešu (Beļģija)', portuguesePortugal: 'Portugāļu (Portugāle)', portugueseBrazil: 'Portugāļu (Brazīlija)'
  },
  mt: {
    bulgarian: 'Bulgaru', czech: 'Ċek', welsh: 'Welsh', danish: 'Daniż', german: 'Ġermaniż', greek: 'Grieg', english: 'Ingliż', spanish: 'Spanjol', estonian: 'Estonian', finnish: 'Finlandiż', french: 'Franċiż', irish: 'Irlandiż', croatian: 'Kroat', hungarian: 'Ungeriż', armenian: 'Armenjan', icelandic: 'Iżlandiż', italian: 'Taljan', lithuanian: 'Litwan', latvian: 'Latvjan', maltese: 'Malti', dutch: 'Olandiż', norwegian: 'Norveġjan', polish: 'Pollakk', portuguese: 'Portugiż', romanian: 'Rumen', russian: 'Russu', slovak: 'Slovakk', slovenian: 'Sloven', swedish: 'Żvediż',
    germanGermany: 'Ġermaniż (Ġermanja)', germanAustria: 'Ġermaniż (Awstrija)', germanSwitzerland: 'Ġermaniż (Svizzera)', englishUK: 'Ingliż (Renju Unit)', englishUS: 'Ingliż (Stati Uniti)', englishAustralia: 'Ingliż (Awstralja)', englishCanada: 'Ingliż (Kanada)', spanishSpain: 'Spanjol (Spanja)', spanishMexico: 'Spanjol (Messiku)', spanishArgentina: 'Spanjol (Arġentina)', frenchFrance: 'Franċiż (Franza)', frenchCanada: 'Franċiż (Kanada)', frenchBelgium: 'Franċiż (Belġju)', dutchNetherlands: 'Olandiż (Olanda)', dutchBelgium: 'Olandiż (Belġju)', portuguesePortugal: 'Portugiż (Portugal)', portugueseBrazil: 'Portugiż (Brażil)'
  },
  no: {
    bulgarian: 'Bulgarsk', czech: 'Tsjekkisk', welsh: 'Walisisk', danish: 'Dansk', german: 'Tysk', greek: 'Gresk', english: 'Engelsk', spanish: 'Spansk', estonian: 'Estisk', finnish: 'Finsk', french: 'Fransk', irish: 'Irsk', croatian: 'Kroatisk', hungarian: 'Ungarsk', armenian: 'Armensk', icelandic: 'Islandsk', italian: 'Italiensk', lithuanian: 'Litauisk', latvian: 'Latvisk', maltese: 'Maltesisk', dutch: 'Nederlandsk', norwegian: 'Norsk', polish: 'Polsk', portuguese: 'Portugisisk', romanian: 'Rumensk', russian: 'Russisk', slovak: 'Slovakisk', slovenian: 'Slovensk', swedish: 'Svensk',
    germanGermany: 'Tysk (Tyskland)', germanAustria: 'Tysk (Østerrike)', germanSwitzerland: 'Tysk (Sveits)', englishUK: 'Engelsk (Storbritannia)', englishUS: 'Engelsk (USA)', englishAustralia: 'Engelsk (Australia)', englishCanada: 'Engelsk (Canada)', spanishSpain: 'Spansk (Spania)', spanishMexico: 'Spansk (Mexico)', spanishArgentina: 'Spansk (Argentina)', frenchFrance: 'Fransk (Frankrike)', frenchCanada: 'Fransk (Canada)', frenchBelgium: 'Fransk (Belgia)', dutchNetherlands: 'Nederlandsk (Nederland)', dutchBelgium: 'Nederlandsk (Belgia)', portuguesePortugal: 'Portugisisk (Portugal)', portugueseBrazil: 'Portugisisk (Brasil)'
  },
  pt: {
    bulgarian: 'Búlgaro', czech: 'Tcheco', welsh: 'Galês', danish: 'Dinamarquês', german: 'Alemão', greek: 'Grego', english: 'Inglês', spanish: 'Espanhol', estonian: 'Estoniano', finnish: 'Finlandês', french: 'Francês', irish: 'Irlandês', croatian: 'Croata', hungarian: 'Húngaro', armenian: 'Arménio', icelandic: 'Islandês', italian: 'Italiano', lithuanian: 'Lituano', latvian: 'Letão', maltese: 'Maltês', dutch: 'Holandês', norwegian: 'Norueguês', polish: 'Polaco', portuguese: 'Português', romanian: 'Romeno', russian: 'Russo', slovak: 'Eslovaco', slovenian: 'Esloveno', swedish: 'Sueco',
    germanGermany: 'Alemão (Alemanha)', germanAustria: 'Alemão (Áustria)', germanSwitzerland: 'Alemão (Suíça)', englishUK: 'Inglês (Reino Unido)', englishUS: 'Inglês (Estados Unidos)', englishAustralia: 'Inglês (Austrália)', englishCanada: 'Inglês (Canadá)', spanishSpain: 'Espanhol (Espanha)', spanishMexico: 'Espanhol (México)', spanishArgentina: 'Espanhol (Argentina)', frenchFrance: 'Francês (França)', frenchCanada: 'Francês (Canadá)', frenchBelgium: 'Francês (Bélgica)', dutchNetherlands: 'Holandês (Países Baixos)', dutchBelgium: 'Holandês (Bélgica)', portuguesePortugal: 'Português (Portugal)', portugueseBrazil: 'Português (Brasil)'
  },
  ro: {
    bulgarian: 'Bulgară', czech: 'Cehă', welsh: 'Galeză', danish: 'Daneză', german: 'Germană', greek: 'Greacă', english: 'Engleză', spanish: 'Spaniolă', estonian: 'Estonă', finnish: 'Finlandeză', french: 'Franceză', irish: 'Irlandeză', croatian: 'Croată', hungarian: 'Maghiară', armenian: 'Armeană', icelandic: 'Islandeză', italian: 'Italiană', lithuanian: 'Lituaniană', latvian: 'Letonă', maltese: 'Malteză', dutch: 'Olandeză', norwegian: 'Norvegiană', polish: 'Poloneză', portuguese: 'Portugheză', romanian: 'Română', russian: 'Rusă', slovak: 'Slovacă', slovenian: 'Slovenă', swedish: 'Suedeză',
    germanGermany: 'Germană (Germania)', germanAustria: 'Germană (Austria)', germanSwitzerland: 'Germană (Elveția)', englishUK: 'Engleză (Regatul Unit)', englishUS: 'Engleză (SUA)', englishAustralia: 'Engleză (Australia)', englishCanada: 'Engleză (Canada)', spanishSpain: 'Spaniolă (Spania)', spanishMexico: 'Spaniolă (Mexic)', spanishArgentina: 'Spaniolă (Argentina)', frenchFrance: 'Franceză (Franța)', frenchCanada: 'Franceză (Canada)', frenchBelgium: 'Franceză (Belgia)', dutchNetherlands: 'Olandeză (Țările de Jos)', dutchBelgium: 'Olandeză (Belgia)', portuguesePortugal: 'Portugheză (Portugalia)', portugueseBrazil: 'Portugheză (Brazilia)'
  },
  sk: {
    bulgarian: 'Bulharčina', czech: 'Čeština', welsh: 'Waleština', danish: 'Dánčina', german: 'Nemčina', greek: 'Gréčtina', english: 'Angličtina', spanish: 'Španielčina', estonian: 'Estónčina', finnish: 'Fínčina', french: 'Francúzština', irish: 'Írčina', croatian: 'Chorvátčina', hungarian: 'Maďarčina', armenian: 'Arménčina', icelandic: 'Islandčina', italian: 'Taliančina', lithuanian: 'Litovčina', latvian: 'Lotyština', maltese: 'Maltčina', dutch: 'Holandčina', norwegian: 'Nórčina', polish: 'Poľština', portuguese: 'Portugalčina', romanian: 'Rumunčina', russian: 'Ruština', slovak: 'Slovenčina', slovenian: 'Slovinčina', swedish: 'Švédčina',
    germanGermany: 'Nemčina (Nemecko)', germanAustria: 'Nemčina (Rakúsko)', germanSwitzerland: 'Nemčina (Švajčiarsko)', englishUK: 'Angličtina (Spojené kráľovstvo)', englishUS: 'Angličtina (USA)', englishAustralia: 'Angličtina (Austrália)', englishCanada: 'Angličtina (Kanada)', spanishSpain: 'Španielčina (Španielsko)', spanishMexico: 'Španielčina (Mexiko)', spanishArgentina: 'Španielčina (Argentína)', frenchFrance: 'Francúzština (Francúzsko)', frenchCanada: 'Francúzština (Kanada)', frenchBelgium: 'Francúzština (Belgicko)', dutchNetherlands: 'Holandčina (Holandsko)', dutchBelgium: 'Holandčina (Belgicko)', portuguesePortugal: 'Portugalčina (Portugalsko)', portugueseBrazil: 'Portugalčina (Brazília)'
  },
  sl: {
    bulgarian: 'Bolgarščina', czech: 'Češčina', welsh: 'Valižanščina', danish: 'Danščina', german: 'Nemščina', greek: 'Grščina', english: 'Angleščina', spanish: 'Španščina', estonian: 'Estonščina', finnish: 'Finščina', french: 'Francoščina', irish: 'Irščina', croatian: 'Hrvaščina', hungarian: 'Madžarščina', armenian: 'Armenščina', icelandic: 'Islandščina', italian: 'Italijanščina', lithuanian: 'Litovščina', latvian: 'Latvijščina', maltese: 'Malteščina', dutch: 'Nizozemščina', norwegian: 'Norveščina', polish: 'Poljščina', portuguese: 'Portugalščina', romanian: 'Romunščina', russian: 'Ruščina', slovak: 'Slovaščina', slovenian: 'Slovenščina', swedish: 'Švedščina',
    germanGermany: 'Nemščina (Nemčija)', germanAustria: 'Nemščina (Avstrija)', germanSwitzerland: 'Nemščina (Švica)', englishUK: 'Angleščina (Združeno kraljestvo)', englishUS: 'Angleščina (ZDA)', englishAustralia: 'Angleščina (Avstralija)', englishCanada: 'Angleščina (Kanada)', spanishSpain: 'Španščina (Španija)', spanishMexico: 'Španščina (Mehika)', spanishArgentina: 'Španščina (Argentina)', frenchFrance: 'Francoščina (Francija)', frenchCanada: 'Francoščina (Kanada)', frenchBelgium: 'Francoščina (Belgija)', dutchNetherlands: 'Nizozemščina (Nizozemska)', dutchBelgium: 'Nizozemščina (Belgija)', portuguesePortugal: 'Portugalščina (Portugalska)', portugueseBrazil: 'Portugalščina (Brazilija)'
  },
  el: {
    bulgarian: 'Βουλγαρικά', czech: 'Τσεχικά', welsh: 'Ουαλικά', danish: 'Δανικά', german: 'Γερμανικά', greek: 'Ελληνικά', english: 'Αγγλικά', spanish: 'Ισπανικά', estonian: 'Εσθονικά', finnish: 'Φινλανδικά', french: 'Γαλλικά', irish: 'Ιρλανδικά', croatian: 'Κροατικά', hungarian: 'Ουγγρικά', armenian: 'Αρμενικά', icelandic: 'Ισλανδικά', italian: 'Ιταλικά', lithuanian: 'Λιθουανικά', latvian: 'Λετονικά', maltese: 'Μαλτέζικα', dutch: 'Ολλανδικά', norwegian: 'Νορβηγικά', polish: 'Πολωνικά', portuguese: 'Πορτογαλικά', romanian: 'Ρουμανικά', russian: 'Ρωσικά', slovak: 'Σλοβακικά', slovenian: 'Σλοβενικά', swedish: 'Σουηδικά',
    germanGermany: 'Γερμανικά (Γερμανία)', germanAustria: 'Γερμανικά (Αυστρία)', germanSwitzerland: 'Γερμανικά (Ελβετία)', englishUK: 'Αγγλικά (Ηνωμένο Βασίλειο)', englishUS: 'Αγγλικά (ΗΠΑ)', englishAustralia: 'Αγγλικά (Αυστραλία)', englishCanada: 'Αγγλικά (Καναδάς)', spanishSpain: 'Ισπανικά (Ισπανία)', spanishMexico: 'Ισπανικά (Μεξικό)', spanishArgentina: 'Ισπανικά (Αργεντινή)', frenchFrance: 'Γαλλικά (Γαλλία)', frenchCanada: 'Γαλλικά (Καναδάς)', frenchBelgium: 'Γαλλικά (Βέλγιο)', dutchNetherlands: 'Ολλανδικά (Ολλανδία)', dutchBelgium: 'Ολλανδικά (Βέλγιο)', portuguesePortugal: 'Πορτογαλικά (Πορτογαλία)', portugueseBrazil: 'Πορτογαλικά (Βραζιλία)'
  }
}

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'base')

function addLanguageNamesToFile(langCode, filePath) {
  if (!LANGUAGE_TRANSLATIONS[langCode]) {
    console.log(`Skipping ${langCode} - no translations defined`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')
  
  // Check if languageNames already exists
  if (content.includes('languageNames:')) {
    console.log(`${langCode}: languageNames already exists`)
    return
  }
  
  // Create the languageNames section
  const translations = LANGUAGE_TRANSLATIONS[langCode]
  const languageNamesSection = `  languageNames: {
    // Base languages
    bulgarian: '${translations.bulgarian}',
    czech: '${translations.czech}',
    welsh: '${translations.welsh}',
    danish: '${translations.danish}',
    german: '${translations.german}',
    greek: '${translations.greek}',
    english: '${translations.english}',
    spanish: '${translations.spanish}',
    estonian: '${translations.estonian}',
    finnish: '${translations.finnish}',
    french: '${translations.french}',
    irish: '${translations.irish}',
    croatian: '${translations.croatian}',
    hungarian: '${translations.hungarian}',
    armenian: '${translations.armenian}',
    icelandic: '${translations.icelandic}',
    italian: '${translations.italian}',
    lithuanian: '${translations.lithuanian}',
    latvian: '${translations.latvian}',
    maltese: '${translations.maltese}',
    dutch: '${translations.dutch}',
    norwegian: '${translations.norwegian}',
    polish: '${translations.polish}',
    portuguese: '${translations.portuguese}',
    romanian: '${translations.romanian}',
    russian: '${translations.russian}',
    slovak: '${translations.slovak}',
    slovenian: '${translations.slovenian}',
    swedish: '${translations.swedish}',
    // Regional variants
    germanGermany: '${translations.germanGermany}',
    germanAustria: '${translations.germanAustria}',
    germanSwitzerland: '${translations.germanSwitzerland}',
    englishUK: '${translations.englishUK}',
    englishUS: '${translations.englishUS}',
    englishAustralia: '${translations.englishAustralia}',
    englishCanada: '${translations.englishCanada}',
    spanishSpain: '${translations.spanishSpain}',
    spanishMexico: '${translations.spanishMexico}',
    spanishArgentina: '${translations.spanishArgentina}',
    frenchFrance: '${translations.frenchFrance}',
    frenchCanada: '${translations.frenchCanada}',
    frenchBelgium: '${translations.frenchBelgium}',
    dutchNetherlands: '${translations.dutchNetherlands}',
    dutchBelgium: '${translations.dutchBelgium}',
    portuguesePortugal: '${translations.portuguesePortugal}',
    portugueseBrazil: '${translations.portugueseBrazil}'
  },`

  // Find the insertion point (before uiDocs section)
  const insertionPoint = content.indexOf('  uiDocs: {')
  if (insertionPoint === -1) {
    console.log(`${langCode}: Could not find uiDocs section`)
    return
  }

  // Insert the languageNames section
  const beforeInsert = content.substring(0, insertionPoint)
  const afterInsert = content.substring(insertionPoint)
  const newContent = beforeInsert + languageNamesSection + '\n  ' + afterInsert

  fs.writeFileSync(filePath, newContent, 'utf8')
  console.log(`${langCode}: Added languageNames section`)
}

// Process all language files
const files = fs.readdirSync(LOCALES_DIR)
files.forEach(file => {
  if (file.endsWith('.ts')) {
    const langCode = file.replace('.ts', '')
    const filePath = path.join(LOCALES_DIR, file)
    addLanguageNamesToFile(langCode, filePath)
  }
})

console.log('Language names addition complete!')