import api from './axios';

// ============================================================
// Centralized API service layer
// ALL Spring Boot API calls go through these functions.
// Components never call `api` directly — they call these.
// ============================================================

// ------ Auth ------

export const authApi = {
  /** POST /api/auth/register */
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),

  /** POST /api/auth/login */
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

// ------ Cube Engine ------

export const cubeApi = {
  /** GET /api/cube/solved — returns the solved 54-facelet state */
  getSolved: () => api.get('/cube/solved'),

  /** GET /api/cube/scramble — generates a random scramble */
  scramble: (length = 20) =>
    api.post('/cube/scramble', { length }),

  /** POST /api/cube/validate — validates a 54-element facelets array */
  validate: (facelets) =>
    api.post('/cube/validate', { facelets }),

  /** POST /api/cube/solve — solves the cube; returns solutionMoves, moveCount, solveTimeMs */
  solve: (facelets) =>
    api.post('/cube/solve', { facelets }),

  /** POST /api/cube/apply-move — applies a move string to a facelets array */
  applyMove: (facelets, move) =>
    api.post('/cube/apply-move', { facelets, move }),
};

// ------ Solve History ------

export const historyApi = {
  /** GET /api/solves?page=0&size=20 — public paginated history */
  getAll: (page = 0, size = 20) =>
    api.get(`/solves?page=${page}&size=${size}`),

  /** GET /api/solves/{id} */
  getById: (id) => api.get(`/solves/${id}`),

  /** GET /api/solves/my — JWT-protected user-specific history */
  getMy: () => api.get('/solves/my'),

  /** POST /api/solves — record a completed practice solve */
  recordSolve: (data) => api.post('/solves', data),

  /** GET /api/solves/stats/my — authentic user dashboard statistics */
  getMyStats: () => api.get('/solves/stats/my'),
};
