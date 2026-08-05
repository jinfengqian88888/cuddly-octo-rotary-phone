const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const slotRoutes = require('./routes/slots');
const reservationRoutes = require('./routes/reservations');
const checkInRoutes = require('./routes/checkIn');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/slots', slotRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/check-in', checkInRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
