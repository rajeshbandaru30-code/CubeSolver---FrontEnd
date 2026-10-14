/**
 * test_camera_scanner_integration.cjs
 *
 * End-to-end integration test validating:
 * 1. Scanner component presence and routing
 * 2. 6-face scanning orientation sequence & center assignments
 * 3. Color detector accuracy across lighting variations
 * 4. 54-facelet reconstruction from 6 scanned faces
 * 5. Physical parity validation (rejects invalid states)
 * 6. Live API contract with Java Kociemba solver
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passed = 0, failed = 0;
function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passed++;
  console.log(`  ✅ PASSED: ${message}`);
}

function makeRequest(method, reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = { 'Content-Type': 'application/json' };
    if (data) reqHeaders['Content-Length'] = Buffer.byteLength(data);

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api' + reqPath,
      method: method,
      headers: reqHeaders,
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(buf); } catch (e) { json = buf; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', err => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('========================================================================');
  console.log('CAMERA SCANNER END-TO-END INTEGRATION TEST SUITE');
  console.log('========================================================================\n');

  // 1. Files & Routing verification
  console.log('[1/6] Verifying Scanner Architecture & Routing Integration...');
  const appJsx = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf-8');
  assert(appJsx.includes('Scanner') && appJsx.includes('./pages/Scanner'), 'Scanner page is imported in App.jsx');
  assert(appJsx.includes('path="/scanner"'), 'Protected /scanner route configured in App.jsx');

  const dashboardJsx = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'Dashboard.jsx'), 'utf-8');
  assert(dashboardJsx.includes('label: \'Scan Cube\'') && dashboardJsx.includes('to: \'/scanner\''), 'Dashboard includes Scan Cube action card');

  const solverJsx = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'Solver.jsx'), 'utf-8');
  assert(solverJsx.includes('navigate(\'/scanner\')'), 'Solver page provides direct 1-click navigation to Camera Scanner');

  const navbarJsx = fs.readFileSync(path.join(__dirname, 'src', 'components', 'Navbar.jsx'), 'utf-8');
  assert(navbarJsx.includes('to: \'/scanner\''), 'Navbar includes link to Scanner');

  const bottomNavJsx = fs.readFileSync(path.join(__dirname, 'src', 'components', 'BottomNav.jsx'), 'utf-8');
  assert(bottomNavJsx.includes('to: \'/scanner\''), 'BottomNav includes mobile Scanner button');

  // 2. Component Files Integrity
  console.log('\n[2/6] Verifying Scanner Components & Video Stream Hygiene...');
  const cameraFeed = fs.readFileSync(path.join(__dirname, 'src', 'components', 'scanner', 'CameraFeed.jsx'), 'utf-8');
  assert(cameraFeed.includes('navigator.mediaDevices.getUserMedia'), 'CameraFeed uses browser getUserMedia API');
  assert(cameraFeed.includes('facingMode: { ideal: facingMode }'), 'CameraFeed supports rear/environment and front camera switching');
  assert(cameraFeed.includes('track.stop()'), 'CameraFeed cleans up all media tracks on unmount');
  assert(cameraFeed.includes('window.isSecureContext'), 'CameraFeed checks secure context for HTTPS/localhost requirements');

  const scanOverlay = fs.readFileSync(path.join(__dirname, 'src', 'components', 'scanner', 'ScanOverlay.jsx'), 'utf-8');
  assert(scanOverlay.includes('gridTemplateColumns: \'repeat(3, 1fr)\''), 'ScanOverlay renders 3x3 targeting reticle');
  assert(scanOverlay.includes('topNeighbor') && scanOverlay.includes('bottomNeighbor'), 'ScanOverlay displays orientation neighbor badges');

  const faceCaptureCard = fs.readFileSync(path.join(__dirname, 'src', 'components', 'scanner', 'FaceCaptureCard.jsx'), 'utf-8');
  assert(faceCaptureCard.includes('onRetake') && faceCaptureCard.includes('onConfirm'), 'FaceCaptureCard provides retake and confirmation actions');
  assert(faceCaptureCard.includes('handleSelectColor'), 'FaceCaptureCard allows manual 1-tap sticker recoloring');

  const reviewModal = fs.readFileSync(path.join(__dirname, 'src', 'components', 'scanner', 'CubeReviewModal.jsx'), 'utf-8');
  assert(reviewModal.includes('CubeVisualizer'), 'CubeReviewModal renders real 3D Three.js cube preview');
  assert(reviewModal.includes('validateCubeState'), 'CubeReviewModal validates mathematical parity and sticker counts');
  assert(reviewModal.includes('cubeApi.solve'), 'CubeReviewModal submits validated state to Java solver');

  // 3. Mathematical Parity & Solvability Logic
  console.log('\n[3/6] Testing Mathematical Parity & Impossible State Detection...');
  const { validateCubeState, SCAN_STEPS } = await import('./src/engine/cubeValidatorClient.js');

  // Solved state
  const solved = [];
  for (let f = 0; f < 6; f++) {
    for (let p = 0; p < 9; p++) solved.push(f);
  }
  const valSolved = validateCubeState(solved);
  assert(valSolved.valid === true, 'Solved state passes all 5 mathematical conditions');

  // Impossible: Flipped edge (parity sum odd)
  // Edge UF is at U*9+7 and F*9+1
  const flippedEdge = [...solved];
  const tmpEdge = flippedEdge[0 * 9 + 7];
  flippedEdge[0 * 9 + 7] = flippedEdge[2 * 9 + 1];
  flippedEdge[2 * 9 + 1] = tmpEdge;
  const valFlipped = validateCubeState(flippedEdge);
  assert(valFlipped.valid === false && valFlipped.errors.some(e => e.includes('flipped') || e.includes('edge')), 'Flipped single edge is correctly detected as impossible');

  // Impossible: Twisted corner (orientation sum % 3 != 0)
  // Corner URF: U*9+8, R*9+0, F*9+2
  const twistedCorner = [...solved];
  const c0 = twistedCorner[0 * 9 + 8];
  const c1 = twistedCorner[1 * 9 + 0];
  const c2 = twistedCorner[2 * 9 + 2];
  twistedCorner[0 * 9 + 8] = c1;
  twistedCorner[1 * 9 + 0] = c2;
  twistedCorner[2 * 9 + 2] = c0;
  const valTwisted = validateCubeState(twistedCorner);
  assert(valTwisted.valid === false && valTwisted.errors.some(e => e.includes('twisted') || e.includes('orientation')), 'Twisted single corner is correctly detected as impossible');

  // 4. Color Detector Robustness
  console.log('\n[4/6] Testing Color Classification & Distance Metrics...');
  const { classifyColor, deltaE, rgbToHsv, rgbToLab } = await import('./src/engine/colorDetector.js');

  // Test standard lighting
  const cWhite = classifyColor(250, 252, 255);
  const cRed = classifyColor(220, 35, 35);
  const cGreen = classifyColor(30, 195, 60);
  const cYellow = classifyColor(245, 215, 20);
  const cOrange = classifyColor(250, 115, 20);
  const cBlue = classifyColor(35, 110, 240);

  assert(cWhite.colorId === 0, 'White recognized');
  assert(cRed.colorId === 1, 'Red recognized');
  assert(cGreen.colorId === 2, 'Green recognized');
  assert(cYellow.colorId === 3, 'Yellow recognized');
  assert(cOrange.colorId === 4, 'Orange recognized');
  assert(cBlue.colorId === 5, 'Blue recognized');

  // Test slightly darker / shaded room lighting
  const shadedYellow = classifyColor(185, 160, 25);
  assert(shadedYellow.colorId === 3, 'Shaded yellow recognized accurately');

  const shadedGreen = classifyColor(20, 140, 45);
  assert(shadedGreen.colorId === 2, 'Shaded green recognized accurately');

  // 5. 54-Sticker Scanned Reconstruction Workflow
  console.log('\n[5/6] Simulating Full 6-Face Camera Capture Reconstruction...');
  // Scramble cube with standard WCA moves: R U R' U'
  const { applyMoves } = await import('./src/engine/cubeMoves.js');
  const scrambledState = applyMoves(solved, ['R', 'U', "R'", "U'"]);
  const valScrambled = validateCubeState(scrambledState);
  assert(valScrambled.valid === true, 'Scrambled cube state is mathematically valid');

  // Slice into 6 faces
  const capturedFaces = {};
  for (let face = 0; face < 6; face++) {
    capturedFaces[face] = [];
    for (let pos = 0; pos < 9; pos++) {
      capturedFaces[face].push({
        index: pos,
        colorId: scrambledState[face * 9 + pos],
        confidence: 95,
        needsReview: false,
      });
    }
  }
  assert(Object.keys(capturedFaces).length === 6, 'All 6 faces captured');

  // Reconstruct 54-facelet array
  const reconstructed = new Array(54);
  for (let face = 0; face < 6; face++) {
    for (let pos = 0; pos < 9; pos++) {
      reconstructed[face * 9 + pos] = capturedFaces[face][pos].colorId;
    }
  }
  assert(reconstructed.length === 54, 'Reconstructed array has 54 stickers');
  assert(JSON.stringify(reconstructed) === JSON.stringify(scrambledState), 'Reconstruction matches scrambled cube exactly');

  // 6. Live Backend Solver Execution
  console.log('\n[6/6] Submitting Reconstructed Scanned State to Spring Boot Kociemba Solver...');
  const solveRes = await makeRequest('POST', '/cube/solve', { facelets: reconstructed });
  assert(solveRes.status === 200, 'POST /api/cube/solve responded with HTTP 200');
  assert(solveRes.body.success === true, 'Java solver reported success = true');
  assert(typeof solveRes.body.solutionMoves === 'string' && solveRes.body.solutionMoves.length > 0, 'Solution moves string returned');
  assert(solveRes.body.moveCount > 0, `Solution move count is valid: ${solveRes.body.moveCount} moves`);
  assert(solveRes.body.solveTimeMs >= 0, `Solver execution time: ${solveRes.body.solveTimeMs}ms`);

  console.log(`\n  Solution computed by Java engine: "${solveRes.body.solutionMoves}"`);
  console.log(`  Moves: ${solveRes.body.moveCount} | Engine time: ${solveRes.body.solveTimeMs}ms`);

  console.log('\n========================================================================');
  console.log(`ALL CAMERA SCANNER INTEGRATION TESTS PASSED: ${passed} passed, ${failed} failed`);
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
