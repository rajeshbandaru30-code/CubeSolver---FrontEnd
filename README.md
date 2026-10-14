# CubeSolve – Intelligent Rubik's Cube Solver

CubeSolve is a full-stack web application designed to solve any valid $3 \times 3$ Rubik's Cube using Herbert Kociemba's Two-Phase Algorithm. It features a real-time computer vision camera scanner with CIELAB color classification, an interactive 3D virtual cube (Three.js / React-Three-Fiber), a 2D net sticker configuration editor, step-by-step playback with visual rotation instructions, a practice mode with a precision speedcubing timer, and private solve history/dashboard analytics backed by MySQL.

---

## Technology Stack

- **Frontend**: React.js 19, Axios, HTML5, CSS3, JavaScript (ES6+), Three.js / React-Three-Fiber, Lucide Icons
- **Backend**: Java 21, Spring Boot 3.3.5, Spring Web (REST API), Spring Data JPA, Hibernate ORM, Spring Security (Stateless JWT)
- **Database**: MySQL 8.0+
- **Embedded Server**: Apache Tomcat (via Spring Boot)
- **Build Tool**: Apache Maven 3.9+
- **Development Environment**: Antigravity IDE / VS Code

---

## 1. System Prerequisites

1. **Java Development Kit (JDK)**: JDK 21 or higher
2. **Node.js**: v18.0.0 or higher (with `npm` v9+)
3. **Apache Maven**: v3.8.0 or higher
4. **MySQL Server**: v8.0 or higher running on `localhost:3306`

---

## 2. Database Setup

1. Open your MySQL client or terminal:
   ```sql
   CREATE DATABASE IF NOT EXISTS cubesolve_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. *(Optional)* Execute the schema script manually if auto-generation is disabled:
   ```bash
   mysql -u <username> -p cubesolve_db < backend/src/main/resources/schema-mysql.sql
   ```

---

## 3. Environment Configuration

The application uses standard development defaults in `backend/src/main/resources/application.properties`. You can override these using environment variables if needed:

| Property | Environment Variable | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `server.port` | `SERVER_PORT` | `8080` | Spring Boot HTTP port |
| `spring.datasource.url` | `DB_HOST`, `DB_PORT`, `DB_NAME` | `jdbc:mysql://localhost:3306/cubesolve_db` | MySQL Connection URL |
| `spring.datasource.username` | `DB_USERNAME` | `root` | MySQL Database User |
| `spring.datasource.password` | `DB_PASSWORD` | `root` | MySQL Database Password |
| `app.jwt.secret` | `JWT_SECRET` | *(Base64 Dev Secret)* | HMAC-SHA256 JWT Secret |
| `app.cors.allowed-origins` | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |

---

## 4. Local Execution Guide

### Step 1: Start Backend (Spring Boot)
Open a terminal in the project root:
```bash
cd backend
mvn spring-boot:run
```
- **Backend URL**: `http://localhost:8080`
- **Health Endpoint**: `http://localhost:8080/api/health`

### Step 2: Start Frontend (React + Vite)
Open a second terminal in the project root:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend URL**: `http://localhost:5173`

---

## 5. Running Automated Tests

### Backend Unit & Integration Tests (JUnit 5 + H2)
```bash
cd backend
mvn test
```
*Executes all 66 test cases covering engine moves, physical parity validation, Kociemba solver accuracy across 71 scrambles, authentication, and multi-tenant IDOR isolation.*

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```

---

## 6. Real-Time Camera Scanner

The real-time camera scanner allows cubers to scan all 6 faces of a physical $3 \times 3$ Rubik's Cube using their smartphone or webcam and reconstruct a 3D solvable state in seconds.

### Guided 6-Face Scanning Sequence:
1. **Up (White)**: White center facing camera, Green on bottom edge.
2. **Right (Red)**: Rotate cube 90° left; White stays on top, Green on left edge.
3. **Front (Green)**: Rotate 90° right; White stays on top, Orange on left edge.
4. **Down (Yellow)**: Tilt cube upward; Green is on top edge, Blue on bottom edge.
5. **Left (Orange)**: Tilt back to Green, rotate 90° right; White on top, Blue on left edge.
6. **Back (Blue)**: Rotate 90° right; White on top, Red on left edge.

### Computer Vision & Color Pipeline:
- **Central Sampling**: Samples the inner 56% region of each sticker, eliminating bevels, specular reflections, and black gaps.
- **Color Spaces**: Converts RGB pixels into CIELAB ($L^*, a^*, b^*$) and HSV to handle lighting shifts, shadows, and white balance differences.
- **Physical Parity Verification**: Reconstructed 54-facelet state is verified mathematically (exact 9-sticker counts, fixed center checks, corner orientation sum $\equiv 0 \pmod 3$, edge orientation sum $\equiv 0 \pmod 2$, and permutation parity).
- **Interactive Review**: Full 3D rotation preview, 1-tap manual sticker recoloring, and direct submission to the Java Kociemba solver.

---

## 7. REST API Overview

| Endpoint | Method | Security | Description |
| :--- | :---: | :---: | :--- |
| `/api/health` | `GET` | Public | Liveness health check |
| `/api/auth/register` | `POST` | Public | Register new user account & return JWT |
| `/api/auth/login` | `POST` | Public | Authenticate user credentials & return JWT |
| `/api/cube/solved` | `GET` | Public | Retrieve canonical 54-facelet solved state |
| `/api/cube/scramble` | `POST` | Public | Generate random 20-move WCA scramble |
| `/api/cube/validate` | `POST` | Public | Validate physical cube facelets & parity laws |
| `/api/cube/solve` | `POST` | Public / JWT | Solve cube using Kociemba 2-phase algorithm |
| `/api/cube/apply-move` | `POST` | Public | Compute 54-facelet state after applying move |
| `/api/solves` | `POST` | JWT Required | Record completed practice solve to MySQL |
| `/api/solves/my` | `GET` | JWT Required | Retrieve authenticated user's solve history |
| `/api/solves/{id}` | `GET` | JWT Required | Retrieve single solve record (IDOR protected) |
| `/api/solves/stats/my` | `GET` | JWT Required | Compute authentic user dashboard statistics |

---

## 8. Troubleshooting

- **Database Connection Failure (`CommunicationsException`)**: Ensure MySQL service is running on port 3306 and `cubesolve_db` has been created.
- **Port 8080 in use**: Stop any existing processes on port 8080 or launch with `SERVER_PORT=8081 mvn spring-boot:run`.
- **CORS Error in Browser**: Ensure frontend is running on `http://localhost:5173`.
