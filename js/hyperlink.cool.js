'use strict';

const fuseOptions = {
  keys: ['title', 'keywords', 'persons', 'links.title'],
  id: 'key'
};

const config = {
  selector: {
    input: '.search__control',
    list: '.record-list',
    item: '.record',
    link: '.record__link',
    activeLink: '.record__link--active'
  }
};

function start() {
  // If some content is hidden via CSS, the js-disabled HTML class is set on
  // the body. Remove it, so potentially interactive elements become usable.
  if (document.body.classList.contains('js-disabled')) {
    document.body.classList.remove('js-disabled');
  }

  const recordNavigator = new RecordNavigator();
  recordNavigator.start();

  fetch('/_data/records.json?cache-bust-2018-10-18')
    .then(response => response.json())
    .then(data => {
      new RecordSearch(recordNavigator, data);
    })
    .catch(error => {
      console.error(error);
      document.querySelector(config.selector.input).parentElement.remove();
    });
}

const controlKeyNames = {
  13: 'enter',
  37: 'arrowLeft',
  38: 'arrowUp',
  39: 'arrowRight',
  40: 'arrowDown'
};

/**
 * Keyboard Navigation
 *
 * @property {HTMLUListElement} recordList
 * @property {HTMLInputElement} searchInput
 */
class RecordNavigator {
  constructor() {
    /** @type {HTMLUListElement} */
    this._recordList = document.querySelector(config.selector.list);
    /** @type {HTMLInputElement} */
    this._searchInput = document.querySelector(config.selector.input);
    this._searchInput.parentElement.removeAttribute('hidden');
    this.selectLink(this._recordList.querySelector(config.selector.link));

    this.controlKey = {
      enter: {
        trigger: event => {
          this.handleEnter(event);
        }
      },
      arrowLeft: {
        trigger: event => {
          this.navigateLink(event, -1);
        }
      },
      arrowRight: {
        trigger: event => {
          this.navigateLink(event, 1);
        }
      },
      arrowUp: {
        trigger: event => {
          this.navigateRecord(event, -1);
        }
      },
      arrowDown: {
        trigger: event => {
          this.navigateRecord(event, 1);
        }
      }
    };
  }

  get recordList() {
    return this._recordList;
  }

  get searchInput() {
    return this._searchInput;
  }

  start() {
    document.addEventListener('keydown', this.handleKeyboardInput.bind(this));
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyboardInput(event) {
    if (event.keyCode in controlKeyNames) {
      const keyName = controlKeyNames[event.keyCode];
      this.controlKey[keyName].trigger(event);
    }
  }

  /**
   * @returns {Boolean} whether the search input is currently focussed.
   */
  searchInputInFocus() {
    return document.activeElement === this.searchInput;
  }

  /**
   * @returns {HTMLAnchorElement}
   */
  getSelectedLink() {
    return this.recordList.querySelector(config.selector.activeLink);
  }

  /**
   * @param {HTMLAnchorElement} targetLink
   */
  selectLink(targetLink) {
    const activeLink = this.getSelectedLink();
    if (activeLink) {
      activeLink.classList.remove(config.selector.activeLink.slice(1));
    }

    targetLink.classList.add(config.selector.activeLink.slice(1));
  }

  /**
   * @param {KeyboardEvent} event
   * @param {Number} direction
   */
  navigateRecord(event, direction) {
    event.preventDefault();

    if (this.searchInputInFocus()) {
      /** @type {HTMLAnchorElement} */
      const targetLink = this.recordList.querySelector(config.selector.link);

      if (targetLink) {
        this.selectLink(targetLink);
        targetLink.focus();
      }
      return;
    }

    const activeRecord = this.getSelectedLink().closest(config.selector.item);
    const records = Array.from(this.recordList.querySelectorAll(config.selector.item));
    const currentIndex = records.indexOf(activeRecord);
    const targetRecord = records[currentIndex + direction];

    if (targetRecord) {
      /** @type {HTMLAnchorElement} */
      const targetLink = targetRecord.querySelector(config.selector.link);

      if (targetLink) {
        this.selectLink(targetLink);
        targetLink.focus();
      }
    }
  }

  /**
   * @param {KeyboardEvent} event
   * @param {Number} direction
   */
  navigateLink(event, direction) {
    if (this.searchInputInFocus()) {
      return;
    }

    event.preventDefault();

    /** @type {Array<HTMLAnchorElement>} */
    const links = Array.from(this.recordList.querySelectorAll(config.selector.link));
    const activeLink = this.getSelectedLink();
    const currentIndex = links.indexOf(activeLink);

    const targetLink = links[currentIndex + direction];

    if (targetLink) {
      this.selectLink(targetLink);
      targetLink.focus();
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleEnter(event) {
    if (!this.searchInputInFocus()) {
      return;
    }

    event.preventDefault();

    /** @type {HTMLAnchorElement} */
    const targetLink = this.recordList.querySelector(config.selector.link);
    if (targetLink) {
      this.selectLink(targetLink);
      targetLink.focus();
    }
  }
};

/**
 * @property {RecordNavigator} recordNavigator
 * @property {Map<String, String>} recordMarkup
 * @property {Array<HyperlinkRecord>} records
 * @property {HTMLUListElement} recordList
 * @property {HTMLInputElement} searchInput
 */
class RecordSearch {
  /**
   * @param {RecordNavigator} recordNavigator
   * @param {*} recordsJson
   */
  constructor(recordNavigator, recordsJson) {
    this._recordNavigator = recordNavigator;
    this._recordMarkup = prebuildRecordMarkup(recordsJson.entries);
    this._records = recordsJson.entries;
    /** @type {HTMLUListElement} */
    this._recordList = document.querySelector(config.selector.list);
    this._searchInput = this.initSearchInput();
  }

  get recordNavigator() {
    return this._recordNavigator;
  }

  get recordMarkup() {
    return this._recordMarkup;
  }

  get records() {
    return this._records;
  }

  get recordList() {
    return this._recordList;
  }

  get searchInput() {
    return this._searchInput;
  }

  /**
   * @returns {HTMLInputElement}
   * @private
   */
  initSearchInput() {
    /** @type {HTMLInputElement} */
    const searchInput = document.querySelector(config.selector.input);

    if (window.location.search.includes('search=')) {
      const query = window.location.search.split('search=')[1].split('&')[0];
      searchInput.value = decodeURIComponent(query);
    }

    if (searchInput.value.length > 0) {
      this.buildRecordList();
    }

    searchInput.focus();

    let timer;
    // Watch the search field for input changes …
    searchInput.addEventListener('input', () => {
      // … and build a new record list according to the filter value
      timer && clearTimeout(timer);
      timer = setTimeout(() => {
        this.buildRecordList();
      }, 150);
    }, false);

    return searchInput;
  }

  /**
   * Build the record list containing elements belonging to keys in `relatedKeys`.
   *
   * @private
   */
  buildRecordList() {
    const filteredKeys = this.filterRecordData();
    let recordListMarkup = '';

    if (this.searchInput.value.length === 0) {
      this.recordMarkup.forEach(markup => {
        recordListMarkup += markup;
      });
    } else {
      filteredKeys.forEach(key => {
        recordListMarkup += this.recordMarkup.get(key);
      });
    }

    this.recordList.innerHTML = recordListMarkup;

    if (this.recordList.hasChildNodes()) {
      // Set the first child element in the list to active state
      this.recordNavigator.selectLink(this.recordList.querySelector(config.selector.link));
    }
  }

  /**
   * Takes a string to search for in records to create an array of related keys.
   *
   * @returns {Array<String>} An array consisting of key strings which are related to `str`.
   * @private
   */
  filterRecordData() {
    const fuse = new Fuse(this.records, fuseOptions);
    return fuse.search(this.searchInput.value);
  }
};

/**
 * @param {Array<HyperlinkRecord>} records
 * @returns {Map<String, String>}
 */
function prebuildRecordMarkup(records) {
  const recordMarkup = new Map();

  for (const record of records) {
    recordMarkup.set(record.key, buildRecordString(record));
  }

  return recordMarkup;
}

/**
 * @param {HyperlinkRecord} record
 * @returns {String} a string that contains the HTML markup for a record
 */
function buildRecordString(record) {
  const itemClass = config.selector.item.slice(1);
  let recordString = `<li class="${itemClass}" data-key="${record.key}">
    <div class="${itemClass}__title">${record.title}</div>`;

  if (record.links.length > 0) {
    recordString += '<nav class="record__links">';
    for (const recordLink of record.links) {
      recordString += `<a class="${itemClass}__link" href="${recordLink.url}">
        ${recordLink.title}
      </a>`;
    }
    recordString += '</nav>';
  }

  recordString += '</li>';

  return recordString;
}

document.addEventListener('DOMContentLoaded', start);

// start();

/**
 * Type definitions
 *
 * @typedef HyperlinkRecord
 * @property {String} key
 * @property {String} title
 * @property {Array<String>} keywords
 * @property {Array<String>} persons
 * @property {Array<HyperlinkLink>} links
 *
 * @typedef HyperlinkLink
 * @property {String} title
 * @property {String} key
 * @property {String} url
 */
