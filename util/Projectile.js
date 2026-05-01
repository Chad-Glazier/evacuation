// @ts-check
/// <reference path="../lib_types/MV.d.ts" />

class Projectile {
	/**
	 * Remember to consider the current rotation when setting the
	 * `startingPoint` and `targetPoint` values. Their positions are absolute.
	 *
	 * @param {number[]} startPoint
	 * @param {number[]} targetPoint
	 * @param {number} speed The rectangle's speed in terms of units per
	 * second.
	 * @param {number} length
	 * @param {number} height
	 */
	constructor(
		startPoint,
		targetPoint,
		speed,
		length,
		height,
		isNuke = false,
	) {
		/**
		 * The center of the rectangle before the most recent time advancement.
		 *
		 * @type {number[]}
		 * @private
		 */
		this.prevPosition = startPoint

		/**
		 * The center of the rectangle.
		 *
		 * @type {number[]}
		 * @private
		 */
		this.currentPosition = startPoint

		/**
		 * A unit vector that defines the direction of the trajectory.
		 *
		 * @type {number[]}
		 * @readonly
		 */
		this.direction = normalize([
			targetPoint[0] - startPoint[0],
			targetPoint[1] - startPoint[1],
			targetPoint[2] - startPoint[2],
		])

		/**
		 * The rectangle's speed in terms of units per second.
		 *
		 * @type {number}
		 * @readonly
		 */
		this.speed = speed

		// Now we make the vertices of the rectangle. In order to save
		// some computation, we'll store the vertices and increment them over
		// time, rather than re-computing them on each position.
		//
		// Below, we define some "forwards," "up," "left," etc. Note
		// the distinction between the anti-parallel directions (e.g., left- and
		// right-wards) is arbitrary. Calling them one or the other just helps
		// to think about the rectangle we're making.
		const forwards = this.direction.map((x) => x * length / 2)
		const backwards = forwards.map((x) => -x)
		// We need a vector orthogonal to the forwards/backwards direction.
		// Per the hairy ball theorem (https://en.wikipedia.org/wiki/Hairy_ball_theorem)
		// there is no continuous function that gives us such a vector. So,
		// we use this ugly piecewise function to find it instead.
		const up = this.direction[0] == 0 && this.direction[1] == 0
			? [height / 2, 0, 0]
			: normalize(cross(forwards, [0, 0, 1])).map((x) => x * height / 2)
		const down = up.map((x) => -x)
		const left = normalize(cross(forwards, up)).map((x) => x * height / 2)
		const right = left.map((x) => -x)

		/**
		 * @type {number[][]}
		 * @private
		 */
		this.currentVertices = [
			[startPoint, forwards, left, up].reduce(add),
			[startPoint, forwards, left, down].reduce(add),
			[startPoint, forwards, right, up].reduce(add),
			[startPoint, forwards, right, down].reduce(add),
			[startPoint, backwards, left, up].reduce(add),
			[startPoint, backwards, left, down].reduce(add),
			[startPoint, backwards, right, up].reduce(add),
			[startPoint, backwards, right, down].reduce(add),
		]

		/**
		 * The indices associated with the rectangle's vertices that define
		 * the triangles necessary for rendering.
		 *
		 * @type {Uint16Array}
		 * @readonly
		 */
		// deno-fmt-ignore
		this.indices = new Uint16Array([
			// front face
			0, 1, 2, 
			2, 1, 3,
			// back face
			4, 6, 5, 
			6, 7, 5,
			// left face
			0, 4, 1, 
			1, 4, 5,
			// right face
			2, 3, 6, 
			3, 7, 6,
			// top face
			0, 2, 4, 
			2, 6, 4,
			// bottom face
			1, 5, 3, 
			3, 5, 7,
		])

		/**
		 * @type {boolean}
		 * @readonly
		 */
		this.isNuke = isNuke

		/** 
		 * Initialize the buffers.
		 * @type {undefined | { vertices: WebGLBuffer, indices: WebGLBuffer }}
		 */
		this.buffers = undefined
	}

	/**
	 * @param {number} ms The number of milliseconds that the projectile should
	 * advance, inducing a displacement based on its velocity.
	 */
	advanceTime(ms) {
		const seconds = ms / 1000
		const displacement = this.direction.map((x) => x * this.speed * seconds)

		this.prevPosition = this.currentPosition.map((x) => x)

		this.currentPosition = this.position.map((_, i) => {
			return this.position[i] + displacement[i]
		})

		this.currentVertices = this.currentVertices.map((vertex) => {
			return vertex.map((_, i) => vertex[i] + displacement[i])
		})
	}

	/**
	 * The center of the rectangle before the most recent time advancement.
	 *
	 * @returns {number[]}
	 */
	get previousPosition() {
		return this.prevPosition
	}

	/**
	 * The center of the rectangle.
	 *
	 * @returns {number[]}
	 */
	get position() {
		return this.currentPosition
	}

	/**
	 * The array of vertices. These should be used in conjunction with the
	 * indices in order to define the triangles necessary to draw the
	 * projectile.
	 *
	 * @returns {Float32Array}
	 */
	get vertices() {
		return new Float32Array(this.currentVertices.flat())
	}

	/**
	 * The distance from the center of the rectangle to the origin.
	 *
	 * @returns {number}
	 */
	get radialDistance() {
		return Math.sqrt(
			this.currentPosition.map((x) => x * x).reduce((a, b) => a + b),
		)
	}
}
