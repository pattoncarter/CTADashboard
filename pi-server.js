// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // limit each IP to 30 requests per minute
});

// Middleware
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// API endpoints
app.get('/api/train-arrivals', async (req, res) => {
  try {
    const response = await axios.get(
      `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx`, {
        params: {
          key: process.env.CTA_TRAIN_API_KEY,
          mapid: '41400', // Roosevelt station
          outputType: 'JSON'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching train data:', error);
    res.status(500).json({ error: 'Failed to fetch train data' });
  }
});

app.get('/api/bus-arrivals', async (req, res) => {
  try {
    const stops = {
      62: ['14323', '14324'],
      29: ['14325', '14326']
    };
    
    const predictions = await Promise.all([
      ...stops[62].map(stop => 
        axios.get(`http://ctabustracker.com/bustime/api/v2/getpredictions`, {
          params: {
            key: process.env.CTA_BUS_API_KEY,
            stpid: stop,
            rt: '62',
            format: 'json'
          }
        })
      ),
      ...stops[29].map(stop => 
        axios.get(`http://ctabustracker.com/bustime/api/v2/getpredictions`, {
          params: {
            key: process.env.CTA_BUS_API_KEY,
            stpid: stop,
            rt: '29',
            format: 'json'
          }
        })
      )
    ]);
    
    res.json(predictions.map(p => p.data));
  } catch (error) {
    console.error('Error fetching bus data:', error);
    res.status(500).json({ error: 'Failed to fetch bus data' });
  }
});

// Serve the static HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  process.exit(0);
});
