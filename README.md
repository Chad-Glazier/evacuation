# Evacuation

*Evacuation* is a small game where the objective is to stop "bugs" from overwhelming a planet. 

The cool part of this project is that it is built entirely with WebAPIs and has no external dependencies; as such, you can run it locally by simply downloading the repository and opening the `index.html` file in a web browser. The [live version](https://chad-glazier.github.io/evacuation/) is currently hosted as static files on GitHub Pages.

## Development Notes

As I mentioned, there are no dependencies, but there is one minimal build process. Specifically, the shader source files stored in [shaders/](./shaders/) need to be built into a JavaScript file, and the separate CSS files in [styles/](./styles/) need to be bundled into a single stylesheet. To perform these steps, the [build.ts](./scripts/build.ts) script can be run via Deno. 

```sh
deno run --allow-read --allow-write ./scripts/build.ts
```

This script will re-build the files once every second so that you don't have to constantly re-run it when making changes to the CSS or shader files.

Since *Evacuation* is meant to have zero dependencies, that includes skipping out on TypeScript. Instead, TSDoc comments are included comprehensively which gives us the support of the TypeScript LSP while still keeping the code in vanilla JavaScript. While this ensures type-safety, the downside is that there are many, many verbose comments where a normal TypeScript codebase could simply write a type annotation in-line. If this project is ever to be expanded significantly, it's almost definitely worthwhile to refactor it into real TypeScript and forgo the "no dependencies" rule.

Another notable pain point in the code is the HTML user interface (the menus, timer, etc). Since there are no dependencies, that also means there is no component framework. In lieu of this, the [ui.js](./util/ui.js) file encapsulates all logic for the HTML display. This works for now, but it's far from an ideal solution and if the project is ever expanded it should probably be refactored to use a real UI framework.

### To-Do

Refactor the rendering logic to optimize performance. As it is, 
- the rendering call happens at a fixed time instead of using `requestAnimationFrame`;
- there are constant buffer reallocations that don't need to happen, and they have a significant drag on performance;
- the memory addresses aren't being cached.
