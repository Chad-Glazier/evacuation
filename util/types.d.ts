declare type Sphere = {
	vertices: Float32Array
	indices: Uint16Array
	buffer?: {
		vertices: WebGLBuffer
		indices: WebGLBuffer
	}
}

declare type Options = {
	/**
	 * The rotation matrix for the sphere.
	 */
	rotate?: number[][]
	distance?: number
	spherePointColor?: number[]
	sphereColor?: number[]
}

/**
 * Represents an object that maps specific locations of values in certain 
 * shader programs (namely, the sphere and sphere points programs).
 */
declare type ProgramLocations = {
	points: {
		aVertexPosition: number
		uModelViewMatrix: WebGLUniformLocation
		uProjectionMatrix: WebGLUniformLocation
		uColor: WebGLUniformLocation
	}
	baseSphere: {
		aVertexPosition: number
		uModelViewMatrix: WebGLUniformLocation
		uProjectionMatrix: WebGLUniformLocation
		uColor: WebGLUniformLocation
	}
	rectangle: {
		aVertexPosition: number
		uModelViewMatrix: WebGLUniformLocation
		uProjectionMatrix: WebGLUniformLocation
	}
}

/**
 * Defines some options to customize how a sphere will look. The terminology is
 * basedon the spherical coordinate system:
 * https://en.wikipedia.org/wiki/Spherical_coordinate_system
 */
declare type SphereOptions = {
	/**
	 * Defines the distance between the center of the sphere and any point on
	 * its surface.
	 */
	radialDistance?: number

	/**
	 * Defines the interval of the polar angle.
	 * - If the interval would be broader than `Math.PI`, then it is set to
	 * 	`[0, Math.PI]`.
	 * - You can technically have the first value be the upper bound and vice
	 * 	versa. It doesn't make a difference.
	 *
	 * The polar angle coordinate defines the angle that each circle
	 * perpendicular to the xy-plane will make relative to the positive z-axis.
	 * In practice, this angle can define a cone.
	 *
	 * To make a cone with the top quarter of the sphere, you could specify
	 * that
	 * ```
	 * 	polarInterval: [0, Math.PI / 4]
	 * ```
	 *
	 * To make a hemisphere with the top half, you could specify
	 * ```
	 * 	polarInterval: [0, Math.PI / 2]
	 * ```
	 *
	 * To make a full sphere, you would would just set
	 * ```
	 * 	polarInterval: [0, Math.PI]
	 * ```
	 */
	polarInterval?: [number, number]

	/**
	 * Defines the interval of the azimuthal angle.
	 * - If the interval would be broader than `2 * Math.PI`, then it is set to
	 * 	`[0, 2 * Math.PI]`.
	 * - You can technically have the first value be the upper bound and vice
	 * 	versa. It doesn't make a difference.
	 *
	 * The azimuthal angle coordinate defines the angle that each circle
	 * perpendicular to the z-axis will make relative to the positive x-axis.
	 * In practice, this angle can define a wedge.
	 *
	 * To make a wedge with a quarter of the sphere, you could specify that
	 * ```
	 * 	azimuthalInterval: [0, Math.PI / 2]
	 * ```
	 * In terms of the xy-plane, this wedge would be the portion of the sphere
	 * that fits in the first quadrant.
	 *
	 * To make a hemisphere, you could instead say
	 * ```
	 * 	azimuthalInterval: [0, Math.PI]
	 * ```
	 * In terms of the xy-plane, this hemisphere would cover the first and
	 * second quadrants; i.e., all points on the sphere where the y-values are
	 * positive.
	 *
	 * To make a full sphere, you would would just set
	 * ```
	 * 	azimuthalInterval: [0, 2 * Math.PI]
	 * ```
	 */
	azimuthalInterval?: [number, number]

	/**
	 * When making spheres, the number of divisions typically defines how many
	 * vertices each circle will have. However, by restricting the azimuth
	 * and/or polar intervals, you can create wedges and cones. Such shapes may
	 * not need the same number of longitudal divisions as latitudal, and vice
	 * versa. When this value is `true`, these divisions are scaled to fit such
	 * shapes proportionally.
	 */
	scaleDivisions?: boolean

	/**
	 * If specified, the bottom-most set of vertices will be connected to the
	 * origin. When making a sphere with a less-than-full polar interval, this
	 * will make it look like a cone instead of a cap.
	 */
	isCone?: boolean
}

declare type Bug = {
	/**
	 * A (fixed) rotation matrix used to determine where the bug should be
	 * centered on the surface of the base sphere.
	 */
	rotationMatrix: number[][]
	arcLength: number
	color: number[]

	/**
	 * The elevation of the bug above the base sphere.
	 */
	elevation: number

	/**
	 * The `Date.now()` timestamp when the bug was spawned.
	 */
	spawnTime: number

	/**
	 * The memoized buffers for the bug.
	 */
	buffer?: {
		vertices: WebGLBuffer
		indices: WebGLBuffer
	}
}

declare type DyingBug = Bug & {
	deathTime: number
	innerArcLength: number
}

declare type GameDifficulty =
	| "easy"
	| "normal"
	| "hard"
	| "apocalypse"

declare type GameOptions = {
	coolingRate: number
	heatPerShot: number
	overdriveDuration: number
	overdriveTemporalModifier: number
	overdriveCooldown: number
	casualtiesThreshold: number
	initialSurvivorCount: number
	timeLimit: number
	keyRotationRPM: number
	baseSphereRadius: number
	startingDistance: number
	maxDistance: number
	minDistance: number
	frictionCoefficient: number
	projectileSpeed: number
	bugGrowthRate: number
	bugDeathRate: number
	scoreSettings: ScoreSettings
	bugElevationGap: number
	enableInertia: boolean
	bugSpawnFrequency: number
	cannonCooldown: number
	dragRotationSensitivity: number
	bugCapacity: number
	difficultyModifiers: {
		easy: number
		normal: number
		hard: number
		apocalypse: number
	}
	dyingBugColor: number[]
}

declare type GameConfig = GameOptions & {
	shaders: ShaderPrograms
	renderingContext: WebGLRenderingContext
	baseSphere: Sphere
}

declare type GameEvent = {
	stopPropagation(): void
	score: number
	coverage: number
	survivors: number
	timeRemaining: number
	overdriveCharge: number
	heat: number
}

declare type GameEventType =
	| "pause"
	| "unpause"
	| "score"
	| "survivor"
	| "coverage"
	| "timeremaining"
	| "overdrivecharge"
	| "activateoverdrive"
	| "deactivateoverdrive"
	| "heat"
	| "gamewin"
	| "gamelose"

declare type ScoreSettings = {
	missedShot: number
	landedShot: number
	perSecond: number
	onWin: number
}

declare type ShaderPrograms = {
	point: WebGLProgram
	sphere: WebGLProgram
	rectangle: WebGLProgram
}

declare type UIMapping = {
	menu: {
		pause: HTMLElement
		settings: HTMLElement
	}
	informationCard: {
		instructions: HTMLElement
		winSummary: HTMLElement
		loseScreen: HTMLElement
	}
	button: {
		instructions: HTMLElement
		restart: HTMLElement
		play: HTMLElement
		decreaseDifficulty: HTMLElement
		increaseDifficulty: HTMLElement
		instructionsReturn: HTMLElement
		settingsReturn: HTMLElement
		settings: HTMLElement
		winSummaryReturn: HTMLElement
		loseScreenReturn: HTMLElement
	}
	textDisplay: {
		score: HTMLElement
		survivor: HTMLElement
		coverage: HTMLElement
		timeRemaining: HTMLElement
		difficulty: HTMLElement
		overdrive: HTMLElement
		heat: HTMLElement
		summarySurvivor: HTMLElement
		summaryDifficulty: HTMLElement
	}
	progressBar: {
		survivor: HTMLElement
		overdrive: HTMLElement
		heat: HTMLElement
	}
	input: {
		keySensitivity: HTMLElement
		mouseSensitivity: HTMLElement
	}
	notification: Record<UINotificationType, HTMLElement>
}

declare type StyleProperty = [property: string, value: string]

declare type ConditionalStyleProperties = {
	pauseMenu: {
		hidden: StyleProperty[]
		shown: StyleProperty[]
	}
	infoPanel: {
		hidden: StyleProperty[]
		shown: StyleProperty[]
	}
	settings: {
		hidden: StyleProperty[]
		shown: StyleProperty[]
	}
	winSummary: {
		hidden: StyleProperty[]
		shown: StyleProperty[]
	}
	loseScreen: {
		hidden: StyleProperty[]
		shown: StyleProperty[]
	}
}

declare type UIEventType =
	| "pausebutton"
	| "instructionsbutton"
	| "restartbutton"
	| "startbutton"
	| "resumebutton"
	| "decreasedifficultybutton"
	| "increasedifficultybutton"

declare type UINotificationType =
	| "overdriveready"
	| "nukeready"
	| "overheated"
	| "startmessage"
