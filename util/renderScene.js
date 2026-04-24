// @ts-check
/// <reference path="../index.js" />
/// <reference path="./types.d.ts" />
/// <reference path="../lib_types/MV.d.ts" />
/// <reference path="./sphere.js" />
/// <reference path="../constants.js" />
/// <reference path="./Projectile.js" />
/// <reference path="./misc.js" />

/**
 * Draws the described scene into the provided rendering context.
 *
 * @param {WebGLRenderingContext} gl
 * @param {number[][]} projectionMatrix
 * @param {Sphere} baseSphere
 * @param {WebGLProgram} pointShaderProgram
 * @param {WebGLProgram} sphereShaderProgram
 * @param {WebGLProgram} rectangleShaderProgram
 * @param {Array<Bug>} bugs
 * @param {Array<DyingBug>} dyingBugs
 * @param {Array<Projectile>} projectiles
 * @param {Options | null} options
 */
function renderScene(
	gl,
	projectionMatrix,
	baseSphere,
	pointShaderProgram,
	sphereShaderProgram,
	rectangleShaderProgram,
	bugs,
	dyingBugs,
	projectiles,
	options = null,
) {
	// If the canvas is offscreen, don't bother.
	if (gl.canvas instanceof OffscreenCanvas) {
		return
	}

	// Set/validate the default options.
	if (options == null) {
		options = {
			rotate: mat4(),
			distance: 6,
		}
	}
	if (options.rotate == undefined) options.rotate = mat4()
	if (options.distance == undefined) options.distance = 6
	if (options.distance > MAX_DISTANCE) options.distance = MAX_DISTANCE
	if (options.distance < MIN_DISTANCE) options.distance = MIN_DISTANCE
	if (options.spherePointColor == undefined) {
		options.spherePointColor = [0.49, 0.98, 0.50, 1.0]
	}
	if (options.sphereColor == undefined) {
		options.sphereColor = [0, 0, 0, 1]
	}

	// Clear the canvas.
	gl.clearColor(0, 0, 0, 1)
	gl.clearDepth(1.0)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// Locations of attributes and uniforms in the shaders.
	const loc = {
		points: {
			aVertexPosition: gl.getAttribLocation(
				pointShaderProgram,
				"aVertexPosition",
			),
			uModelViewMatrix: gl.getUniformLocation(
				pointShaderProgram,
				"uModelViewMatrix",
			),
			uProjectionMatrix: gl.getUniformLocation(
				pointShaderProgram,
				"uProjectionMatrix",
			),
			uColor: gl.getUniformLocation(pointShaderProgram, "uColor"),
		},
		baseSphere: {
			aVertexPosition: gl.getAttribLocation(
				sphereShaderProgram,
				"aVertexPosition",
			),
			uModelViewMatrix: gl.getUniformLocation(
				sphereShaderProgram,
				"uModelViewMatrix",
			),
			uProjectionMatrix: gl.getUniformLocation(
				sphereShaderProgram,
				"uProjectionMatrix",
			),
			uColor: gl.getUniformLocation(sphereShaderProgram, "uColor"),
		},
		rectangle: {
			aVertexPosition: gl.getAttribLocation(
				rectangleShaderProgram,
				"aVertexPosition",
			),
			uModelViewMatrix: gl.getUniformLocation(
				rectangleShaderProgram,
				"uModelViewMatrix",
			),
			uProjectionMatrix: gl.getUniformLocation(
				rectangleShaderProgram,
				"uProjectionMatrix",
			),
		},
	}

	// Create the model view matrix, which factors in rotations and distance
	// (along the z-axis), based on the `options` argument.
	// The functions used here are from `lib/MV.js`
	let modelViewMatrix = mat4()
	modelViewMatrix = mult(options.rotate, modelViewMatrix)
	modelViewMatrix = mult(
		translate(0, 0, -1 * options.distance),
		modelViewMatrix,
	)

	// Draw the base sphere.
	gl.useProgram(sphereShaderProgram)

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()) // buffer for distinct vertices
	gl.bufferData(gl.ARRAY_BUFFER, baseSphere.vertices, gl.STATIC_DRAW)
	gl.vertexAttribPointer(loc.points.aVertexPosition, 3, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(loc.points.aVertexPosition)

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()) // buffer for indices
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, baseSphere.indices, gl.STATIC_DRAW)

	gl.uniformMatrix4fv(
		loc.baseSphere.uProjectionMatrix,
		false,
		flatten(projectionMatrix),
	)
	gl.uniformMatrix4fv(
		loc.baseSphere.uModelViewMatrix,
		false,
		flatten(modelViewMatrix),
	)
	gl.uniform4fv(loc.baseSphere.uColor, new Float32Array(options.sphereColor))

	gl.drawElements(
		gl.TRIANGLES,
		baseSphere.indices.length,
		gl.UNSIGNED_SHORT,
		0,
	)

	// Draw the points.
	gl.useProgram(pointShaderProgram)

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, baseSphere.vertices, gl.STATIC_DRAW)
	gl.vertexAttribPointer(loc.points.aVertexPosition, 3, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(loc.points.aVertexPosition)

	gl.uniformMatrix4fv(
		loc.points.uProjectionMatrix,
		false,
		flatten(projectionMatrix),
	)
	gl.uniformMatrix4fv(
		loc.points.uModelViewMatrix,
		false,
		flatten(modelViewMatrix),
	)
	gl.uniform4fv(loc.points.uColor, new Float32Array(options.spherePointColor))

	gl.drawArrays(gl.POINTS, 0, baseSphere.vertices.length / 3)

	// Draw the bugs
	for (const bug of [...bugs, ...dyingBugs]) {
		let bugModelViewMatrix = mat4()
		bugModelViewMatrix = mult(bug.rotationMatrix, bugModelViewMatrix)
		bugModelViewMatrix = mult(options.rotate, bugModelViewMatrix)
		bugModelViewMatrix = mult(
			translate(0, 0, -1 * options.distance),
			bugModelViewMatrix,
		)

		//@ts-ignore
		let innerArcLength = bug["innerArcLength"] ?? 0
		const bugSphere = sphere(SPHERE_DIVISIONS, {
			polarInterval: [innerArcLength, bug.arcLength],
			// the base sphere has a radial distance of 1 we want the bugs
			// to be *slightly* bigger.
			radialDistance: 1 + bug.elevation,
			isCone: true,
		})

		gl.useProgram(sphereShaderProgram)

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()) // buffer for distinct vertices
		gl.bufferData(gl.ARRAY_BUFFER, bugSphere.vertices, gl.STATIC_DRAW)
		gl.vertexAttribPointer(
			loc.points.aVertexPosition,
			3,
			gl.FLOAT,
			false,
			0,
			0,
		)
		gl.enableVertexAttribArray(loc.points.aVertexPosition)

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()) // buffer for indices
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bugSphere.indices, gl.STATIC_DRAW)

		gl.uniformMatrix4fv(
			loc.baseSphere.uProjectionMatrix,
			false,
			flatten(projectionMatrix),
		)
		gl.uniformMatrix4fv(
			loc.baseSphere.uModelViewMatrix,
			false,
			flatten(bugModelViewMatrix),
		)
		gl.uniform4fv(loc.baseSphere.uColor, new Float32Array(bug.color))

		gl.drawElements(
			gl.TRIANGLES,
			bugSphere.indices.length,
			gl.UNSIGNED_SHORT,
			0,
		)
	}

	// Draw the projectiles
	for (const projectile of projectiles) {
		// let projectileMVMatrix = mat4()
		// projectileMVMatrix = mult(options.rotate, projectileMVMatrix)
		// projectileMVMatrix = mult(translate(0, 0, -1 * options.distance), projectileMVMatrix)

		gl.useProgram(rectangleShaderProgram)

		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()) // buffer for distinct vertices
		gl.bufferData(gl.ARRAY_BUFFER, projectile.vertices, gl.STATIC_DRAW)
		gl.vertexAttribPointer(
			loc.rectangle.aVertexPosition,
			3,
			gl.FLOAT,
			false,
			0,
			0,
		)
		gl.enableVertexAttribArray(loc.rectangle.aVertexPosition)

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()) // buffer for indices
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, projectile.indices, gl.STATIC_DRAW)

		gl.uniformMatrix4fv(
			loc.rectangle.uProjectionMatrix,
			false,
			flatten(projectionMatrix),
		)
		gl.uniformMatrix4fv(
			loc.rectangle.uModelViewMatrix,
			false,
			flatten(modelViewMatrix),
		)

		gl.drawElements(
			gl.TRIANGLES,
			projectile.indices.length,
			gl.UNSIGNED_SHORT,
			0,
		)
	}
}
