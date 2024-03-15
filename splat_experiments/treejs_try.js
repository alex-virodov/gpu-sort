import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// const [canvasWidth, canvasHeight] = [window.innerWidth, window.innerHeight]
const [canvasWidth, canvasHeight] = [400, 400]
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

// Add box.
{
    const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    scene.add( cube );
}

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

function countPlyFloatsUchars(properties) {
    // For now, assuming properties are a number of floats followed by a number of uchars, which is
    // true for the data I have.
    let numFloatsCounter = 0;
    while (numFloatsCounter < properties.length && 
        properties[numFloatsCounter].type == 'float') { numFloatsCounter++; }
    let numUcharsCounter = numFloatsCounter;
    while (numUcharsCounter < properties.length && 
        properties[numUcharsCounter].type == 'uchar') { numUcharsCounter++; }
    console.log('numFloatsCounter=', numFloatsCounter, 'numUcharsCounter=', numUcharsCounter)
    
    const numFloats = numFloatsCounter;
    const numUchars = numUcharsCounter - numFloatsCounter; // Note: the uchars counter includes floats.
    console.log('numFloats=', numFloats, 'numUchars=', numUchars);
    
    return {numFloats: numFloats, numUchars: numUchars};
}

async function readPly(url) {
    console.log('readPly url=' + url);
    const response = await fetch(url);
    // https://stackoverflow.com/questions/48447550/how-can-i-send-a-binary-data-blob-using-fetch-and-formdata
    const binaryContent = await response.blob();
    // console.log('binaryContent=', binaryContent);

    // https://stackoverflow.com/questions/49653279/getting-the-binary-content-of-a-blob
    const buffer = await binaryContent.arrayBuffer();
    // console.log('buffer=', buffer);

    // TODO: more robust header decoding, allow arbitrary len.
    const headerView = new Int8Array(buffer, 0, 2048);
    // console.log('headerView=', headerView);

    var headerString = new TextDecoder().decode(headerView);
    // console.log('headerString=', headerString);

    const lines = headerString.split(/\n/);
    // console.log('lines=', lines);

    // Read the first few lines of header that are expected to be fairly constant.
    checkLineIs('lines[0]', 'ply', lines[0]);
    checkLineIs('lines[1]', 'format binary_little_endian 1.0', lines[1]); // todo: support other formats.
    
    checkLineStartsWith('lines[2]', 'element vertex ', lines[2]);
    const numVertices = parseInt(lines[2].substring('element vertex '.length));
    console.log(`numVertices=${numVertices}`);

    // Read the variable list of properties until the 'end_header'.
    let properties = []
    let lineIndex = 3;
    while (lines[lineIndex] != 'end_header') {
        // console.log(`parsing lines[${lineIndex}]=${lines[lineIndex]}`);
        checkLineStartsWith(`lines[${lineIndex}]`, 'property ', lines[lineIndex]);
        const propertyParts = lines[lineIndex].split(' ');
        properties.push({type: propertyParts[1], name: propertyParts[2]});
        lineIndex++;
    }
    console.log('properties=', properties);

    // Find the start of the binary data by locating the 'end_header' string.
    const endHeaderLocation = headerString.indexOf('end_header');
    console.assert(endHeaderLocation != -1); // should really have it.
    const startBinaryLocation = endHeaderLocation + 'end_header'.length + 1; // todo: why '+1'? Shouldn't need it, but without it the buffer size doesn't match expected from vertex size * count.
    // console.log('startBinaryLocation=', startBinaryLocation);
    const dataBuffer = buffer.slice(startBinaryLocation);

    /* No need to parse vertices, we'll do that with OpenGL attribute bindings (I hope :)
    // haha, no, not supported in three.js yet, and may not be feasible becase underlying webgl
    // doesn't do it efficiently anyway ("We recently found that using interleaved buffers with 
    // attributes of different types leads to the creation of multiple buffers in WebGL, which 
    // duplicates data on the GPU and defeats the purpose of interleaving data in the first place"):
    // https://github.com/mrdoob/three.js/pull/21656
    // And in any case, the trained models are all floats, only the 'input.ply' has uchars.

    // Structured binary reading: https://github.com/gkjohnson/js-struct-data-view
    // todo: call countPlyFloatsUchars(properties), if needed.

    const vertexSizeInBytes = numFloats * 4 + numUchars;
    console.log(`vertexSizeInBytes=${vertexSizeInBytes}, numVertices=${numVertices}, dataBuffer.byteLength=${dataBuffer.byteLength}`);
    console.assert(numVertices * vertexSizeInBytes == dataBuffer.byteLength);
    */

    console.log('readPly end');
    return {properties: properties, dataBuffer: dataBuffer};
}

function animate() {
	requestAnimationFrame( animate );

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
    controls.update()

	renderer.render( scene, camera );
}
animate();

const data = await readPly('data/models/train/point_cloud/iteration_7000/point_cloud.ply');
console.log('readPly result=', data);

// Point cloud example from https://threejs.org/docs/index.html#api/en/materials/PointsMaterial
{
    const dataCounts = countPlyFloatsUchars(data.properties);
    const interleavedBuffer = new THREE.InterleavedBuffer(new Float32Array(data.dataBuffer), /*stride=*/dataCounts.numFloats);
    console.log('interleavedBuffer=', interleavedBuffer);
    const ibattrXyz = new THREE.InterleavedBufferAttribute(interleavedBuffer, 3, 0);
    const ibattrRgb = new THREE.InterleavedBufferAttribute(interleavedBuffer, 3, 6);
    const ibattrSh0123 = new THREE.InterleavedBufferAttribute(interleavedBuffer, 3, 9);
    console.log('ibattrXyz=', ibattrXyz);



    const material = new THREE.ShaderMaterial( {

        uniforms: {
        },
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent

    } );


    /*const vertices = [];

    for ( let i = 0; i < 1000; i ++ ) {
        const x = THREE.MathUtils.randFloatSpread( 20 );
        const y = THREE.MathUtils.randFloatSpread( 20 );
        const z = THREE.MathUtils.randFloatSpread( 20 );

        vertices.push( x, y, z );
    }*/

    const geometry = new THREE.BufferGeometry();
    // geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geometry.setAttribute( 'position', ibattrXyz);
    geometry.setAttribute( 'color', ibattrRgb);
    geometry.setAttribute( 'sh0123', ibattrSh0123);
    // const material = new THREE.PointsMaterial( { color: 0x888888, size: 0.1 } );
    const points = new THREE.Points( geometry, material );
    scene.add( points );
}
