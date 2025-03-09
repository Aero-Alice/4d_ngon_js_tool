// 4D Visualizer

// Canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;

// UI elements
const shapeNameElement = document.getElementById('shape-name');
const changeShapeBtn = document.getElementById('change-shape-btn');
const freeRotationBtn = document.getElementById('free-rotation-btn');
const controlsContainer = document.getElementById('controls-container');
const toggleControlsBtn = document.getElementById('toggle-controls');
const controlsHeader = document.getElementById('controls-header');

// Knob elements (sliders, indicators, values, reset buttons)
const xySlider = document.getElementById('xy-slider');
const xzSlider = document.getElementById('xz-slider');
const xwSlider = document.getElementById('xw-slider');
const yzSlider = document.getElementById('yz-slider');
const ywSlider = document.getElementById('yw-slider');
const zwSlider = document.getElementById('zw-slider');

const xyIndicator = document.getElementById('xy-indicator');
const xzIndicator = document.getElementById('xz-indicator');
const xwIndicator = document.getElementById('xw-indicator');
const yzIndicator = document.getElementById('yz-indicator');
const ywIndicator = document.getElementById('yw-indicator');
const zwIndicator = document.getElementById('zw-indicator');

const xyValue = document.getElementById('xy-value');
const xzValue = document.getElementById('xz-value');
const xwValue = document.getElementById('xw-value');
const yzValue = document.getElementById('yz-value');
const ywValue = document.getElementById('yw-value');
const zwValue = document.getElementById('zw-value');

const xyResetBtn = document.getElementById('xy-reset');
const xzResetBtn = document.getElementById('xz-reset');
const xwResetBtn = document.getElementById('xw-reset');
const yzResetBtn = document.getElementById('yz-reset');
const ywResetBtn = document.getElementById('yw-reset');
const zwResetBtn = document.getElementById('zw-reset');

// Slider reference array for wheel events
const allSliders = [
    { slider: xySlider, reset: xyResetBtn, value: xyValue, indicator: xyIndicator, index: 0 },
    { slider: xzSlider, reset: xzResetBtn, value: xzValue, indicator: xzIndicator, index: 1 },
    { slider: xwSlider, reset: xwResetBtn, value: xwValue, indicator: xwIndicator, index: 2 },
    { slider: yzSlider, reset: yzResetBtn, value: yzValue, indicator: yzIndicator, index: 3 },
    { slider: ywSlider, reset: ywResetBtn, value: ywValue, indicator: ywIndicator, index: 4 },
    { slider: zwSlider, reset: zwResetBtn, value: zwValue, indicator: zwIndicator, index: 5 }
];

// Colors
const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';

// State variables
let zoomFactor = 10.0; // Start with higher zoom 
let angles = [0, 0, 0, 0, 0, 0]; // XY, XZ, XW, YZ, YW, ZW rotation angles
let rotationRates = [0, 0, 0, 0, 0, 0]; // Will be set to random small values on init
let currentShapeIndex = 0;
let vertices4D = [];
let edges = [];
let shapeName = '';
let scale = calculateScale();
let isMouseRotating = false;
let previousMousePos = { x: 0, y: 0 };
let freeRotation = true;
let controlsExpanded = false;
let controlsPosUpdated = false;

// Math helper functions
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;

// Generate a random small value for rotation
function generateRandomRotationValue() {
    return (Math.random() - 0.5) * 0.012; // Value between -0.006 and 0.006
}

// Shape generators (hypercube, 5-cell, 16-cell, 24-cell, 8-cell)
function generateHypercube() {
    const vertices = [];
    
    // 16 vertices of a 4D hypercube
    for (let x of [-1, 1]) {
        for (let y of [-1, 1]) {
            for (let z of [-1, 1]) {
                for (let w of [-1, 1]) {
                    vertices.push([x, y, z, w]);
                }
            }
        }
    }
    
    // Connect vertices that differ in only one coordinate
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            let diff = 0;
            for (let k = 0; k < 4; k++) {
                if (vertices[i][k] !== vertices[j][k]) diff++;
            }
            if (diff === 1) edges.push([i, j]);
        }
    }
    
    return { vertices, edges, name: "Hypercube" };
}

function generate5Cell() {
    const r = 1.5;
    const vertices = [
        [0, 0, 0, -r/4],
        [r, 0, 0, r/4],
        [-r/3, r*0.94, 0, r/4],
        [-r/3, -r*0.47, r*0.82, r/4],
        [-r/3, -r*0.47, -r*0.82, r/4]
    ];
    
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            edges.push([i, j]);
        }
    }
    
    return { vertices, edges, name: "5-cell" };
}

function generate16Cell() {
    const r = 1.0;
    const vertices = [
        [r, 0, 0, 0], [-r, 0, 0, 0],
        [0, r, 0, 0], [0, -r, 0, 0],
        [0, 0, r, 0], [0, 0, -r, 0],
        [0, 0, 0, r], [0, 0, 0, -r]
    ];
    
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            edges.push([i, j]);
        }
    }
    
    return { vertices, edges, name: "16-cell" };
}

function generate24Cell() {
    const vertices = [];
    const r = 1.0;
    
    for (let x of [-r, r]) {
        for (let y of [-r, r]) {
            vertices.push([x, y, 0, 0]);
            vertices.push([x, 0, y, 0]);
            vertices.push([x, 0, 0, y]);
            vertices.push([0, x, y, 0]);
            vertices.push([0, x, 0, y]);
            vertices.push([0, 0, x, y]);
        }
    }
    
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            const dist = distance(vertices[i], vertices[j]);
            if (Math.abs(dist - Math.sqrt(2)) < 0.01) {
                edges.push([i, j]);
            }
        }
    }
    
    return { vertices, edges, name: "24-cell" };
}

function generate8Cell() {
    const r = 1.5;
    const vertices = [
        [r, 0, 0, 0], [-r, 0, 0, 0],
        [0, r, 0, 0], [0, -r, 0, 0],
        [0, 0, r, 0], [0, 0, -r, 0],
        [0, 0, 0, r], [0, 0, 0, -r]
    ];
    
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            let sameZeros = 0;
            for (let k = 0; k < 4; k++) {
                if (vertices[i][k] === 0 && vertices[j][k] === 0) sameZeros++;
            }
            if (sameZeros === 3) edges.push([i, j]);
        }
    }
    
    return { vertices, edges, name: "8-cell" };
}

// Helper function to calculate distance between two points
function distance(p1, p2) {
    let sum = 0;
    for (let i = 0; i < p1.length; i++) {
        sum += (p1[i] - p2[i]) ** 2;
    }
    return Math.sqrt(sum);
}

// All shape generators
const shapeGenerators = [
    generateHypercube,
    generate5Cell,
    generate16Cell,
    generate24Cell,
    generate8Cell
];

// 4D rotation and projection functions
function rotate4D(points, angleXY, angleXZ, angleXW, angleYZ, angleYW, angleZW) {
    // Create rotation matrices
    const rotationXY = [
        [cos(angleXY), -sin(angleXY), 0, 0],
        [sin(angleXY), cos(angleXY), 0, 0],
        [0, 0, 1, 0], [0, 0, 0, 1]
    ];
    
    const rotationXZ = [
        [cos(angleXZ), 0, -sin(angleXZ), 0],
        [0, 1, 0, 0],
        [sin(angleXZ), 0, cos(angleXZ), 0],
        [0, 0, 0, 1]
    ];
    
    const rotationXW = [
        [cos(angleXW), 0, 0, -sin(angleXW)],
        [0, 1, 0, 0], [0, 0, 1, 0],
        [sin(angleXW), 0, 0, cos(angleXW)]
    ];
    
    const rotationYZ = [
        [1, 0, 0, 0],
        [0, cos(angleYZ), -sin(angleYZ), 0],
        [0, sin(angleYZ), cos(angleYZ), 0],
        [0, 0, 0, 1]
    ];
    
    const rotationYW = [
        [1, 0, 0, 0],
        [0, cos(angleYW), 0, -sin(angleYW)],
        [0, 0, 1, 0],
        [0, sin(angleYW), 0, cos(angleYW)]
    ];
    
    const rotationZW = [
        [1, 0, 0, 0], [0, 1, 0, 0],
        [0, 0, cos(angleZW), -sin(angleZW)],
        [0, 0, sin(angleZW), cos(angleZW)]
    ];
    
    // Deep copy input points and apply rotations sequentially
    let rotated = JSON.parse(JSON.stringify(points));
    rotated = multiplyMatrices(rotated, transpose(rotationXY));
    rotated = multiplyMatrices(rotated, transpose(rotationXZ));
    rotated = multiplyMatrices(rotated, transpose(rotationXW));
    rotated = multiplyMatrices(rotated, transpose(rotationYZ));
    rotated = multiplyMatrices(rotated, transpose(rotationYW));
    rotated = multiplyMatrices(rotated, transpose(rotationZW));
    
    return rotated;
}

// Matrix helpers
function transpose(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];
    
    for (let j = 0; j < cols; j++) {
        result[j] = [];
        for (let i = 0; i < rows; i++) {
            result[j][i] = matrix[i][j];
        }
    }
    
    return result;
}

function multiplyMatrices(points, matrix) {
    const result = [];
    
    for (let i = 0; i < points.length; i++) {
        result[i] = [0, 0, 0, 0];
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result[i][j] += points[i][k] * matrix[j][k];
            }
        }
    }
    
    return result;
}

// Projection functions
function project4DTo3D(points4D) {
    const distance = 4;
    const points3D = [];
    
    for (let i = 0; i < points4D.length; i++) {
        const w = 1 / (distance - points4D[i][3]);
        points3D[i] = [
            points4D[i][0] * w,
            points4D[i][1] * w,
            points4D[i][2] * w
        ];
    }
    
    return points3D;
}

function project3DTo2D(points3D) {
    const distance = 4;
    const points2D = [];
    
    for (let i = 0; i < points3D.length; i++) {
        const z = 1 / (distance - points3D[i][2]);
        points2D[i] = [
            points3D[i][0] * z,
            points3D[i][1] * z
        ];
    }
    
    return points2D;
}

function calculateScale() {
    return Math.min(width, height) / 3 * zoomFactor;
}

// UI Control functions
function positionControlsPanel() {
    const canvasRect = canvas.getBoundingClientRect();
    
    if (!controlsExpanded) {
        // Collapsed state - align to right and vertically center
        controlsContainer.style.right = '0px';
        controlsContainer.style.top = '50%';
        controlsContainer.style.transform = 'translateY(-50%)';
        controlsContainer.style.left = 'auto';
    } else {
        // Expanded state - align to right and top
        controlsContainer.style.right = '0px';
        controlsContainer.style.top = '20px';
        controlsContainer.style.transform = 'none';
        controlsContainer.style.left = 'auto';
    }
    
    // Ensure controls don't overlap with canvas
    const controlsWidth = controlsExpanded ? 320 : 40;
    const minRightSpace = controlsWidth + 5; // Add a small buffer
    
    // Adjust canvas container if needed
    const mainContainer = document.getElementById('main-container');
    const availableWidth = mainContainer.clientWidth;
    const canvasMaxWidth = availableWidth - minRightSpace;
    
    // Set canvas max-width to prevent overlap
    canvas.style.maxWidth = `${canvasMaxWidth}px`;
    
    controlsPosUpdated = true;
}

function changeShape() {
    currentShapeIndex = (currentShapeIndex + 1) % shapeGenerators.length;
    const shapeData = shapeGenerators[currentShapeIndex]();
    vertices4D = shapeData.vertices;
    edges = shapeData.edges;
    shapeName = shapeData.name;
    
    if (shapeNameElement) {
        shapeNameElement.textContent = '';
    }
}

function resetRotationRate(index) {
    rotationRates[index] = 0;
    updateSliderValues();
    updateKnobIndicators();
}

function updateSliderValues() {
    // Clamp values to slider range
    const clampValue = (val) => Math.max(-0.05, Math.min(0.05, val));
    
    // Update slider positions
    xySlider.value = clampValue(rotationRates[0]);
    xzSlider.value = clampValue(rotationRates[1]);
    xwSlider.value = clampValue(rotationRates[2]);
    yzSlider.value = clampValue(rotationRates[3]);
    ywSlider.value = clampValue(rotationRates[4]);
    zwSlider.value = clampValue(rotationRates[5]);
    
    // Update displayed values
    xyValue.textContent = parseFloat(xySlider.value).toFixed(3);
    xzValue.textContent = parseFloat(xzSlider.value).toFixed(3);
    xwValue.textContent = parseFloat(xwSlider.value).toFixed(3);
    yzValue.textContent = parseFloat(yzSlider.value).toFixed(3);
    ywValue.textContent = parseFloat(ywSlider.value).toFixed(3);
    zwValue.textContent = parseFloat(zwSlider.value).toFixed(3);
}

function updateKnobIndicators() {
    // Map slider value to rotation angle (-0.05 => -135deg, 0 => 0deg, 0.05 => 135deg)
    const valueToAngle = (value) => {
        const normalizedValue = (parseFloat(value) + 0.05) / 0.1; // 0 to 1
        return -135 + normalizedValue * 270; // -135 to 135 degrees
    };
    
    // Apply rotations to indicators
    xyIndicator.style.transform = `rotate(${valueToAngle(xySlider.value)}deg)`;
    xzIndicator.style.transform = `rotate(${valueToAngle(xzSlider.value)}deg)`;
    xwIndicator.style.transform = `rotate(${valueToAngle(xwSlider.value)}deg)`;
    yzIndicator.style.transform = `rotate(${valueToAngle(yzSlider.value)}deg)`;
    ywIndicator.style.transform = `rotate(${valueToAngle(ywSlider.value)}deg)`;
    zwIndicator.style.transform = `rotate(${valueToAngle(zwSlider.value)}deg)`;
}

function toggleControls() {
    controlsExpanded = !controlsExpanded;
    if (controlsExpanded) {
        controlsContainer.classList.add('expanded');
        toggleControlsBtn.textContent = '×';
    } else {
        controlsContainer.classList.remove('expanded');
        toggleControlsBtn.textContent = '≡';
    }
    
    setTimeout(positionControlsPanel, 50);
}

// Event handlers
function handleResize() {
    const container = document.getElementById('canvas-container');
    const containerWidth = container.clientWidth;
    
    width = Math.min(containerWidth - 40, 800);
    height = Math.min(window.innerHeight - 100, 600);
    
    canvas.width = width;
    canvas.height = height;
    
    scale = calculateScale();
    positionControlsPanel();
}

// No drag handlers needed as controls are fixed in position

// Handle knob wheel events - this is one of the key new features
function handleKnobWheel(e) {
    // Check if hovering over a knob
    let isOverKnob = false;
    let activeKnobData = null;
    
    for (const knobData of allSliders) {
        const rect = knobData.slider.getBoundingClientRect();
        const containerRect = knobData.slider.parentNode.getBoundingClientRect();
        
        // Check if mouse is over knob or its container
        if (
            (e.clientX >= rect.left && e.clientX <= rect.right &&
             e.clientY >= rect.top && e.clientY <= rect.bottom) ||
            (e.clientX >= containerRect.left && e.clientX <= containerRect.right &&
             e.clientY >= containerRect.top && e.clientY <= containerRect.bottom)
        ) {
            isOverKnob = true;
            activeKnobData = knobData;
            break;
        }
    }
    
    if (isOverKnob && activeKnobData) {
        e.preventDefault();
        
        // Get current value and update based on wheel direction
        let value = parseFloat(activeKnobData.slider.value);
        const increment = 0.001; // Small increment for fine control
        
        if (e.deltaY < 0) {
            value += increment; // Scroll up = increase
        } else {
            value -= increment; // Scroll down = decrease
        }
        
        // Clamp value to min/max range
        value = Math.max(parseFloat(activeKnobData.slider.min), 
                Math.min(parseFloat(activeKnobData.slider.max), value));
        
        // Update the slider, rotation rate and UI
        activeKnobData.slider.value = value;
        rotationRates[activeKnobData.index] = value;
        activeKnobData.value.textContent = value.toFixed(3);
        updateKnobIndicators();
    } else {
        // Normal canvas zoom wheel handling
        e.preventDefault();
        zoomFactor *= e.deltaY < 0 ? 1.1 : 0.9;
        zoomFactor = Math.max(0.1, Math.min(zoomFactor, 10.0));
        scale = calculateScale();
    }
}

// Handle knob middle-click to reset (another key feature)
function handleKnobMiddleClick(e) {
    if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        
        for (const knobData of allSliders) {
            const rect = knobData.slider.getBoundingClientRect();
            const containerRect = knobData.slider.parentNode.getBoundingClientRect();
            
            if (
                (e.clientX >= rect.left && e.clientX <= rect.right &&
                 e.clientY >= rect.top && e.clientY <= rect.bottom) ||
                (e.clientX >= containerRect.left && e.clientX <= containerRect.right &&
                 e.clientY >= containerRect.top && e.clientY <= containerRect.bottom)
            ) {
                resetRotationRate(knobData.index);
                break;
            }
        }
    }
}

// Mouse handling for rotation
function handleMouseDown(e) {
    if (e.button === 2) { // Right mouse button
        e.preventDefault();
        isMouseRotating = true;
        previousMousePos = { x: e.clientX, y: e.clientY };
        
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
}

function handleMouseUp(e) {
    if (e.button === 2) isMouseRotating = false;
}

function handleMouseMove(e) {
    if (isMouseRotating) {
        const dx = e.clientX - previousMousePos.x;
        const dy = e.clientY - previousMousePos.y;
        
        angles[0] += dx * 0.01;
        angles[1] += dy * 0.01;
        
        previousMousePos = { x: e.clientX, y: e.clientY };
    }
}

function handleKeyDown(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        changeShape();
    }
}

// Animation loop
function animate() {
    // Update rotation angles if in free rotation mode
    if (freeRotation) {
        for (let i = 0; i < 6; i++) {
            angles[i] += rotationRates[i];
        }
    }
    
    // Rotate and project
    const rotatedVertices = rotate4D(vertices4D, ...angles);
    const projected3D = project4DTo3D(rotatedVertices);
    const projected2D = project3DTo2D(projected3D);
    
    // Scale and center the 2D points
    const screenPoints = projected2D.map(point => [
        point[0] * scale + width / 2,
        point[1] * scale + height / 2
    ]);
    
    // Draw
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, width, height);
    
    // Draw edges
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 1;
    for (const edge of edges) {
        const start = screenPoints[edge[0]];
        const end = screenPoints[edge[1]];
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    }
    
    // Draw vertices
    ctx.fillStyle = WHITE;
    for (const point of screenPoints) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Position controls if needed
    if (!controlsPosUpdated) {
        positionControlsPanel();
    }
    
    // Continue animation loop
    requestAnimationFrame(animate);
}

// Initialize the app
function init() {
    // Set random rotation rates
    for (let i = 0; i < 6; i++) {
        rotationRates[i] = generateRandomRotationValue();
    }
    
    // Set up the first shape
    changeShape();
    
    // Set up event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleKnobWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleKnobMiddleClick);
    
    // Controls toggle only (no drag)
    toggleControlsBtn.addEventListener('click', toggleControls);
    
    // Shape change and free rotation buttons
    changeShapeBtn.addEventListener('click', changeShape);
    freeRotationBtn.addEventListener('click', () => {
        freeRotation = !freeRotation;
        freeRotationBtn.textContent = freeRotation ? "Freeze" : "Rotate";
    });
    
    // Add slider input listeners
    xySlider.addEventListener('input', () => { 
        rotationRates[0] = parseFloat(xySlider.value); 
        xyValue.textContent = parseFloat(xySlider.value).toFixed(3);
        updateKnobIndicators();
    });
    xzSlider.addEventListener('input', () => { 
        rotationRates[1] = parseFloat(xzSlider.value); 
        xzValue.textContent = parseFloat(xzSlider.value).toFixed(3);
        updateKnobIndicators();
    });
    xwSlider.addEventListener('input', () => { 
        rotationRates[2] = parseFloat(xwSlider.value); 
        xwValue.textContent = parseFloat(xwSlider.value).toFixed(3);
        updateKnobIndicators();
    });
    yzSlider.addEventListener('input', () => { 
        rotationRates[3] = parseFloat(yzSlider.value); 
        yzValue.textContent = parseFloat(yzSlider.value).toFixed(3);
        updateKnobIndicators();
    });
    ywSlider.addEventListener('input', () => { 
        rotationRates[4] = parseFloat(ywSlider.value); 
        ywValue.textContent = parseFloat(ywSlider.value).toFixed(3);
        updateKnobIndicators();
    });
    zwSlider.addEventListener('input', () => { 
        rotationRates[5] = parseFloat(zwSlider.value); 
        zwValue.textContent = parseFloat(zwSlider.value).toFixed(3);
        updateKnobIndicators();
    });
    
    // Add reset button listeners
    xyResetBtn.addEventListener('click', () => resetRotationRate(0));
    xzResetBtn.addEventListener('click', () => resetRotationRate(1));
    xwResetBtn.addEventListener('click', () => resetRotationRate(2));
    yzResetBtn.addEventListener('click', () => resetRotationRate(3));
    ywResetBtn.addEventListener('click', () => resetRotationRate(4));
    zwResetBtn.addEventListener('click', () => resetRotationRate(5));
    
    // Initialize UI
    updateSliderValues();
    updateKnobIndicators();
    
    // Position the controls
    setTimeout(() => {
        handleResize();
        toggleControls(); // Start with controls expanded
        positionControlsPanel();
    }, 100);
    
    // Start animation loop
    requestAnimationFrame(animate);
}

// Start the app when the window loads
window.onload = init;
