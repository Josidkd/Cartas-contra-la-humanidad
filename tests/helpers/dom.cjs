const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Only the document boundary is doubled. The game and both real decks run unchanged.
function loadGame() {
  const elements = new Map();
  const document = {
    activeElement: null,
    getElementById: (id) => elements.get(id) || null,
    getElementsByName: (name) => [...elements.values()].filter((el) => el.name === name),
    querySelectorAll: (selector) =>
      [...elements.values()].filter((el) =>
        selector === '[data-card]'
          ? el.attributes['data-card'] !== undefined
          : selector === '[data-screen]'
            ? el.attributes['data-screen'] !== undefined
            : false,
      ),
  };
  class Element {
    constructor(attributes = {}, owner = null) {
      this.attributes = attributes;
      this.id = attributes.id;
      this.name = attributes.name;
      this.value = attributes.value || '';
      this.hidden = 'hidden' in attributes;
      this.disabled = 'disabled' in attributes;
      this.textContent = '';
      this.owner = owner;
      this.html = '';
      this.classes = new Set((attributes.class || '').split(/\s+/));
      this.classList = {
        add: (value) => this.classes.add(value),
        remove: (value) => this.classes.delete(value),
        contains: (value) => this.classes.has(value),
        toggle: (value, force) => {
          const add = force === undefined ? !this.classes.has(value) : force;
          if (add) this.classes.add(value);
          else this.classes.delete(value);
          return add;
        },
      };
    }
    set innerHTML(html) {
      for (const [id, el] of elements) {
        if (el.owner === this) elements.delete(id);
      }
      this.html = html;
      parse(html, this);
    }
    get innerHTML() {
      return this.html;
    }
    setAttribute(key, value) {
      this.attributes[key] = String(value);
    }
    getAttribute(key) {
      return this.attributes[key] ?? null;
    }
    removeAttribute(key) {
      delete this.attributes[key];
    }
    focus() {
      document.activeElement = this;
    }
  }
  function parse(html, owner = null) {
    for (const match of html.matchAll(/<[a-z][a-z0-9-]*\b([^>]*)>/gi)) {
      const attrs = {};
      for (const attr of match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g))
        attrs[attr[1]] = attr[2] ?? '';
      if (attrs.id || attrs.name)
        elements.set(attrs.id || `anonymous-${elements.size}`, new Element(attrs, owner));
    }
  }
  parse(fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8'));
  const alerts = [];
  const context = vm.createContext({
    document,
    console,
    alert: (text) => alerts.push(text),
    location: { reload() {} },
  });
  for (const file of [
    'componentes/cartasPregunta.js',
    'componentes/cartasRespuesta.js',
    'main.js',
  ]) {
    const filename = path.resolve(__dirname, '../..', file);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }
  return {
    run: (code) => vm.runInContext(code, context),
    el: (id) => document.getElementById(id),
    document,
    alerts,
    json: (code) => JSON.parse(vm.runInContext(`JSON.stringify(${code})`, context)),
  };
}

function configure(game, count = 3, rounds = 2) {
  game.el('numJugadores').value = String(count);
  game.run('creaPartida()');
  const fields = game.document.getElementsByName('inputNombre');
  for (let i = 0; i < count; i++)
    fields[i].value = ['Pablo', 'Ana', 'Luis'][i] || `Jugador ${i + 1}`;
  game.el('numRondas').value = String(rounds);
}
module.exports = { loadGame, configure };
