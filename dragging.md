# Drag effects

## Modes of interaction

pointer = mouse (desktop) or touch (mobile)

events:
- `mousedown`, `mouseup`, `mousemove`
- `touchdown`, `touchup`, `touchmove`

now:
- `pointerdown`, `pointerup`, `pointermove`

## Targets

- HTML element
    - no coordinate conversion necessary
    - `click`/`mousedown`/`touchstart`/`pointerdown` event listener

- SVG element
  - need to convert to SVG coordinates
  - `click`/`mousedown`/`touchstart`/`pointerdown` event listener

- mesh in a THREE.js scene
  - need to convert to scene coordinates
  - need to "raycast" to see which object was clicked or hovered on

## Interactions

### pointer down
Set up the pointer move and pointer up event listeners.

Get the current coordinates of the pointer (mouse/touch)

Attached on the drag target

change cursor to indicate that dragging is in progress

### pointer move
Get the current coordinates of the pointer (mouse/touch)

do something with that (move the element)

gets attached on `document.body` (if we can drag anywhere) or possibly on a container element (e.g. the THREE.js scene container)

### pointer up

cancel the move event listener

needs to be attached to `document.body` otherwise dragging can get stuck

reset cursor

### hover (pointer over draggable element)

change cursor to indicate that something is draggable