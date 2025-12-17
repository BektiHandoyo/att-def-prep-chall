const express = require('express');
const path = require('path');
const appRoutes = require('./routes/appRoutes');
const { decryptMiddleware, encryptMiddleware } = require('./middleware/cryptoUtils');

const app = express();
const PORT = 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.text({ type: 'text/plain', limit: '10mb' }));
app.use(decryptMiddleware);
app.use(encryptMiddleware);

// Routes
app.use('/', appRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
}); 