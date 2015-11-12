# vlau.me

A website that tries to help the Computer Science and Media students from our university with the hassle of remembering all the different links for their courses by eliminating that necessity.

## To Do / Problems

- Lack of order. The current implementation knows no order of the list items, so after reverting a filtered list to a former state, the order changes. That’s not good.
- `courses.json` is a bad name for the file since there are not only items for courses in it
- HTMLProofer to make sure links do not 404 too much.
- Find out whether `window.open(activeLinkItems[0].href, '_blank');` is troublesome

## Done
- BIG IDEA: Additionally of setting `list-item--active`(or instead), transfer `:focus` state. This *might* actually also scroll them into view!!!! OH MY GOD.
- Refactor the CSS mess
