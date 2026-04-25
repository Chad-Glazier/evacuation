// @ts-check

/** The `id` of the `<canvas>` element in the HTML document. */
const CANVAS_ID = "gl-canvas"

/** The maximum distance between the camera and the base sphere. */
const MAX_DISTANCE = 20

/** The minimum distance between the camera and the base sphere. */
const MIN_DISTANCE = 3

/** The initial distance between the camera and the base sphere. */
const INITIAL_DISTANCE = 5

/** The number of divisions for each sphere. */
const SPHERE_DIVISIONS = 72

const OVERDRIVE_BLUE = [0.290, 0.847, 1.00, 1.00]

/**
 * The time (in milliseconds) that it takes to complete an animation on the
 * UI menus. E.g., the number of milliseconds it takes to fully hide/show the
 * pause menu. This should correspond to the `transition: ...` CSS property of
 * relevant elements, the menu animations are *not* handled by the JavaScript
 * code.
 */
const ANIMATION_TIME = 400

/** @type {GameOptions} */
const DEFAULT_GAME_OPTIONS = {
	overdriveDuration: 6 * 1000, // overdrive lasts 6 seconds.
	overdriveTemporalModifier: 0.10, // time moves at 10% during overdrive.
	overdriveCooldown: 30 * 1000, // 30 seconds.
	timeLimit: 2 * 60 * 1000, // 2 minutes, in milliseconds.
	casualtiesThreshold: 0.20, // Casualties are incurred beyond 20% coverage.
	initialSurvivorCount: 10000, // 10K initial survivors.
	baseSphereRadius: 1,
	startingDistance: 5,
	maxDistance: 10,
	minDistance: 3,
	refreshRate: 60,
	frictionCoefficient: 0.25,
	heatPerShot: 0.075,
	coolingRate: 0.20,
	projectileSpeed: 15,
	bugGrowthRate: Math.PI / 72,
	bugDeathRate: Math.PI / 2,
	scoreSettings: {
		missedShot: -100,
		landedShot: 100,
		perSecond: 5,
		onWin: 1000,
	},
	bugElevationGap: 0.0032,
	enableInertia: true,
	bugSpawnFrequency: 0.65,
	cannonCooldown: 0.20,
	dragRotationSensitivity: 1.0,
	keyRotationRPM: 20,
	bugCapacity: 8,
	difficultyModifiers: {
		easy: 1,
		normal: 2,
		hard: 3,
		apocalypse: 4,
	},
	dyingBugColor: [0.78, 0.24, 0.24, 1.0],
}
