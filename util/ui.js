// @ts-check
/// <reference path="./types.d.ts" />
/// <reference path="./misc.js" />
/// <reference path="../constants.js" />

/**
 * This class is meant to encapsulate some methods to interact with the HTML
 * user interface. It contains methods to hide/reveal menus, update displayed
 * text and progress bars, etc.
 */
class UI {
	/**
	 * @param {UIMapping} mapping Indicates which HTML elements to use for each
	 * UI component.
	 * @param {ConditionalStyleProperties} conditionalStyles Defines some style
	 * properties that should be set for specific elements when they are in
	 * a given condition.
	 */
	constructor(mapping, conditionalStyles) {
		/**
		 * Maps the menu components to their associated HTML element in the
		 * document.
		 *
		 * @public
		 * @readonly
		 * @type {UIMapping}
		 */
		this.element = mapping

		/**
		 * Defines some style properties that should be set for specific
		 * elements when they are in a given condition.
		 */
		this.conditionalStyles = conditionalStyles

		/**
		 * A boolean flag to indicate whether or not the UI is currently
		 * in an animation. If it is, then it probably shouldn't accept any
		 * new inputs.
		 *
		 * @private
		 * @type {boolean}
		 */
		this.inAnimation = false

		/** @private @type {boolean} */
		this.instructionsShown = false
		/** @private @type {boolean} */
		this.pauseMenuShown = false
		/** @private @type {boolean} */
		this.settingsShown = false
		/** @private @type {boolean} */
		this.winSummaryShown = false
		/** @private @type {boolean} */
		this.loseScreenShown = false

		/** @private @type {number} */
		this.difficultyTextChangeInterval = NaN

		/** @private @type {Set<UINotificationType>} */
		this.notifications = new Set()
	}

	/**
	 * The score that is displayed in the UI.
	 *
	 * @param {number} newScore The updated score to display. This value will
	 * be rounded to the nearest integer.
	 */
	set score(newScore) {
		this.element.textDisplay.score.textContent = Math.round(newScore)
			.toString()
	}

	/**
	 * The survivor count that is displayed in the UI.
	 *
	 * @param {number} newSurvivorCount The updated survivor count to display.
	 */
	set survivorCountNumber(newSurvivorCount) {
		this.element.textDisplay.survivor.textContent = Math.round(
			newSurvivorCount,
		)
			.toString()
	}

	/**
	 * Sets the progress on the survivor progress bar in the UI.
	 *
	 * @param {number} newProgress A number from `0` to `1` representing the
	 * percentage of the progress bar to fill.
	 */
	set survivorCountProgress(newProgress) {
		this.element.progressBar.survivor.style.setProperty(
			"width",
			`calc(${Math.min(100, Math.floor(newProgress * 100))}% - 4px)`,
		)
	}

	/**
	 * Sets the temperature on the heat progress bar in the UI.
	 *
	 * @param {number} newProgress A number from `0` to `1` representing the
	 * percentage of the progress bar to fill.
	 */
	set heatProgress(newProgress) {
		let hotColor = normalize([255, 100, 0])
		let coolColor = normalize([255, 255, 153])

		let proportionalHot = hotColor.map((x) => x * newProgress)
		let proportionalCool = coolColor.map((x) => x * (1 - newProgress))
		let color = proportionalHot.map((_, i) => {
			return proportionalHot[i] + proportionalCool[i]
		})
		color = normalize(color)
		color = color.map((x) => x * 255 * 1.5)

		this.element.progressBar.heat.style.setProperty(
			"width",
			`calc(${Math.min(100, Math.floor(newProgress * 100))}% - 4px)`,
		)
		this.element.progressBar.heat.style.setProperty(
			"background-color",
			`rgb(${color[0]}, ${color[1]}, ${color[2]})`,
		)

		if (newProgress >= 1) {
			this.element.textDisplay.heat.innerText = `OVERHEATED`
		}
		if (newProgress == 0) {
			this.element.textDisplay.heat.innerText = ""
		}
	}

	/**
	 * Sets the progress on the overdrive progress bar in the UI.
	 *
	 * @param {number} newProgress A number representing the percentage of the
	 * progress bar to fill, where `0` is 0% and `1` is 100%. Note that values
	 * above 100% are allowed and will widen the progress bar.
	 */
	set overdriveChargeProgress(newProgress) {
		this.element.progressBar.overdrive.style.setProperty(
			"width",
			`calc(${Math.min(100, Math.floor(newProgress * 100))}% - 4px)`,
		)
		if (newProgress == 1) {
			this.element.textDisplay.overdrive.innerHTML = `READY`
		} else {
			this.element.textDisplay.overdrive.innerText = ""
		}
	}

	/**
	 * The coverage percentage that is displayed in the UI.
	 *
	 * @param {number} newCoverage A number from `0` to `1` that represents the
	 * updated coverage to display.
	 */
	set coverage(newCoverage) {
		newCoverage = Math.min(Math.ceil(newCoverage * 100), 100)
		this.element.textDisplay.coverage.textContent = `${newCoverage}%`
	}

	/**
	 * The remaining time displayed in the UI.
	 *
	 * @param {number} newTimeRemaining The time remaining in milliseconds.
	 */
	set timeRemaining(newTimeRemaining) {
		const minutes = Math.floor(newTimeRemaining / 1000 / 60)
		const seconds = Math.floor(newTimeRemaining / 1000 - minutes * 60)

		this.element.textDisplay.timeRemaining.textContent = `${
			minutes < 10 ? "0" : ""
		}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
	}

	/**
	 * The game's difficulty setting.
	 *
	 * @param {GameDifficulty} newDifficulty The new difficulty setting.
	 */
	set difficulty(newDifficulty) {
		if (this.inAnimation) return

		clearInterval(this.difficultyTextChangeInterval)

		this.difficultyTextChangeInterval = transitionText(
			this.element.textDisplay.difficulty,
			newDifficulty,
			200,
		)
	}

	/**
	 * Applies styles to an element. Optionally, this can be treated as an
	 * animation in which case a callback can be specified to be executed upon
	 * completion.
	 *
	 * The most important change when indicating an animation is that no two
	 * animations will be allowed at the same time. I.e., if this function
	 * determines that there is currently an animation in progress, it will not
	 * start a new one (instead, the call will be ignored).
	 *
	 * @param {HTMLElement} element The element to apply the styles to.
	 * @param {StyleProperty[]} newStyles The new style properties to apply to
	 * the element.
	 * @param {number | null} duration If not `null`, this value indicates that
	 * the style change is an animation of the given duration in milliseconds.
	 * In most cases, this is due to a `transition` style property on the
	 * element.
	 * @param {(() => void) | null} uponCompletion A callback function to be
	 * executed once the animation (if there is one) is completed.
	 */
	applyStyles(element, newStyles, duration = null, uponCompletion = null) {
		const animation = duration != null

		if (animation && this.inAnimation) {
			return
		}

		newStyles.forEach(([property, value]) => {
			element.style.setProperty(property, value)
		})

		if (!animation) return

		this.inAnimation = true
		setTimeout(() => {
			this.inAnimation = false
			if (uponCompletion !== null) uponCompletion()
		}, duration)
	}

	/**
	 * @param {(() => void) | null} uponCompletion An optional callback
	 * function that will be executed when the animation finishes.
	 */
	hidePauseMenu(uponCompletion = null) {
		this.applyStyles(
			this.element.menu.pause,
			this.conditionalStyles.pauseMenu.hidden,
			ANIMATION_TIME,
			uponCompletion,
		)
		this.pauseMenuShown = false
	}

	showPauseMenu() {
		this.applyStyles(
			this.element.menu.pause,
			this.conditionalStyles.pauseMenu.shown,
			ANIMATION_TIME,
		)
		this.pauseMenuShown = true
	}

	/**
	 * @param {(() => void) | null} uponCompletion An optional callback
	 * function that will be executed when the animation finishes.
	 */
	hideInstructions(uponCompletion = null) {
		this.applyStyles(
			this.element.informationCard.instructions,
			this.conditionalStyles.infoPanel.hidden,
			ANIMATION_TIME,
			uponCompletion,
		)
		this.instructionsShown = false
	}

	showInstructions() {
		this.applyStyles(
			this.element.informationCard.instructions,
			this.conditionalStyles.infoPanel.shown,
			ANIMATION_TIME,
		)
		this.instructionsShown = true
	}

	/**
	 * @param {(() => void) | null} uponCompletion An optional callback
	 * function that will be executed when the animation finishes.
	 */
	hideSettings(uponCompletion = null) {
		this.applyStyles(
			this.element.menu.settings,
			this.conditionalStyles.settings.hidden,
			ANIMATION_TIME,
			uponCompletion,
		)
		this.settingsShown = false
	}

	showSettings() {
		this.applyStyles(
			this.element.menu.settings,
			this.conditionalStyles.settings.shown,
			ANIMATION_TIME,
		)
		this.settingsShown = true
	}

	/**
	 * @param {(() => void) | null} uponCompletion An optional callback
	 * function that will be executed when the animation finishes.
	 */
	hideWinSummary(uponCompletion = null) {
		this.applyStyles(
			this.element.informationCard.winSummary,
			this.conditionalStyles.winSummary.hidden,
			ANIMATION_TIME,
			uponCompletion,
		)
		this.winSummaryShown = false
	}

	/**
	 * @param {number} survivorCount
	 * @param {GameDifficulty} difficulty
	 */
	showWinSummary(survivorCount, difficulty) {
		this.applyStyles(
			this.element.informationCard.winSummary,
			this.conditionalStyles.winSummary.shown,
			ANIMATION_TIME,
			() => {
				transitionText(
					this.element.textDisplay.summaryDifficulty,
					difficulty.toUpperCase(),
					ANIMATION_TIME,
				)
				transitionText(
					this.element.textDisplay.summarySurvivor,
					Math.round(survivorCount).toString(),
					ANIMATION_TIME,
				)
			},
		)
		this.winSummaryShown = true
	}

	/**
	 * @param {(() => void) | null} uponCompletion An optional callback
	 * function that will be executed when the animation finishes.
	 */
	hideLoseScreen(uponCompletion = null) {
		this.applyStyles(
			this.element.informationCard.loseScreen,
			this.conditionalStyles.loseScreen.hidden,
			ANIMATION_TIME,
			uponCompletion,
		)
		this.loseScreenShown = false
	}

	showLoseScreen() {
		this.applyStyles(
			this.element.informationCard.loseScreen,
			this.conditionalStyles.loseScreen.shown,
			ANIMATION_TIME,
		)
		this.loseScreenShown = true
	}

	/**
	 * @param {UINotificationType} notification
	 */
	showNotification(notification) {
		if (this.notifications.has(notification)) return
		this.notifications.add(notification)

		this.element.notification[notification].classList.remove("inactive")
	}

	/**
	 * @param {UINotificationType} notification
	 */
	hideNotification(notification) {
		if (!this.notifications.has(notification)) return
		this.notifications.delete(notification)

		this.element.notification[notification].classList.add("inactive")
	}

	get instructionsVisible() {
		return this.instructionsShown
	}

	get pauseMenuVisible() {
		return this.pauseMenuShown
	}

	get settingsVisible() {
		return this.settingsShown
	}

	get winSummaryVisible() {
		return this.winSummaryShown
	}

	get loseScreenVisible() {
		return this.loseScreenShown
	}
}
