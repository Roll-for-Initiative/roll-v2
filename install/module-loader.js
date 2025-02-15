const modules = [
    'test',
    'renderable',
    'shaders/dither-shader',
    'shaders/dither-pass',
    // 'lib/particle-fire',
    'model-loader',
    'scene'
]

const loadScript=()=> {
    const directory = 'modules/';
    const extension = '.js';
    
    for (const module of modules) {
        const path = directory + module + extension;
        const script = document.createElement("script");
        script.type="module"
        script.src = path;
        document.body.appendChild(script);
        console.log("loaded script: ", path)
    }
}

loadScript()