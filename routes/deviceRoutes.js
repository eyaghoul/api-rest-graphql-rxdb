const express = require('express');
const router = express.Router();

const deviceService = require('../services/deviceService');
const dbPromise = require('../db');

// GET ALL
router.get('/', async (req, res) => {
  const { devices } = await dbPromise;
  const docs = await devices.find().exec();
  res.json(docs.map(d => d.toJSON()));
});

// GET BY USER
router.get('/user/:id', async (req, res) => {
  const result = await deviceService.getDevicesByUser(req.params.id);
  res.json(result);
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { createId } = await dbPromise;
    const result = await deviceService.createDevice(req.body, createId);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const result = await deviceService.updateDevice({
    id: req.params.id,
    ...req.body
  });

  if (!result) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(result);
});

// DELETE
router.delete('/:id', async (req, res) => {
  const ok = await deviceService.deleteDevice(req.params.id);

  if (!ok) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({ message: 'success' });
});

module.exports = router;