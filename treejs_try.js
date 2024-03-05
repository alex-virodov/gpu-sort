import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// const [canvasWidth, canvasHeight] = [window.innerWidth, window.innerHeight]
const [canvasWidth, canvasHeight] = [240, 120]
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(/*fov=*/75, canvasWidth / canvasHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( canvasWidth, canvasHeight );
renderer.domElement.style.border = "1px solid black"; 
document.body.appendChild( renderer.domElement );

// TODO: wasd camera controls.
const controls = new OrbitControls( camera, renderer.domElement );
camera.position.z = 2;
controls.rotateSpeed = 0.2
controls.enablePan = false
controls.update()

const size = 10; const divisions = 10; 
const gridHelper = new THREE.GridHelper( size, divisions ); 
scene.add( gridHelper );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// https://stackoverflow.com/questions/29610102/orbitcontrols-how-to-load-last-view-position-and-rotation
function loadControls(controls) {
    const stateJSON = localStorage.getItem(`orbitControls`);
    console.log(stateJSON);
  
    if (stateJSON) {
        const { target0, position0, zoom0 } = JSON.parse(stateJSON);
        controls.target0.copy(target0);
        controls.position0.copy(position0);
        controls.zoom0 = zoom0;
        controls.reset();
    }
};

function saveControls(controls) {
    controls.saveState();
    const { target0, position0, zoom0 } = controls;
    const state = { target0, position0, zoom0 };
    localStorage.setItem(`orbitControls`, JSON.stringify(state));
};

document.addEventListener(`visibilitychange`, () => {
    saveControls(controls);
});
loadControls(controls);

// For testing async code - emulate long waits.
// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkLineIs(index, expected, actual) {
    if (!(expected === actual)) {
        throw new Error(`Expected ${index} to be "${expected}", got="${actual}"`);
    }
}
function checkLineStartsWith(index, expected, actual) {
    if (!actual.startsWith(expected)) {
        throw new Error(`Expected ${index} to start with "${expected}", got="${actual}"`);
    }
}

async function readPly(url) {
    console.log('readPly url=' + url);
    const response = await fetch(url);
    console.log(response);
    // https://stackoverflow.com/questions/48447550/how-can-i-send-a-binary-data-blob-using-fetch-and-formdata
    const binaryContent = await response.blob();
    console.log('binaryContent=', binaryContent);

    // https://stackoverflow.com/questions/49653279/getting-the-binary-content-of-a-blob
    const buffer = await binaryContent.arrayBuffer();
    console.log('buffer=', buffer);

    // TODO: more robust header decoding, allow arbitrary len.
    const headerView = new Int8Array(buffer, 0, 1024);
    console.log('headerView=', headerView);

    var headerString = new TextDecoder().decode(headerView);
    console.log('headerString=', headerString);

    const lines = headerString.split(/\n/);
    console.log('lines=', lines);

    checkLineIs('lines[0]', 'ply', lines[0]);
    checkLineIs('lines[1]', 'format binary_little_endian 1.0', lines[1]); // todo: support other formats.
    
    checkLineStartsWith('lines[2]', 'element vertex ', lines[2]);
    const vertex_count = parseInt(lines[2].substring('element vertex '.length));
    console.log(`vertex_count=${vertex_count}`);

    let properties = []
    let idx = 3;
    while (lines[idx] != 'end_header') {
        console.log(`parsing lines[${idx}]=${lines[idx]}`);
        checkLineStartsWith('lines[${idx}]', 'property ', lines[idx]);
        idx++;
    }





    /*if (lines[0] != 'ply') {
        throw new Error('Expected first line to be "ply", got=' + lines[0]);
    }

    if (lines[1] != 'format binary_little_endian 1.0') {
        throw new Error('Expected first line to be "format binary_little_endian 1.0", got=' + lines[1]);
    }*/




    console.log('readPly end');
    return {'a': 4, 'foo': 23};
}

function animate() {
	requestAnimationFrame( animate );

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
    controls.update()

	renderer.render( scene, camera );
}
animate();

console.log('Start read');
const data = await readPly('data/models/train/input.ply');
console.log('End read');
console.log('readPly result=', data);
