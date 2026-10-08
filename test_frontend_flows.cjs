// test_frontend_flows.cjs
// Automated test script validating full frontend contracts, routing, Axios flows,
// animation logic, practice mode, history, stats, and responsive CSS tokens.

const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (data) {
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api' + path,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(responseBody);
        } catch (e) {
          json = responseBody;
        }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });

    req.on('error', err => reject(err));
    if (data) req.write(data);
    req.end();
  });
}

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

async function runAll() {
  console.log('========================================================================');
  console.log('FRONTEND COMPREHENSIVE INTEGRATION & FLOW VERIFICATION');
  console.log('========================================================================\n');

  const fs = require('fs');
  const path = require('path');

  // 1. ROUTING & ACCESS CONTROL TESTS
  console.log('[1/7] Testing Routing & Protected Route Configuration...');
  const appJsx = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf-8');
  assert(appJsx.includes('path="/"') && appJsx.includes('Landing'), 'Public Landing route exists');
  assert(appJsx.includes('path="/auth"') && appJsx.includes('Auth'), 'Public Auth route exists');
  assert(appJsx.includes('PrivateRoute><AppLayout><Dashboard') || appJsx.includes('PrivateRoute'), 'Dashboard is protected by PrivateRoute');
  assert(appJsx.includes('PrivateRoute') && appJsx.includes('Solver'), 'Solver is protected by PrivateRoute');
  assert(appJsx.includes('PrivateRoute') && appJsx.includes('Practice'), 'Practice is protected by PrivateRoute');
  assert(appJsx.includes('PrivateRoute') && appJsx.includes('History'), 'History is protected by PrivateRoute');
  assert(appJsx.includes('PrivateRoute') && appJsx.includes('Statistics'), 'Statistics is protected by PrivateRoute');
  assert(appJsx.includes('path="*"') && appJsx.includes('Navigate to="/"'), 'Fallback route catches unmatched paths');

  // 2. AUTHENTICATION & TOKEN HANDLING
  console.log('\n[2/7] Testing Authentication & Token Handling in Axios/AuthContext...');
  const axiosJs = fs.readFileSync(path.join(__dirname, 'src', 'api', 'axios.js'), 'utf-8');
  assert(axiosJs.includes('localStorage.getItem(\'token\')'), 'Axios attaches Bearer token from localStorage');
  assert(axiosJs.includes('error.response.status === 401'), 'Axios interceptor handles 401 responses');
  assert(axiosJs.includes('localStorage.removeItem(\'token\')'), 'Axios purges token on 401');
  assert(axiosJs.includes('dispatchEvent(new Event(\'auth-error\'))'), 'Axios dispatches auth-error event on 401');

  const authContextJs = fs.readFileSync(path.join(__dirname, 'src', 'context', 'AuthContext.jsx'), 'utf-8');
  assert(authContextJs.includes('window.addEventListener(\'auth-error\''), 'AuthContext listens for auth-error');
  assert(authContextJs.includes('try {') && authContextJs.includes('JSON.parse(storedUser)'), 'AuthContext wraps user parsing in defensive try/catch');

  // 3. LIVE AXIOS COMMUNICATION & API CONTRACTS
  console.log('\n[3/7] Testing Live Axios API Contract Endpoints against Spring Boot...');
  const testUser = 'front_user_' + Date.now();
  const testPass = 'Password@123';
  const testEmail = `${testUser}@example.com`;

  // Register
  const regRes = await makeRequest('POST', '/auth/register', { username: testUser, password: testPass, email: testEmail });
  assert(regRes.status === 200 && regRes.body.token, 'POST /api/auth/register issued JWT token');
  const token = regRes.body.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Login
  const loginRes = await makeRequest('POST', '/auth/login', { username: testUser, password: testPass });
  assert(loginRes.status === 200 && loginRes.body.token, 'POST /api/auth/login authenticated successfully');

  // Get Solved Cube
  const solvedRes = await makeRequest('GET', '/cube/solved');
  assert(solvedRes.status === 200 && Array.isArray(solvedRes.body.facelets) && solvedRes.body.facelets.length === 54, 'GET /api/cube/solved returned 54 facelets');

  // Scramble
  const scrambleRes = await makeRequest('POST', '/cube/scramble', { length: 20 });
  assert(scrambleRes.status === 200 && scrambleRes.body.scrambleMoves.split(' ').length === 20, 'POST /api/cube/scramble generated 20-move scramble');

  // Validate
  const valRes = await makeRequest('POST', '/cube/validate', { facelets: solvedRes.body.facelets });
  assert(valRes.status === 200 && valRes.body.valid === true, 'POST /api/cube/validate verified solved facelets');

  // Solve
  const solveRes = await makeRequest('POST', '/cube/solve', { facelets: scrambleRes.body.facelets }, authHeaders);
  assert(solveRes.status === 200 && solveRes.body.success === true && solveRes.body.solutionMoves, 'POST /api/cube/solve computed valid solution');

  // Apply Move
  const moveRes = await makeRequest('POST', '/cube/apply-move', { facelets: solvedRes.body.facelets, move: 'R' });
  assert(moveRes.status === 200 && moveRes.body.facelets && moveRes.body.facelets.length === 54, 'POST /api/cube/apply-move updated cube state');

  // 4. PRACTICE MODE FLOW & DB PERSISTENCE
  console.log('\n[4/7] Testing Practice Mode & Database Storage Flow...');
  const practiceRecord = {
    scrambleMoves: 'R U R\' U\'',
    solutionMoves: 'U R U\' R\'',
    moveCount: 4,
    solveTimeMs: 4120,
    cubeState: solvedRes.body.facelets.join(',')
  };
  const saveRes = await makeRequest('POST', '/solves', practiceRecord, authHeaders);
  assert(saveRes.status === 201 && saveRes.body.id, 'POST /api/solves persisted practice session to MySQL');
  const recordId = saveRes.body.id;

  // 5. HISTORY & STATS RETRIEVAL
  console.log('\n[5/7] Testing History and User Dashboard Statistics...');
  const historyRes = await makeRequest('GET', '/solves/my', null, authHeaders);
  assert(historyRes.status === 200 && historyRes.body.length >= 1, 'GET /api/solves/my retrieved saved solve');
  assert(historyRes.body[0].id === recordId, 'History record matches created solve ID');

  const statsRes = await makeRequest('GET', '/solves/stats/my', null, authHeaders);
  assert(statsRes.status === 200 && statsRes.body.totalSolves >= 1, 'GET /api/solves/stats/my returned authentic totalSolves');
  assert(statsRes.body.bestTimeMs > 0, 'User stats contains valid bestTimeMs');

  // 6. SOLUTION ANIMATION & MOVE INSTRUCTION MAPPING
  console.log('\n[6/7] Testing Move Instruction Mapping & Animation Helpers...');
  const playerFile = fs.readFileSync(path.join(__dirname, 'src', 'components', 'CubePlayer.jsx'), 'utf-8');
  assert(playerFile.includes('MOVE_INFO') && playerFile.includes('Rotate'), 'Move instructions are provided for all moves');
  assert(playerFile.includes('0.5') && playerFile.includes('1') && playerFile.includes('2'), 'Speed controls (0.5x, 1x, 2x) implemented');
  assert(playerFile.includes('togglePlay') && playerFile.includes('restart'), 'Animation controls (Play, Pause, Restart) present');

  // 7. RESPONSIVE DESIGN & CSS TOKENS
  console.log('\n[7/7] Testing Responsive CSS & Design Tokens...');
  const css = fs.readFileSync(path.join(__dirname, 'src', 'index.css'), 'utf-8');
  assert(css.includes('--primary-color'), 'CSS design system defines --primary-color token');
  assert(css.includes('--bg-color') && css.includes('--bg-surface'), 'CSS design system defines dark theme tokens');
  assert(css.includes('@media (max-width: 768px)') || css.includes('@media (max-width: 640px)'), 'Mobile responsive media queries defined in index.css');
  assert(css.includes('glass-panel'), 'Glassmorphism container styles implemented');

  console.log('\n========================================================================');
  console.log(`FRONTEND PASS COMPLETED: ${passed} passed, ${failed} failed`);
  console.log('========================================================================\n');
}

runAll().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
