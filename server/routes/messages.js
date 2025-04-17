const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');

// @route   GET api/messages
// @desc    Get all messages for current user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.user.id }, { to: req.user.id }]
    })
      .sort({ date: -1 })
      .populate('from to', ['name', 'avatar']);

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/messages
// @desc    Send a message
router.post(
  '/',
  [
    auth,
    [
      check('to', 'Recipient is required').not().isEmpty(),
      check('text', 'Message text is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { to, text } = req.body;

      // Check if recipient exists
      const recipient = await User.findById(to);
      if (!recipient) {
        return res.status(404).json({ msg: 'Recipient not found' });
      }

      const newMessage = new Message({
        from: req.user.id,
        to,
        text
      });

      const message = await newMessage.save();
      res.json(message);

      // Emit message via Socket.io
      req.app.get('io').to(to).emit('message', message);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/messages/conversation/:user_id
// @desc    Get conversation between two users
router.get('/conversation/:user_id', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user.id, to: req.params.user_id },
        { from: req.params.user_id, to: req.user.id }
      ]
    })
      .sort({ date: 1 })
      .populate('from to', ['name', 'avatar']);

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;