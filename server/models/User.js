import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: {
    type: String, // Global unique ID (or socket during session)
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', UserSchema);
