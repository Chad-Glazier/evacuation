// @ts-check
/// <reference path="./lib_types/MV.d.ts" />

/**
 * This file was created by running 
 * 
 * ```
 * deno --allow-read --allow-write ./scripts/build.ts
 * ```
 * 
 * All of the source code here corresponds to the files ending in `.glsl` that
 * were found in the `./shaders` directory.
 */

const POINTS_FSHADER_SOURCE = `uniform lowp vec4 uColor;

void main() {
	gl_FragColor = uColor;
}
`
const POINTS_VSHADER_SOURCE = `
attribute vec3 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
	gl_PointSize = 2.0;
	gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}
`
const RECTANGLE_FSHADER_SOURCE = `
void main() {
	gl_FragColor = vec4(0.78, 0.24, 0.24, 1.0);
}
`
const RECTANGLE_VSHADER_SOURCE = `
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`
const SPHERE_FSHADER_SOURCE = `
uniform lowp vec4 uColor;

void main() {
	gl_FragColor = uColor;
}
`
const SPHERE_VSHADER_SOURCE = `
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`
