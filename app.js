const SUPPORTED_LANGS = ['pt', 'en', 'it'];
const DEFAULT_LANG = 'pt';
const LANG_KEY = 'idosolink-lang';

const getPath = (lang) => `i18n/${lang}.json`;

const getNestedValue = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);

const setTextContent = (data) => {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    const value = getNestedValue(data, key);
    if (value !== undefined) {
      node.textContent = value;
    }
  });

  document.querySelectorAll('[data-i18n-alt]').forEach((node) => {
    const key = node.getAttribute('data-i18n-alt');
    const value = getNestedValue(data, key);
    if (value !== undefined) {
      node.setAttribute('alt', value);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.getAttribute('data-i18n-placeholder');
    const value = getNestedValue(data, key);
    if (value !== undefined) {
      node.setAttribute('placeholder', value);
    }
  });
};

const renderList = (containerId, items, itemClass) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = itemClass || '';
    li.textContent = item;
    container.appendChild(li);
  });
};

const renderCards = (containerId, items) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h4');
    title.textContent = item.title || `${index + 1}`;
    const text = document.createElement('p');
    text.textContent = item.text;

    card.append(title, text);
    container.appendChild(card);
  });
};

const renderFlow = (containerId, items) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = item;
    li.setAttribute('data-step', String(index + 1).padStart(2, '0'));
    container.appendChild(li);
  });
};

const renderPills = (containerId, items) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item) => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = item;
    container.appendChild(pill);
  });
};

const renderInfoCard = (containerId, data) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const title = document.createElement('h4');
  title.textContent = data.title;
  const text = document.createElement('p');
  text.textContent = data.text;
  container.append(title, text);
};

const renderPractice = (containerId, items) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('h4');
    title.textContent = item.title;
    const text = document.createElement('p');
    text.textContent = item.text;
    card.append(title, text);
    container.appendChild(card);
  });
};

const loadTranslations = async (lang) => {
  const response = await fetch(getPath(lang));
  if (!response.ok) {
    throw new Error(`Unable to load language: ${lang}`);
  }
  return response.json();
};

const applyTranslations = (data) => {
  setTextContent(data);
  if (data.meta && data.meta.title) {
    document.title = data.meta.title;
  }
  renderList('hero-bullets', data.hero.bullets);
  renderCards('how-steps', data.howItWorks.steps);
  renderList('families-benefits', data.families.benefits);
  renderFlow('families-flow', data.families.flow);
  renderList('caregivers-benefits', data.caregivers.benefits);
  renderPills('caregivers-pill-group', data.caregivers.highlights);
  renderList('caregivers-requirements', data.caregivers.requirements);
  renderList('caregivers-services', data.caregivers.services);
  renderCards('token-utility', data.token.utilities);
  renderCards('token-cycle', data.token.cycle);
  renderPractice('token-practice', data.token.practice);
  renderList('investors-thesis', data.investors.thesis);
  renderList('investors-metrics', data.investors.metrics);
  renderInfoCard('investors-token', data.investors.tokenConnection);
  renderCards('about-values', data.about.values);
};

const updateLanguage = async (lang) => {
  const selectedLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  const data = await loadTranslations(selectedLang);
  document.documentElement.lang = selectedLang;
  localStorage.setItem(LANG_KEY, selectedLang);
  applyTranslations(data);
  const select = document.getElementById('language-select');
  if (select) {
    select.value = selectedLang;
  }
  return data;
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    return stored;
  }
  const browserLang = navigator.language.slice(0, 2);
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : DEFAULT_LANG;
};

const setupMenuToggle = () => {
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
};

let currentTranslations = null;
let formListenerAttached = false;

const setupForm = (data) => {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  if (!form || !feedback) return;
  currentTranslations = data;

  if (formListenerAttached) return;
  formListenerAttached = true;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const message = String(formData.get('message') || '').trim();

    const emailValid = /\S+@\S+\.\S+/.test(email);

    if (!name || !email || !message) {
      feedback.textContent = currentTranslations.contact.validation.required;
      return;
    }

    if (!emailValid) {
      feedback.textContent = currentTranslations.contact.validation.email;
      return;
    }

    feedback.textContent = currentTranslations.contact.validation.success;
    form.reset();
  });
};

const init = async () => {
  const lang = getInitialLanguage();
  const data = await updateLanguage(lang);
  setupForm(data);
  setupMenuToggle();

  const select = document.getElementById('language-select');
  if (select) {
    select.addEventListener('change', (event) => {
      updateLanguage(event.target.value).then((newData) => setupForm(newData));
    });
  }
};

init();
