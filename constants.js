// @ts-check

/** The `id` of the `<canvas>` element in the HTML document. */
const CANVAS_ID = "gl-canvas"

/** The maximum distance between the camera and the base sphere. */
const MAX_DISTANCE = 20

/** The minimum distance between the camera and the base sphere. */
const MIN_DISTANCE = 3

/** The initial distance between the camera and the base sphere. */
const INITIAL_DISTANCE = 5

/**
 * The perceived friction the sphere experiences when you "let go" of it.
 * Setting this to `1` will effectively remove all inertia, while `0` will
 * remove friction entirely.
 */
const FRICTION = 0.25

/** The number of divisions for each sphere. */
const SPHERE_DIVISIONS = 72

/** The color (RGBA) for the base sphere. */
const BASE_SPHERE_COLOR = [0.0, 0.0, 0.0, 1.0]

/** How many bugs spawn per second. */
const BUG_SPAWN_FREQUENCY = 0.65

/** How much the arc length for each bug increases per second. */
const BUG_GROWTH_RATE = Math.PI / 72

/** The maximum number of allowed bugs at one time. */
const BUG_CAPACITY = 8

/**
 * The radial distance between each bug. The gaps must exist to prevent the
 * triangles from overlapping (which makes things look weird). By experimenting
 * a little, I landed on this number (with `SPHERE_DIVISIONS = 64`)
 */
const BUG_ELEVATION_GAP = 0.0032 // set this to 0.0018 if using 100 divisions

/**
 * The speed of the projectiles, in terms of units per second. Note that the
 * default size of the base sphere is `1.0`.
 */
const PROJECTILE_SPEED = 15

/**
 * Determines the cooldown for the projectile cannon in seconds.
 */
const CANNON_COOLDOWN = 0.2

/**
 * Defines the RPM of the sphere when holding down a key to rotate it.
 */
const KEY_ROTATION_SENSITIVITY = 12

/**
 * Defines the color of dying bugs.
 *
 * @type {[number, number, number, number]}
 */
const DYING_BUG_COLOR = [0.78, 0.24, 0.24, 1.0]

/**
 * How quickly a bug dies (once hit). This number will be the amount that the
 * inner arc length increases per second.
 */
const BUG_DEATH_SPEED = Math.PI / 2

const SCORE_SETTINGS = {
	missedShot: -50,
	landedShot: 100,
	perSecond: 1,
}

const OVERDRIVE_BLUE = [0.290, 0.847, 1.00, 1.00]

/**
 * Determines how sensitive the sphere is to rotation from clicking and
 * dragging it. Values above `1` will increase the sensitivity above it's
 * default, values below `1` will decrease the sensitivity. Negative values
 * are technically possible, but will invert the rotation direction.
 *
 * When you drag the sphere, the rotation is based on the displacement of the
 * cursor, divided by the length of the screen (i.e., the height or width,
 * whichever is longer), multiplied by 360 degrees, and then finally multiplied
 * by this constant.
 */
const DRAG_ROTATION_SENSITIVITY = 1.0

/**
 * The radius of the base sphere, which is ball that the bugs spawn on.
 */
const BASE_SPHERE_RADIUS = 1

/**
 * How many times per second the game is re-rendered.
 */
const REFRESH_RATE = 60

/**
 * The time (in milliseconds) that it takes to complete an animation on the
 * UI menus. E.g., the number of milliseconds it takes to fully hide/show the
 * pause menu. This should correspond to the `transition: ...` CSS property of
 * relevant elements, the menu animations are *not* handled by the JavaScript
 * code.
 */
const ANIMATION_TIME = 400

/**
 * Sets the difficulty modifiers for the game. Each modifier will be used as
 * a multiplier for the growth rate, spawn frequency, and capacity of bugs.
 */
const DIFFICULTY_MODIFIERS = {
	easy: 0.75,
	normal: 1.0,
	hard: 1.5,
	apocalypse: 2.0,
}
