import {
  type Camera,
  type Controls,
  type Mesh,
  type Plane,
  Raycaster,
  Vector2,
  Vector3,
  type WebGLRenderer,
} from "three";

/** Convert screen coordinates to Normalized Device Coordinates (NDC) */
export function screenToNDC(
  /** screen x coordinate */
  x: number,

  /** screen y coordinate */
  y: number,

  /** renderer */
  renderer: WebGLRenderer,
) {
  const rect = renderer.domElement.getBoundingClientRect();

  return new Vector2(
    ((x - rect.left) / rect.width) * 2 - 1,
    (-(y - rect.top) / rect.height) * 2 + 1,
  );
}

/** Convert scene coordinates to scene coordinates lying in a specified plane. */
export function screenToScene(
  /** screen x coordinate */
  x: number,

  /** screen y coordinate */
  y: number,

  /** plane to constrain coordinates to */
  plane: Plane,

  /** renderer */
  renderer: WebGLRenderer,

  /** camera */
  camera: Camera,
) {
  const ndc = screenToNDC(x, y, renderer),
    mouse = new Vector3(ndc.x, ndc.y, 0);

  mouse.unproject(camera);

  const dir = mouse.sub(camera.position).normalize();

  const distance =
    -plane.distanceToPoint(camera.position) /
    Math.cos(dir.angleTo(plane.normal));

  return camera.position.clone().add(dir.multiplyScalar(distance));
}

interface DragHandler {
  /** handle pointer down on the mesh */
  down?: (params: { raycaster: Raycaster }) => void;

  /** handle pointer motion once dragging has begun */
  move?: (params: { x: number; y: number }) => void;

  /** handle pointer release (ending dragging) */
  up?: (pos: Vector3) => void;
}

interface MakeMeshDraggableArgs {
  camera: Camera;
  container: HTMLDivElement;
  controls: Controls<any>;
  renderer: WebGLRenderer;
}

const dragHandlersSymbol = Symbol();

// inform TypeScript of our symbols
declare global {
  interface HTMLDivElement {
    [key: symbol]: [Mesh, DragHandler][];
  }
}

/**
 * Add drag functionality to a Mesh in a THREE.js scene
 * @see https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/DragControls.js
 * @returns a callback to remove drag functionality
 */
export function makeMeshDraggable(
  /** Mesh on which to add drag functionality */
  mesh: Mesh,

  /** event listeners */
  listeners: DragHandler,
  args: MakeMeshDraggableArgs,
): () => void {
  // initialize event handling on the container
  if (!args.container[dragHandlersSymbol]) {
    args.container[dragHandlersSymbol] = [];
    bindListeners(args);
  }

  const allListeners = args.container[dragHandlersSymbol];

  // add the event listener for this mesh
  allListeners.push([mesh, listeners]);

  // return a function to disable the functionality
  return () => {
    const index = allListeners.findIndex(
      (pair) => pair[0] === mesh && pair[1] === listeners,
    );

    if (index === -1) return;

    allListeners.splice(index, 1);
  };
}

/** set up drag functionality on a DOM element */
function bindListeners({
  camera,
  container,
  controls,
  renderer,
}: MakeMeshDraggableArgs) {
  /** handler for the drag event in progress */
  let handler: DragHandler;

  /** used to identify touchstart/touchend pairs */
  let touchId: number;

  // list of all [mesh, handlers] pairs
  const dragHandlers = container[dragHandlersSymbol];

  let dragging = false;

  // handle pointer down event
  const down = (e: MouseEvent | TouchEvent) => {
    let x: number, y: number;

    // get screen coordinates
    if (e instanceof MouseEvent) {
      [x, y] = [e.clientX, e.clientY];
    } else {
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      [x, y] = [touch.clientX, touch.clientY];
    }

    // raycast through scene
    const mouse = screenToNDC(x, y, renderer);

    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // loop over listeners
    for (const [mesh, options] of dragHandlers) {
      const intersects = raycaster.intersectObject(mesh).length > 0;

      if (intersects) {
        // disable other controls while dragging is in progress
        controls.enabled = false;

        // set dragging state (used by move handler)
        dragging = true;

        // set cursor
        container.classList.add("dragging");

        // set active handler
        handler = options;
        handler.down?.({ raycaster });
        break;
      }
    }
  };

  // handle move events
  const move = (e: MouseEvent | TouchEvent) => {
    if (dragging) {
      // if we are currently dragging, dispatch a move event
      if (e instanceof MouseEvent) {
        handler.move?.({ x: e.clientX, y: e.clientY });
      } else {
        for (const touch of Array.from(e.changedTouches)) {
          if (touch.identifier !== touchId) continue;

          handler.move?.({ x: touch.clientX, y: touch.clientY });
        }
      }
    } else if (e instanceof MouseEvent) {
      // otherwise, check if we are hovering over a draggable mesh

      // raycast through scene
      const mouse = screenToNDC(e.clientX, e.clientY, renderer);

      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);

      for (const [mesh] of dragHandlers) {
        const intersects = raycaster.intersectObject(mesh).length > 0;
        if (intersects) {
          // set draggable cursor
          container.classList.add("draggable");
          return;
        }
      }

      // remove draggable cursor
      container.classList.remove("draggable");
    }
  };

  // handle pointer up events
  const up = () => {
    if (!dragging) return;

    // re-enable controls
    controls.enabled = true;

    // remove dragging cursor
    container.classList.remove("dragging");

    // update dragging state
    dragging = false;
  };

  // bind event listeners
  container.addEventListener("touchstart", down);
  container.addEventListener("mousedown", down);

  container.addEventListener("mousemove", move);
  container.addEventListener("touchmove", move);

  document.addEventListener("mouseup", up);
  document.addEventListener("touchend", up);
  document.addEventListener("touchcancel", up);
}
