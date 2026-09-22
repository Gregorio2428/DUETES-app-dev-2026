# Latch: Express.js signup + login

A small signup and login system. The backend is Express.js, the "database" is a JSON array in `database.js`, and the frontend is plain HTML/CSS/JS. Every API endpoint is a **POST**.

## Run it in VS Code

1. Open this folder in VS Code (**File → Open Folder…**).
2. Open the terminal (**Ctrl + `**) and install the dependency:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Visit **http://localhost:3000**.

Use `npm run dev` to restart automatically when you edit `server.js`.

## Project layout

```
latch-auth/
├── server.js        Express app: POST /api/signup and POST /api/login
├── database.js      The demo database: a JSON array of users
├── package.json
└── public/
    ├── signup.html  login.html  home.html
    ├── css/styles.css
    └── js/          shared.js  signup.js  login.js  home.js
```

## API

| Endpoint | Body (JSON) | Responses |
|---|---|---|
| `POST /api/signup` | `email`, `username`, `password` | **201** created · **400** empty field or invalid email · **409** email/username already exists |
| `POST /api/login`  | `username`, `password` | **200** user exists and password matches · **400** empty field · **401** wrong credentials |

Both endpoints read the request **body**, never URL params. Any other method on `/api/*` returns **405**.

A user object in the array looks like this (note the `id`):

```json
{ "id": 1, "email": "ada@example.com", "username": "ada", "password": "<salt>:<scrypt hash>" }
```

### Try it without the UI (Thunder Client / curl)

```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","username":"ada","password":"secret123"}'
```

## Design notes

- **Only POST:** the API has no GET/PUT/DELETE. The browser still needs GET to *download* the HTML pages, and `express.static` handles that. No GET routes are written in `server.js`.
- **Passwords are hashed** with Node's built-in `crypto.scrypt` before they go into the array.
- **Usernames and emails** are compared case-insensitively, so `Ada` and `ada` count as the same user.
- **Login failures** return one generic 401 message, so nobody can probe which usernames exist.
- **Forms use `novalidate`**, so empty submissions reach the server and you can see the real 400 responses.
- **Demo session:** after login, the user is kept in `sessionStorage` so the home page can greet them. A real app would use a server-issued cookie or token.
- **Data resets on restart**, because the array lives in memory.
