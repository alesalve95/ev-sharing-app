import mongoose from 'mongoose';

const StationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  available: {
    type: Boolean,
    default: true
  },
  visible: {
    type: Boolean,
    default: true
  },
  power: {
    type: Number,
    required: true
  },
  connectorType: {
    type: String,
    required: true,
    enum: ['Type 1', 'Type 2', 'CCS', 'CHAdeMO']
  },
  currentType: {
    type: String,
    required: true,
    enum: ['AC monofase', 'AC trifase', 'DC']
  },
  additionalInfo: String,
  rating: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.models.Station || mongoose.model('Station', StationSchema);
