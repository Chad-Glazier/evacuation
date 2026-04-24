// @ts-check
/// <reference path="./lib_types/MV.d.ts" />
/// <reference path="./util/types.d.ts" />
/// <reference path="./shaders.js" />
/// <reference path="./util/sphere.js" />
/// <reference path="./util/initShaderProgram.js" />
/// <reference path="./util/renderScene.js" />
/// <reference path="./constants.js" />
/// <reference path="./util/GameState.js" />
/// <reference path="./util/ui.js" />

function main() {
	//
	// Set up the rendering context.
	//

	const canvas = document.getElementById(CANVAS_ID)
	if (canvas == null) {
		console.error(`\`<canvas id="${CANVAS_ID}">\` element missing.`)
		return
	}
	if (!(canvas instanceof HTMLCanvasElement)) {
		console.error(
			`\`<tag id="${CANVAS_ID}">\` element must be a \`<canvas>\` element.`,
		)
		return
	}

	const gl = canvas.getContext("webgl")

	if (gl == null) {
		console.error(
			`WebGL rendering context could not be created. Make sure that WebGL is supported by your browser.`,
		)
		return
	}

	gl.enable(gl.DEPTH_TEST)

	const pointShaderProgram = initShaderProgram(
		gl,
		POINTS_VSHADER_SOURCE,
		POINTS_FSHADER_SOURCE,
	)
	const sphereShaderProgram = initShaderProgram(
		gl,
		SPHERE_VSHADER_SOURCE,
		SPHERE_FSHADER_SOURCE,
	)
	const rectangleShaderProgram = initShaderProgram(
		gl,
		RECTANGLE_VSHADER_SOURCE,
		RECTANGLE_FSHADER_SOURCE,
	)

	if (pointShaderProgram == null) return
	if (sphereShaderProgram == null) return
	if (rectangleShaderProgram == null) return

	//
	// Set up the HTML user interface (i.e., the start menu, instructions,
	// the score display, etc.)
	//

	// menus
	const pauseMenu = document.getElementById("menu")
	const settingsMenu = document.getElementById("settings")
	// information cards
	const instructions = document.getElementById("instructions")
	const winSummary = document.getElementById("win-screen")
	const loseScreen = document.getElementById("lose-screen")
	// buttons
	const playButton = document.getElementById("play-button")
	const restartButton = document.getElementById("restart-button")
	const instructionsButton = document.getElementById("instructions-button")
	const instructionsReturnButton = document.getElementById(
		"instructions-return-button",
	)
	const settingsReturnButton = document.getElementById(
		"settings-return-button",
	)
	const increaseDifficultyButton = document.getElementById(
		"increase-difficulty-button",
	)
	const decreaseDifficultyButton = document.getElementById(
		"decrease-difficulty-button",
	)
	const settingsButton = document.getElementById("settings-button")
	const winSummaryReturn = document.getElementById(
		"win-screen-return-button",
	)
	const loseScreenReturn = document.getElementById(
		"lose-screen-return-button",
	)
	// text displays
	const scoreDisplay = document.getElementById("score-display")
	const survivorDisplay = document.getElementById("survivor-display")
	const coverageDisplay = document.getElementById("coverage-display")
	const timeRemaining = document.getElementById("time-remaining-display")
	const difficultyText = document.getElementById("difficulty-text")
	const overdriveText = document.getElementById("overdrive-text")
	const heatText = document.getElementById("heat-text")
	const summarySurvivorCount = document.getElementById(
		"summary-survivor-count",
	)
	const summaryDifficulty = document.getElementById("summary-difficulty")
	// progress bars
	const survivorBar = document.getElementById("survivor-progress-bar")
	const overdriveBar = document.getElementById("overdrive-progress-bar")
	const heatBar = document.getElementById("heat-progress-bar")
	// slider inputs
	const mouseSensitivitySlider = document.getElementById(
		"mouse-sensitivity-range",
	)
	const keySensitivitySlider = document.getElementById(
		"key-sensitivity-range",
	)
	// notifications
	const overheatedNotification = document.getElementById(
		"overheated-notification",
	)
	const overdriveReadyNotification = document.getElementById(
		"overdrive-ready-notification",
	)
	const nukeReadyNotification = document.getElementById(
		"nuke-ready-notification",
	)

	if (
		pauseMenu == null ||
		instructions == null ||
		playButton == null ||
		restartButton == null ||
		increaseDifficultyButton == null ||
		decreaseDifficultyButton == null ||
		scoreDisplay == null ||
		instructionsButton == null ||
		instructionsReturnButton == null ||
		survivorDisplay == null ||
		coverageDisplay == null ||
		timeRemaining == null ||
		survivorBar == null ||
		overdriveBar == null ||
		settingsReturnButton == null ||
		settingsButton == null ||
		settingsMenu == null ||
		difficultyText == null ||
		overdriveText == null ||
		keySensitivitySlider == null ||
		mouseSensitivitySlider == null ||
		heatBar == null ||
		heatText == null ||
		overheatedNotification == null ||
		overdriveReadyNotification == null ||
		nukeReadyNotification == null ||
		winSummary == null ||
		winSummaryReturn == null ||
		summaryDifficulty == null ||
		summarySurvivorCount == null ||
		loseScreen == null ||
		loseScreenReturn == null
	) {
		console.error(
			`One or more necessary elements were not found when setting up the UI.`,
		)
		return
	}

	// create the UI object.
	const ui = new UI(
		{
			menu: {
				pause: pauseMenu,
				settings: settingsMenu,
			},
			informationCard: {
				instructions: instructions,
				winSummary: winSummary,
				loseScreen: loseScreen,
			},
			button: {
				play: playButton,
				restart: restartButton,
				increaseDifficulty: increaseDifficultyButton,
				decreaseDifficulty: decreaseDifficultyButton,
				instructions: instructionsButton,
				instructionsReturn: instructionsReturnButton,
				settingsReturn: settingsReturnButton,
				settings: settingsButton,
				winSummaryReturn: winSummaryReturn,
				loseScreenReturn: loseScreenReturn,
			},
			textDisplay: {
				score: scoreDisplay,
				survivor: survivorDisplay,
				coverage: coverageDisplay,
				timeRemaining: timeRemaining,
				difficulty: difficultyText,
				overdrive: overdriveText,
				heat: heatText,
				summaryDifficulty: summaryDifficulty,
				summarySurvivor: summarySurvivorCount,
			},
			progressBar: {
				survivor: survivorBar,
				overdrive: overdriveBar,
				heat: heatBar,
			},
			input: {
				mouseSensitivity: mouseSensitivitySlider,
				keySensitivity: keySensitivitySlider,
			},
			notification: {
				"nukeready": nukeReadyNotification,
				"overdriveready": overdriveReadyNotification,
				"overheated": overheatedNotification,
			},
		},
		{
			pauseMenu: {
				hidden: [
					["top", "calc(100vh + 50px)"],
				],
				shown: [
					["top", "calc(50vh - var(--menu-height) / 2)"],
				],
			},
			infoPanel: {
				hidden: [
					["top", "calc(100vh + 50px)"],
				],
				shown: [
					["top", "calc(50vh - var(--info-panel-height) / 2)"],
				],
			},
			settings: {
				hidden: [
					["top", "calc(100vh + 50px)"],
				],
				shown: [
					["top", "calc(50vh - var(--settings-height) / 2)"],
				],
			},
			winSummary: {
				hidden: [
					["top", "calc(100vh + 50px)"],
				],
				shown: [
					["top", "calc(50vh - var(--win-screen-height) / 2)"],
				],
			},
			loseScreen: {
				hidden: [
					["top", "calc(100vh + 50px)"],
				],
				shown: [
					["top", "calc(50vh - var(--lose-screen-height) / 2)"],
				],
			},
		},
	)

	//
	// Set up the game.
	//

	/** @type {GameOptions} */
	const defaultOptions = {
		overdriveDuration: 6 * 1000, // overdrive lasts 6 seconds.
		overdriveTemporalModifier: 0.05, // time moves at 5% during overdrive.
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

	const shaders = {
		point: pointShaderProgram,
		sphere: sphereShaderProgram,
		rectangle: rectangleShaderProgram,
	}

	let game = new GameState(gl, shaders, defaultOptions)

	//
	// Sync the UI's display with the game state.
	//

	game.on("score", ({ score }) => ui.score = score)
	game.on("coverage", ({ coverage }) => ui.coverage = coverage)
	game.on("survivor", ({ survivors }) => {
		ui.survivorCountProgress = survivors / game.config.initialSurvivorCount
		ui.survivorCountNumber = survivors
	})
	let notifiedAboutNuke = false
	game.on("timeremaining", ({ timeRemaining }) => {
		ui.timeRemaining = timeRemaining

		if (timeRemaining <= 0 && !notifiedAboutNuke) {
			ui.showNotification("nukeready")
			notifiedAboutNuke = true
		}
	})
	let notifiedAboutOverdrive = false
	game.on("overdrivecharge", ({ overdriveCharge }) => {
		ui.overdriveChargeProgress = overdriveCharge

		if (overdriveCharge >= 1 && !notifiedAboutOverdrive) {
			ui.showNotification("overdriveready")
			notifiedAboutOverdrive = true

			setTimeout(() => {
				ui.hideNotification("overdriveready")
			}, 5000)
		} else {
			ui.hideNotification("overdriveready")
			notifiedAboutOverdrive = false
		}
	})
	game.on("heat", ({ heat }) => {
		ui.heatProgress = heat

		if (heat >= 1) ui.showNotification("overheated")
		if (heat <= 0) ui.hideNotification("overheated")
	})
	let gameOver = false
	game.on("gamewin", ({ survivors }) => {
		game.pause()
		ui.showWinSummary(survivors, game.difficultySetting)
		gameOver = true
	})
	game.on("gamelose", () => {
		game.pause()
		ui.showLoseScreen()
		gameOver = true
	})

	//
	// Set up some controls.
	//

	window.addEventListener("keydown", ({ key }) => {
		if (key !== "q") return

		game.activateOverdrive()
	})

	window.addEventListener("keydown", (ev) => {
		if (ev.key != "Escape") return

		if (!game.isPaused) {
			game.pause()
			ui.showPauseMenu()
			return
		}

		if (ui.instructionsVisible) {
			ui.hideInstructions(() => game.unpause())
			return
		}

		if (ui.settingsVisible) {
			ui.hideSettings(() => game.unpause())
			return
		}

		if (ui.pauseMenuVisible) {
			ui.hidePauseMenu(() => game.unpause())
			return
		}

		if (ui.winSummaryVisible) {
			ui.hideWinSummary(() => ui.showPauseMenu())
		}

		if (ui.loseScreenVisible) {
			ui.hideLoseScreen(() => ui.showPauseMenu())
		}
	})

	ui.element.button.play.addEventListener("click", () => {
		if (!game.isPaused) {
			return
		}

		if (gameOver) {
			ui.element.button.restart.dispatchEvent(new Event("click"))
			return
		}

		ui.hidePauseMenu(() => game.unpause())
	})

	ui.element.button.instructionsReturn.addEventListener("click", () => {
		ui.hideInstructions(() => ui.showPauseMenu())
	})

	ui.element.button.loseScreenReturn.addEventListener("click", () => {
		ui.hideLoseScreen(() => ui.showPauseMenu())
	})

	ui.element.button.winSummaryReturn.addEventListener("click", () => {
		ui.hideWinSummary(() => ui.showPauseMenu())
	})

	ui.element.button.settingsReturn.addEventListener("click", () => {
		ui.hideSettings(() => ui.showPauseMenu())
	})

	ui.element.button.restart.addEventListener("click", () => {
		game.restart()
		game.pause()
		ui.hidePauseMenu(() => game.unpause())

		notifiedAboutNuke = false
		notifiedAboutOverdrive = false
		gameOver = false
		ui.hideNotification("nukeready")
		ui.hideNotification("overdriveready")
		ui.hideNotification("overheated")
	})

	ui.element.button.instructions.addEventListener("click", () => {
		ui.hidePauseMenu(() => ui.showInstructions())
	})

	ui.element.button.settings.addEventListener("click", () => {
		ui.hidePauseMenu(() => ui.showSettings())
	})

	canvas.addEventListener("wheel", (ev) => {
		if (game.isPaused) return

		game.zoom += ev.deltaY / 300 / 25
	})

	enableMouseDrag(game)
	enableKeyRotationControls(game)

	/** @type {[x: number, y: number]} */
	let mousePosition = [0, 0]
	window.addEventListener("mousemove", ({ clientX, clientY }) => {
		mousePosition = [clientX, clientY]
	})

	let firingInterval = NaN

	window.addEventListener("keydown", (ev) => {
		if (ev.key !== " ") return
		if (game.isPaused) return

		ev.preventDefault()

		if (!Number.isNaN(firingInterval)) return

		game.launchProjectile(
			game.projectGameCoordinates(mousePosition),
		)

		firingInterval = setInterval(() => {
			game.launchProjectile(
				game.projectGameCoordinates(mousePosition),
			)
		}, game.config.cannonCooldown)
	})

	window.addEventListener("keyup", (ev) => {
		if (ev.key !== " ") return

		clearInterval(firingInterval)
		firingInterval = NaN
	})

	window.addEventListener("mousedown", (ev) => {
		if (game.isPaused) return
		if (ev.button !== 0) return // ensure it's left-click

		ev.preventDefault()

		if (!Number.isNaN(firingInterval)) return

		game.launchProjectile(
			game.projectGameCoordinates(mousePosition)
		)

		firingInterval = setInterval(() => {
			game.launchProjectile(
				game.projectGameCoordinates(mousePosition)	
			)
		}, game.config.cannonCooldown)
	})

	window.addEventListener("mouseup", (ev) => {
		if (ev.button !== 0) return // ensure it's left-click

		clearInterval(firingInterval)
		firingInterval = NaN
	})

	window.addEventListener("keydown", (ev) => {
		if (ev.key !== "f") return

		game.launchNuke()
		ui.hideNotification("nukeready")
	})

	ui.element.button.decreaseDifficulty.addEventListener("click", () => {
		switch (game.difficultySetting) {
			case "easy":
				return
			case "normal":
				ui.difficulty = "easy"
				game.difficultySetting = "easy"
				break
			case "hard":
				ui.difficulty = "normal"
				game.difficultySetting = "normal"
				break
			case "apocalypse":
				ui.difficulty = "hard"
				game.difficultySetting = "hard"
				break
		}
	})

	ui.element.button.increaseDifficulty.addEventListener("click", () => {
		switch (game.difficultySetting) {
			case "easy":
				ui.difficulty = "normal"
				game.difficultySetting = "normal"
				break
			case "normal":
				ui.difficulty = "hard"
				game.difficultySetting = "hard"
				break
			case "hard":
				ui.difficulty = "apocalypse"
				game.difficultySetting = "apocalypse"
				break
			case "apocalypse":
				return
		}
	})

	ui.element.input.keySensitivity.addEventListener("input", (ev) => {
		if (!(ui.element.input.keySensitivity instanceof HTMLInputElement)) {
			return
		}

		game.keySensitivityMultiplier = parseFloat(
			ui.element.input.keySensitivity.value,
		)
	})

	ui.element.input.mouseSensitivity.addEventListener("input", (ev) => {
		if (!(ui.element.input.keySensitivity instanceof HTMLInputElement)) {
			return
		}

		game.mouseSensitivityMultiplier = parseFloat(
			ui.element.input.keySensitivity.value,
		)
	})

	//
	// Start the game
	//

	game.start()
	game.pause()
	ui.showPauseMenu()
}

/**
 * Set up the dragging functionality for sphere.
 *
 * @param {GameState} game
 */
function enableMouseDrag(game) {
	const canvas = game.config.renderingContext.canvas

	if (canvas instanceof OffscreenCanvas) {
		return
	}

	let dragging = false
	let initialPosition = [0, 0]
	let initialTime = 0
	let lastRPM = 0
	let lastAxis = [0, 0, 0]

	canvas.addEventListener("mousedown", ev => {
		if (game.isPaused) return
		if (ev.button !== 1) return // ensure it's clicking the mousewheel

		dragging = true
		initialTime = Date.now()

		game.setMomentum([0, 0, 1], 0)
	})

	canvas.addEventListener("mousemove", ({ movementX, movementY }) => {
		if (game.isPaused) return
		if (!dragging) return

		const canvasLength = Math.max(canvas.clientWidth, canvas.clientHeight)

		// We calculate the displacement of the mouse.
		const [initialX, initialY] = initialPosition
		const [deltaX, deltaY] = [
			movementX,
			-1 * movementY,
		]
		const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
		if (magnitude === 0) return

		// By default, there is one half of a rotation per length of the canvas
		// dragged. The sensitivity setting is also factored in.
		const rotations = game.dragSensitivity * magnitude /
			(2 * canvasLength) * game.mouseSensitivityMultiplier

		// The axis of rotation ought to be orthogonal to the displacement
		// of the mouse in order to feel natural. It's magnitude is irrelevant.
		// Since we know that `deltaY` and `deltaX` are never both zero,
		// otherwise the "mousemove" event wouldn't be emitted in the first
		// place, this should work.
		const axisOfRotation = [-1 * deltaY, deltaX, 0]

		// Finally, we apply the rotation.
		game.applyRotation(axisOfRotation, rotations * 360)

		// Adjust the outer variables.
		const minutes = (Date.now() - initialTime) / 1000 / 60
		lastAxis = axisOfRotation
		lastRPM = rotations / minutes
		if (lastRPM == Infinity) lastRPM = 0
		initialTime = Date.now()
	})

	canvas.addEventListener("mouseup", ev => {
		if (!dragging) return
		if (ev.button !== 1) return // ensure it's clicking the mousewheel

		dragging = false
		game.setInertia(lastAxis, lastRPM)
	})

	canvas.addEventListener("mouseleave", () => {
		if (!dragging) return

		dragging = false
		game.setInertia(lastAxis, lastRPM)
	})
}

/**
 * Sets the event listeners necessary to allow the user to rotate the sphere
 * with arrow keys / WASD.
 *
 * @param {GameState} game
 */
function enableKeyRotationControls(game) {
	const keyControls = [
		{
			keys: ["ArrowRight", "d"],
			dir: "right",
		},
		{
			keys: ["ArrowLeft", "a"],
			dir: "left",
		},
		{
			keys: ["ArrowDown", "s"],
			dir: "down",
		},
		{
			keys: ["ArrowUp", "w"],
			dir: "up",
		},
	]

	const activeKeyRotationEvents = new Set()
	const direction = {
		up: false,
		down: false,
		right: false,
		left: false,
	}

	const updateMomentum = () => {
		const originalMomentum = game.getMomentum()

		const { up, down, left, right } = direction
		let x = 0, y = 0
		if (up && !down) {
			x = 1
		}
		if (down && !up) {
			x = -1
		}
		if (left && !right) {
			y = 1
		}
		if (right && !left) {
			y = -1
		}
		if (x == 0 && y == 0) {
			game.setMomentum([0, 0, 1], 0)
			game.setInertia(originalMomentum.axis, originalMomentum.rpm)
		} else {
			game.setMomentum(
				[x, y, 0],
				game.config.keyRotationRPM * game.keySensitivityMultiplier,
			)
		}
	}

	window.addEventListener("keydown", ({ key }) => {
		if (game.isPaused) return
		if (activeKeyRotationEvents.has(key)) {
			return
		}

		game.setInertia([0, 0, 1], 0)

		for (const { keys, dir } of keyControls) {
			if (!keys.includes(key)) {
				continue
			}

			keys.forEach((k) => activeKeyRotationEvents.add(k))
			//@ts-ignore
			direction[dir] = true
			updateMomentum()
		}
	})

	window.addEventListener("keyup", ({ key }) => {
		if (!activeKeyRotationEvents.has(key)) return

		for (const { keys, dir } of keyControls) {
			if (!keys.includes(key)) {
				continue
			}

			keys.forEach((k) => activeKeyRotationEvents.delete(k))
			//@ts-ignore
			direction[dir] = false
			updateMomentum()
		}
	})
}

main()
