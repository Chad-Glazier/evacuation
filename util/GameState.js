// @ts-check
/// <reference path="./types.d.ts" />
/// <reference path="./renderScene.js" />
/// <reference path="../lib_types/MV.d.ts" />

/**
 * Instances of this class store the state of a game. Methods are included to
 * advance the state of the game and render it in the graphics context.
 */
class GameState {
	/**
	 * Constructs a new game state.
	 *
	 * @param {WebGLRenderingContext} renderingContext the WebGL rendering
	 * context on which the game will be rendered.
	 * @param {ShaderPrograms} shaders the shader programs necessary to render
	 * the game.
	 * @param {GameOptions} options an object containing a long list of optional
	 * game settings.
	 */
	constructor(renderingContext, shaders, options) {
		/**
		 * The options that the game was initialized with.
		 *
		 * @public
		 * @readonly
		 * @type {GameConfig}
		 */
		this.config = {
			...options,
			shaders,
			renderingContext,
			baseSphere: sphere(
				SPHERE_DIVISIONS,
				{
					radialDistance: options.baseSphereRadius,
				},
			),
		}

		this.overheated = false

		/**
		 * A number from `0` to `1` representing the heat of the cannon.
		 *
		 * @private
		 */
		this.currentHeat = 0

		/**
		 * The living bugs in the game.
		 *
		 * @private
		 * @type {Bug[]}
		 */
		this.bugs = []

		/**
		 * The dying bugs in the game.
		 *
		 * @private
		 * @type {DyingBug[]}
		 */
		this.dyingBugs = []

		/**
		 * The projectiles in the game.
		 *
		 * @private
		 * @type {Projectile[]}
		 */
		this.projectiles = []

		/**
		 * The rotation matrix that defines the orientation of the game
		 * objects when being rendered.
		 *
		 * @private
		 * @type {number[][]}
		 */
		this.rotation = mat4()
		this.rotation = mult(rotate(90, [1, 0, 0]), this.rotation)
		this.rotation = mult(rotate(23.45, [0, 0, 1]), this.rotation)

		/**
		 * The distance between the camera and the center of the base sphere.
		 *
		 * @private
		 * @type {number}
		 */
		this.distance = options.startingDistance

		/**
		 * Stores the game time in milliseconds.
		 *
		 * @private
		 * @type {number}
		 */
		this.time = 0

		/**
		 * Stores the rotational momentum of the sphere. Note that momentum
		 * is fixed until it is otherwise changed, as opposed to the sphere's
		 * `inertia` which decreases over time as a function of friction.
		 *
		 * @private
		 * @type {{ axis: number[], rpm: number }}
		 */
		this.momentum = { axis: [0, 0, 1], rpm: 0 }

		/**
		 * Stores the rotational inertia of the sphere. Note that the inertia
		 * of the sphere decreases over time as a function of friction.
		 *
		 * The inertia of the sphere is not meant to add to or replace the
		 * momentum. It's function is to store the inertia of the sphere when
		 * user input is no longer fixing the momentum. For example, if you
		 * bind a certain key to set the momentum of the sphere, when the user
		 * presses the key you would set the momentum to the appropriate value.
		 * When the user later releases that key, you will set the inertia to
		 * match the momentum, then set the momentum to zero. This will let the
		 * sphere continue to spin after it was "released," with the friction
		 * gradually slowing it to a halt.
		 *
		 * @private
		 * @type {{ axis: number[], rpm: number }}
		 */
		this.inertia = { axis: [0, 0, 1], rpm: 0 }

		/**
		 * Stores the current game score.
		 *
		 * @private
		 * @type {number}
		 */
		this.score = 0

		/**
		 * Stores the in-game time when the last bug was spawned.
		 *
		 * @private
		 * @type {number}
		 */
		this.timeOfLastBug = 0

		/**
		 * Stores the `time` at which the most recent cannon shot was fired.
		 *
		 * @private
		 * @type {number}
		 */
		this.timeOfLastProjectile = 0

		/**
		 * Marks whether or not time should pass in the game.
		 *
		 * @private
		 * @type {boolean}
		 */
		this.paused = false

		/**
		 * Maps game events like `"pause"`, `"unpause"`, and `"score"` to their
		 * registered event listener(s).
		 *
		 * @private
		 * @type {Map<string, Array<(event: GameEvent) => void>>}
		 */
		this.listeners = new Map()

		/**
		 * Stores the ID of the main game loop, which is a `setInterval`
		 * function. This can be used to terminate the main game loop with
		 * `clearInterval(this.gameLoop)`.
		 *
		 * @private
		 * @type {number}
		 */
		this.gameLoop = NaN

		/**
		 * The number of survivors lost to the bugs.
		 *
		 * @private
		 * @type {number}
		 */
		this.casualties = 0

		/**
		 * The number of additional survivors discovered.
		 *
		 * @private
		 * @type {number}
		 */
		this.newSurvivors = 0

		/**
		 * Indicates that the bugs have been fully eradicated. No new bugs
		 * should spawn until a new game is started.
		 */
		this.bugsEradicated = false

		/**
		 * Determines the game difficulty
		 *
		 * @private
		 * @type {GameDifficulty}
		 */
		this.difficulty = "normal"

		/**
		 * A number from `0` to `1` representing the charge of the overdrive
		 * ability, where `1` is fully charged.
		 *
		 * @type {number}
		 */
		this.overdriveCharge = 0

		/**
		 * A boolean flag marking whether or not the overdrive ability is
		 * active.
		 */
		this.overdriveActive = false

		this.mouseSensitivityMultiplier = 1.0
		this.keySensitivityMultiplier = 1.0

		let canvasWidth, canvasHeight
		if (this.config.renderingContext.canvas instanceof OffscreenCanvas) {
			canvasWidth = 100
			canvasHeight = 100
		} else {
			canvasWidth = this.config.renderingContext.canvas.clientWidth
			canvasHeight = this.config.renderingContext.canvas.clientHeight
		}

		/**
		 * The projection matrix used.
		 *
		 * @readonly
		 * @type {number[][]}
		 */
		this.projectionMatrix = perspective(
			45, // 45 degree field of view
			canvasWidth / canvasHeight, // aspect ratio
			0.1, // the distance to the near clipping plane
			100, // the distance to the far clipping plane
		)

		/**
		 * The inverse of the projection matrix used.
		 *
		 * @readonly
		 * @type {number[][]}
		 */
		this.inverseProjectionMatrix = inversePerspective(
			45,
			canvasWidth / canvasHeight,
			0.1,
			100,
		)
	}

	/**
	 * Draws the scene.
	 *
	 * @private
	 */
	render() {
		let spherePointColor = [
			this.coverage,
			1 - this.coverage,
			0,
			1,
		]
		let sphereColor = [0.2 * this.coverage, 0, 0, 1]
		if (this.overdriveActive) {
			spherePointColor = OVERDRIVE_BLUE
			sphereColor = OVERDRIVE_BLUE.map((x) => x * 0.2)
			sphereColor[3] = 1
		}
		if (this.bugsEradicated) {
			spherePointColor = [0, 1, 0, 1]
		}

		renderScene(
			this.config.renderingContext,
			this.projectionMatrix,
			this.config.baseSphere,
			this.config.shaders.point,
			this.config.shaders.sphere,
			this.config.shaders.rectangle,
			this.bugs,
			this.dyingBugs,
			this.projectiles,
			{
				rotate: this.rotation,
				distance: this.distance,
				spherePointColor: spherePointColor,
				sphereColor: sphereColor,
			},
		)
	}

	/**
	 * Projects pixel coordinates onto a plane in-game.
	 *
	 * @param {[x: number, y: number]} position The coordinates that you want
	 * to convert from pixel coordinates (e.g., `[event.clientX, event.clientY]`)
	 * to in-game coordinates.
	 *
	 * @returns {[x: number, y: number, z: number]} The x- and y- coordinates
	 * mapped onto the `z = 0` plane.
	 */
	projectGameCoordinates([x, y]) {
		const canvas = this.config.renderingContext.canvas

		let maxX, maxY
		if (canvas instanceof OffscreenCanvas) {
			maxX = canvas.width
			maxY = canvas.height
		} else {
			maxX = canvas.clientWidth
			maxY = canvas.clientHeight
		}

		const normalizedDeviceCoordinates = [
			x / maxX * 2 - 1,
			y / maxY * -2 + 1,
			-1,
			0,
		]

		let projectedPosition = transform([
			this.inverseProjectionMatrix,
		], normalizedDeviceCoordinates)

		projectedPosition = transform(
			[transpose(this.rotation)],
			[
				projectedPosition[0] * this.distance,
				projectedPosition[1] * this.distance,
				0,
			],
		)

		return [
			projectedPosition[0],
			projectedPosition[1],
			projectedPosition[2],
		]
	}

	/**
	 * Advances the internal clock by the specified number of milliseconds,
	 * updating the game state as necessary. I.e.,this advances the
	 * projectiles, grows the bugs, rotates the sphere if it has momentum or
	 * inertia, etc.
	 *
	 * This function does *not* re-render the game.
	 *
	 * @private
	 * @param {number} milliseconds the number of milliseconds to advance the
	 * game clock by.
	 */
	advanceTime(milliseconds) {
		const {
			timeLimit,
			scoreSettings,
			casualtiesThreshold,
			initialSurvivorCount,
			frictionCoefficient,
			bugSpawnFrequency,
			bugCapacity,
			bugGrowthRate,
			bugElevationGap,
			bugDeathRate,
			baseSphereRadius,
			dyingBugColor,
			overdriveTemporalModifier,
			overdriveCooldown,
			overdriveDuration,
		} = this.config

		this.time = Math.min(this.time + milliseconds, this.config.timeLimit)
		const seconds = milliseconds / 1000
		const minutes = seconds / 60
		const originalScore = this.score
		const originalSurvivorCount = this.survivorCount
		const originalCoverage = this.coverage
		const originalOverdriveCharge = this.overdriveCharge
		const originalHeat = this.currentHeat

		// Get the "real" time, without the overdrive modifier. This is so that
		// we can apply rotations and stuff without slowing it down during
		// overdrive.
		const real = {
			milliseconds,
			seconds,
			minutes,
		}
		if (this.overdriveActive) {
			for (const unit in real) {
				real[unit] /= overdriveTemporalModifier
			}
		}

		// Decrease the heat.
		this.currentHeat = Math.max(
			this.currentHeat - this.config.coolingRate * seconds,
			0,
		)
		if (this.overheated && this.currentHeat == 0) {
			this.overheated = false
		}

		// Progress the overdrive cooldown.
		if (!this.overdriveActive) {
			this.overdriveCharge += milliseconds / overdriveCooldown
			this.overdriveCharge = Math.min(1, this.overdriveCharge)
		} else {
			this.overdriveCharge -= real.milliseconds / overdriveDuration
			this.overdriveCharge = Math.max(0, this.overdriveCharge)
		}

		// Handle overdrive ending
		if (this.overdriveCharge == 0) {
			this.overdriveActive = false
			this.handleEvent("deactivateoverdrive")
		}

		// Create some modifiers for certain "difficulty" values based on the
		// progress and game difficulty setting.
		const timeFactor = this.time / this.config.timeLimit
		const difficultyFactor = this.difficultyModifier
		const bugGrowthRateModifier = Math.min(
			1.5,
			1 + timeFactor * difficultyFactor,
		)
		const bugSpawnFrequencyModifier = 1 + timeFactor * difficultyFactor
		const bugCapacityModifier = 1 + timeFactor * difficultyFactor
		const casualtiesModifier = 1 + timeFactor * difficultyFactor * 2

		// Increment score if the game is still going
		if (this.time < timeLimit) {
			this.score += scoreSettings.perSecond * seconds
		}

		// Calculate casualties / newly discovered survivors. Do not change
		// these values if the game is ended.
		if (this.time < timeLimit) {
			if (
				originalCoverage >= casualtiesThreshold &&
				this.survivorCount > 0
			) {
				this.casualties += Math.min(
					(0.05 * initialSurvivorCount) *
						(originalCoverage - casualtiesThreshold) *
						seconds *
						casualtiesModifier,
					this.survivorCount,
				)
			} else {
				this.newSurvivors += (0.002 * this.survivorCount) *
					(casualtiesThreshold - originalCoverage) * seconds
			}
		}

		// Check if all survivors are lost.
		if (Math.round(this.survivorCount) <= 0) {
			this.handleEvent("gamelose")
		}

		// Calculate rotation based on the current rotational momentum.
		let newRotation = rotate(
			360 * this.momentum.rpm * real.minutes,
			this.momentum.axis,
		)

		// Calculate rotation based on the current rotational inertia.
		if (this.momentum.rpm == 0 && this.inertia.rpm > 0) {
			newRotation = mult(
				rotate(
					360 * this.inertia.rpm * real.minutes,
					this.inertia.axis,
				),
				newRotation,
			)
			this.inertia.rpm *= 1 - frictionCoefficient
		}

		this.rotation = mult(newRotation, this.rotation)

		// Advance the projectiles.
		this.projectiles.forEach((projectile) =>
			projectile.advanceTime(milliseconds)
		)

		// Spawn a new bug if necessary.
		const secondsSinceLastBug = (this.time - this.timeOfLastBug) / 1000
		const bugSpawnCooldown = 1 /
			(bugSpawnFrequency * bugSpawnFrequencyModifier)
		if (
			secondsSinceLastBug >= bugSpawnCooldown &&
			this.bugs.length < bugCapacity * bugCapacityModifier &&
			!this.bugsEradicated
		) {
			this.timeOfLastBug = this.time
			let bugRotation = mat4()
			bugRotation = mult(
				rotate(Math.random() * 360, [1, 0, 0]),
				bugRotation,
			)
			bugRotation = mult(
				rotate(Math.random() * 360, [0, 1, 0]),
				bugRotation,
			)
			bugRotation = mult(
				rotate(Math.random() * 360, [0, 0, 1]),
				bugRotation,
			)
			let bugColor = [Math.random(), Math.random(), Math.random()]
			// all bugs will be equally "bright." This keeps them from blending into the sphere.
			bugColor = normalize(bugColor)
			bugColor.push(1) // opacity
			this.bugs.push({
				rotationMatrix: bugRotation,
				arcLength: 0,
				color: bugColor,
				elevation: this.bugs.length,
				spawnTime: this.time,
			})
		}

		// Grow the bugs and set their elevation to avoid overlap.
		this.bugs = this.bugs.map((bug, i) => {
			const increment = bugGrowthRate * bugGrowthRateModifier * seconds
			bug.arcLength = Math.min(Math.PI, bug.arcLength + increment)
			bug.elevation = (i + 1) * bugElevationGap
			return bug
		})

		// Grow the inner arc length of the dying bugs. If any of them are
		// fully dead, delete them from the game.
		this.dyingBugs.map((bug) => {
			bug.innerArcLength += bugDeathRate * seconds
		})
		this.dyingBugs = this.dyingBugs.filter(
			({ innerArcLength, arcLength }) => {
				return innerArcLength < arcLength
			},
		)

		// The height of the highest bug. If a projectile is above this, we
		// know that it is definitely not colliding yet.
		const maximumCollisionDistance = this.config.baseSphereRadius +
			this.config.bugElevationGap * this.bugs.length

		for (let projectile of this.projectiles) {
			const dist = projectile.radialDistance

			// Ignore any projectiles that are definitely not colliding yet.
			if (dist > maximumCollisionDistance) {
				continue
			}

			// Handle the nuke case.
			if (projectile.isNuke) {
				this.score += this.config.scoreSettings.onWin
				this.bugsEradicated = true
				this.bugs.forEach((bug) =>
					this.dyingBugs.push({
						...bug,
						deathTime: this.time,
						innerArcLength: 0,
						color: dyingBugColor,
					})
				)
				this.bugs = []
				this.projectiles = this.projectiles.filter((x) => x != projectile)
				continue
			}

			// Find any bugs in the collision course.
			const bugsInCollisionCourse = this.bugs.filter((bug) => {
				return collided(
					this.config.baseSphereRadius,
					projectile,
					bug,
				)
			})

			// Handle the miss case.
			if (bugsInCollisionCourse.length == 0) {
				continue
			}

			// Projectile hits the topmost bug.
			this.score += scoreSettings.landedShot
			const bugHit = bugsInCollisionCourse.reduce((bug1, bug2) => {
				if (bug1.elevation > bug2.elevation) {
					return bug1
				}
				return bug2
			})
			this.bugs = this.bugs.filter((el) => el != bugHit)
			this.dyingBugs.push({
				...bugHit,
				deathTime: this.time,
				innerArcLength: 0,
				color: dyingBugColor,
			})

			// Delete the projectile.
			this.projectiles = this.projectiles.filter((x) => x != projectile)
		}

		// Filter out projectiles that missed the sphere or are inside it.
		this.projectiles = this.projectiles.filter(({ radialDistance }) => {
			const inBounds = radialDistance < 1.2 * this.config.maxDistance
			const outsideSphere = radialDistance > this.config.baseSphereRadius
			if (!inBounds || !outsideSphere) {
				this.score += this.config.scoreSettings.missedShot
			}
			return inBounds && outsideSphere
		})

		// Emit relevant events
		if (this.score != originalScore) {
			this.handleEvent("score")
		}
		if (this.survivorCount != originalSurvivorCount) {
			this.handleEvent("survivor")
		}
		if (this.overdriveCharge != originalOverdriveCharge) {
			this.handleEvent("overdrivecharge")
		}
		if (this.currentHeat != originalHeat) {
			this.handleEvent("heat")
		}
		this.handleEvent("coverage")
		this.handleEvent("timeremaining")
	}

	/**
	 * Activates overdrive, if the charge is full.
	 *
	 * @public
	 */
	activateOverdrive() {
		if (this.overdriveCharge != 1) return
		if (this.time >= this.config.timeLimit) return

		if (this.overheated) {
			this.overheated = false
		}

		this.currentHeat = 0
		this.handleEvent("heat")

		this.overdriveActive = true
		this.handleEvent("activateoverdrive")
	}

	/**
	 * Launches a projectile if allowed by the cooldown.
	 *
	 * @public
	 * @param {number[]} target The in-game coordinates at which the projectile
	 * will be launched.
	 */
	launchProjectile(target = [0, 0, 0]) {
		if (this.paused) return

		let secondsSinceLastShot = (this.time - this.timeOfLastProjectile) /
			1000
		if (this.overdriveActive) {
			secondsSinceLastShot /= this.config.overdriveTemporalModifier
		}

		if (secondsSinceLastShot < this.config.cannonCooldown) {
			return
		}

		if (this.overheated) return

		if (!this.overdriveActive) {
			this.currentHeat += this.config.heatPerShot

			this.handleEvent("heat")

			if (this.currentHeat >= 1) {
				this.overheated = true
			}
		}

		this.timeOfLastProjectile = this.time

		this.projectiles.push(
			new Projectile(
				transform([transpose(this.rotation)], [
					0.3,
					-0.2,
					this.distance,
				]),
				target,
				this.config.projectileSpeed,
				0.1,
				0.01,
			),
			new Projectile(
				transform([transpose(this.rotation)], [
					-0.3,
					-0.2,
					this.distance,
				]),
				target,
				this.config.projectileSpeed,
				0.1,
				0.01,
			),
		)
	}

	/**
	 * Sets the sphere's rotational momentum.
	 *
	 * @public
	 * @param {number[]} axis Defines the axis of rotation for the new
	 * rotational momentum.
	 * @param {number} rpm Defines the rotations per minute for the new
	 * rotational momentum.
	 */
	setMomentum(axis, rpm) {
		if (this.paused) return

		this.momentum = { axis, rpm }
	}

	/**
	 * Retrieve's the current rotational momentum.
	 *
	 * @returns {{ axis: number[], rpm: number }}
	 */
	getMomentum() {
		return this.momentum
	}

	/**
	 * Applies a rotation directly to the game's current rotation matrix,
	 * ignoring time.
	 *
	 * @public
	 * @param {number[]} axis Defines the axis of rotation.
	 * @param {number} angle Defines the number of degrees to rotate about
	 * the axis.
	 */
	applyRotation(axis, angle) {
		this.momentum.rpm = 0
		this.inertia.rpm = 0

		this.rotation = mult(
			rotate(angle, axis),
			this.rotation,
		)
	}

	/**
	 * Sets the rotational inertia of the sphere.
	 *
	 * @param {number[]} axis The axis about which the sphere should rotate.
	 * @param {number} rpm The number of rotations per minute.
	 */
	setInertia(axis, rpm) {
		this.inertia = { axis, rpm }
	}

	/**
	 * Registers a listener for certain game events.
	 *
	 * @public
	 * @param {GameEventType} event The type of game event to listen for.
	 * @param {(event: GameEvent) => void} handler the callback function to
	 * emit on occurrences of the specified event.
	 * @returns {(event: GameEvent) => void} a reference to the event handler.
	 */
	on(event, handler) {
		let handlers = this.listeners.get(event)
		if (handlers === undefined) {
			handlers = []
		}
		handlers.push(handler)
		this.listeners.set(event, handlers)
		return handler
	}

	/**
	 * Disables an event listener.
	 *
	 * @public
	 * @param {GameEventType} event The type of game event to disable an event
	 * listener for.
	 * @param {(event: GameEvent) => void} handler A reference to the event
	 * handler to disable.
	 * @returns {void}
	 */
	disableListener(event, handler) {
		let handlers = this.listeners.get(event)
		if (handlers === undefined) {
			return
		}
		if (handlers.length == 0) {
			return
		}
		this.listeners.set(event, handlers.filter((el) => el != handler))
	}

	/**
	 * Executes the associated game event handlers.
	 *
	 * @private
	 * @param {GameEventType} eventType The type of game event to handle. E.g.,
	 * `"pause"`, `"unpause"`, etc.
	 */
	handleEvent(eventType) {
		const callbacks = this.listeners.get(eventType)
		if (callbacks === undefined) {
			return
		}

		let continuePropagation = true
		const eventObject = {
			score: this.score,
			coverage: this.coverage,
			timeRemaining: this.timeRemaining,
			survivors: this.survivorCount,
			overdriveCharge: this.overdriveCharge,
			heat: this.currentHeat,
			stopPropagation: () => {
				continuePropagation = false
			},
		}

		for (const callback of callbacks) {
			callback(eventObject)
			if (!continuePropagation) {
				break
			}
		}
	}

	/**
	 * Pauses the game and executes any callback functions registered via the
	 * `on("pause", ...)` method.
	 *
	 * @public
	 */
	pause() {
		this.paused = true
		this.handleEvent("pause")
	}

	/**
	 * Unpauses the game and executes any callback functions registered via the
	 * `on("unpause", ...)` method.
	 *
	 * @public
	 */
	unpause() {
		this.paused = false
		this.handleEvent("unpause")
	}

	/**
	 * @returns {boolean} `true` if the game is paused, `false` otherwise.
	 */
	get isPaused() {
		return this.paused
	}

	/**
	 * Starts the game.
	 *
	 * @public
	 */
	start() {
		const millisecondInterval = 1 / this.config.refreshRate * 1000

		this.render()
		this.handleEvent("score")
		this.handleEvent("coverage")
		this.handleEvent("timeremaining")
		this.handleEvent("survivor")
		this.handleEvent("overdrivecharge")
		this.handleEvent("heat")

		let lastTime = Date.now()
		this.gameLoop = setInterval(() => {
			if (this.paused) {
				lastTime = Date.now()
				return
			}
			let interval = Date.now() - lastTime
			if (this.overdriveActive) {
				interval *= this.config.overdriveTemporalModifier
			}
			this.advanceTime(interval)
			lastTime = Date.now()
			requestAnimationFrame(() => this.render())
		}, millisecondInterval)
	}

	/**
	 * Restarts the game.
	 *
	 * @public
	 */
	restart() {
		this.end()

		this.bugs = []
		this.dyingBugs = []
		this.projectiles = []
		this.rotation = mat4()
		this.rotation = mult(rotate(90, [1, 0, 0]), this.rotation)
		this.rotation = mult(rotate(23.45, [0, 0, 1]), this.rotation)
		this.time = 0
		this.momentum = { axis: [0, 0, 1], rpm: 0 }
		this.inertia = { axis: [0, 0, 1], rpm: 0 }
		this.score = 0
		this.timeOfLastBug = 0
		this.timeOfLastProjectile = 0
		this.paused = false
		this.gameLoop = NaN
		this.casualties = 0
		this.newSurvivors = 0
		this.bugsEradicated = false
		this.overdriveCharge = 0
		this.currentHeat = 0
		this.overheated = false

		this.handleEvent("score")
		this.handleEvent("coverage")
		this.handleEvent("timeremaining")
		this.handleEvent("survivor")
		this.handleEvent("overdrivecharge")
		this.handleEvent("heat")

		this.start()
	}

	/**
	 * Ends the game.
	 *
	 * @public
	 */
	end() {
		clearInterval(this.gameLoop)
	}

	/**
	 * Eradicates all bugs via a nuclear blast. This will only be available if
	 * the game's time limit is expired.
	 *
	 * @public
	 */
	launchNuke() {
		if (this.time < this.config.timeLimit) return
		if (this.bugsEradicated) return

		this.projectiles.push(
			new Projectile(
				transform([transpose(this.rotation)], [0, -0.3, this.distance]),
				transform([transpose(this.rotation)], [0, 0, 1]),
				this.config.projectileSpeed,
				0.5,
				0.1,
				true,
			),
		)

		setTimeout(() => {
			this.handleEvent("gamewin")
		}, 1000)
	}

	/**
	 * Describes the current distance between the camera and the center of the
	 * base sphere with a number from `0` to `1`, where `0` is maximally zoomed
	 * out, and `1` is maximally zoomed in.
	 *
	 * @public
	 */
	get zoom() {
		const { minDistance, maxDistance } = this.config
		return (this.distance - minDistance) / (maxDistance - minDistance)
	}
	/**
	 * @public
	 * @param newZoom
	 */
	set zoom(newZoom) {
		const { minDistance, maxDistance } = this.config
		if (newZoom > 1) newZoom = 1
		if (newZoom < 0) newZoom = 0
		this.distance = minDistance + newZoom * (maxDistance - minDistance)
	}

	/**
	 * How responsive the sphere is to rotations induced by dragging it with
	 * the mouse.
	 *
	 * @public
	 */
	get dragSensitivity() {
		return this.config.dragRotationSensitivity
	}

	/**
	 * How fast (in rotations per minute) the sphere should rotate when
	 * pressing a rotation key.
	 */
	get keySensitivity() {
		return this.config.keyRotationRPM
	}

	/**
	 * The calculated coverage of the sphere. I.e., the ratio of the total
	 * surface area of the bugs to the surface area of the base sphere, up
	 * to a maximum of `1.0`.
	 *
	 * @public
	 */
	get coverage() {
		const totalBugArea = this.bugs
			.map(({ arcLength }) =>
				sphereSurfaceArea(arcLength, this.config.baseSphereRadius)
			)
			.reduce((a, b) => a + b, 0)
		const baseSphereArea = 4 * Math.PI *
			Math.pow(this.config.baseSphereRadius, 2)
		return Math.min(totalBugArea / baseSphereArea, 1)
	}

	/**
	 * The time remaining in the game, in milliseconds.
	 *
	 * @public
	 */
	get timeRemaining() {
		return Math.max(0, this.config.timeLimit - this.time)
	}

	/**
	 * The number of remaining survivors.
	 *
	 * @public
	 */
	get survivorCount() {
		return this.config.initialSurvivorCount - this.casualties +
			this.newSurvivors
	}

	/**
	 * The difficulty modifier.
	 *
	 * @private
	 */
	get difficultyModifier() {
		return this.config.difficultyModifiers[this.difficulty]
	}

	/**
	 * The game's difficulty setting.
	 *
	 * @public
	 * @type {GameDifficulty}
	 */
	get difficultySetting() {
		return this.difficulty
	}
	/**
	 * @public
	 * @param {GameDifficulty} newDifficulty
	 */
	set difficultySetting(newDifficulty) {
		this.difficulty = newDifficulty
		this.restart()
		this.pause()
	}
}
