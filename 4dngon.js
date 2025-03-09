// 4D Visualizer
// JavaScript implementation

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;

// UI elements
const shapeNameElement = document.getElementById('shape-name');
const changeShapeBtn = document.getElementById('change-shape-btn');
const xySlider = document.getElementById('xy-slider');
const xzSlider = document.getElementById('xz-slider');
const zySlider = document.getElementById('zy-slider');
const freeRotationBtn = document.getElementById('free-rotation-btn');

// Colors
const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';

// State variables
let zoomFactor = 1.0;
let angles = [0, 0, 0, 0, 0, 0]; // XY, XZ, XW, YZ, YW, ZW
let currentShapeIndex = 0;
let vertices4D = [];
let edges = [];
let shapeName = '';
let scale = calculateScale();
let isMouseRotating = false;
let previousMousePos = { x: 0, y: 0 };
let manualRotation = false;
let freeRotation = false;

// Math helper functions
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;

// Shape Generation Functions
function generateHypercube() {
    // Generate vertices and edges for a 4D hypercube (tesseract)
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
                if (vertices[i][k] !== vertices[j][k]) {
                    diff++;
                }
            }
            if (diff === 1) {
                edges.push([i, j]);
            }
        }
    }
    
    return {
        vertices: vertices,
        edges: edges,
        name: "Hypercube"
    };
}

function generate5Cell() {
    // Generate vertices and edges for a 5-cell (4D simplex)
    const r = 1.5; // Scale factor for better visualization
    const vertices = [
        [0, 0, 0, -r/4],  // Base vertex
        [r, 0, 0, r/4],    // Remaining vertices in a tetrahedral arrangement
        [-r/3, r*0.94, 0, r/4],
        [-r/3, -r*0.47, r*0.82, r/4],
        [-r/3, -r*0.47, -r*0.82, r/4]
    ];
    
    // All vertices connect to each other in a 5-cell
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            edges.push([i, j]);
        }
    }
    
    return {
        vertices: vertices,
        edges: edges,
        name: "5-cell"
    };
}

function generate16Cell() {
    // Generate vertices and edges for a 16-cell (4D hexadecachoron)
    const r = 1.0;
    const vertices = [
        [r, 0, 0, 0],
        [-r, 0, 0, 0],
        [0, r, 0, 0],
        [0, -r, 0, 0],
        [0, 0, r, 0],
        [0, 0, -r, 0],
        [0, 0, 0, r],
        [0, 0, 0, -r]
    ];
    
    // Connect vertices to form the 16-cell
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            edges.push([i, j]);
        }
    }
    
    return {
        vertices: vertices,
        edges: edges,
        name: "16-cell"
    };
}

function generate24Cell() {
    // Generate vertices and edges for a 24-cell
    const vertices = [];
    const r = 1.0;
    
    // Permutations of (±1, ±1, 0, 0)
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
    
    // Connect vertices that are at distance √2
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            const dist = distance(vertices[i], vertices[j]);
            if (Math.abs(dist - Math.sqrt(2)) < 0.01) { // Allow for small floating-point errors
                edges.push([i, j]);
            }
        }
    }
    
    return {
        vertices: vertices,
        edges: edges,
        name: "24-cell"
    };
}

function generate8Cell() {
    // Generate vertices and edges for an 8-cell (4D octahedron)
    const r = 1.5;
    const vertices = [
        [r, 0, 0, 0],
        [-r, 0, 0, 0],
        [0, r, 0, 0],
        [0, -r, 0, 0],
        [0, 0, r, 0],
        [0, 0, -r, 0],
        [0, 0, 0, r],
        [0, 0, 0, -r]
    ];
    
    // Connect vertices to form the edges of the octahedron
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            // Only connect if they share one non-zero coordinate
            let sameZeros = 0;
            for (let k = 0; k < 4; k++) {
                if (vertices[i][k] === 0 && vertices[j][k] === 0) {
                    sameZeros++;
                }
            }
            if (sameZeros === 3) { // They both have 3 zero coordinates
                edges.push([i, j]);
            }
        }
    }
    
    return {
        vertices: vertices,
        edges: edges,
        name: "8-cell"
    };
}

// Helper function to calculate distance between two points
function distance(p1, p2) {
    let sum = 0;
    for (let i = 0; i < p1.length; i++) {
        sum += (p1[i] - p2[i]) ** 2;
    }
    return Math.sqrt(sum);
}

// Define all available shapes
const shapeGenerators = [
    generateHypercube,
    generate5Cell,
    generate16Cell,
    generate24Cell,
    generate8Cell
];

// Projection and rotation matrices
function rotate4D(points, angleXY, angleXZ, angleXW, angleYZ, angleYW, angleZW) {
    // XY rotation
    const rotationXY = [
        [cos(angleXY), -sin(angleXY), 0, 0],
        [sin(angleXY), cos(angleXY), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
    
    // XZ rotation
    const rotationXZ = [
        [cos(angleXZ), 0, -sin(angleXZ), 0],
        [0, 1, 0, 0],
        [sin(angleXZ), 0, cos(angleXZ), 0],
        [0, 0, 0, 1]
    ];
    
    // XW rotation
    const rotationXW = [
        [cos(angleXW), 0, 0, -sin(angleXW)],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [sin(angleXW), 0, 0, cos(angleXW)]
    ];
    
    // YZ rotation
    const rotationYZ = [
        [1, 0, 0, 0],
        [0, cos(angleYZ), -sin(angleYZ), 0],
        [0, sin(angleYZ), cos(angleYZ), 0],
        [0, 0, 0, 1]
    ];
    
    // YW rotation
    const rotationYW = [
        [1, 0, 0, 0],
        [0, cos(angleYW), 0, -sin(angleYW)],
        [0, 0, 1, 0],
        [0, sin(angleYW), 0, cos(angleYW)]
    ];
    
    // ZW rotation
    const rotationZW = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, cos(angleZW), -sin(angleZW)],
        [0, 0, sin(angleZW), cos(angleZW)]
    ];
    
    // Apply rotations sequentially
    let rotated = JSON.parse(JSON.stringify(points)); // Deep copy
    rotated = multiplyMatrices(rotated, transpose(rotationXY));
    rotated = multiplyMatrices(rotated, transpose(rotationXZ));
    rotated = multiplyMatrices(rotated, transpose(rotationXW));
    rotated = multiplyMatrices(rotated, transpose(rotationYZ));
    rotated = multiplyMatrices(rotated, transpose(rotationYW));
    rotated = multiplyMatrices(rotated, transpose(rotationZW));
    
    return rotated;
}

// Matrix operations
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

function project4DTo3D(points4D, wPlane = 2) {
    // Perform perspective projection from 4D to 3D
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

function project3DTo2D(points3D, zPlane = 2) {
    // Perform perspective projection from 3D to 2D
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

// Calculate scale based on window size
function calculateScale() {
    return Math.min(width, height) / 3 * zoomFactor;
}

// Function to change shape
function changeShape() {
    currentShapeIndex = (currentShapeIndex + 1) % shapeGenerators.length;
    const shapeData = shapeGenerators[currentShapeIndex]();
    vertices4D = shapeData.vertices;
    edges = shapeData.edges;
    shapeName = shapeData.name;
    
    // Keep the name for internal reference but don't display it
    if (shapeNameElement) {
        shapeNameElement.textContent = '';
    }
}

// Initialize the first shape
function init() {
    // Set up the first shape
    changeShape();
    
    // Set up event listeners
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    changeShapeBtn.addEventListener('click', changeShape);
    
    // Add event listeners for new controls
    xySlider.addEventListener('input', () => {
        angles[0] = parseFloat(xySlider.value);
    });
    
    xzSlider.addEventListener('input', () => {
        angles[1] = parseFloat(xzSlider.value);
    });
    
    zySlider.addEventListener('input', () => {
        angles[2] = parseFloat(zySlider.value);
    });

    freeRotationBtn.addEventListener('click', () => {
        freeRotation = !freeRotation;
        freeRotationBtn.textContent = freeRotation ? "Stop" : "Free";
    });
    
    // Start animation loop
    requestAnimationFrame(animate);
}

// Event handlers
function handleResize() {
    // Get the container width for responsive sizing
    const container = document.getElementById('container');
    const containerWidth = container.clientWidth;
    
    // Set canvas size based on container
    width = Math.min(containerWidth - 40, 800);
    height = Math.min(window.innerHeight - 100, 600);
    
    canvas.width = width;
    canvas.height = height;
    
    scale = calculateScale();
}

function handleWheel(event) {
    event.preventDefault();
    // Adjust zoom with mouse wheel
    zoomFactor *= event.deltaY < 0 ? 1.1 : 0.9;
    // Limit zoom range to avoid extreme scaling
    zoomFactor = Math.max(0.1, Math.min(zoomFactor, 10.0));
    scale = calculateScale();
}

function handleMouseDown(event) {
    if (event.button === 2) { // Right mouse button
        event.preventDefault();
        isMouseRotating = true;
        previousMousePos = { x: event.clientX, y: event.clientY };
        manualRotation = true; // User is now manually rotating
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }
}

function handleMouseUp(event) {
    if (event.button === 2) { // Right mouse button
        isMouseRotating = false;
    }
}

function handleMouseMove(event) {
    if (isMouseRotating) {
        const currentMousePos = { x: event.clientX, y: event.clientY };
        const dx = currentMousePos.x - previousMousePos.x;
        const dy = currentMousePos.y - previousMousePos.y;
        
        // Adjust rotation angles based on mouse movement
        // Horizontal movement controls XY rotation
        angles[0] += dx * 0.01;
        // Vertical movement controls XZ rotation
        angles[1] += dy * 0.01;
        
        previousMousePos = currentMousePos;
    }
}

function handleKeyDown(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        changeShape();
    } else if (event.code === 'Escape') {
        // Optional: add any cleanup or reset functionality
    }
}

// Animation loop
function animate() {
    // Update rotation angles if in free rotation mode
    if (freeRotation) {
        angles[0] += 0.02; // XY rotation
        angles[1] += 0.02; // XZ rotation
        angles[2] += 0.02; // ZY rotation
        
        // Update slider positions to reflect current angles
        xySlider.value = angles[0];
        xzSlider.value = angles[1];
        zySlider.value = angles[2];
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
    
    // Draw vertices
    ctx.fillStyle = WHITE;
    for (const point of screenPoints) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
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
    
    // Continue animation loop
    requestAnimationFrame(animate);
}

// Initialize when the page loads
window.onload = init;
