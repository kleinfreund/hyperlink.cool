# vlau.me

A website that tries to help the Computer Science and Media students from our university with the hassle of remembering all the different links for their courses by eliminating that necessity.

## To Do / Problems

- Gulp:
  - Build site with Jekyll (also handles Sass)
  - Local server
  - Watch for changes and repeat
  - Something like HTMLProofer to detect dead links

## Done

- BIG IDEA: Additionally of setting `list-item--active`(or instead), transfer `:focus` state. This *might* actually also scroll them into view!!!! OH MY GOD.
- Refactor the CSS mess
- Find out whether `window.open(link, '_blank');` is troublesome. **Answer:** It is, it triggers popup blockers so it’s not functional. Using `location = link` instead. I guess that’s the best for now.
- Lack of order. The current implementation knows no order of the list items, so after reverting a filtered list to a former state, the order changes. That’s not good. **Solution:** Rebuild list everytime.
- On navigating away from the page while there is any input in the filter results in a divergence when going back via browser history: the list is not filtered from the get go **Solution:** Fixed by the new filter/rebuild mechanism
- `courses.json` is a bad name for the file since there are not only items for courses in it. **Solution:** `record-data.json` it is
- Special cased handling of enter key press on mobile should just hide keyboard **Fixed** by *blurring* the input field (i.e. removing the focus)
- Accessing the first item in a list is difficult **Fixed** by moving the focus on enter to the first element
- Consider utilizing `tab` key for also transferring active state, because a link with focus can be opened by clicking tab by default
- Listen for `tab` keypresses: If pressed, do not prevent the default (so focus still gets transferred to the next focusable item). Now also transfer the *active* state from item to another. This enables us to *activate* links by pressing enter after traversing through the list by tabbing.
- Navigating away from the page and returning via browser history does not filter list. **Fixed**
- Fuzzy Search **Added Fuse.js**
