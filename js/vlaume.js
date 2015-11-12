function listFilter(jsonFile, inputID) {
    // Variable that stores the course data from the JSON file
    var listData;
    var listClass = 'course-list';
    var listItemClass = 'list-item';

    // Get the JSON data by using a XML http request
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonFile, false );
    xhr.onload = function(e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                listData = JSON.parse(xhr.responseText);
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function(e) {
        console.error(xhr.statusText);
    };
    xhr.send(null);

    // Wait for the document to be ready
    window.onload = function(e) {
        buildList();

        var firstItem = document.getElementById(listClass).firstElementChild;
        if (firstItem.className.indexOf(listItemClass) > -1) {
            firstItem.className += '  ' + listItemClass + '--active';
        }

        var keyArray = []
        for (var key in listData) {
            keyArray = keyArray.concat(listData[key].names);
        }

        var input = document.getElementById(inputID);
        input.placeholder = keyArray[Math.floor(Math.random() * keyArray.length)];;

        // Watch the search field for input changes …
        input.addEventListener('input', function(e) {
            // … and filter the course list
            filterCourseList(input.value);
        }, false);
    };

    window.onkeydown = function(e) {
        e = e || window.event;

        // If `e.keyCode` is not in the array, abort mission right away
        // `enter` – 13;   `esc` – 27;   `←` – 37;   `↑` – 38;   `→` – 39;   `↓` – 40;
        if ([13, 27, 37, 38, 39, 40].indexOf(e.keyCode) === -1) {
            return;
        }

        var activeItemClass = listItemClass + '--active';
        var activeLinkClass = listItemClass + '__link--active';
        var activeListItems = document.getElementsByClassName(activeItemClass);
        var activeLinkItems = document.getElementsByClassName(activeLinkClass);

        // Determine in which element has the active state: list or link item?
        if (activeListItems.length > 0 && activeLinkItems.length > 0) {
            // Bad voodoo happened. This should not be possible.
            console.log('Both list and link items have an active class. This should not happen.');
        } else if (activeListItems.length > 0) {
            // A list item is active
            // Cancel on `←`, and `Esc` key presses. We don’t need them here.
            if ([27, 37].indexOf(e.keyCode) > -1) {
                return;
            }

            // Else, we don’t want the default interaction to trigger.
            e.preventDefault();

            var activeItem = activeListItems[0];
            var targetItem;

            if ([13, 39].indexOf(e.keyCode) > -1) {
                var linkItems = activeItem.getElementsByClassName(listItemClass + '__link');
                activeItem.classList.remove(activeItemClass);
                linkItems[0].className += '  ' + listItemClass + '__link--active';

                // We’re done here
                return;
            } else if (e.keyCode === 38) {
                targetItem = activeItem.previousSibling;
            } else if (e.keyCode === 40) {
                targetItem = activeItem.nextSibling;
            }

            if (targetItem !== null) {
                if (targetItem.className.indexOf(listItemClass) > -1) {
                    activeItem.classList.remove(activeItemClass);
                    targetItem.className += '  ' + activeItemClass;

                    // List items have `tabindex="-1"` so they can get the focus without interupting
                    // regular tabbing through links. This, conveniently, scrolls them into the viewport.
                    targetItem.focus();
                }
            }
        } else if (activeLinkItems.length > 0) {
            // A link item is active, prevent the default interaction for the pressed key
            e.preventDefault();

            var activeItem = activeLinkItems[0];
            var targetItem;

            if (e.keyCode === 27 || ([37, 38].indexOf(e.keyCode) > -1 && activeItem.previousElementSibling === null)) {
                function findAncestor(el, cls) {
                    while ((el = el.parentElement) && !el.classList.contains(cls));
                    return el;
                }

                var parentListItem = findAncestor(activeLinkItems[0], listItemClass);
                activeLinkItems[0].classList.remove(activeLinkClass);
                parentListItem.className += '  ' + activeItemClass;

                return;
            } else if (e.keyCode === 13) {
                // window.open(activeLinkItems[0].href, '_blank');
                location = activeLinkItems[0].href;

                return;
            } else if ([37, 38].indexOf(e.keyCode) > -1) {
                targetItem = activeItem.previousSibling;
            } else if ([39, 40].indexOf(e.keyCode) > -1) {
                targetItem = activeItem.nextSibling;
            }

            if (targetItem !== null) {
                if (targetItem.className.indexOf(listItemClass + '__link') > -1) {
                    activeItem.classList.remove(activeLinkClass);
                    targetItem.className += '  ' + activeLinkClass;
                }
            }
        }
    };

    // Build a course item that represents one course in the course list
    function buildListItem(list, key, value) {
        var courseStr = '<li class="' + listItemClass + '  ' + listItemClass + '--' + key
            + '" data-abbr="' + value.abbr
            + '" tabindex="-1">'
            + '<div class="' + listItemClass + '__title">' + value.title + '</div>'
            + '<nav class="nav  link-list">';

        for (var link in value.links) {
            if (!link.hasOwnProperty(link)) {
                courseStr += '<a class="' + listItemClass + '__link" href="' + value.links[link] + '">' + link + '</a>';
            }
        }

        list.innerHTML += courseStr;
    }

    // Populate the course list
    function buildList() {
        var list = document.createElement('ul');
        list.id = listClass;
        list.className = listClass;

        for (var key in listData) {
            if (!key.hasOwnProperty(key)) {
                buildListItem(list, key, listData[key]);
            }
        }

        var filterContainer = document.getElementById('filter-container');
        filterContainer.insertBefore(list, null);
    }

    // Check whether an array contains strings that contain `substring`
    function arrayContainsSubstring(array, substring) {
        var lowercaseArray = array.map(function(item) {
            return item.toLowerCase();
        })

        for (var i = 0; i < lowercaseArray.length; i++) {
            if (lowercaseArray[i].indexOf(substring.toLowerCase()) > -1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filters the course list by removing all list items that are not related
     * to `searchStr`.
     * What’s related is determined by `listData[course].names`
     */
    function filterCourseList(searchStr) {
        // Separate related and unrelated course keys
        var unrelatedKeys = [];
        var relatedKeys = [];
        for (var key in listData) {
            if (!key.hasOwnProperty(key)) {
                if (arrayContainsSubstring(listData[key].names, searchStr)) {
                    relatedKeys.push(key);
                } else {
                    unrelatedKeys.push(key);
                }
            }
        }

        // Remove unrelated courses
        for (var i = 0; i < unrelatedKeys.length; i++) {
            // Check whether there are any course items …
            var listItems = document.getElementsByClassName(listItemClass + '--' + unrelatedKeys[i]);
            while (listItems.length > 0) {
                // … and remove them
                listItems[0].parentNode.removeChild(listItems[0]);
            }
        }

        // Add missing courses
        for (var i = 0; i < relatedKeys.length; i++) {
            var relatedKey = relatedKeys[i]
            // Check whether the course item already exists …
            if (document.getElementsByClassName(listItemClass + '--' + relatedKeys[i]).length === 0) {
                // … and add it otherwise
                buildListItem(document.getElementById(listClass), relatedKey, listData[relatedKey]);
            }
        }

        var firstItem = document.getElementById(listClass).firstElementChild;

        if (firstItem !== null) {
            if (firstItem.className.indexOf(listItemClass) > -1) {
                var activeClass = listItemClass + '--active';
                var activeItems = document.getElementsByClassName(activeClass);
                for (var i = 0; i < activeItems.length; i++) {
                    activeItems[i].classList.remove(activeClass);
                }

                firstItem.className += '  ' + activeClass;
            }
        }
    }
}
