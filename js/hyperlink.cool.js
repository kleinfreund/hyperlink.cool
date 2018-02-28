'use strict';

const fuseOptions = {
  keys: ['title', 'keywords', 'persons', 'links.title'],
  id: 'key'
};

document.addEventListener('DOMContentLoaded', function () {
  // If some content is hidden via CSS, the js-disabled HTML class is set on
  // the body. Remove it, so potentially interactive elements become usable.
  if (document.body.classList.contains('js-disabled')) {
    document.body.classList.remove('js-disabled');
  }

  const recordNavigator = new RecordNavigator();
  document.addEventListener('keydown', function (event) {
    if (event.keyCode in controlKeyNames) {
      const keyName = controlKeyNames[event.keyCode];
      controlKey[keyName].trigger(recordNavigator, event);
    }
  });

  fetch('/_data/records.json')
    .then(response => response.json())
    .then(data => new RecordSearch(recordNavigator, data))
    .catch(error => {
      console.error(error);
      document.querySelector(config.selector.input).parentElement.remove();
    });
});

const config = {
  selector: {
    input: '.search__control',
    list: '.record-list',
    item: '.record',
    link: '.record__link',
    activeLink: '.record__link--active'
  }
};

const controlKeyNames = {
  // 9: 'tab',
  13: 'enter',
  37: 'arrowLeft',
  38: 'arrowUp',
  39: 'arrowRight',
  40: 'arrowDown'
};

const controlKey = {
  enter: {
    trigger: function (recordNavigator, event) {
      recordNavigator.handleEnter(event);
    }
  },
  tab: {
    trigger: function (recordNavigator, event) {
      recordNavigator.navigateLink(event, event.shiftKey ? -1 : 1);
    }
  },
  arrowLeft: {
    direction: -1,
    trigger: function (recordNavigator, event) {
      recordNavigator.navigateLink(event, this.direction);
    }
  },
  arrowRight: {
    direction: 1,
    trigger: function (recordNavigator, event) {
      recordNavigator.navigateLink(event, this.direction);
    }
  },
  arrowUp: {
    direction: -1,
    trigger: function (recordNavigator, event) {
      recordNavigator.navigateRecord(event, this.direction);
    }
  },
  arrowDown: {
    direction: 1,
    trigger: function (recordNavigator, event) {
      recordNavigator.navigateRecord(event, this.direction);
    }
  }
};

class RecordNavigator {
  constructor() {
    this._recordList = document.querySelector(config.selector.list);
    this._searchInput = document.querySelector(config.selector.input);
    this._searchInput.parentElement.removeAttribute('hidden');
    this.selectLink(this._recordList.querySelector(config.selector.link));
  }

  get recordList() {
    return this._recordList;
  }

  get searchInput() {
    return this._searchInput;
  }

  searchInputInFocus() {
    return document.activeElement === this.searchInput;
  }

  /**
   * @returns {Element}
   */
  getSelectedLink() {
    return this.recordList.querySelector(config.selector.activeLink);
  }

  /**
   * @param {Element} targetLink
   */
  selectLink(targetLink) {
    const activeLink = this.getSelectedLink();
    if (activeLink) {
      activeLink.classList.remove(config.selector.activeLink.slice(1));
    }

    targetLink.classList.add(config.selector.activeLink.slice(1));
  }

  navigateRecord(event, direction) {
    event.preventDefault();

    if (this.searchInputInFocus()) {
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
      const targetLink = targetRecord.querySelector(config.selector.link);
      if (targetLink) {
        this.selectLink(targetLink);
        targetLink.focus();
      }
    }
  }

  navigateLink(event, direction) {
    if (this.searchInputInFocus()) {
      return;
    }

    event.preventDefault();

    const activeLink = this.getSelectedLink();
    const links = Array.from(this.recordList.querySelectorAll(config.selector.link));
    const currentIndex = links.indexOf(activeLink);
    const targetLink = links[currentIndex + direction];

    if (targetLink) {
      this.selectLink(targetLink);
      targetLink.focus();
    }
  }

  handleEnter(event) {
    if (this.searchInputInFocus()) {
      const targetLink = this.recordList.querySelector(config.selector.link);
      if (targetLink) {
        this.selectLink(targetLink);
        targetLink.focus();
      }
      event.preventDefault();
    }
  }
};

class RecordSearch {
  constructor(recordNavigator, recordsJson) {
    this._recordNavigator = recordNavigator;
    this._recordMarkup = prebuildRecordMarkup(recordsJson.entries);
    this._records = recordsJson.entries;
    this._recordList = document.querySelector(config.selector.list);
    this._searchInput = document.querySelector(config.selector.input);
    this.initSearchInput();
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

  initSearchInput() {
    if (window.location.search.includes('search=')) {
      const query = window.location.search.split('search=')[1].split('&')[0];
      // ... put it in the search input
      this.searchInput.value = decodeURIComponent(query);
    }

    if (this.searchInput.value.length > 0) {
      this.buildRecordList();
    }

    this.searchInput.focus();

    let timer;
    // Watch the search field for input changes …
    this.searchInput.addEventListener('input', () => {
      // … and build a new record list according to the filter value
      timer && clearTimeout(timer);
      timer = setTimeout(() => {
        this.buildRecordList();
      }, 150);
    }, false);
  }

  /**
   * Build the record list containing elements belonging to keys in `relatedKeys`.
   */
  buildRecordList() {
    const filteredKeys = this.filterRecordData();
    let recordListMarkup = '';

    if (this.searchInput.value.length === 0) {
      this.recordMarkup.forEach(markup => recordListMarkup += markup);
    } else {
      filteredKeys.forEach(key => recordListMarkup += this.recordMarkup.get(key));
    }

    this.recordList.innerHTML = recordListMarkup;

    if (this.recordList.hasChildNodes()) {
      // Set the first child element in the list to active state
      this.recordNavigator.selectLink(this.recordList.querySelector(config.selector.link));
    }
  }

  /**
   * Takes a string to search for in records to create an array of related keys.
   * @return {Array} An array consisting of key strings which are related to `str`.
   */
  filterRecordData() {
    const fuse = new Fuse(this.records, fuseOptions);
    return fuse.search(this.searchInput.value);
  }
};

function prebuildRecordMarkup(records) {
  const recordMarkup = new Map();

  for (const record of records) {
    recordMarkup.set(record.key, buildRecordString(record));
  }

  return recordMarkup;
}

/**
 * @return {String} a string that contains the HTML markup for a record
 */
function buildRecordString(value) {
  const itemClass = config.selector.item.slice(1);
  let str = `<li class="${itemClass}" data-key="${value.key}">
      <div class="${itemClass}__title">${value.title}</div>`;

  if (value.links.length > 0) {
    str += `<nav class="record__links">`;
    for (const link of value.links) {
      str += `
        <a class="${itemClass}__link" href="${link.url}">
          ${link.title}
        </a>
      `;
    }
    str += `</nav>`;
  }

  str += `</li>`;

  return str;
}
