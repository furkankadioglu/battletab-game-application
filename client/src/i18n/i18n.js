/**
 * BattleTab v2 — i18n System
 * Translation hook and utility for React components.
 */

import { useState, useCallback } from 'react';
import en from './en.js';
import tr from './tr.js';

const languages = { en, tr };
let currentLang = localStorage.getItem('battletab_lang') || navigator.language?.slice(0, 2) || 'en';
if (!languages[currentLang]) currentLang = 'en';

let listeners = [];

export function t(key, params = {}) {
  const str = languages[currentLang]?.[key] || languages.en?.[key] || key;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`);
}

export function setLanguage(lang) {
  if (!languages[lang]) return;
  currentLang = lang;
  localStorage.setItem('battletab_lang', lang);
  listeners.forEach(fn => fn(lang));
}

export function getLanguage() {
  return currentLang;
}

export function getAvailableLanguages() {
  return Object.keys(languages);
}

export function useTranslation() {
  const [, setLang] = useState(currentLang);

  // Subscribe to language changes
  useState(() => {
    const handler = (lang) => setLang(lang);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter(fn => fn !== handler);
    };
  });

  return { t, setLanguage, language: currentLang };
}
