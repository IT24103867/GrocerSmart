const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    publicId: {
        type: String,
        unique: true,
        sparse: true
    },
    // Company identity
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true
    },
    contactPerson: {
        type: String
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    email: {
        type: String,
        lowercase: true
    },
    address: {
        type: String
    },
    // Categories this supplier covers
    supplyCategories: {
        type: [String],
        default: []
    },
    // Financials
    outstandingPayable: {
        type: Number,
        default: 0
    },
    category: {
        type: String
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, { timestamps: true });

supplierSchema.pre('save', async function () {
    if (!this.publicId) {
        this.publicId = 'SUP-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
});

// Virtual: companyName alias
supplierSchema.virtual('companyName').get(function () {
    return this.name;
});

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
